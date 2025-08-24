from __future__ import annotations

import json
from typing import Dict

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


RESULTS_INTERPRETATION_PROMPT = PromptTemplate(
    template=(
        "You are a senior research scientist. Analyze the 'Results' and 'Discussion' to synthesize main findings.\n"
        "STRICT CONSTRAINT: Use ONLY the provided full article text.\n\n"
        "User's Initial Objective: {objective}\n\n"
        "Article Full Text: {full_text}\n\n"
        "OUTPUT ONLY one JSON object with EXACTLY: primary_finding, interpretation, unexpected_findings (strings)."
    ),
    input_variables=["objective", "full_text"],
)


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if "```" in t:
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _coerce(obj: object) -> Dict[str, str]:
    if not isinstance(obj, dict):
        obj = {}
    return {
        "primary_finding": str((obj or {}).get("primary_finding", "")).strip(),
        "interpretation": str((obj or {}).get("interpretation", "")).strip(),
        "unexpected_findings": str((obj or {}).get("unexpected_findings", "")).strip(),
    }


def analyze_results_interpretation(full_article_text: str, user_initial_objective: str, llm) -> Dict[str, str]:
    safe_text = (full_article_text or "")[:12000]
    chain = LLMChain(llm=llm, prompt=RESULTS_INTERPRETATION_PROMPT)
    raw = chain.invoke({"objective": (user_initial_objective or "")[:400], "full_text": safe_text})
    text = raw.get("text", raw) if isinstance(raw, dict) else str(raw)
    cleaned = _strip_code_fences(text)
    try:
        data = json.loads(cleaned)
    except Exception:
        data = {}
    return _coerce(data)

