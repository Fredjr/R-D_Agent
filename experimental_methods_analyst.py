from __future__ import annotations

import json
from typing import List, Dict

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


EXPERIMENTAL_METHODS_PROMPT = PromptTemplate(
    template=(
        "You are a lab research specialist. Analyze the 'Methods' section of the article to identify key experimental techniques.\n"
        "STRICT CONSTRAINT: Use ONLY the provided full article text.\n\n"
        "User's Initial Objective: {objective}\n\n"
        "Article Full Text: {full_text}\n\n"
        "Return ONLY a JSON array of objects, each with EXACTLY: technique, role_in_study, assessment."
    ),
    input_variables=["objective", "full_text"],
)


def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if "```" in t:
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _coerce_methods(arr: object) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    if not isinstance(arr, list):
        return out
    for it in arr:
        if not isinstance(it, dict):
            continue
        out.append({
            "technique": str(it.get("technique", "")).strip(),
            "role_in_study": str(it.get("role_in_study", "")).strip(),
            "assessment": str(it.get("assessment", "")).strip(),
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

