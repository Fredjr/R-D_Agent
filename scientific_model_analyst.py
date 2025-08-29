from __future__ import annotations

import json
import re
from typing import Dict

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


SCIENTIFIC_MODEL_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "model_type","study_design","population_description","protocol_summary","strengths","limitations",
        "model_type_taxonomy","study_design_taxonomy","sample_size","arms_groups","blinding_randomization","control_type","collection_timepoints","justification","link_to_objective","fact_anchors"
    ],
    "properties": {
        "model_type": {"type": "string"},
        "study_design": {"type": "string"},
        "population_description": {"type": "string"},
        "protocol_summary": {"type": "string"},
        "strengths": {"type": "string"},
        "limitations": {"type": "string"},
        "model_type_taxonomy": {"type": "string"},
        "study_design_taxonomy": {"type": "string"},
        "sample_size": {"type": "string"},
        "arms_groups": {"type": "string"},
        "blinding_randomization": {"type": "string"},
        "control_type": {"type": "string"},
        "collection_timepoints": {"type": "string"},
        "justification": {"type": "string"},
        "link_to_objective": {"type": "string"},
        "fact_anchors": {"type": "array"},
    },
}


_MODEL_ANALYST_PROMPT = PromptTemplate(
    template=(
        "You are an expert in scientific study design. Analyze the article to create a clear summary of its scientific model.\n"
        "STRICT CONSTRAINT: Use ONLY the provided full article text; do not use any external sources.\n\n"
        "User's Initial Objective: {objective}\n\n"
        "Article Full Text: {full_text}\n\n"
        "First, think step-by-step about:\n"
        "1) Model Identification (e.g., in vitro, in vivo, clinical, review, computational modeling).\n"
        "2) Population/Sample: SPECIFIC DETAILS REQUIRED - for in vitro: exact cell lines (e.g., HEK293, MCF-7, primary human endothelial cells); for in vivo: exact animal strain and characteristics (e.g., C57BL/6 mice, Sprague-Dawley rats, age, weight, sex); for clinical: patient demographics, inclusion/exclusion criteria.\n"
        "3) Study Design Classification (e.g., randomized trial, observational, meta-analysis).\n"
        "4) Protocol Summary (concise, grounded).\n"
        "5) Model Rationale: EXPLICITLY explain WHY this model was chosen over alternatives - what specific biological question does it address?\n"
        "6) Bias Assessment: IDENTIFY SPECIFIC potential biases (e.g., selection bias in patient recruitment, species differences in animal models, immortalization artifacts in cell lines).\n"
        "7) Strengths & Limitations of the chosen model/design.\n"
        "8) Taxonomy normalization and key metadata (model_type_taxonomy, study_design_taxonomy, sample_size, arms_groups, blinding_randomization, control_type, collection_timepoints).\n"
        "9) Provide 3-5 fact_anchors: each item must include a claim and an evidence object with fields title, year, pmid, and a direct quote from the text.\n\n"
        "Then OUTPUT ONLY one JSON object with EXACTLY these keys:\n"
        "model_type, study_design, population_description, protocol_summary, model_rationale, bias_assessment, strengths, limitations, model_type_taxonomy, study_design_taxonomy, sample_size, arms_groups, blinding_randomization, control_type, collection_timepoints, justification, link_to_objective, fact_anchors."
    ),
    input_variables=["objective", "full_text"],
)


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if "```" in t:
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _coerce_schema(obj: Dict[str, object]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    keys = [
        "model_type","study_design","population_description","protocol_summary","model_rationale","bias_assessment","strengths","limitations",
        "model_type_taxonomy","study_design_taxonomy","sample_size","arms_groups","blinding_randomization","control_type","collection_timepoints","justification","link_to_objective"
    ]
    for k in keys:
        v = obj.get(k)
        out[k] = ("" if v is None else str(v)).strip()

    # Handle fact_anchors more robustly
    anchors = obj.get("fact_anchors")
    if not isinstance(anchors, list):
        anchors = []

    # Validate and normalize each anchor
    normalized_anchors = []
    for anchor in anchors:
        if not isinstance(anchor, dict):
            continue
        claim = str(anchor.get("claim", "")).strip()
        if not claim:
            continue

        evidence = anchor.get("evidence")
        if not isinstance(evidence, dict):
            evidence = {}

        normalized_anchor = {
            "claim": claim,
            "evidence": {
                "title": str(evidence.get("title", "")).strip(),
                "year": evidence.get("year"),
                "pmid": str(evidence.get("pmid", "")).strip() if evidence.get("pmid") else None,
                "quote": str(evidence.get("quote", "")).strip()
            }
        }
        normalized_anchors.append(normalized_anchor)

    return {**out, "fact_anchors": normalized_anchors}


def analyze_scientific_model(full_article_text: str, user_initial_objective: str, llm) -> Dict[str, str]:
    """Return structured JSON describing the scientific model used in the article.

    - Uses ONLY the provided article text; no external sources.
    - Enforces a strict, predictable schema of strings.
    """
    # Defensive truncation to respect token limits
    safe_text = (full_article_text or "")[:12000]
    chain = LLMChain(llm=llm, prompt=_MODEL_ANALYST_PROMPT)
    raw = chain.invoke({"objective": (user_initial_objective or "")[:400], "full_text": safe_text})
    text = raw.get("text", raw) if isinstance(raw, dict) else str(raw)
    cleaned = _strip_code_fences(text)
    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            raise ValueError("not dict")
    except Exception:
        data = {}
    return _coerce_schema(data)

