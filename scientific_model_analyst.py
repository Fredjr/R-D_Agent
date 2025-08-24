from __future__ import annotations

import json
import re
from typing import Dict

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


SCIENTIFIC_MODEL_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "model_type",
        "study_design",
        "population_description",
        "protocol_summary",
        "strengths",
        "limitations",
    ],
    "properties": {
        "model_type": {"type": "string"},
        "study_design": {"type": "string"},
        "population_description": {"type": "string"},
        "protocol_summary": {"type": "string"},
        "strengths": {"type": "string"},
        "limitations": {"type": "string"},
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
        "2) Population/Sample (cells, animals, patients, dataset; include specific characteristics when present).\n"
        "3) Study Design Classification (e.g., randomized trial, observational, meta-analysis).\n"
        "4) Protocol Summary (concise, grounded).\n"
        "5) Strengths & Limitations of the chosen model/design.\n\n"
        "Then OUTPUT ONLY a single JSON object with EXACTLY these keys (all string values):\n"
        "model_type, study_design, population_description, protocol_summary, strengths, limitations."
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
    for k in (
        "model_type",
        "study_design",
        "population_description",
        "protocol_summary",
        "strengths",
        "limitations",
    ):
        v = obj.get(k)
        out[k] = ("" if v is None else str(v)).strip()
    return out


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

