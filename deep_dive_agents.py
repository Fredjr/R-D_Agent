from __future__ import annotations
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional

try:
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
    LANGCHAIN_AVAILABLE = True
except ImportError:
    print("⚠️ LangChain not available in deep_dive_agents, using dummy classes")
    class LLMChain:
        def __init__(self, *args, **kwargs):
            pass
        def run(self, *args, **kwargs):
            return "LangChain not available"

    class PromptTemplate:
        def __init__(self, *args, **kwargs):
            pass
        def format(self, *args, **kwargs):
            return "LangChain not available"

    LANGCHAIN_AVAILABLE = False

# Enhanced prompts for sophisticated scientific analysis
METHODS_BASE_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Experimental Design Expert with PhD-level expertise in research methodology and experimental validation.\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Provide methodological analysis with experimental precision and protocol specificity\n"
        "✅ Include quantitative parameters with exact concentrations, timepoints, and conditions\n"
        "✅ Assess statistical power, sample size adequacy, and experimental design rigor\n"
        "✅ Evaluate reproducibility with inter-laboratory validation and standardization\n"
        "✅ Include methodological innovation assessment and technical advancement evaluation\n\n"
        "ENHANCED ANALYSIS REQUIREMENTS:\n"
        "1. Identify ALL experimental techniques with methodological classification and innovation assessment\n"
        "2. Extract quantitative parameters with precision (concentrations, pH, temperature, duration)\n"
        "3. Assess methodological rigor with statistical power analysis and design optimization\n"
        "4. Evaluate controls with negative/positive controls, technical replicates, and validation standards\n"
        "5. Analyze reproducibility with inter-assay variability, standardization protocols, and quality control\n"
        "6. Include regulatory compliance and Good Laboratory Practice (GLP) considerations\n\n"
        "Return a JSON array of objects with these enhanced fields:\n"
        "- technique: Method name, type, and methodological classification\n"
        "- measurement: Quantitative/qualitative measurements with detection limits and sensitivity\n"
        "- role_in_study: Purpose, hypothesis testing role, and experimental workflow position\n"
        "- parameters: Exact conditions (concentrations in μM/nM, pH ±0.1, temperature ±1°C, timepoints)\n"
        "- controls_validation: Comprehensive control strategy with positive/negative controls and validation standards\n"
        "- statistical_design: Sample size calculation, power analysis, and experimental design rationale\n"
        "- reproducibility_standards: Inter-assay CV%, standardization protocols, and quality control measures\n"
        "- methodological_innovation: Technical advancement, novel applications, and methodological improvements\n"
        "- regulatory_compliance: GLP compliance, standardization adherence, and validation requirements\n"
        "- limitations_reproducibility: Critical assessment with mitigation strategies and improvement recommendations\n"
        "- validation: Statistical validation, technical validation, and cross-platform verification\n"
        "- accession_ids: Database identifiers, protocol repositories, and standardization references\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

RESULTS_BASE_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Biostatistician and Data Analysis Expert with PhD-level expertise in quantitative research and statistical interpretation.\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Provide statistical analysis with rigorous hypothesis testing and effect size interpretation\n"
        "✅ Include comprehensive statistical metrics with confidence intervals and power analysis\n"
        "✅ Assess clinical significance with Number Needed to Treat (NNT) and clinical relevance thresholds\n"
        "✅ Evaluate reproducibility with statistical heterogeneity and publication bias assessment\n"
        "✅ Include evidence strength grading with GRADE methodology and systematic review standards\n\n"
        "ENHANCED ANALYSIS REQUIREMENTS:\n"
        "1. Evaluate hypothesis alignment with Bayesian evidence assessment and posterior probability\n"
        "2. Extract quantitative results with complete statistical reporting (means, SDs, CIs, exact p-values)\n"
        "3. Assess effect sizes with clinical interpretation and minimal clinically important difference (MCID)\n"
        "4. Identify statistical biases with multiple testing correction and selective reporting assessment\n"
        "5. Evaluate clinical significance with real-world impact and health economic implications\n"
        "6. Include meta-analysis potential and systematic review integration considerations\n\n"
        "Return a JSON object with these enhanced fields:\n"
        "- hypothesis_alignment: Detailed alignment assessment with Bayesian evidence strength and posterior probability\n"
        "- key_results: Array of comprehensive quantitative findings with:\n"
        "  * metric: Measurement with biological/clinical context and reference ranges\n"
        "  * value: Numerical result with precision and measurement uncertainty\n"
        "  * unit: Units with standardization and conversion factors\n"
        "  * effect_size: Cohen's d, Hedges' g, odds ratio, hazard ratio with interpretation\n"
        "  * p_value: Exact p-value with multiple testing correction (Bonferroni, FDR)\n"
        "  * ci: 95% confidence interval with clinical interpretation\n"
        "  * power: Statistical power and sample size adequacy assessment\n"
        "  * direction: Effect direction with clinical relevance and biological plausibility\n"
        "  * mcid: Minimal clinically important difference assessment\n"
        "  * figure_table_ref: Source reference with data extraction verification\n"
        "- statistical_heterogeneity: Between-study variability and consistency assessment\n"
        "- evidence_strength: GRADE evidence quality with risk of bias assessment\n"
        "- limitations_biases_in_results: Comprehensive bias assessment with mitigation strategies\n"
        "- clinical_significance: NNT, clinical relevance thresholds, and health economic impact\n"
        "- reproducibility_assessment: Statistical reproducibility with prediction intervals and heterogeneity\n"
        "- meta_analysis_potential: Suitability for systematic review and meta-analysis integration\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

# New enhanced model analysis prompt
MODEL_ANALYSIS_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Translational Research Expert with PhD-level expertise in experimental model validation and study design optimization.\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Provide model analysis with translational validity assessment and clinical relevance evaluation\n"
        "✅ Include experimental design optimization with power analysis and sample size justification\n"
        "✅ Assess model limitations with alternative model comparison and validation strategies\n"
        "✅ Evaluate translational potential with regulatory pathway and clinical development considerations\n"
        "✅ Include reproducibility assessment with inter-laboratory validation and standardization protocols\n\n"
        "ENHANCED ANALYSIS REQUIREMENTS:\n"
        "1. Characterize experimental model with phylogenetic relevance and physiological similarity assessment\n"
        "2. Evaluate study design with CONSORT/ARRIVE guideline compliance and methodological rigor\n"
        "3. Assess population characteristics with demographic representativeness and selection bias evaluation\n"
        "4. Identify systematic biases with confounding variable analysis and causal inference assessment\n"
        "5. Evaluate translational validity with species differences and human relevance prediction\n"
        "6. Include regulatory compliance with FDA/EMA guidance and Good Laboratory Practice standards\n\n"
        "Return a JSON object with these enhanced fields:\n"
        "- model_type: Experimental system classification with phylogenetic and physiological context\n"
        "- study_design: Methodology with CONSORT/ARRIVE compliance and design optimization rationale\n"
        "- population_description: Comprehensive demographics with representativeness and selection criteria\n"
        "- protocol_summary: Detailed procedures with standardization and quality control measures\n"
        "- model_rationale: Scientific justification with alternative model comparison and validation evidence\n"
        "- translational_validity: Human relevance assessment with species differences and physiological similarity\n"
        "- bias_assessment: Systematic bias identification with confounding variable analysis and mitigation\n"
        "- experimental_rigor: CONSORT/ARRIVE compliance with methodological quality assessment\n"
        "- strengths: Model advantages with unique capabilities and experimental precision\n"
        "- limitations: Model constraints with species differences and translational barriers\n"
        "- clinical_relevance: Real-world applicability with patient population alignment and clinical utility\n"
        "- sample_size_power: Statistical power calculation with effect size estimation and adequacy assessment\n"
        "- randomization_blinding: Allocation concealment with bias prevention and quality assurance\n"
        "- regulatory_pathway: FDA/EMA guidance alignment with development pathway and approval considerations\n"
        "- reproducibility_standards: Inter-laboratory validation with standardization protocols and quality metrics\n\n"
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
    # Increased token limit to handle enhanced content extraction (70K+ chars)
    # Focus on methods sections for better analysis
    safe_text = _extract_methods_section(full_text or "", max_chars=25000)
    base = LLMChain(llm=llm, prompt=METHODS_BASE_PROMPT).invoke({"objective": objective[:400], "full_text": safe_text})
    try:
        from services.flexible_json_parser import parse_llm_json
        text = base.get("text", base) if isinstance(base, dict) else str(base)
        parse_result = parse_llm_json(text, expected_structure=[], fallback_factory=lambda: [])
        rows = parse_result.data if parse_result.success and isinstance(parse_result.data, list) else []
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
    # Increased token limit to handle enhanced content extraction (70K+ chars)
    # Focus on results sections for better analysis
    safe_text = _extract_results_section(full_text or "", max_chars=25000)
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
    # Increased token limit to handle enhanced content extraction (70K+ chars)
    # Focus on model/experimental design sections for better analysis
    safe_text = _extract_model_section(full_text or "", max_chars=30000)

    try:
        base = LLMChain(llm=llm, prompt=MODEL_ANALYSIS_PROMPT).invoke({
            "objective": objective[:400],
            "full_text": safe_text
        })

        from services.flexible_json_parser import parse_llm_json
        raw_text = base.get("text", base) if isinstance(base, dict) else str(base)

        parse_result = parse_llm_json(raw_text, expected_structure={}, fallback_factory=lambda: {})
        result = parse_result.data if parse_result.success and isinstance(parse_result.data, dict) else {}

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

# Intelligent content extraction functions for enhanced analysis
def _extract_methods_section(full_text: str, max_chars: int = 25000) -> str:
    """Extract methods section with intelligent prioritization"""
    if not full_text:
        return ""

    # If text is short enough, return as-is
    if len(full_text) <= max_chars:
        return full_text

    # Look for methods section markers
    methods_patterns = [
        r"(?i)(methods?|methodology|experimental\s+procedures?|materials?\s+and\s+methods?)",
        r"(?i)(protocol|procedure|approach|technique)",
        r"(?i)(statistical\s+analysis|data\s+analysis)"
    ]

    # Try to find methods section
    methods_start = -1
    for pattern in methods_patterns:
        match = re.search(pattern, full_text)
        if match:
            methods_start = max(0, match.start() - 500)  # Include some context
            break

    if methods_start >= 0:
        # Extract methods section with some buffer
        methods_end = min(len(full_text), methods_start + max_chars)
        return full_text[methods_start:methods_end]

    # Fallback: take first portion (likely contains methods)
    return full_text[:max_chars]

def _extract_results_section(full_text: str, max_chars: int = 25000) -> str:
    """Extract results section with intelligent prioritization"""
    if not full_text:
        return ""

    # If text is short enough, return as-is
    if len(full_text) <= max_chars:
        return full_text

    # Look for results section markers
    results_patterns = [
        r"(?i)(results?|findings?|outcomes?)",
        r"(?i)(statistical\s+analysis|data\s+analysis|analysis)",
        r"(?i)(figure|table|supplementary)",
        r"(?i)(p\s*[<>=]\s*0\.\d+|significant|correlation)"
    ]

    # Try to find results section
    results_start = -1
    for pattern in results_patterns:
        match = re.search(pattern, full_text)
        if match:
            results_start = max(0, match.start() - 500)  # Include some context
            break

    if results_start >= 0:
        # Extract results section with some buffer
        results_end = min(len(full_text), results_start + max_chars)
        return full_text[results_start:results_end]

    # Fallback: take middle portion (likely contains results)
    start_pos = len(full_text) // 3
    return full_text[start_pos:start_pos + max_chars]

def _extract_model_section(full_text: str, max_chars: int = 30000) -> str:
    """Extract model/experimental design section with intelligent prioritization"""
    if not full_text:
        return ""

    # If text is short enough, return as-is
    if len(full_text) <= max_chars:
        return full_text

    # Look for model/design section markers
    model_patterns = [
        r"(?i)(experimental\s+design|study\s+design|model|approach)",
        r"(?i)(methods?|methodology|protocol|procedure)",
        r"(?i)(participants?|subjects?|samples?|population)",
        r"(?i)(in\s+vitro|in\s+vivo|clinical|computational)",
        r"(?i)(randomiz|blind|control|treatment)"
    ]

    # Try to find model/design section (usually early in paper)
    model_start = -1
    for pattern in model_patterns:
        match = re.search(pattern, full_text)
        if match:
            model_start = max(0, match.start() - 1000)  # Include more context for design
            break

    if model_start >= 0:
        # Extract model section with buffer
        model_end = min(len(full_text), model_start + max_chars)
        return full_text[model_start:model_end]

    # Fallback: take first portion (likely contains introduction + methods)
    return full_text[:max_chars]


# 🚀 CONTEXT-ENHANCED DEEP-DIVE ANALYSIS PROMPTS
# Enhanced versions of the analysis prompts that use context assembly

CONTEXT_ENHANCED_METHODS_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Research Methodology Expert specializing in {research_domain} with expertise in experimental design and statistical analysis.\n\n"
        "CONTEXT PACK:\n"
        "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
        "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
        "PAPER CONTEXT: {paper_title}, {journal}, {year}, {authors}\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Comprehensive methodology analysis with statistical validation\n"
        "✅ Domain-specific expertise in {research_domain} methodologies\n"
        "✅ Critical assessment of experimental design and controls\n"
        "✅ Reproducibility analysis with sample size adequacy\n"
        "✅ Methodological innovation identification\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Identify ALL experimental techniques with {research_domain}-specific context\n"
        "2. Extract parameters with statistical rigor assessment\n"
        "3. Evaluate methodological appropriateness for {project_objective}\n"
        "4. Assess controls and validation with domain expertise\n"
        "5. Identify methodological innovations and limitations\n\n"
        "Return a JSON array of objects with these fields:\n"
        "- technique: Method name with domain-specific classification\n"
        "- measurement: What is measured with precision and accuracy assessment\n"
        "- role_in_study: Purpose within research framework and {project_objective}\n"
        "- parameters: Conditions with statistical power assessment\n"
        "- controls_validation: Control experiments with adequacy evaluation\n"
        "- limitations_reproducibility: Limitations with severity scoring\n"
        "- validation: Statistical validation with effect size assessment\n"
        "- domain_relevance: Relevance to {research_domain} and {project_objective}\n"
        "- methodological_innovation: Novel aspects and improvements\n"
        "- accession_ids: Database identifiers and references\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=[
        "research_domain", "experience_level", "project_phase",
        "project_objective", "research_questions", "paper_title",
        "journal", "year", "authors", "objective", "full_text"
    ],
)

CONTEXT_ENHANCED_RESULTS_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Data Analysis Expert specializing in {research_domain} with expertise in statistical interpretation and evidence synthesis.\n\n"
        "CONTEXT PACK:\n"
        "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
        "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
        "PAPER CONTEXT: {paper_title}, {journal}, {year}, {authors}\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Comprehensive results interpretation with effect sizes\n"
        "✅ Statistical significance with clinical/practical significance\n"
        "✅ Domain-specific interpretation in {research_domain} context\n"
        "✅ Evidence strength assessment with confidence intervals\n"
        "✅ Bias identification and limitation analysis\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Evaluate hypothesis alignment with {project_objective}\n"
        "2. Extract quantitative results with {research_domain}-specific interpretation\n"
        "3. Assess statistical and clinical significance\n"
        "4. Identify biases and confounding factors\n"
        "5. Evaluate translational potential and practical implications\n\n"
        "Return a JSON object with these fields:\n"
        "- hypothesis_alignment: Alignment with {project_objective} (support/refute/mixed)\n"
        "- key_results: Array of findings with domain-specific interpretation:\n"
        "  * metric: Measurement with {research_domain} context\n"
        "  * value: Result with precision and confidence intervals\n"
        "  * unit: Units with standardization assessment\n"
        "  * effect_size: Effect size with clinical significance\n"
        "  * statistical_significance: p-values with multiple testing correction\n"
        "  * clinical_significance: Practical importance in {research_domain}\n"
        "  * confidence_interval: 95% CI with interpretation\n"
        "- statistical_methods: Methods with appropriateness assessment\n"
        "- sample_characteristics: Demographics with representativeness\n"
        "- limitations_biases_in_results: Biases with severity scoring\n"
        "- evidence_strength: Overall strength with GRADE assessment\n"
        "- translational_potential: Clinical/practical applications\n"
        "- domain_implications: Implications for {research_domain}\n"
        "- future_research: Recommendations aligned with {project_objective}\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=[
        "research_domain", "experience_level", "project_phase",
        "project_objective", "research_questions", "paper_title",
        "journal", "year", "authors", "objective", "full_text"
    ],
)

CONTEXT_ENHANCED_MODEL_PROMPT = PromptTemplate(
    template=(
        "You are a Senior Experimental Design Expert specializing in {research_domain} with expertise in study design and model validation.\n\n"
        "CONTEXT PACK:\n"
        "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
        "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
        "PAPER CONTEXT: {paper_title}, {journal}, {year}, {authors}\n\n"
        "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
        "✅ Comprehensive experimental design analysis\n"
        "✅ Model validity assessment with {research_domain} expertise\n"
        "✅ Population representativeness evaluation\n"
        "✅ Bias identification with severity assessment\n"
        "✅ Translational relevance to {project_objective}\n\n"
        "ANALYSIS REQUIREMENTS:\n"
        "1. Characterize experimental model with {research_domain} context\n"
        "2. Evaluate study design rigor and appropriateness\n"
        "3. Assess population characteristics and representativeness\n"
        "4. Identify biases and confounding factors\n"
        "5. Evaluate translational relevance to {project_objective}\n\n"
        "Return a JSON object with these fields:\n"
        "- experimental_model: Model type with {research_domain} classification\n"
        "- study_design: Design with rigor assessment\n"
        "- study_design_taxonomy: Formal classification\n"
        "- population_characteristics: Demographics with representativeness\n"
        "- sample_size_analysis: Power analysis and adequacy\n"
        "- randomization_blinding: Methods with bias prevention\n"
        "- inclusion_exclusion_criteria: Criteria with selection bias assessment\n"
        "- potential_biases: Biases with severity and mitigation\n"
        "- model_validity: Internal and external validity assessment\n"
        "- translational_relevance: Relevance to {research_domain} and {project_objective}\n"
        "- protocol_summary: Summary with methodological strengths\n"
        "- domain_appropriateness: Suitability for {research_domain} research\n\n"
        "Focus on: {objective}\n\n"
        "Article Text: {full_text}"
    ),
    input_variables=[
        "research_domain", "experience_level", "project_phase",
        "project_objective", "research_questions", "paper_title",
        "journal", "year", "authors", "objective", "full_text"
    ],
)


# 🚀 CONTEXT-ENHANCED PIPELINE FUNCTIONS
# Enhanced versions that use context assembly for PhD-level analysis

def run_methods_pipeline_with_context(full_text: str, objective: str, llm, context_pack: dict) -> List[Dict[str, Any]]:
    """Enhanced methods analysis pipeline with context assembly"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Prepare context variables
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "deep_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [objective])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown Year")),
            "authors": ", ".join(paper_info.get("authors", [])),
            "objective": objective,
            "full_text": full_text
        }

        # Use context-enhanced prompt
        chain = LLMChain(llm=llm, prompt=CONTEXT_ENHANCED_METHODS_PROMPT)
        result = chain.invoke(context_vars)

        # Parse and return result
        from services.flexible_json_parser import parse_llm_json
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)

        parse_result = parse_llm_json(text_result, expected_structure=[], fallback_factory=lambda: [])
        if parse_result.success:
            parsed_data = parse_result.data
            return parsed_data if isinstance(parsed_data, list) else [parsed_data]
        else:
            # Fallback to original pipeline if JSON parsing fails
            return run_methods_pipeline(full_text, objective, llm)

    except Exception:
        # Graceful fallback to original pipeline
        return run_methods_pipeline(full_text, objective, llm)


def run_results_pipeline_with_context(full_text: str, objective: str, llm, pmid: str, context_pack: dict) -> Dict[str, Any]:
    """Enhanced results analysis pipeline with context assembly"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Prepare context variables
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "deep_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [objective])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown Year")),
            "authors": ", ".join(paper_info.get("authors", [])),
            "objective": objective,
            "full_text": full_text
        }

        # Use context-enhanced prompt
        chain = LLMChain(llm=llm, prompt=CONTEXT_ENHANCED_RESULTS_PROMPT)
        result = chain.invoke(context_vars)

        # Parse and return result
        from services.flexible_json_parser import parse_llm_json
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)

        parse_result = parse_llm_json(text_result, expected_structure={}, fallback_factory=lambda: {})
        if parse_result.success:
            return parse_result.data if isinstance(parse_result.data, dict) else {}
        else:
            # Fallback to original pipeline if JSON parsing fails
            return run_results_pipeline(full_text, objective, llm, pmid)

    except Exception:
        # Graceful fallback to original pipeline
        return run_results_pipeline(full_text, objective, llm, pmid)


def run_enhanced_model_pipeline_with_context(full_text: str, objective: str, llm, context_pack: dict) -> Dict[str, Any]:
    """Enhanced model analysis pipeline with context assembly"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Prepare context variables
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "deep_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [objective])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown Year")),
            "authors": ", ".join(paper_info.get("authors", [])),
            "objective": objective,
            "full_text": full_text
        }

        # Use context-enhanced prompt
        chain = LLMChain(llm=llm, prompt=CONTEXT_ENHANCED_MODEL_PROMPT)
        result = chain.invoke(context_vars)

        # Parse and return result
        from services.flexible_json_parser import parse_llm_json
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)

        parse_result = parse_llm_json(text_result, expected_structure={}, fallback_factory=lambda: {})
        if parse_result.success:
            return parse_result.data if isinstance(parse_result.data, dict) else {}
        else:
            # Fallback to original pipeline if JSON parsing fails
            return run_enhanced_model_pipeline(full_text, objective, llm)

    except Exception:
        # Graceful fallback to original pipeline
        return run_enhanced_model_pipeline(full_text, objective, llm)


# 🚀 OUTPUT CONTRACT-ENHANCED PIPELINE FUNCTIONS
# Enhanced versions that enforce academic quality standards with OutputContract

def run_methods_pipeline_with_contract(full_text: str, objective: str, llm, context_pack: dict, output_contract: dict) -> List[Dict[str, Any]]:
    """Enhanced methods analysis pipeline with OutputContract quality enforcement"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Create contract-enhanced prompt template
        contract_enhanced_methods_prompt = PromptTemplate(
            template=(
                "You are a Senior Research Methodology Expert specializing in {research_domain} with expertise in experimental design and statistical analysis.\n\n"
                "CONTEXT PACK:\n"
                "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
                "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
                "PAPER CONTEXT: {paper_title}, {journal}, {year}, {authors}\n\n"
                "OUTPUT CONTRACT (MANDATORY REQUIREMENTS):\n"
                "✅ Include ≥{required_quotes} direct quotes with exact citations\n"
                "✅ Extract ≥{required_entities} entities (methods, tools, statistical approaches)\n"
                "✅ Provide quantitative metrics and sample characteristics\n"
                "✅ Include counter-analysis and limitation assessment\n"
                "✅ Provide ≥{min_actionable_steps} actionable methodological recommendations\n\n"
                "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
                "✅ Comprehensive methodology analysis with statistical validation\n"
                "✅ Domain-specific expertise in {research_domain} methodologies\n"
                "✅ Critical assessment of experimental design and controls\n"
                "✅ Reproducibility analysis with sample size adequacy\n"
                "✅ Methodological innovation identification\n"
                "✅ Bias assessment and validity evaluation\n\n"
                "Research Objective: {objective}\n\n"
                "Full Text to Analyze:\n{full_text}\n\n"
                "Return ONLY a JSON array of methodology analysis objects. Each object must include:\n"
                "- method_name: string (specific methodology name)\n"
                "- description: string (detailed methodology description with quotes)\n"
                "- statistical_approach: string (statistical methods used)\n"
                "- sample_characteristics: object (sample size, demographics, inclusion criteria)\n"
                "- validity_assessment: string (internal/external validity evaluation)\n"
                "- reproducibility_score: number (1-10 reproducibility assessment)\n"
                "- limitations: array of strings (methodological limitations)\n"
                "- innovations: array of strings (novel methodological aspects)\n"
                "- actionable_recommendations: array of strings (implementation recommendations)\n"
                "- evidence_quotes: array of objects with {quote, source_section}\n"
                "- extracted_entities: array of strings (methods, tools, frameworks)\n"
            ),
            input_variables=[
                "research_domain", "experience_level", "project_phase",
                "project_objective", "research_questions", "paper_title",
                "journal", "year", "authors", "required_quotes", "required_entities",
                "min_actionable_steps", "objective", "full_text"
            ],
        )

        # Prepare context variables with contract requirements
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "methodology_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown")),
            "authors": ", ".join(paper_info.get("authors", [])) if isinstance(paper_info.get("authors"), list) else str(paper_info.get("authors", "Unknown")),
            "required_quotes": str(output_contract.get("required_quotes", 2)),
            "required_entities": str(output_contract.get("required_entities", 5)),
            "min_actionable_steps": str(output_contract.get("min_actionable_steps", 3)),
            "objective": objective,
            "full_text": full_text[:8000]  # Truncate for prompt efficiency
        }

        # Use contract-enhanced prompt
        chain = LLMChain(llm=llm, prompt=contract_enhanced_methods_prompt)
        result = chain.invoke(context_vars)

        # Parse and return result with JSON cleaning
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)
        if "```" in text_result:
            text_result = text_result.replace("```json", "").replace("```JSON", "").replace("```", "").strip()

        from services.flexible_json_parser import parse_llm_json
        parse_result = parse_llm_json(text_result, expected_structure=[], fallback_factory=lambda: [{"error": "Failed to parse contract-enhanced methods analysis", "raw_output": text_result[:500]}])
        if parse_result.success:
            parsed_data = parse_result.data
            return parsed_data if isinstance(parsed_data, list) else [parsed_data]
        else:
            return [{"error": "Failed to parse contract-enhanced methods analysis", "raw_output": text_result[:500]}]

    except Exception:
        # Graceful fallback to context-enhanced pipeline
        return run_methods_pipeline_with_context(full_text, objective, llm, context_pack)

def run_results_pipeline_with_contract(full_text: str, objective: str, llm, pmid: str, context_pack: dict, output_contract: dict) -> List[Dict[str, Any]]:
    """Enhanced results analysis pipeline with OutputContract quality enforcement"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Create contract-enhanced prompt template
        contract_enhanced_results_prompt = PromptTemplate(
            template=(
                "You are a Senior Research Results Analyst specializing in {research_domain} with expertise in statistical interpretation and evidence synthesis.\n\n"
                "CONTEXT PACK:\n"
                "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
                "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
                "PAPER CONTEXT: {paper_title}, {journal}, {year}\n\n"
                "OUTPUT CONTRACT (MANDATORY REQUIREMENTS):\n"
                "✅ Include ≥{required_quotes} direct quotes with exact statistical results\n"
                "✅ Extract ≥{required_entities} quantitative entities (metrics, p-values, effect sizes)\n"
                "✅ Provide quantitative metrics with confidence intervals\n"
                "✅ Include counter-analysis and alternative interpretations\n"
                "✅ Provide ≥{min_actionable_steps} actionable clinical recommendations\n\n"
                "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
                "✅ Rigorous statistical interpretation with effect size analysis\n"
                "✅ Clinical significance assessment beyond statistical significance\n"
                "✅ Hypothesis alignment and research question answering\n"
                "✅ Bias detection and confounding variable analysis\n"
                "✅ Generalizability assessment and population applicability\n"
                "✅ Evidence strength grading and recommendation formulation\n\n"
                "Research Objective: {objective}\n\n"
                "Full Text to Analyze:\n{full_text}\n\n"
                "Return ONLY a JSON array of results analysis objects. Each object must include:\n"
                "- finding_name: string (specific result or finding)\n"
                "- statistical_result: string (exact statistical values with quotes)\n"
                "- effect_size: object (magnitude and clinical significance)\n"
                "- confidence_intervals: string (statistical confidence bounds)\n"
                "- hypothesis_alignment: string (how results address research questions)\n"
                "- clinical_significance: string (practical importance assessment)\n"
                "- limitations: array of strings (result interpretation limitations)\n"
                "- alternative_interpretations: array of strings (counter-analysis)\n"
                "- actionable_recommendations: array of strings (clinical applications)\n"
                "- evidence_quotes: array of objects with {quote, statistical_value, source_section}\n"
                "- extracted_entities: array of strings (metrics, biomarkers, outcomes)\n"
                "- evidence_strength: string (GRADE or similar evidence assessment)\n"
            ),
            input_variables=[
                "research_domain", "experience_level", "project_phase",
                "project_objective", "research_questions", "paper_title",
                "journal", "year", "required_quotes", "required_entities",
                "min_actionable_steps", "objective", "full_text"
            ],
        )

        # Prepare context variables with contract requirements
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "results_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown")),
            "required_quotes": str(output_contract.get("required_quotes", 2)),
            "required_entities": str(output_contract.get("required_entities", 5)),
            "min_actionable_steps": str(output_contract.get("min_actionable_steps", 3)),
            "objective": objective,
            "full_text": full_text[:8000]  # Truncate for prompt efficiency
        }

        # Use contract-enhanced prompt
        chain = LLMChain(llm=llm, prompt=contract_enhanced_results_prompt)
        result = chain.invoke(context_vars)

        # Parse and return result with JSON cleaning
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)
        if "```" in text_result:
            text_result = text_result.replace("```json", "").replace("```JSON", "").replace("```", "").strip()

        from services.flexible_json_parser import parse_llm_json
        parse_result = parse_llm_json(text_result, expected_structure=[], fallback_factory=lambda: [{"error": "Failed to parse contract-enhanced results analysis", "raw_output": text_result[:500]}])
        if parse_result.success:
            parsed_data = parse_result.data
            return parsed_data if isinstance(parsed_data, list) else [parsed_data]
        else:
            return [{"error": "Failed to parse contract-enhanced results analysis", "raw_output": text_result[:500]}]

    except Exception:
        # Graceful fallback to context-enhanced pipeline
        return run_results_pipeline_with_context(full_text, objective, llm, pmid, context_pack)

def run_enhanced_model_pipeline_with_contract(full_text: str, objective: str, llm, context_pack: dict, output_contract: dict) -> List[Dict[str, Any]]:
    """Enhanced model analysis pipeline with OutputContract quality enforcement"""
    try:
        # Extract context variables with fallbacks
        user_profile = context_pack.get("user_profile", {})
        project_context = context_pack.get("project_context", {})
        papers_data = context_pack.get("papers_data", [{}])
        paper_info = papers_data[0] if papers_data else {}

        # Create contract-enhanced prompt template
        contract_enhanced_model_prompt = PromptTemplate(
            template=(
                "You are a Senior Scientific Model Analyst specializing in {research_domain} with expertise in experimental design and theoretical frameworks.\n\n"
                "CONTEXT PACK:\n"
                "USER PROFILE: {research_domain}, {experience_level}, {project_phase}\n"
                "PROJECT CONTEXT: {project_objective}, {research_questions}\n"
                "PAPER CONTEXT: {paper_title}, {journal}, {year}\n\n"
                "OUTPUT CONTRACT (MANDATORY REQUIREMENTS):\n"
                "✅ Include ≥{required_quotes} direct quotes with exact model descriptions\n"
                "✅ Extract ≥{required_entities} model entities (frameworks, assumptions, variables)\n"
                "✅ Provide quantitative model parameters and validation metrics\n"
                "✅ Include counter-analysis and model limitation assessment\n"
                "✅ Provide ≥{min_actionable_steps} actionable model improvement recommendations\n\n"
                "ACADEMIC STANDARDS (MANDATORY - PhD Dissertation Level):\n"
                "✅ Comprehensive model architecture analysis with theoretical grounding\n"
                "✅ Assumption validation and constraint identification\n"
                "✅ Predictive capability assessment with validation metrics\n"
                "✅ Theoretical framework alignment and innovation assessment\n"
                "✅ Generalizability analysis and boundary condition identification\n"
                "✅ Model comparison and benchmarking against established approaches\n\n"
                "Research Objective: {objective}\n\n"
                "Full Text to Analyze:\n{full_text}\n\n"
                "Return ONLY a JSON array of model analysis objects. Each object must include:\n"
                "- model_name: string (specific model or framework name)\n"
                "- theoretical_framework: string (underlying theoretical basis with quotes)\n"
                "- key_assumptions: array of strings (critical model assumptions)\n"
                "- model_parameters: object (quantitative parameters and settings)\n"
                "- validation_metrics: object (performance measures and benchmarks)\n"
                "- predictive_capability: string (model prediction accuracy and scope)\n"
                "- limitations: array of strings (model constraints and boundary conditions)\n"
                "- innovations: array of strings (novel aspects and contributions)\n"
                "- actionable_recommendations: array of strings (model improvement suggestions)\n"
                "- evidence_quotes: array of objects with {quote, model_aspect, source_section}\n"
                "- extracted_entities: array of strings (frameworks, algorithms, variables)\n"
                "- theoretical_alignment: string (alignment with established theories)\n"
            ),
            input_variables=[
                "research_domain", "experience_level", "project_phase",
                "project_objective", "research_questions", "paper_title",
                "journal", "year", "required_quotes", "required_entities",
                "min_actionable_steps", "objective", "full_text"
            ],
        )

        # Prepare context variables with contract requirements
        context_vars = {
            "research_domain": user_profile.get("research_domain", "biomedical_research"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "project_phase": user_profile.get("project_phase", "model_analysis"),
            "project_objective": project_context.get("objective", objective),
            "research_questions": ", ".join(project_context.get("research_questions", [])),
            "paper_title": paper_info.get("title", "Unknown Title"),
            "journal": paper_info.get("journal", "Unknown Journal"),
            "year": str(paper_info.get("year", "Unknown")),
            "required_quotes": str(output_contract.get("required_quotes", 2)),
            "required_entities": str(output_contract.get("required_entities", 5)),
            "min_actionable_steps": str(output_contract.get("min_actionable_steps", 3)),
            "objective": objective,
            "full_text": full_text[:8000]  # Truncate for prompt efficiency
        }

        # Use contract-enhanced prompt
        chain = LLMChain(llm=llm, prompt=contract_enhanced_model_prompt)
        result = chain.invoke(context_vars)

        # Parse and return result with JSON cleaning
        text_result = result.get("text", result) if isinstance(result, dict) else str(result)
        if "```" in text_result:
            text_result = text_result.replace("```json", "").replace("```JSON", "").replace("```", "").strip()

        from services.flexible_json_parser import parse_llm_json
        parse_result = parse_llm_json(text_result, expected_structure=[], fallback_factory=lambda: [{"error": "Failed to parse contract-enhanced model analysis", "raw_output": text_result[:500]}])
        if parse_result.success:
            parsed_data = parse_result.data
            return parsed_data if isinstance(parsed_data, list) else [parsed_data]
        else:
            return [{"error": "Failed to parse contract-enhanced model analysis", "raw_output": text_result[:500]}]

    except Exception:
        # Graceful fallback to context-enhanced pipeline
        return run_enhanced_model_pipeline_with_context(full_text, objective, llm, context_pack)