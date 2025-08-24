from __future__ import annotations

import json
from typing import List, Dict

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


def analyze_experimental_methods(full_article_text: str, user_initial_objective: str, llm) -> List[Dict[str, str]]:
    safe_text = (full_article_text or "")[:12000]
    chain = LLMChain(llm=llm, prompt=EXPERIMENTAL_METHODS_PROMPT)
    raw = chain.invoke({"objective": (user_initial_objective or "")[:400], "full_text": safe_text})
    text = raw.get("text", raw) if isinstance(raw, dict) else str(raw)
    cleaned = _strip_code_fences(text)
    try:
        data = json.loads(cleaned)
    except Exception:
        data = []
    return _coerce_methods(data)

