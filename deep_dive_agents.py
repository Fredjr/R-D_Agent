from __future__ import annotations
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# Base prompts (focused) for smaller, task-specific extractions
METHODS_BASE_PROMPT = PromptTemplate(
    template=(
        "Using ONLY the provided full article text, list key experimental techniques.\n"
        "Return ONLY a JSON array of objects with: technique, measurement, role_in_study, parameters.\n\n"
        "User Objective: {objective}\nFull Text: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

RESULTS_BASE_PROMPT = PromptTemplate(
    template=(
        "Using ONLY the article full text, summarize main outcomes and provide an initial quantitative list if present.\n"
        "Return ONLY one JSON object with keys: hypothesis_alignment (string), key_results (array of {metric,value,unit,effect_size,p_value,fdr,ci,direction,figure_table_ref}).\n\n"
        "User Objective: {objective}\nFull Text: {full_text}"
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
        print(f"DEBUG: AI raw output: {raw_text[:500]}")  # Debug the raw AI output
        obj = json.loads(raw_text)
        if not isinstance(obj, dict):
            obj = {}
        print(f"DEBUG: Successfully parsed JSON with keys: {list(obj.keys()) if obj else 'empty'}")
    except Exception as e:
        print(f"DEBUG: JSON parsing failed: {e}, raw text: {raw_text[:200] if 'raw_text' in locals() else 'N/A'}")
        obj = {}
        print("DEBUG: Returning empty dict due to parsing failure")

    # Ensure keys exist with proper defaults
    obj.setdefault("hypothesis_alignment", "")
    obj.setdefault("key_results", [])
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

    print(f"DEBUG: Final result keys: {list(obj.keys())}, key_results count: {len(obj.get('key_results', []))}")
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