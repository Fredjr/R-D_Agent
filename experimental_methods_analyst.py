from __future__ import annotations

import json
from typing import List, Dict
import re

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


EXPERIMENTAL_METHODS_PROMPT = PromptTemplate(
    template=(
        "You are a lab research specialist. Identify and evaluate the key experimental techniques used.\n"
        "STRICT: Use ONLY the provided full article text. Tie relevance to the user's objective.\n\n"
        "User Objective: {objective}\n\n"
        "Article Full Text: {full_text}\n\n"
        "Return ONLY a JSON array. Each object must include EXACTLY these keys: \n"
        "technique, measurement, role_in_study, parameters, controls_validation, limitations_reproducibility, validation, accession_ids, fact_anchors.\n"
        "- technique: concise name of the lab method or assay (e.g., RT-qPCR, Western blot).\n"
        "- measurement: what is quantified or detected (analyte/endpoint).\n"
        "- role_in_study: how the technique supports the study question.\n"
        "- parameters: key settings/platforms/reagents (e.g., antibody clone, kit/vendor, cycles/temps).\n"
        "- controls_validation: control types and validation approaches used.\n"
        "- limitations_reproducibility: caveats and reproducibility notes.\n"
        "- validation: orthogonal validations or replication if any.\n"
        "- accession_ids: array of repository accessions (e.g., GEO/SRA) if present; else [].\n"
        "- fact_anchors: provide 3-5 items; each item must include a claim and an evidence object with fields title, year, pmid, and a direct quote from the text.\n"
    ),
    input_variables=["objective", "full_text"],
)


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if "```" in t:
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _coerce_methods(arr: object) -> List[Dict[str, object]]:
    out: List[Dict[str, object]] = []
    if not isinstance(arr, list):
        return out
    for it in arr:
        if not isinstance(it, dict):
            continue
        anchors = it.get("fact_anchors")
        if not isinstance(anchors, list):
            anchors = []
        # Normalize evidence subfields
        norm_anchors: List[Dict[str, object]] = []
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
                }
            })
        acc = it.get("accession_ids")
        if not isinstance(acc, list):
            acc = []
        out.append({
            "technique": str(it.get("technique", "")).strip(),
            "measurement": str(it.get("measurement", "")).strip(),
            "role_in_study": str(it.get("role_in_study", "")).strip(),
            "parameters": str(it.get("parameters", "")).strip(),
            "controls_validation": str(it.get("controls_validation", "")).strip(),
            "limitations_reproducibility": str(it.get("limitations_reproducibility", "")).strip(),
            "validation": str(it.get("validation", "")).strip(),
            "accession_ids": [str(x).strip() for x in acc if str(x).strip()],
            "fact_anchors": norm_anchors,
        })
    return out


def _harvest_accessions(text: str) -> List[str]:
    ids: List[str] = []
    if not text:
        return ids
    patterns = [
        r"\bGSE\d+\b", r"\bGSM\d+\b", r"\bSRR\d+\b", r"\bSRS\d+\b", r"\bPRJNA\d+\b",
        r"\bERP\d+\b", r"\bE-\w\w\w-\d+\b", r"\bPRJEB\d+\b"
    ]
    for pat in patterns:
        for m in re.findall(pat, text):
            if m not in ids:
                ids.append(m)
    return ids[:15]


def _instruments_hints(text: str) -> str:
    if not text:
        return ""
    hints = []
    if re.search(r"flow cytometer|BD Accuri|FACS|Canto|Fortessa", text, flags=re.I):
        hints.append("flow cytometer")
    if re.search(r"microscope|Olympus|Nikon|Zeiss", text, flags=re.I):
        hints.append("microscope")
    if re.search(r"qPCR|RT-qPCR|ABI|QuantStudio|LightCycler", text, flags=re.I):
        hints.append("qPCR")
    return ", ".join(sorted(set(hints)))


def _controls_hints(text: str) -> str:
    if not text:
        return ""
    hints = []
    if re.search(r"isotype control", text, flags=re.I):
        hints.append("isotype control")
    if re.search(r"replicate", text, flags=re.I):
        hints.append("replicates")
    if re.search(r"vehicle[- ]?treated|untreated|control group", text, flags=re.I):
        hints.append("vehicle/untreated control")
    return ", ".join(sorted(set(hints)))


def analyze_experimental_methods(full_article_text: str, user_initial_objective: str, llm) -> List[Dict[str, object]]:
    # Increased token limit to handle enhanced content extraction (70K+ chars)
    safe_text = (full_article_text or "")[:25000]
    chain = LLMChain(llm=llm, prompt=EXPERIMENTAL_METHODS_PROMPT)
    raw = chain.invoke({"objective": (user_initial_objective or "")[:400], "full_text": safe_text})
    text = raw.get("text", raw) if isinstance(raw, dict) else str(raw)
    cleaned = _strip_code_fences(text)
    try:
        data = json.loads(cleaned)
    except Exception:
        data = []
    rows = _coerce_methods(data)
    # Lightweight enrichment: accession ids and controls when missing
    accs = _harvest_accessions(safe_text)
    ctrl_hint = _controls_hints(safe_text)
    inst_hint = _instruments_hints(safe_text)
    for r in rows:
        if isinstance(r.get("accession_ids"), list) and len(r["accession_ids"]) == 0 and accs:
            r["accession_ids"] = accs
        if not r.get("controls_validation") and ctrl_hint:
            r["controls_validation"] = ctrl_hint
        if inst_hint and not r.get("parameters"):
            r["parameters"] = inst_hint
    return rows

