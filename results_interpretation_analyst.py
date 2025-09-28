from __future__ import annotations

import json
from typing import Dict, List
import re

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


RESULTS_INTERPRETATION_PROMPT = PromptTemplate(
    template=(
        "You are a senior research scientist. Synthesize results, quantify key outcomes, and link to the hypothesis.\n"
        "STRICT: Use ONLY the article full text provided.\n\n"
        "User Objective: {objective}\n\n"
        "Article Full Text: {full_text}\n\n"
        "Return ONLY one JSON object with EXACTLY these keys: \n"
        "hypothesis_alignment, key_results, limitations_biases_in_results, fact_anchors.\n"
        "- hypothesis_alignment: one of confirm | partial | contradict, plus brief rationale (e.g., 'confirm: …').\n"
        "- key_results: array of objects with metric, value, unit, effect_size, p_value, fdr, ci, direction, figure_table_ref.\n"
        "- limitations_biases_in_results: array of brief strings.\n"
        "- fact_anchors: provide 3-5 items; each item must include a claim and an evidence object with fields title, year, pmid, and a direct quote from the text.\n"
    ),
    input_variables=["objective", "full_text"],
)


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if "```" in t:
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _coerce(obj: object) -> Dict[str, object]:
    if not isinstance(obj, dict):
        obj = {}
    # Normalize anchors
    anchors = (obj or {}).get("fact_anchors")
    if not isinstance(anchors, list):
        anchors = []
    norm_anchors = []
    for a in anchors:
        if not isinstance(a, dict):
            continue
        ev = a.get("evidence") or {}
        if not isinstance(ev, dict):
            ev = {}
        norm_anchors.append({
            "claim": str(a.get("claim", "")).strip(),
            "evidence": {
                "title": str(ev.get("title", "")).strip(),
                "year": ev.get("year", None),
                "pmid": str(ev.get("pmid", "")).strip() or None,
                "quote": str(ev.get("quote", "")).strip(),
            },
        })
    # Normalize key_results
    key_results = (obj or {}).get("key_results")
    if not isinstance(key_results, list):
        key_results = []
    norm_results = []
    for kr in key_results:
        if not isinstance(kr, dict):
            continue
        norm_results.append({
            "metric": str(kr.get("metric", "")).strip(),
            "value": str(kr.get("value", "")).strip(),
            "unit": str(kr.get("unit", "")).strip(),
            "effect_size": str(kr.get("effect_size", "")).strip(),
            "p_value": str(kr.get("p_value", "")).strip(),
            "fdr": str(kr.get("fdr", "")).strip(),
            "ci": str(kr.get("ci", "")).strip(),
            "direction": str(kr.get("direction", "")).strip(),
            "figure_table_ref": str(kr.get("figure_table_ref", "")).strip(),
        })
    # Normalize limitations/biases
    lims = (obj or {}).get("limitations_biases_in_results")
    if not isinstance(lims, list):
        lims = [str((obj or {}).get("limitations_biases_in_results", "")).strip()] if (obj or {}).get("limitations_biases_in_results") else []
    return {
        "hypothesis_alignment": str((obj or {}).get("hypothesis_alignment", "")).strip(),
        "key_results": norm_results,
        "limitations_biases_in_results": [str(x).strip() for x in lims if str(x).strip()],
        "fact_anchors": norm_anchors,
    }


def _harvest_quant(text: str) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    if not text:
        return out
    # Simple patterns for p-values and fold changes
    for m in re.finditer(r"p\s*[<=>]\s*0\.?\d+", text, flags=re.I):
        out.append({"metric": "p_value", "value": m.group(0), "unit": "", "effect_size": "", "p_value": m.group(0), "fdr": "", "ci": "", "direction": "", "figure_table_ref": ""})
    for m in re.finditer(r"(\b\d+(\.\d+)?)\s*(fold|x)\s*(increase|decrease)?", text, flags=re.I):
        out.append({"metric": "fold_change", "value": m.group(0), "unit": "", "effect_size": m.group(0), "p_value": "", "fdr": "", "ci": "", "direction": "", "figure_table_ref": ""})
    # Figure/Table references
    for m in re.finditer(r"(Fig\.?\s*\d+[A-Za-z]?|Table\s*\d+)", text, flags=re.I):
        out.append({"metric": "reference", "value": "", "unit": "", "effect_size": "", "p_value": "", "fdr": "", "ci": "", "direction": "", "figure_table_ref": m.group(0)})
    return out[:10]


def analyze_results_interpretation(full_article_text: str, user_initial_objective: str, llm) -> Dict[str, object]:
    # Increased token limit to handle enhanced content extraction (70K+ chars)
    safe_text = (full_article_text or "")[:25000]
    chain = LLMChain(llm=llm, prompt=RESULTS_INTERPRETATION_PROMPT)
    raw = chain.invoke({"objective": (user_initial_objective or "")[:400], "full_text": safe_text})
    text = raw.get("text", raw) if isinstance(raw, dict) else str(raw)
    cleaned = _strip_code_fences(text)
    try:
        data = json.loads(cleaned)
    except Exception:
        data = {}
    obj = _coerce(data)
    # Lightweight enrichment for missing quant fields
    if isinstance(obj.get("key_results"), list) and len(obj["key_results"]) == 0:
        obj["key_results"] = _harvest_quant(safe_text)
    return obj

