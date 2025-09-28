from __future__ import annotations
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# Enhanced prompts for sophisticated scientific analysis
METHODS_BASE_PROMPT = PromptTemplate(
    template=(
        "As an expert scientific analyst, extract and analyze experimental methodologies from this research article.\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Identify ALL experimental techniques, assays, and analytical methods\n"
        "2. Extract specific parameters, conditions, and protocols\n"
        "3. Assess methodological rigor and potential limitations\n"
        "4. Identify controls, validation approaches, and reproducibility measures\n\n"
        "Return a JSON array of objects with these fields:\n"
        "- technique: Method name and type\n"
        "- measurement: What is being measured/detected\n"
        "- role_in_study: Purpose and context within the research\n"
        "- parameters: Specific conditions, concentrations, timepoints\n"
        "- controls_validation: Control experiments and validation approaches\n"
        "- limitations_reproducibility: Potential limitations and reproducibility concerns\n"
        "- validation: Statistical or technical validation methods\n"
        "- accession_ids: Any database accession numbers or identifiers\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

RESULTS_BASE_PROMPT = PromptTemplate(
    template=(
        "As an expert data analyst, perform comprehensive analysis of research findings and outcomes.\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Evaluate hypothesis alignment and research question fulfillment\n"
        "2. Extract ALL quantitative results with statistical significance\n"
        "3. Assess effect sizes, confidence intervals, and statistical power\n"
        "4. Identify potential biases, limitations, and confounding factors\n"
        "5. Evaluate clinical or practical significance of findings\n\n"
        "Return a JSON object with these fields:\n"
        "- hypothesis_alignment: How results align with stated hypotheses (support/refute/mixed)\n"
        "- key_results: Array of quantitative findings with:\n"
        "  * metric: What was measured\n"
        "  * value: Numerical result\n"
        "  * unit: Units of measurement\n"
        "  * effect_size: Cohen's d, odds ratio, or other effect size measure\n"
        "  * p_value: Statistical significance\n"
        "  * fdr: False discovery rate if applicable\n"
        "  * ci: Confidence interval\n"
        "  * direction: positive/negative/neutral effect\n"
        "  * figure_table_ref: Reference to source figure/table\n"
        "- limitations_biases_in_results: Critical assessment of study limitations\n"
        "- clinical_significance: Practical implications and real-world relevance\n"
        "- reproducibility_assessment: Likelihood of result reproducibility\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

# New enhanced model analysis prompt
MODEL_ANALYSIS_PROMPT = PromptTemplate(
    template=(
        "As an expert in experimental design, analyze the research model and study design comprehensively.\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Characterize the experimental model (in vitro, in vivo, computational, clinical)\n"
        "2. Evaluate study design rigor and appropriateness\n"
        "3. Assess population characteristics and representativeness\n"
        "4. Identify potential biases and confounding factors\n"
        "5. Evaluate model validity and translational relevance\n\n"
        "Return a JSON object with these fields:\n"
        "- model_type: Type of experimental system\n"
        "- study_design: Design methodology and approach\n"
        "- population_description: Detailed characteristics of study subjects/samples\n"
        "- protocol_summary: Key procedural elements\n"
        "- model_rationale: Justification for model choice\n"
        "- bias_assessment: Potential sources of bias\n"
        "- strengths: Model and design strengths\n"
        "- limitations: Model and design limitations\n"
        "- translational_relevance: Applicability to real-world scenarios\n"
        "- sample_size_power: Sample size adequacy and statistical power\n"
        "- randomization_blinding: Randomization and blinding procedures\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

# Heuristic helpers

def _regex_list(patterns: List[str], text: str) -> List[str]:
    hits: List[str] = []
    for pat in patterns:
        for m in re.finditer(pat, text, flags=re.I):
            s = m.group(0)
            if s not in hits:
                hits.append(s)
    return hits

def _harvest_accessions(text: str) -> List[str]:
    return _regex_list([
        r"\bGSE\d+\b", r"\bGSM\d+\b", r"\bSRR\d+\b", r"\bSRS\d+\b", r"\bPRJNA\d+\b",
        r"\bERP\d+\b", r"\bE-\w\w\w-\d+\b", r"\bPRJEB\d+\b"
    ], text)[:20]

def _controls_hints(text: str) -> str:
    hints = []
    if re.search(r"isotype control", text, flags=re.I): hints.append("isotype control")
    if re.search(r"replicate", text, flags=re.I): hints.append("replicates")
    if re.search(r"vehicle[- ]?treated|untreated|control group", text, flags=re.I): hints.append("vehicle/untreated control")
    if re.search(r"blinded", text, flags=re.I): hints.append("blinded analysis")
    if re.search(r"siRNA|CRISPR|knockdown|sham", text, flags=re.I): hints.append("genetic/sham controls")
    return ", ".join(sorted(set(hints)))

def _instruments_hints(text: str) -> str:
    hints = []
    if re.search(r"flow cytometer|BD Accuri|FACS|Canto|Fortessa", text, flags=re.I): hints.append("flow cytometer")
    if re.search(r"microscope|Olympus|Nikon|Zeiss", text, flags=re.I): hints.append("microscope")
    if re.search(r"qPCR|RT-qPCR|ABI|QuantStudio|LightCycler", text, flags=re.I): hints.append("qPCR")
    return ", ".join(sorted(set(hints)))

# JATS utils

def _fetch_pmc_jats_xml(pmcid: str) -> str:
    try:
        ident = f"oai:pubmedcentral.nih.gov:{pmcid}"
        url = (
            "https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier="
            + urllib.parse.quote(ident)
            + "&metadataPrefix=pmc"
        )
        with urllib.request.urlopen(url, timeout=12) as r:
            return r.read().decode("utf-8", errors="ignore")
    except Exception:
        try:
            url2 = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/?page=1&format=xml"
            with urllib.request.urlopen(url2, timeout=12) as r2:
                return r2.read().decode("utf-8", errors="ignore")
        except Exception:
            return ""

def _harvest_quant_from_jats(jats_xml: str) -> List[Dict[str, str]]:
    if not jats_xml:
        return []
    out: List[Dict[str, str]] = []
    try:
        jats_xml = re.sub(r"xmlns(:\w+)?=\"[^\"]+\"", "", jats_xml)
        root = ET.fromstring(jats_xml)
        text_blobs: List[str] = []
        for t in root.iter():
            try:
                if t.text and t.tag.lower().endswith(('p',)):
                    text_blobs.append(t.text)
            except Exception:
                continue
        big = "\n".join(text_blobs)[:200000]
        # p-values
        for m in re.finditer(r"p\s*[<=>]\s*0\.?\d+", big, flags=re.I):
            out.append({"metric":"p_value","value":m.group(0),"unit":"","effect_size":"","p_value":m.group(0),"fdr":"","ci":"","direction":"","figure_table_ref":""})
        # fold/percent
        for m in re.finditer(r"(\b\d+(\.\d+)?)\s*(%|percent|fold|x)\b.*?(increase|decrease|up|down)?", big, flags=re.I):
            out.append({"metric":"change","value":m.group(0),"unit":"","effect_size":m.group(0),"p_value":"","fdr":"","ci":"","direction":"","figure_table_ref":""})
        # CI
        for m in re.finditer(r"(95% CI|CI)\s*[:\(]?\s*[-\d\.]+\s*[-,]\s*[-\d\.]+", big, flags=re.I):
            out.append({"metric":"ci","value":m.group(0),"unit":"","effect_size":"","p_value":"","fdr":"","ci":m.group(0),"direction":"","figure_table_ref":""})
        return out[:25]
    except Exception:
        return out[:10]

def _harvest_tables_from_jats(jats_xml: str) -> List[Dict[str, str]]:
    if not jats_xml:
        return []
    out: List[Dict[str, str]] = []
    try:
        jats_xml = re.sub(r"xmlns(:\w+)?=\"[^\"]+\"", "", jats_xml)
        root = ET.fromstring(jats_xml)
        for tw in root.iter():
            tag = (getattr(tw, 'tag', '') or '').lower()
            if not tag.endswith('table-wrap'):
                continue
            label = ''
            caption = ''
            for ch in list(tw):
                nm = (getattr(ch, 'tag', '') or '').lower()
                if nm.endswith('label') and getattr(ch, 'text', None):
                    label = (ch.text or '').strip()
                if nm.endswith('caption') and getattr(ch, 'text', None):
                    caption = (ch.text or '').strip()
            blob_parts: List[str] = [caption]
            for cell in tw.iter():
                cn = (getattr(cell, 'tag', '') or '').lower()
                if cn.endswith('td') or cn.endswith('th'):
                    if getattr(cell, 'text', None):
                        blob_parts.append((cell.text or '').strip())
            blob = (' | '.join([s for s in blob_parts if s]) )[:12000]
            for m in re.finditer(r"p\s*[<=>]\s*0\.?\d+", blob, flags=re.I):
                out.append({"metric":"p_value","value":m.group(0),"unit":"","effect_size":"","p_value":m.group(0),"fdr":"","ci":"","direction":"","figure_table_ref": label or 'Table'})
            for m in re.finditer(r"(\b\d+(\.\d+)?)\s*(%|percent|fold|x)\b", blob, flags=re.I):
                out.append({"metric":"change","value":m.group(0),"unit":"","effect_size":m.group(0),"p_value":"","fdr":"","ci":"","direction":"","figure_table_ref": label or 'Table'})
            for m in re.finditer(r"(95% CI|CI)\s*[:\(]?\s*[-\d\.]+\s*[-,]\s*[-\d\.]+", blob, flags=re.I):
                out.append({"metric":"ci","value":m.group(0),"unit":"","effect_size":"","p_value":"","fdr":"","ci":m.group(0),"direction":"","figure_table_ref": label or 'Table'})
        return out[:25]
    except Exception:
        return out[:10]

# Sub-agent pipelines

def run_methods_pipeline(full_text: str, objective: str, llm) -> List[Dict[str, Any]]:
    safe_text = (full_text or "")[:12000]
    base = LLMChain(llm=llm, prompt=METHODS_BASE_PROMPT).invoke({"objective": objective[:400], "full_text": safe_text})
    try:
        import json
        rows = json.loads(base.get("text", base) if isinstance(base, dict) else str(base))
        if not isinstance(rows, list):
            rows = []
    except Exception:
        rows = []
    # Enrich with heuristics
    accs = _harvest_accessions(safe_text)
    ctrl = _controls_hints(safe_text)
    inst = _instruments_hints(safe_text)
    out: List[Dict[str, Any]] = []
    for it in rows:
        if not isinstance(it, dict):
            continue
        acc = it.get("accession_ids")
        if not isinstance(acc, list):
            acc = []
        if len(acc) == 0 and accs:
            acc = accs
        params = str(it.get("parameters", "")).strip()
        if not params and inst:
            params = inst
        cv = str(it.get("controls_validation", "")).strip() or ctrl
        out.append({
            "technique": str(it.get("technique", "")).strip(),
            "measurement": str(it.get("measurement", "")).strip(),
            "role_in_study": str(it.get("role_in_study", "")).strip(),
            "parameters": params,
            "controls_validation": cv,
            "limitations_reproducibility": str(it.get("limitations_reproducibility", "")).strip(),
            "validation": str(it.get("validation", "")).strip(),
            "accession_ids": acc,
            "fact_anchors": it.get("fact_anchors") if isinstance(it.get("fact_anchors"), list) else [],
        })
    return out

def run_results_pipeline(full_text: str, objective: str, llm, pmcid: str | None) -> Dict[str, Any]:
    safe_text = (full_text or "")[:12000]
    base = LLMChain(llm=llm, prompt=RESULTS_BASE_PROMPT).invoke({"objective": objective[:400], "full_text": safe_text})
    try:
        import json
        raw_text = base.get("text", base) if isinstance(base, dict) else str(base)
        obj = json.loads(raw_text)
        if not isinstance(obj, dict):
            obj = {}
    except Exception as e:
        obj = {}

    # Ensure keys exist with proper defaults
    obj.setdefault("hypothesis_alignment", "")
    obj.setdefault("key_results", [])
    obj.setdefault("limitations_biases_in_results", [])
    if not isinstance(obj["key_results"], list):
        obj["key_results"] = []

    # Ensure each key_results item has all required fields
    for i, item in enumerate(obj["key_results"]):
        if not isinstance(item, dict):
            obj["key_results"][i] = {}
        obj["key_results"][i].setdefault("metric", "")
        obj["key_results"][i].setdefault("value", "")
        obj["key_results"][i].setdefault("unit", "")
        obj["key_results"][i].setdefault("effect_size", "")
        obj["key_results"][i].setdefault("p_value", "")
        obj["key_results"][i].setdefault("fdr", "")
        obj["key_results"][i].setdefault("ci", "")
        obj["key_results"][i].setdefault("direction", "")
        obj["key_results"][i].setdefault("figure_table_ref", "")

    # Ensure limitations_biases_in_results is a list
    if not isinstance(obj["limitations_biases_in_results"], list):
        obj["limitations_biases_in_results"] = []

    return obj
    # Heuristic harvest when sparse
    if len(obj["key_results"]) == 0:
        # HTML-based quick harvest
        for s in _regex_list([r"p\s*[<=>]\s*0\.?\d+"], safe_text):
            obj["key_results"].append({"metric":"p_value","value":s,"unit":"","effect_size":"","p_value":s,"fdr":"","ci":"","direction":"","figure_table_ref":""})
        for s in _regex_list([r"(\b\d+(\.\d+)?)\s*(%|percent|fold|x)\b.*?(increase|decrease|up|down)?"], safe_text):
            obj["key_results"].append({"metric":"change","value":s,"unit":"","effect_size":s,"p_value":"","fdr":"","ci":"","direction":"","figure_table_ref":""})
        for s in _regex_list([r"(95% CI|CI)\s*[:\(]?\s*[-\d\.]+\s*[-,]\s*[-\d\.]+"], safe_text):
            obj["key_results"].append({"metric":"ci","value":s,"unit":"","effect_size":"","p_value":"","fdr":"","ci":s,"direction":"","figure_table_ref":""})
    # JATS harvesting
    if (pmcid or ""):
        jats = _fetch_pmc_jats_xml(pmcid)
        if jats:
            obj["key_results"] += _harvest_quant_from_jats(jats)
            obj["key_results"] += _harvest_tables_from_jats(jats)
    return obj

# Enhanced helper functions for improved analysis
def _enhanced_controls_detection(text: str) -> str:
    """Enhanced detection of experimental controls and validation approaches"""
    controls = []

    # Standard controls
    if re.search(r"isotype control", text, flags=re.I):
        controls.append("isotype control")
    if re.search(r"negative control", text, flags=re.I):
        controls.append("negative control")
    if re.search(r"positive control", text, flags=re.I):
        controls.append("positive control")
    if re.search(r"vehicle control", text, flags=re.I):
        controls.append("vehicle control")
    if re.search(r"sham control", text, flags=re.I):
        controls.append("sham control")

    # Validation approaches
    if re.search(r"replicate", text, flags=re.I):
        controls.append("biological/technical replicates")
    if re.search(r"validation", text, flags=re.I):
        controls.append("validation experiments")
    if re.search(r"reproducib", text, flags=re.I):
        controls.append("reproducibility testing")
    if re.search(r"cross-validation", text, flags=re.I):
        controls.append("cross-validation")

    # Statistical controls
    if re.search(r"multiple testing", text, flags=re.I):
        controls.append("multiple testing correction")
    if re.search(r"bonferroni", text, flags=re.I):
        controls.append("Bonferroni correction")
    if re.search(r"fdr|false discovery", text, flags=re.I):
        controls.append("FDR correction")

    return "; ".join(controls) if controls else "Not specified"

def _extract_statistical_metrics(text: str) -> List[Dict[str, str]]:
    """Extract statistical metrics and quantitative results from text"""
    metrics = []

    # P-values
    p_values = re.findall(r"p\s*[<>=]\s*0\.?\d+", text, re.I)
    for p_val in p_values[:5]:  # Limit to avoid spam
        metrics.append({
            "metric": "Statistical significance",
            "value": p_val,
            "type": "p_value"
        })

    # Effect sizes
    effect_patterns = [
        r"cohen'?s?\s+d\s*[=:]\s*[\d\.]+",
        r"effect\s+size\s*[=:]\s*[\d\.]+",
        r"odds\s+ratio\s*[=:]\s*[\d\.]+",
        r"hazard\s+ratio\s*[=:]\s*[\d\.]+",
    ]

    for pattern in effect_patterns:
        matches = re.findall(pattern, text, re.I)
        for match in matches[:3]:
            metrics.append({
                "metric": "Effect size",
                "value": match,
                "type": "effect_size"
            })

    # Confidence intervals
    ci_matches = re.findall(r"(95%\s*ci|confidence\s+interval)\s*[:\(]?\s*[\d\.-]+\s*[-,to]\s*[\d\.-]+", text, re.I)
    for ci in ci_matches[:3]:
        metrics.append({
            "metric": "Confidence interval",
            "value": ci,
            "type": "confidence_interval"
        })

    return metrics

# Enhanced pipeline functions
def run_enhanced_model_pipeline(full_text: str, objective: str, llm) -> Dict[str, Any]:
    """Enhanced model analysis pipeline with comprehensive experimental design evaluation"""
    safe_text = (full_text or "")[:15000]

    try:
        base = LLMChain(llm=llm, prompt=MODEL_ANALYSIS_PROMPT).invoke({
            "objective": objective[:400],
            "full_text": safe_text
        })

        import json
        raw_text = base.get("text", base) if isinstance(base, dict) else str(base)

        # Clean JSON response
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0]
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0]

        result = json.loads(raw_text)
        if not isinstance(result, dict):
            result = {}

    except Exception as e:
        print(f"Model analysis error: {e}")
        result = {}

    # Enhanced model analysis with heuristic enrichment
    model_type = result.get("model_type", "Unknown")

    # Detect model type from text if not provided
    if model_type == "Unknown":
        if any(term in safe_text.lower() for term in ["cell culture", "in vitro", "cultured cells"]):
            model_type = "in vitro"
        elif any(term in safe_text.lower() for term in ["mouse", "mice", "rat", "animal", "in vivo"]):
            model_type = "in vivo"
        elif any(term in safe_text.lower() for term in ["patient", "clinical", "human", "cohort"]):
            model_type = "clinical"
        elif any(term in safe_text.lower() for term in ["computational", "simulation", "modeling"]):
            model_type = "computational"

    return {
        "model_type": model_type,
        "study_design": result.get("study_design", "Not specified"),
        "population_description": result.get("population_description", "Not specified"),
        "protocol_summary": result.get("protocol_summary", "Not available"),
        "model_rationale": result.get("model_rationale", "Not provided"),
        "bias_assessment": result.get("bias_assessment", "Not assessed"),
        "strengths": result.get("strengths", "Not identified"),
        "limitations": result.get("limitations", "Not identified"),
        "translational_relevance": result.get("translational_relevance", "Not evaluated"),
        "sample_size_power": result.get("sample_size_power", "Not reported"),
        "randomization_blinding": result.get("randomization_blinding", "Not specified"),
        "fact_anchors": result.get("fact_anchors", [])
    }