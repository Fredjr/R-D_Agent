from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
from fastapi.concurrency import run_in_threadpool

# Step 2.2.1: Import LangChain components for prompt-driven chain
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import json
import re
from typing import List
import time
import threading
from datetime import datetime
import math
import numpy as np
import uuid
import urllib.request
import urllib.parse
import asyncio
import random
from jsonschema import validate as jsonschema_validate, ValidationError
try:
    from langgraph.graph import StateGraph, END
except Exception:
    StateGraph = None  # type: ignore
    END = None  # type: ignore

from tools import PubMedSearchTool, WebSearchTool, PatentsSearchTool
from langchain.agents import AgentType, initialize_agent
from scoring import calculate_publication_score

# Embeddings and Pinecone
from langchain.embeddings import HuggingFaceEmbeddings
from pinecone import Pinecone
try:
    # Optional: legacy/alternate Index constructor in some pinecone versions
    from pinecone import Index as PineconeIndex  # type: ignore
except Exception:  # pragma: no cover - optional import
    PineconeIndex = None  # type: ignore
try:
    from sentence_transformers import CrossEncoder
    _HAS_CROSS = True
except Exception:
    CrossEncoder = None  # type: ignore
    _HAS_CROSS = False

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for frontend dev (broad for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv('ALLOW_ORIGIN_REGEX', '.*'),
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


# Enable CORS for frontend dev

# Initialize the Gemini Pro model with API key
# Prefer a dedicated Gemini key if provided; fall back to GOOGLE_API_KEY
_GENAI_KEY = os.getenv("GOOGLE_GENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-1.5-pro"),
    convert_system_message_to_human=True,
    google_api_key=_GENAI_KEY,
)
llm_analyzer = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_SMALL_MODEL", os.getenv("GEMINI_MODEL", "gemini-1.5-pro")),
    convert_system_message_to_human=True,
    google_api_key=_GENAI_KEY,
    temperature=0.2,
)
llm_summary = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MAIN_MODEL", os.getenv("GEMINI_MODEL", "gemini-1.5-pro")),
    convert_system_message_to_human=True,
    google_api_key=_GENAI_KEY,
    temperature=0.5,
)
llm_critic = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_SMALL_MODEL", os.getenv("GEMINI_MODEL", "gemini-1.5-pro")),
    convert_system_message_to_human=True,
    google_api_key=_GENAI_KEY,
    temperature=0.1,
)
_EMBED_MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
_EMBEDDINGS_OBJ = None

def _get_embeddings():
    global _EMBEDDINGS_OBJ
    if _EMBEDDINGS_OBJ is None:
        try:
            _EMBEDDINGS_OBJ = HuggingFaceEmbeddings(model_name=_EMBED_MODEL_NAME)
        except Exception:
            _EMBEDDINGS_OBJ = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _EMBEDDINGS_OBJ
_CROSS_MODEL_NAME = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
cross_encoder = None
if os.getenv("CROSS_ENCODER_ENABLED", "0") not in ("0","false","False") and _HAS_CROSS:
    try:
        cross_encoder = CrossEncoder(_CROSS_MODEL_NAME)
    except Exception:
        cross_encoder = None
_NLI_MODEL_NAME = os.getenv("NLI_CROSS_ENCODER_MODEL", "cross-encoder/nli-deberta-v3-base")
_ENTAILMENT_ENABLED = os.getenv("ENTAILMENT_ENABLED", "0") not in ("0","false","False")
nli_encoder = None
if _HAS_CROSS and _ENTAILMENT_ENABLED:
    try:
        nli_encoder = CrossEncoder(_NLI_MODEL_NAME)
    except Exception:
        nli_encoder = None

# Pinecone client
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "rd-agent-memory")
PINECONE_HOST = os.getenv("PINECONE_HOST")


def _get_pinecone_index():
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        return None
    host = os.getenv("PINECONE_HOST")
    index_name = os.getenv("PINECONE_INDEX", PINECONE_INDEX)
    try:
        pc = Pinecone(api_key=api_key)
    except Exception:
        return None

    # Try host-first path (new serverless style)
    if host:
        try:
            return pc.Index(host=host)
        except Exception:
            pass
        # Fallback to legacy constructor if available
        if PineconeIndex is not None:
            try:
                return PineconeIndex(host=host)  # type: ignore
            except Exception:
                pass

    # Try by name (control-plane resolves host)
    try:
        return pc.Index(index_name)
    except Exception:
        pass
    if PineconeIndex is not None:
        try:
            return PineconeIndex(index_name)  # type: ignore
        except Exception:
            pass
    return None



tools = [PubMedSearchTool(), WebSearchTool()]

SYSTEM_MESSAGE = """
You are a research assistant. You have access to search tools. For any user query, your final answer MUST be a JSON object with the following schema:

{
  "summary": "A concise summary of the findings.",
  "confidence_score": "A score from 0 to 100 indicating how relevant the findings are to the user's query.",
  "methodologies": ["A", "list", "of", "key", "methodologies", "found"]
}

Rules:
- Respond with ONLY the JSON object.
- Do not include code fences, backticks, or any explanatory text.
- Ensure the JSON is valid and parseable.
 - If the user's objective is vague or missing (e.g., a single word or generic topic), prioritize identifying a single high-impact, highly cited article and produce a concise summary grounded in that article rather than a broad overview.
"""



agent_executor = initialize_agent(
    tools,
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    agent_kwargs={
        "system_message": SYSTEM_MESSAGE,
    },
)



from typing import Dict

# ---------------------
# Observability & Caching
# ---------------------

def _now_ms() -> int:
    return int(time.time() * 1000)

_LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", os.path.join(os.getcwd(), "server.log"))

def log_event(event: Dict[str, object]) -> None:
    try:
        payload = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **event,
        }
        line = json.dumps(payload, ensure_ascii=False)
        print(line)
        try:
            with open(_LOG_FILE_PATH, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        except Exception:
            pass
    except Exception:
        pass

class TTLCache:
    def __init__(self, ttl_seconds: int, max_items: int = 256):
        self._ttl = max(1, int(ttl_seconds))
        self._max = max(1, int(max_items))
        self._data: dict[str, tuple[float, object]] = {}
        self._lock = threading.Lock()

    def get(self, key: str):
        now = time.time()
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            exp, val = item
            if exp < now:
                self._data.pop(key, None)
                return None
            return val

    def set(self, key: str, value: object) -> None:
        now = time.time()
        with self._lock:
            # prune if needed
            if len(self._data) >= self._max:
                # remove oldest by expiration
                try:
                    oldest_key = min(self._data, key=lambda k: self._data[k][0])
                    self._data.pop(oldest_key, None)
                except Exception:
                    self._data.clear()
            self._data[key] = (now + self._ttl, value)

    def set_with_ttl(self, key: str, value: object, ttl_seconds: int) -> None:
        ttl = max(1, int(ttl_seconds))
        now = time.time()
        with self._lock:
            if len(self._data) >= self._max:
                try:
                    oldest_key = min(self._data, key=lambda k: self._data[k][0])
                    self._data.pop(oldest_key, None)
                except Exception:
                    self._data.clear()
            self._data[key] = (now + ttl, value)

# Caching controls
ANALYZER_CACHE_TTL = int(os.getenv("ANALYZER_CACHE_TTL", "900"))  # 15 min
RESPONSE_CACHE_TTL = int(os.getenv("RESPONSE_CACHE_TTL", "600"))  # 10 min
ENABLE_CACHING = os.getenv("ENABLE_CACHING", "1") not in ("0", "false", "False")

analyzer_cache = TTLCache(ANALYZER_CACHE_TTL)
response_cache = TTLCache(RESPONSE_CACHE_TTL)
synonyms_cache = TTLCache(int(os.getenv("SYNONYMS_CACHE_TTL", "86400")))
ALWAYS_THREE_SECTIONS = os.getenv("ALWAYS_THREE_SECTIONS", "0") not in ("0", "false", "False")
CROSS_ENCODER_ENABLED = os.getenv("CROSS_ENCODER_ENABLED", "0") not in ("0", "false", "False")
TOTAL_BUDGET_S = float(os.getenv("TOTAL_BUDGET_S", "90"))
PER_QUERY_BUDGET_S = float(os.getenv("PER_QUERY_BUDGET_S", "20"))
ENABLE_AGENT = os.getenv("ENABLE_AGENT", "0") not in ("0", "false", "False")
ENABLE_CRITIC = os.getenv("ENABLE_CRITIC", "0") not in ("0", "false", "False")
AGGRESSIVE_PRIMARY_ENABLED = os.getenv("AGGRESSIVE_PRIMARY", "0") not in ("0", "false", "False")
MULTISOURCE_ENABLED = os.getenv("MULTISOURCE_ENABLED", "1") not in ("0", "false", "False")
TRIAGE_TOP_K = int(os.getenv("TRIAGE_TOP_K", "20"))
DEEPDIVE_TOP_K = int(os.getenv("DEEPDIVE_TOP_K", "8"))
PATENTS_RETMAX = int(os.getenv("PATENTS_RETMAX", "10"))
TRIALS_RETMAX = int(os.getenv("TRIALS_RETMAX", "25"))
PLAN_BUDGET_S = float(os.getenv("PLAN_BUDGET_S", "3"))
HARVEST_BUDGET_S = float(os.getenv("HARVEST_BUDGET_S", "20"))
TRIAGE_BUDGET_S = float(os.getenv("TRIAGE_BUDGET_S", "5"))
DEEPDIVE_BUDGET_S = float(os.getenv("DEEPDIVE_BUDGET_S", "20"))
SYNTH_BUDGET_S = float(os.getenv("SYNTH_BUDGET_S", "5"))
ENTAILMENT_BUDGET_S = float(os.getenv("ENTAILMENT_BUDGET_S", "2.5"))
PUBMED_POOL_MAX = int(os.getenv("PUBMED_POOL_MAX", "50"))
TRIALS_POOL_MAX = int(os.getenv("TRIALS_POOL_MAX", "50"))
PATENTS_POOL_MAX = int(os.getenv("PATENTS_POOL_MAX", "50"))
ADAPTIVE_PROJECT_BLEND = float(os.getenv("ADAPTIVE_PROJECT_BLEND", "0.2"))
APP_VERSION = os.getenv("APP_VERSION", "v0.1.0")
GIT_SHA = os.getenv("GIT_SHA", "")

# Metrics (simple in-memory counters)
_METRICS_LOCK = threading.Lock()
METRICS = {
    "requests_total": 0,
    "requests_errors": 0,
    "llm_calls_total": 0,
    "pubmed_calls_total": 0,
    "fallback_sections_total": 0,
    "review_fallback_sections_total": 0,
    "response_cached_hits": 0,
    "latency_ms_sum": 0,
    "anchors_entailment_kept": 0,
    "anchors_entailment_filtered": 0,
    "controller_precision_deep": 0,
    "controller_recall_deep": 0,
}

def _metrics_inc(key: str, amount: int = 1):
    with _METRICS_LOCK:
        METRICS[key] = METRICS.get(key, 0) + amount

@app.get("/metrics")
async def metrics_snapshot() -> dict:
    with _METRICS_LOCK:
        data = dict(METRICS)
        completed = max(1, METRICS.get("requests_total", 0))
        data["avg_latency_ms"] = round(METRICS.get("latency_ms_sum", 0) / completed, 2)
        return data

def ensure_json_response(text: str) -> Dict[str, object]:
    """Parse LLM output into our structured object.

    - Strip code fences if present
    - Accept minimal JSON with keys: summary, relevance_justification
    - Backfill confidence_score and methodologies if missing
    - If JSON parse fails, wrap raw text as summary
    """
    cleaned = text.strip()
    try:
        # Strip common code fences
        if "```" in cleaned:
            cleaned = cleaned.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
        import json as _json
        parsed = _json.loads(cleaned)
        if isinstance(parsed, dict):
            # Backfill defaults
            if "confidence_score" not in parsed:
                parsed["confidence_score"] = 60
            if "methodologies" not in parsed:
                parsed["methodologies"] = []
            # Ensure summary exists as string
            parsed["summary"] = str(parsed.get("summary", "")).strip()
            return parsed
    except Exception:
        pass
    # Fallback: wrap raw text as summary
    return {
        "summary": cleaned,
        "confidence_score": 60,
        "methodologies": [],
    }

# ---------------------
# JSON schema for LLM outputs and auto-repair
# ---------------------
SUMMARY_JSON_SCHEMA = {
    "type": "object",
    "required": ["summary", "relevance_justification", "fact_anchors"],
    "properties": {
        "summary": {"type": "string", "minLength": 1},
        "relevance_justification": {"type": "string", "minLength": 1},
        "confidence_score": {"type": ["number", "integer"]},
        "methodologies": {"type": "array"},
        "score_breakdown": {"type": "object"},
        "fact_anchors": {
            "type": "array",
            "minItems": 3,
            "maxItems": 5,
            "items": {
                "type": "object",
                "required": ["claim", "evidence"],
                "properties": {
                    "claim": {"type": "string", "minLength": 1},
                    "evidence": {
                        "type": "object",
                        "required": ["title", "year", "pmid", "quote"],
                        "properties": {
                            "title": {"type": "string"},
                            "year": {"type": ["number", "integer"]},
                            "pmid": {"type": ["string", "null"]},
                            "quote": {"type": "string"}
                        }
                    }
                }
            }
        }
    },
}

def _validate_or_repair_summary(obj: Dict[str, object], objective: str, abstract: str) -> Dict[str, object]:
    try:
        jsonschema_validate(instance=obj, schema=SUMMARY_JSON_SCHEMA)
        return obj
    except ValidationError:
        try:
            corrected = critic_refine_chain.invoke({
                "objective": objective,
                "abstract": abstract,
                "draft_json": json.dumps({
                    "summary": str(obj.get("summary", ""))[:1000],
                    "relevance_justification": str(obj.get("relevance_justification", ""))[:500],
                })
            })
            ct = corrected.get("text", "")
            if "```" in ct:
                ct = ct.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            rep = json.loads(ct)
            if isinstance(rep, dict):
                jsonschema_validate(instance=rep, schema=SUMMARY_JSON_SCHEMA)
                # carry over optional fields
                rep.setdefault("confidence_score", obj.get("confidence_score", 60))
                rep.setdefault("methodologies", obj.get("methodologies", []))
                return rep
        except Exception:
            pass
        # Minimal fallback
        obj.setdefault("summary", str(obj.get("summary", "")).strip() or abstract[:400])
        obj.setdefault("relevance_justification", "")
        return obj

# ---------------------
# Embedding cache to reduce latency
# ---------------------
class EmbeddingCache:
    def __init__(self, max_items: int = 4096):
        self._data: dict[str, list[float]] = {}
        self._lock = threading.Lock()
        self._max = max_items

    def get_or_compute(self, text: str) -> list[float]:
        key = (text or "")[:4096]
        with self._lock:
            vec = self._data.get(key)
            if vec is not None:
                return vec
        try:
            vec = _get_embeddings().embed_query(text or "")
        except Exception:
            vec = []
        with self._lock:
            if len(self._data) >= self._max:
                # drop arbitrary item
                try:
                    self._data.pop(next(iter(self._data)))
                except Exception:
                    self._data.clear()
            self._data[key] = vec
        return vec

EMBED_CACHE = EmbeddingCache()


def _fallback_fact_anchors(abstract: str, art: dict, max_items: int = 3) -> list[dict]:
    """Generate simple fact anchors from the abstract when the LLM did not.

    Takes the first few substantive sentences as claims and attaches evidence
    (title/year/pmid/quote). This guarantees UI rendering even on LLM miss.
    """
    try:
        text = (abstract or "").strip()
        if not text:
            return []
        # Split into sentences conservatively
        parts: list[str] = []
        for seg in re.split(r"(?<=[\.!?])\s+|\n+", text):
            s = seg.strip()
            if len(s) >= 40:  # discard very short fragments
                parts.append(s)
        claims = parts[:max_items] if parts else [(text[:200] + ("…" if len(text) > 200 else ""))]
        anchors: list[dict] = []
        for c in claims:
            ev = {
                "title": art.get("title"),
                "year": art.get("pub_year"),
                "pmid": art.get("pmid"),
                "quote": c[:240],
            }
            anchors.append({"claim": c, "evidence": ev})
        return anchors[:max_items]
    except Exception:
        return []


# ---------------------
# Objective tokenization and signal inference (generic, molecule-agnostic)
# ---------------------

def _extract_objective_tokens(objective: str) -> list[str]:
    try:
        toks = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (objective or "").lower()) if len(t) >= 3]
        # de-dup order preserving
        seen: set[str] = set()
        out: list[str] = []
        for t in toks:
            if t not in seen:
                seen.add(t)
                out.append(t)
        return out
    except Exception:
        return []

_IMMUNO_ALIASES = ["pdcd1", "cd279", "cd274", "b7-h1", "ifng", "ifn-γ", "ifn-g", "gep", "ici", "cpi", "neoantigen", "exhaustion"]

def _infer_signals(objective: str) -> list[str]:
    toks = _extract_objective_tokens(objective)
    signals: list[str] = []
    def add(sig: str, keys: list[str]):
        if any(k in toks for k in keys) and sig not in signals:
            signals.append(sig)
    add("MSI-H", ["msi", "msi-h"]) ; add("dMMR", ["dmmr"]) ; add("TMB", ["tmb", "mutational"]) ; add("PD-L1 CPS", ["cps", "pd-l1"]) ; add("IFN-γ GEP", ["ifng", "ifn-γ", "ifn-g", "gep", "gene", "expression"]) ; add("neoantigen", ["neoantigen"]) ; add("exhaustion", ["exhaustion"]) ; add("PD-1/PD-L1", ["pd-1", "pd1", "pd-l1", "pdl1"]) 
    return signals


def _sanitize_molecule_name(molecule: str) -> str:
    """Normalize molecule for query planning: strip parentheses content and extra symbols, keep hyphens.

    Examples: "Pembrolizumab (Keytruda)" -> "Pembrolizumab Keytruda"
    """
    try:
        t = (molecule or "").strip()
        if not t:
            return ""
        # Remove parenthetical content
        t = re.sub(r"\([^)]*\)", " ", t)
        # Keep letters, numbers, hyphen, spaces
        t = re.sub(r"[^\w\-\s]", " ", t)
        # Collapse whitespace
        t = re.sub(r"\s+", " ", t).strip()
        return t
    except Exception:
        return molecule or ""


def _expand_molecule_synonyms(molecule: str, limit: int = 6) -> list[str]:
    """Collect a small set of synonyms (PubChem + CHEMBL), dedup, short list."""
    base = _sanitize_molecule_name(molecule)
    seen: set[str] = set()
    out: list[str] = []
    def _add(s: str):
        ss = (s or "").strip()
        if not ss:
            return
        if ss.lower() in seen:
            return
        seen.add(ss.lower())
        out.append(ss)
    _add(base)
    try:
        for s in _fetch_pubchem_synonyms(base)[:limit*2]:
            _add(_sanitize_molecule_name(s))
            if len(out) >= limit:
                break
    except Exception:
        pass
    try:
        if len(out) < limit:
            for s in _fetch_chembl_synonyms(base)[:limit*2]:
                _add(_sanitize_molecule_name(s))
                if len(out) >= limit:
                    break
    except Exception:
        pass
    return out[:limit]


# ---------------------
# Per-corpus planners (PubMed / Trials / Web / Patents)
# ---------------------

def _plan_pubmed_queries(molecule: str, synonyms: list[str], objective: str, preference: str | None = None) -> dict:
    mol = _sanitize_molecule_name(molecule)
    tokens_tiab = "(" + " OR ".join([f'"{t}"[tiab]' for t in ([mol] + synonyms) if t]) + ")" if mol else ""
    tokens_title = "(" + " OR ".join([f'"{t}"[Title]' for t in ([mol] + synonyms) if t]) + ")" if mol else ""
    # Objective-derived tokens for general adaptability
    obj_tokens = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (objective or "").lower()) if len(t) >= 3]
    # Common mechanism markers and biomarker signals inferred from objective (generic, molecule-agnostic)
    mech_terms = ["mechanism", "mechanism of action", "signaling", "pathway", "activation", "inhibition"]
    bio_signals = []
    if any(k in obj_tokens for k in ["msi", "msi-h", "dmmr"]):
        bio_signals += ["MSI-H", "dMMR"]
    if any(k in obj_tokens for k in ["tmb", "mutational"]):
        bio_signals += ["tumor mutational burden"]
    if any(k in obj_tokens for k in ["cps", "pd-l1"]):
        bio_signals += ["PD-L1 CPS"]
    if any(k in obj_tokens for k in ["ifn", "ifn-γ", "ifn-g", "gep", "gene", "expression"]):
        bio_signals += ["IFN-γ", "gene expression profile"]
    # Review focus
    review_query = (
        f'(({tokens_tiab} OR {tokens_title}) AND ' if mol else "("
    ) + f'(review[pt] OR systematic[sb]) AND (2015:3000[dp]))'
    # Mechanism focus
    mech_query = (
        f'(({tokens_tiab} OR {tokens_title}) AND ' if mol else "("
    ) + '("mechanism"[tiab] OR "mechanism of action"[tiab] OR "signaling"[tiab] OR "pathway"[tiab]))'
    # Broader mechanism with common lexicon
    broad_query = f'{(" ".join(([mol] + synonyms)).strip() + " "+objective).strip()} mechanism pathway signaling'
    # Recall variants (drop review constraint, add biomarker/mechanistic terms)
    pref = (preference or "").lower()
    recall_mech = None
    recall_broad = None
    if pref == "recall":
        # Mechanism recall: simpler [tiab] presence plus optional biomarker signals
        extra = []
        if bio_signals:
            extra = [f'"{s}"[tiab]' for s in bio_signals]
        recall_mech = (
            f'(({tokens_tiab} OR {tokens_title}) AND ' if mol else "("
        ) + '(("mechanism"[tiab] OR "mechanism of action"[tiab] OR "signaling"[tiab] OR "pathway"[tiab])' + (f" OR {' OR '.join(extra)}" if extra else "") + '))'
        # Broad recall: remove explicit mechanism requirement; rely on objective tokens and title bias
        recall_broad = (
            f'(({tokens_tiab} OR {tokens_title}) AND ' if mol else "("
        ) + '(humans[mesh]))'
    return {
        "review_query": review_query,
        "mechanism_query": mech_query,
        "broad_query": broad_query,
        "recall_mechanism_query": recall_mech,
        "recall_broad_query": recall_broad,
    }

def _plan_trials_query(molecule: str, synonyms: list[str], objective: str) -> str:
    # ClinicalTrials.gov is accessed via a separate endpoint; simple textual expression
    base = _sanitize_molecule_name(molecule)
    combo = " ".join(([base] + synonyms)).strip() or objective.strip()
    return f"{combo} randomized OR human OR type 2 diabetes"

def _plan_web_query(molecule: str, synonyms: list[str], objective: str) -> str:
    combo = (" ".join(([molecule] + synonyms)).strip() + " " + objective).strip()
    # Prefer mechanistic PDFs on reputable domains
    wl = ["nih.gov", "nature.com", "nejm.org", "lancet.com", "sciencedirect.com", "springer.com"]
    return f"{combo} mechanism (" + " OR ".join([f'site:{d}' for d in wl]) + ") filetype:pdf"

def _plan_patents_query(molecule: str, synonyms: list[str], objective: str) -> str:
    combo = (" ".join(([molecule] + synonyms)).strip() + " " + objective).strip()
    return f'{combo} formulation OR delivery OR analog patents'

def _lightweight_entailment_filter(abstract: str, fact_anchors: list[dict]) -> list[dict]:
    """Heuristic entailment: keep anchors whose claim tokens or evidence quote occur in abstract.
    Lightweight, no extra model calls.
    """
    try:
        ab = (abstract or "").lower()
        kept: list[dict] = []
        for fa in fact_anchors or []:
            claim = str(fa.get("claim", "")).strip()
            ev = fa.get("evidence") or {}
            quote = str((ev or {}).get("quote", "")).strip()
            # tokens overlap check
            tokens = [t for t in claim.lower().replace(",", " ").replace(".", " ").split() if len(t) > 3]
            overlap = sum(1 for t in tokens if t in ab)
            quote_ok = (quote and quote.lower() in ab)
            if overlap >= max(2, int(len(tokens) * 0.25)) or quote_ok:
                kept.append(fa)
        return kept[:5]
    except Exception:
        return (fact_anchors or [])[:5]


def _nli_entailment_filter(abstract: str, fact_anchors: list[dict], deadline: float) -> list[dict]:
    """Use CrossEncoder NLI model to keep anchors with high entailment confidence.
    Fallback to lightweight filter if model/time not available.
    """
    if not _ENTAILMENT_ENABLED or nli_encoder is None or _time_left(deadline) < ENTAILMENT_BUDGET_S:
        return _lightweight_entailment_filter(abstract, fact_anchors)
    try:
        pairs = []
        for fa in fact_anchors or []:
            claim = str(fa.get("claim", "")).strip()
            if claim:
                pairs.append((abstract[:1500], claim[:300]))
        if not pairs:
            return fact_anchors
        # Predict entailment confidence; normalize to [0,1] if needed
        scores = nli_encoder.predict(pairs)
        kept = []
        for fa, sc in zip(fact_anchors, scores):
            try:
                score = float(sc if not isinstance(sc, (list, tuple)) else sc[0])
            except Exception:
                score = 0.0
            if score >= float(os.getenv("ENTAILMENT_KEEP_THRESHOLD", "0.5")):
                kept.append(fa)
        try:
            _metrics_inc("anchors_entailment_kept", len(kept))
            _metrics_inc("anchors_entailment_filtered", max(0, len(fact_anchors) - len(kept)))
        except Exception:
            pass
        return kept[:5] if kept else _lightweight_entailment_filter(abstract, fact_anchors)
    except Exception:
        return _lightweight_entailment_filter(abstract, fact_anchors)


# ---------------------
# LangGraph DAG orchestration (behind dagMode)
# ---------------------
_DAG_APP = None

def _log_node_event(name: str, start_ms: int, ok: bool, extra: dict | None = None) -> None:
    payload = {"event": f"dag_{name.lower()}", "ok": ok, "took_ms": _now_ms() - start_ms}
    if extra:
        payload.update(extra)
    try:
        log_event(payload)
    except Exception:
        pass

async def _with_timeout(coro, timeout_s: float, name: str, retries: int = 0):
    attempt = 0
    err: Exception | None = None
    while attempt <= retries:
        try:
            return await asyncio.wait_for(coro, timeout=timeout_s)
        except Exception as e:
            err = e
            attempt += 1
            if attempt > retries:
                raise e
            await asyncio.sleep(0.1 * attempt)
    if err:
        raise err

def _build_dag_app():
    if StateGraph is None:
        return None
    graph = StateGraph(dict)

    async def node_plan(state: dict) -> dict:
        t0 = _now_ms()
        try:
            request = state["request"]
            memories = state.get("memories") or []
            mem_txt = " | ".join(m.get("text", "")[:200] for m in memories) if memories else ""
            plan = await _with_timeout(
                asyncio.to_thread(_build_query_plan, request.objective, mem_txt, state["deadline"], getattr(request, "molecule", None)),
                PLAN_BUDGET_S,
                "Plan"
            )
            plan = _inject_molecule_into_plan(plan, getattr(request, "molecule", None))
            state["plan"] = plan or {}
            _log_node_event("Plan", t0, True, {"has_plan": bool(plan)})
            return state
        except Exception as e:
            _log_node_event("Plan", t0, False, {"error": str(e)[:200]})
            state["plan"] = {}
            return state

    async def node_harvest(state: dict) -> dict:
        t0 = _now_ms()
        try:
            plan = state.get("plan", {})
            arts: list[dict] = []
            deadline = state["deadline"]
            # PubMed (bounded pool) – parallel per-query with retry and min-pool guard
            pubmed_items: list[dict] = []
            keys_order = ("review_query", "mechanism_query", "broad_query", "recall_mechanism_query", "recall_broad_query")
            queries: list[str] = [plan.get(k) for k in keys_order if plan.get(k)]
            # Helper to run one query with timeout
            async def _run_one(q: str) -> list[dict]:
                if _time_left(deadline) <= 0.8:
                    return []
                try:
                    return await _with_timeout(asyncio.to_thread(_harvest_pubmed, q, deadline), HARVEST_BUDGET_S, "Harvest", retries=1)
                except Exception:
                    return []
            # First pass: run all in parallel
            if queries and _time_left(deadline) > 1.0:
                results = await asyncio.gather(*[_run_one(q) for q in queries], return_exceptions=True)
                for res in results:
                    if isinstance(res, list):
                        pubmed_items += res
            # Retry lightly for weak queries (returned <3)
            if _time_left(deadline) > 2.0:
                weak_indices = []
                for idx, q in enumerate(queries):
                    try:
                        # Count how many items from this q by checking source_query
                        cnt = sum(1 for a in pubmed_items if isinstance(a, dict) and a.get("source_query") == q)
                        if cnt < 3:
                            weak_indices.append(idx)
                    except Exception:
                        continue
                if weak_indices:
                    retry_res = await asyncio.gather(*[_run_one(queries[i]) for i in weak_indices], return_exceptions=True)
                    for res in retry_res:
                        if isinstance(res, list):
                            pubmed_items += res
            arts += pubmed_items[:PUBMED_POOL_MAX]
            # Min-pool guard: relax and re-harvest if pool is too small
            if len(arts) < 10 and _time_left(deadline) > 4.0:
                # Prefer recall queries if present, else broaden existing ones
                relaxed: list[str] = []
                for k in ("recall_mechanism_query", "recall_broad_query", "broad_query"):
                    q = plan.get(k)
                    if q:
                        relaxed.append(q)
                # If still nothing, strip review/systematic and [tiab] field tags from review/mechanism queries
                def _relax_q(q: str) -> str:
                    try:
                        x = q
                        x = x.replace("review[pt]", "").replace("systematic[sb]", "")
                        x = x.replace("[tiab]", "").replace("[Title]", "")
                        x = re.sub(r"\s+AND\s+\(\)\s*", " ", x)
                        return re.sub(r"\s{2,}", " ", x).strip()
                    except Exception:
                        return q
                if not relaxed:
                    for k in ("review_query", "mechanism_query"):
                        q = plan.get(k)
                        if q:
                            relaxed.append(_relax_q(q))
                # Run relaxed queries in parallel
                if relaxed and _time_left(deadline) > 2.0:
                    relax_res = await asyncio.gather(*[_run_one(q) for q in relaxed], return_exceptions=True)
                    for res in relax_res:
                        if isinstance(res, list):
                            arts += res
                # Cap again
                if len(arts) > PUBMED_POOL_MAX:
                    arts = arts[:PUBMED_POOL_MAX]
            # Trials
            if _time_left(deadline) > 1.0 and plan.get("clinical_query"):
                arts += await _with_timeout(asyncio.to_thread(_harvest_trials, plan.get("clinical_query"), deadline), HARVEST_BUDGET_S, "Harvest", retries=1)
            state["arts"] = arts
            _log_node_event("Harvest", t0, True, {"pool": len(arts)})
            return state
        except Exception as e:
            _log_node_event("Harvest", t0, False, {"error": str(e)[:200]})
            state["arts"] = state.get("arts") or []
            return state

    def _compute_controller_caps(preference: str, pool_len: int, time_left: float) -> tuple[int, int]:
        pref = (preference or "precision").lower()
        shortlist_goal = 28 if pref == "precision" else 50
        deep_goal = 13 if pref == "recall" else 8
        if time_left < 12:
            shortlist_goal = 24 if pref == "precision" else 40
        shortlist_cap = max(8, min(shortlist_goal, pool_len))
        deep_cap = max(5, min(deep_goal if pool_len >= deep_goal else pool_len, shortlist_cap))
        return shortlist_cap, deep_cap

    async def node_triage(state: dict) -> dict:
        t0 = _now_ms()
        try:
            norm = _normalize_candidates(state.get("arts") or [])
            # Prefer items mentioning the molecule when provided; gate by PD-1 context
            try:
                req_obj = state.get("request")
                mol = getattr(req_obj, "molecule", None)
                pref = str(getattr(req_obj, "preference", "precision") or "precision").lower()
            except Exception:
                mol, pref = None, "precision"
            if mol:
                gated = _filter_by_molecule(norm, mol)
                if pref == "precision":
                    norm = gated
                else:
                    # recall: blend gated to top to keep breadth
                    seen = set()
                    mixed = []
                    for a in gated + norm:
                        t = a.get("title", "")
                        if t in seen:
                            continue
                        seen.add(t)
                        mixed.append(a)
                    norm = mixed
            request = state["request"]
            time_left = _time_left(state["deadline"])
            sc_cap, deep_pref = _compute_controller_caps(getattr(request, "preference", "precision"), len(norm), time_left)
            triage_cap = min(TRIAGE_TOP_K, sc_cap)
            # Build molecule tokens for gating across molecules
            mol_tokens = []
            try:
                if mol:
                    mol_tokens = [mol] + _expand_molecule_synonyms(mol)
            except Exception:
                mol_tokens = [mol] if mol else []
            shortlist = _triage_rank(request.objective, norm, triage_cap, None, mol_tokens)
            # Cross-encoder re-ranking for DAG shortlist if enabled and time remains
            try:
                if cross_encoder is not None and time_left > 5.0:
                    pairs = [(request.objective or "", (a.get('title') or '') + ". " + (a.get('abstract') or '')) for a in shortlist[:30]]
                    scores = cross_encoder.predict(pairs)
                    for i, s in enumerate(scores):
                        shortlist[i]["score"] = 0.8 * float(shortlist[i].get("score", 0.0)) + 0.2 * float(s)
                    shortlist = sorted(shortlist, key=lambda x: x.get("score", 0.0), reverse=True)
            except Exception:
                pass
            deep_cap = min(len(shortlist), max(DEEPDIVE_TOP_K, deep_pref))
            state.update({"norm": norm, "shortlist": shortlist, "top_k": shortlist[:deep_cap]})
            _log_node_event("Triage", t0, True, {"norm": len(norm), "shortlist": len(shortlist), "top_k": len(state["top_k"])})
            return state
        except Exception as e:
            _log_node_event("Triage", t0, False, {"error": str(e)[:200]})
            state.update({"norm": [], "shortlist": [], "top_k": []})
            return state

    async def node_deepdive(state: dict) -> dict:
        t0 = _now_ms()
        try:
            request = state["request"]
            deep = await _with_timeout(_deep_dive_articles(request.objective, state.get("top_k") or [], state.get("memories") or [], state["deadline"]), DEEPDIVE_BUDGET_S, "DeepDive", retries=0)
            state["deep"] = deep
            _log_node_event("DeepDive", t0, True, {"deep": len(deep)})
            return state
        except Exception as e:
            _log_node_event("DeepDive", t0, False, {"error": str(e)[:200]})
            state["deep"] = []
            return state

    async def node_specialists(state: dict) -> dict:
        # Specialists were invoked inside deep-dive relevance; keep node for telemetry/extensibility
        _log_node_event("Specialists", _now_ms(), True)
        return state

    async def node_synthesis(state: dict) -> dict:
        t0 = _now_ms()
        try:
            request = state["request"]
            deep = state.get("deep") or []
            if len(deep) < 3:
                state["executive_summary"] = ""
                _log_node_event("Synthesis", t0, True, {"len": 0, "skipped": True})
                return state
            exec_sum = await _with_timeout(asyncio.to_thread(_synthesize_executive_summary, request.objective, deep, time.time() + SYNTH_BUDGET_S), SYNTH_BUDGET_S + 0.5, "Synthesis")
            state["executive_summary"] = exec_sum or ""
            _log_node_event("Synthesis", t0, True, {"len": len(exec_sum or "")})
            return state
        except Exception as e:
            _log_node_event("Synthesis", t0, False, {"error": str(e)[:200]})
            state["executive_summary"] = ""
            return state

    async def node_scorecard(state: dict) -> dict:
        t0 = _now_ms()
        try:
            request = state["request"]
            memories = state.get("memories") or []
            results_sections: list[dict] = []
            seen_pmids: set[str] = set()
            seen_titles: set[str] = set()
            for d in state.get("deep") or []:
                art = d["article"]
                top = d["top_article"]
                if _is_duplicate_section(top, seen_pmids, seen_titles):
                    continue
                _mark_seen(top, seen_pmids, seen_titles)
                # Backfill score_breakdown if DAG deep-dive result is missing components
                try:
                    res = d.get("result") or {}
                    # Guarantee fact_anchors exist for UI
                    try:
                        fa = res.get("fact_anchors")
                        if not (isinstance(fa, list) and len(fa) > 0):
                            # Cap fallback anchors to reduce per-article work
                            fa_fb = _fallback_fact_anchors(art.get("abstract") or art.get("summary") or "", art, max_items=2)
                            if fa_fb:
                                res["fact_anchors"] = _lightweight_entailment_filter(art.get("abstract") or art.get("summary") or "", fa_fb)
                    except Exception:
                        pass
                    sb = res.setdefault("score_breakdown", {})
                    if ("objective_similarity_score" not in sb) or ("recency_score" not in sb) or ("impact_score" not in sb):
                        objective = state["request"].objective
                        abstract = art.get("abstract") or art.get("summary") or ""
                        # similarity
                        try:
                            obj_vec = np.array(EMBED_CACHE.get_or_compute(objective or ""), dtype=float)
                            abs_vec = np.array(EMBED_CACHE.get_or_compute(abstract or art.get("title") or ""), dtype=float)
                            sim_raw = float(np.dot(obj_vec, abs_vec) / ((np.linalg.norm(obj_vec) or 1.0) * (np.linalg.norm(abs_vec) or 1.0)))
                            sb["objective_similarity_score"] = round(max(0.0, min(100.0, ((sim_raw + 1.0) / 2.0) * 100.0)), 1)
                        except Exception:
                            sb.setdefault("objective_similarity_score", 0.0)
                        # recency
                        try:
                            year = int(top.get("pub_year") or 0)
                            nowy = datetime.utcnow().year
                            rec_norm = max(0.0, min(1.0, (year - 2015) / float((nowy - 2015 + 1)))) if year else 0.0
                            sb["recency_score"] = round(rec_norm * 100.0, 1)
                        except Exception:
                            sb.setdefault("recency_score", 0.0)
                        # impact
                        try:
                            year = int(top.get("pub_year") or 0)
                            cites = float(top.get("citation_count") or 0.0)
                            cpy = (cites / max(1, (datetime.utcnow().year - year + 1))) if year else 0.0
                            sb["impact_score"] = round(max(0.0, min(100.0, (cpy / 100.0) * 100.0)), 1)
                        except Exception:
                            sb.setdefault("impact_score", 0.0)
                except Exception:
                    pass
                # Ensure complete score_breakdown for UI
                try:
                    _ensure_score_breakdown(d.get("result", {}), request.objective, art.get("abstract") or art.get("summary") or "", top, None)
                except Exception:
                    pass
                # Ensure article-specific relevance justification
                try:
                    _ensure_relevance_fields(d.get("result", {}), getattr(request, "molecule", ""), getattr(request, "objective", ""), {
                        "title": top.get("title"),
                        "pub_year": top.get("pub_year"),
                        "abstract": art.get("abstract") or art.get("summary") or "",
                    })
                except Exception:
                    pass
                _plan = (state.get("plan") or {})
                _q = art.get("source_query") or _plan.get("mechanism_query") or _plan.get("review_query") or request.objective,
                results_sections.append({
                    "query": _q,
                    "result": d["result"],
                    "articles": [art],
                    "top_article": top,
                    "source": "primary",
                    "memories_used": len(memories or []),
                })
            diagnostics = {
                "pool_size": len(state.get("norm") or []),
                "shortlist_size": len(state.get("shortlist") or []),
                "deep_dive_count": len(results_sections),
                "timings_ms": {},
                "pool_caps": {"pubmed": PUBMED_POOL_MAX, "trials": TRIALS_POOL_MAX, "patents": PATENTS_POOL_MAX},
            }
            state.update({"results_sections": results_sections, "diagnostics": diagnostics})
            _log_node_event("Scorecard", t0, True, {"sections": len(results_sections)})
            return state
        except Exception as e:
            _log_node_event("Scorecard", t0, False, {"error": str(e)[:200]})
            state.update({"results_sections": [], "diagnostics": {}})
            return state

    # Wire graph
    graph.add_node("Plan", node_plan)
    graph.add_node("Harvest", node_harvest)
    graph.add_node("Triage", node_triage)
    graph.add_node("DeepDive", node_deepdive)
    graph.add_node("Specialists", node_specialists)
    graph.add_node("Synthesis", node_synthesis)
    graph.add_node("Scorecard", node_scorecard)
    graph.set_entry_point("Plan")
    graph.add_edge("Plan", "Harvest")
    graph.add_edge("Harvest", "Triage")
    graph.add_edge("Triage", "DeepDive")
    graph.add_edge("DeepDive", "Specialists")
    graph.add_edge("Specialists", "Synthesis")
    graph.add_edge("Synthesis", "Scorecard")
    graph.add_edge("Scorecard", END)
    return graph.compile()


def _sanitize_number(value: object, default: float = 0.0) -> float:
    try:
        x = float(value)
        if math.isnan(x) or math.isinf(x):
            return float(default)
        return x
    except Exception:
        return float(default)


def _ensure_relevance_fields(structured: Dict[str, object], molecule: str, objective: str, top_article: dict | None) -> None:
    # Ensure keys exist
    if not isinstance(structured.get("summary"), str):
        structured["summary"] = str(structured.get("summary", "")).strip()
    # Fallback relevance if missing
    rel = structured.get("relevance_justification")
    try:
        abs_text = ((top_article or {}).get("abstract") or "").lower()
    except Exception:
        abs_text = ""
    if not isinstance(rel, str) or not rel.strip() or rel.strip().startswith("Selected because it directly mentions"):
        title = (top_article or {}).get("title") or "this article"
        year = (top_article or {}).get("pub_year") or ""
        mol = (molecule or "the molecule").strip()
        obj_l = (objective or "").lower()
        # Heuristic extraction of salient mechanistic/biomarker signals
        tokens: list[str] = []
        def add_if(txt: str, *keys: str) -> None:
            tl = txt.lower()
            if any(k in tl for k in keys):
                tokens.append(keys[0])
        add_if(obj_l + " " + abs_text, "pd-1/pd-l1", "pd-1", "pd-l1", "immune checkpoint")
        add_if(abs_text, "tmb", "tumor mutational burden")
        add_if(abs_text, "msi-h/dmmr", "msi-h", "dmmr")
        add_if(abs_text, "pd-l1 cps", "combined positive score", "cps")
        add_if(abs_text, "ifn-γ gep", "ifn-γ", "ifn-g", "gene expression profile")
        add_if(abs_text, "t cell activation", "t cell", "t-cell")
        sig = ", ".join(dict.fromkeys(tokens)) if tokens else None
        core = f"Selected for {mol} vs objective: {objective}."
        if sig:
            structured["relevance_justification"] = (
                f"{core} Evidence in {title}{f' ({year})' if year else ''} mentions: {sig}."
            )
        else:
            structured["relevance_justification"] = (
                f"{core} High mechanistic alignment found in {title}{f' ({year})' if year else ''}."
            )
    # Sanitize numeric fields to avoid NaN in UI
    structured["confidence_score"] = int(_sanitize_number(structured.get("confidence_score", 60), 60))
    structured["publication_score"] = round(_sanitize_number(structured.get("publication_score", 0.0), 0.0), 1)
    structured["overall_relevance_score"] = round(_sanitize_number(structured.get("overall_relevance_score", 0.0), 0.0), 1)


def _ensure_score_breakdown(structured: Dict[str, object], objective: str, abstract: str, top_article: dict | None, contextual_match_score: float | None = None) -> None:
    """Make sure score_breakdown has objective_similarity_score, recency_score, impact_score, and contextual_match_score.

    Computes values if missing, using embeddings for similarity and article metadata for recency/impact.
    """
    try:
        sb = structured.setdefault("score_breakdown", {})  # type: ignore
        # Objective similarity (0-100)
        if sb.get("objective_similarity_score") is None:
            try:
                obj_vec = np.array(EMBED_CACHE.get_or_compute(objective or ""), dtype=float)
                abs_vec = np.array(EMBED_CACHE.get_or_compute(abstract or (top_article or {}).get("title") or ""), dtype=float)
                sim_raw = float(np.dot(obj_vec, abs_vec) / ((np.linalg.norm(obj_vec) or 1.0) * (np.linalg.norm(abs_vec) or 1.0)))
                sb["objective_similarity_score"] = round(max(0.0, min(100.0, ((sim_raw + 1.0) / 2.0) * 100.0)), 1)
            except Exception:
                sb["objective_similarity_score"] = 0.0
        # Recency (0-100)
        if sb.get("recency_score") is None:
            try:
                year = int((top_article or {}).get("pub_year") or 0)
                nowy = datetime.utcnow().year
                rec_norm = max(0.0, min(1.0, (year - 2015) / float((nowy - 2015 + 1)))) if year else 0.0
                sb["recency_score"] = round(rec_norm * 100.0, 1)
            except Exception:
                sb["recency_score"] = 0.0
        # Impact (0-100)
        if sb.get("impact_score") is None:
            try:
                year = int((top_article or {}).get("pub_year") or 0)
                cites = float((top_article or {}).get("citation_count") or 0.0)
                cpy = (cites / max(1, (datetime.utcnow().year - year + 1))) if year else 0.0
                sb["impact_score"] = round(max(0.0, min(100.0, (cpy / 100.0) * 100.0)), 1)
            except Exception:
                sb["impact_score"] = 0.0
        # Contextual match (0-100)
        if sb.get("contextual_match_score") is None:
            try:
                if contextual_match_score is None:
                    obj = (objective or "").lower()
                    ab = (abstract or (top_article or {}).get("title") or "").lower()
                    # Token overlap heuristic
                    toks = [t for t in re.split(r"[^a-z0-9\-]+", obj) if len(t) >= 3]
                    if toks:
                        hits = sum(1 for t in toks if t in ab)
                        contextual_match_score = max(0.0, min(100.0, (hits / max(1, len(toks))) * 100.0))
                    else:
                        contextual_match_score = 0.0
                sb["contextual_match_score"] = round(float(contextual_match_score or 0.0), 1)
            except Exception:
                sb["contextual_match_score"] = round(float(contextual_match_score or 0.0), 1)
    except Exception:
        # last-resort defaults
        structured.setdefault("score_breakdown", {  # type: ignore
            "objective_similarity_score": 0.0,
            "recency_score": 0.0,
            "impact_score": 0.0,
            "contextual_match_score": float(contextual_match_score or 0.0),
        })

def _is_duplicate_section(top_article: dict | None, seen_pmids: set[str], seen_titles: set[str]) -> bool:
    if not top_article:
        return False
    pmid = str(top_article.get("pmid") or "").strip()
    title = (top_article.get("title") or "").strip().lower()
    if pmid and pmid in seen_pmids:
        return True
    if title and title in seen_titles:
        return True
    return False

def _mark_seen(top_article: dict | None, seen_pmids: set[str], seen_titles: set[str]) -> None:
    if not top_article:
        return
    pmid = str(top_article.get("pmid") or "").strip()
    title = (top_article.get("title") or "").strip().lower()
    if pmid:
        seen_pmids.add(pmid)
    if title:
        seen_titles.add(title)


# ---------------------
# V2 Orchestrated (Broaden-then-Deepen) helpers
# ---------------------

def _time_left(deadline: float) -> float:
    return max(0.0, deadline - time.time())

def _build_query_plan(objective: str, memories_text: str, deadline: float, molecule: str | None = None) -> dict:
    """Return a dict with five queries: review_query, mechanism_query, clinical_query, broad_query, web_query."""
    if _time_left(deadline) < 1.0:
        return {}
    strategist_template = """
You are a master research strategist at a biotech firm. Given the user's objective and prior context, output ONLY a JSON object with EXACTLY these keys:
review_query, mechanism_query, clinical_query, broad_query, web_query.
- review_query: recent high-impact review articles
- mechanism_query: PubMed fielded query using [tiab] targeting the core mechanism
- clinical_query: clinical trials / human studies related to the objective
- broad_query: broadened related concepts query
- web_query: Google search query optimized to find relevant PDFs/news

Objective: {objective}
Molecule (if any): {molecule}
Prior Context: {memories}
"""
    try:
        prompt = PromptTemplate(template=strategist_template, input_variables=["objective", "memories", "molecule"])
        chain = LLMChain(llm=llm_analyzer, prompt=prompt)
        out = chain.invoke({"objective": objective[:400], "memories": memories_text[:400], "molecule": (molecule or "")[:200]})
        txt = out.get("text", out) if isinstance(out, dict) else str(out)
        if "```" in txt:
            txt = txt.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
        plan = json.loads(txt)
        if isinstance(plan, dict):
            return plan
    except Exception:
        pass
    # Fallback: construct reasonable defaults
    obj = objective.strip()
    mol = _sanitize_molecule_name(molecule or "")
    synonyms = _expand_molecule_synonyms(mol) if mol else []
    # Per-corpus
    # Use a simple preference heuristic in fallback: recall if objective looks exploratory
    pref_hint = "recall" if any(k in obj.lower() for k in ["overview", "broad", "landscape", "review"]) else None
    pubmed = _plan_pubmed_queries(mol, synonyms, obj, pref_hint)
    clinical_query = _plan_trials_query(mol, synonyms, obj)
    web_query = _plan_web_query(mol, synonyms, obj)
    return {
        "review_query": pubmed["review_query"],
        "mechanism_query": pubmed["mechanism_query"],
        "clinical_query": clinical_query,
        "broad_query": pubmed["broad_query"],
        "recall_mechanism_query": pubmed.get("recall_mechanism_query"),
        "recall_broad_query": pubmed.get("recall_broad_query"),
        "web_query": web_query,
    }


def _inject_molecule_into_plan(plan: dict, molecule: str | None) -> dict:
    """Ensure molecule token is present in key queries for better specificity.

    If a molecule is provided and a plan query lacks it, prefix a title/tiab clause.
    Conservative so we do not over-filter; no change if molecule already present.
    """
    try:
        mol = (molecule or "").strip()
        if not mol or not isinstance(plan, dict):
            return plan
        def ensure(term: str) -> str:
            q = str(plan.get(term) or "")
            if not q:
                return q
            q_l = q.lower()
            mol_l = mol.lower()
            if mol_l in q_l:
                return q
            prefix = f'("{mol}"[tiab] OR "{mol}"[Title]) AND '
            return f"{prefix}{q}"
        for key in ("mechanism_query", "review_query", "broad_query"):
            if key in plan:
                plan[key] = ensure(key)
        return plan
    except Exception:
        return plan

def _harvest_pubmed(query: str, deadline: float) -> list[dict]:
    if _time_left(deadline) <= 0.5:
        return []
    try:
        tool = PubMedSearchTool()
        raw = tool._run(query)
        import json as _json
        arts = _json.loads(raw) if isinstance(raw, str) else (raw or [])
        if isinstance(arts, list):
            # Annotate with source query for transparency/debugging
            for a in arts:
                if isinstance(a, dict):
                    a["source_query"] = query
            return arts
        return []
    except Exception:
        return []

def _harvest_trials(query: str, deadline: float) -> list[dict]:
    # ClinicalTrials.gov API
    if _time_left(deadline) <= 0.5:
        return []
    try:
        expr = urllib.parse.quote(query.strip())
        fields = [
            "NCTId", "BriefTitle", "BriefSummary", "Phase", "StudyType", "StartDate", "CompletionDate",
        ]
        url = (
            "https://clinicaltrials.gov/api/query/study_fields?expr=" + expr +
            "&fields=" + ",".join(fields) +
            "&min_rnk=1&max_rnk=25&fmt=json"
        )
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode())
        studies = (((data.get("StudyFieldsResponse") or {}).get("StudyFields") or []))
        out: list[dict] = []
        for s in studies:
            def _g(k: str) -> str:
                v = s.get(k)
                if isinstance(v, list) and v:
                    return str(v[0])
                return str(v or "")
            title = _g("BriefTitle")
            summ = _g("BriefSummary")
            nct = _g("NCTId")
            phase = _g("Phase")
            year = 0
            try:
                sd = _g("StartDate")
                if sd and any(ch.isdigit() for ch in sd):
                    year = int([tok for tok in sd.split() if tok.isdigit() and len(tok) == 4][0])
            except Exception:
                year = 0
            out.append({
                "title": title,
                "abstract": summ,
                "pub_year": year,
                "pmid": None,
                "url": f"https://clinicaltrials.gov/study/{nct}" if nct else "",
                "citation_count": 0,
                "nct_id": nct,
                "source": "clinicaltrials",
                "phase": phase,
                "source_query": query,
            })
        return out
    except Exception:
        return []

def _normalize_candidates(items: list[dict]) -> list[dict]:
    norm: list[dict] = []
    seen_titles: set[str] = set()
    seen_pmids: set[str] = set()
    title_vecs: dict[str, np.ndarray] = {}
    for a in items:
        try:
            title = (a.get("title") or "").strip()
            if not title:
                continue
            pmid = str(a.get("pmid") or "").strip()
            key_title = title.lower()
            if pmid and pmid in seen_pmids:
                continue
            if pmid:
                seen_pmids.add(pmid)
            if key_title in seen_titles:
                continue
            # Near-dup clustering by title embedding cosine
            try:
                tvec = np.array(EMBED_CACHE.get_or_compute(title), dtype=float)
                dup = False
                for k, v in list(title_vecs.items())[:128]:  # limit comparisons
                    denom = (np.linalg.norm(v) or 1.0) * (np.linalg.norm(tvec) or 1.0)
                    if denom:
                        cs = float(np.dot(v, tvec) / denom)
                        if cs >= 0.95:  # very similar titles
                            dup = True
                            break
                if dup:
                    continue
                title_vecs[key_title] = tvec
            except Exception:
                pass
            seen_titles.add(key_title)
            year = int(a.get("pub_year") or 0)
            norm.append({
                "title": title,
                "abstract": a.get("abstract") or a.get("summary") or "",
                "pub_year": year,
                "pmid": pmid or None,
                "url": a.get("url") or "",
                "citation_count": int(a.get("citation_count") or 0),
                "source": a.get("source") or ("pubmed" if pmid else "unknown"),
                "source_query": a.get("source_query") or "",
            })
        except Exception:
            continue
    return norm


def _filter_by_molecule(candidates: list[dict], molecule: str | None) -> list[dict]:
    """Prefer candidates that mention the molecule or a synonym.
    If filtering would drop everything, return the original candidates.
    """
    mol = (molecule or "").strip()
    if not mol:
        return candidates
    try:
        synonyms = _expand_molecule_synonyms(mol)
    except Exception:
        synonyms = []
    tokens = [t.lower() for t in ([mol] + synonyms) if t]
    filtered: list[dict] = []
    for a in candidates:
        try:
            text = f"{a.get('title','')} {a.get('abstract','')}".lower()
            if any(tok in text for tok in tokens):
                filtered.append(a)
        except Exception:
            continue
    return filtered if filtered else candidates

def _triage_rank(
    objective: str,
    candidates: list[dict],
    max_keep: int,
    project_vec: np.ndarray | None = None,
    molecule_tokens: list[str] | None = None,
) -> list[dict]:
    # Use existing _score_article-like features; reuse embeddings cosine
    try:
        objective_vec = np.array(EMBED_CACHE.get_or_compute(objective or ""), dtype=float)
        obj_norm = np.linalg.norm(objective_vec) or 1.0
    except Exception:
        objective_vec = None
        obj_norm = 1.0
    obj_lc = (objective or "").lower()
    is_pd1_objective = any(k in obj_lc for k in ["pd-1", "pd1", "pd-l1", "programmed death", "programmed-death"])
    # Signals lexicon for broader objectives (extensible)
    signal_lexicon = [
        "pd-1", "pd1", "pd-l1", "pdl1", "ctla-4", "ctla4", "tigit", "lag-3", "lag3", "ido", "ido1",
        "msi-h", "dmmr", "tmb", "neoantigen", "pdl-1", "gep", "ifn-",
    ]
    required_hits = any(tok in obj_lc for tok in signal_lexicon)
    # Negative topic demotions (tangential unless co-mentioned with molecule)
    tangential_terms = [
        "t-vec", "talimogene", "laherparepvec", "oncolytic", "virotherapy", "herpes simplex virus", "hf-10", "oncorine", "measles virus"
    ]
    mol_tokens_lc = [t.lower() for t in (molecule_tokens or []) if t]
    def score_one(a: dict) -> float:
        text = f"{a.get('title','')} {a.get('abstract','')}`".lower()
        mech_hits = sum(1 for kw in ["mechanism", "pathway", "inhibit", "agonist", "antagonist"] if kw in text)
        # Signal presence
        has_icp = any(tok in text for tok in ["pd-1", "pd1", "pd-l1", "programmed death", "programmed-death", "checkpoint"])
        has_molecule = any(mt in text for mt in mol_tokens_lc) if mol_tokens_lc else False
        has_required = has_icp or any(tok in text for tok in signal_lexicon)
        # Domain filter (demotions) and context boosts
        social_terms = [
            "social media", "pharmacovigilance", "aesthetic", "plastic", "marketing", "influencer",
            "twitter", "reddit", "tiktok", "instagram"
        ]
        glp1_lexicon = [
            "glp-1", "glp1", "glp-1r", "glp1r", "incretin", "semaglutide", "liraglutide", "exenatide",
            "beta-cell", "c-amp", "camp", "pka", "gastric emptying", "insulin secretion"
        ]
        objective_l = (objective or "").lower()
        is_glp1_context = any(k in objective_l for k in ["glp-1", "glp1", "semaglutide", "incretin", "type 2 diabetes", "t2d"]) 
        # cosine
        try:
            if objective_vec is not None:
                abs_vec = np.array(EMBED_CACHE.get_or_compute(a.get('abstract') or a.get('title') or ""), dtype=float)
                sim_raw = float(np.dot(objective_vec, abs_vec) / ((obj_norm) * (np.linalg.norm(abs_vec) or 1.0)))
                similarity = max(0.0, min(1.0, (sim_raw + 1.0) / 2.0))
            else:
                similarity = 0.0
        except Exception:
            similarity = 0.0
        # Adaptive project blend (if available)
        if project_vec is not None:
            try:
                pv = project_vec
                pv_norm = float(np.linalg.norm(pv)) or 1.0
                abs_vec2 = np.array(EMBED_CACHE.get_or_compute(a.get('abstract') or a.get('title') or ""), dtype=float)
                sim2 = float(np.dot(pv, abs_vec2) / (pv_norm * (np.linalg.norm(abs_vec2) or 1.0)))
                sim2_mapped = max(0.0, min(1.0, (sim2 + 1.0) / 2.0))
                similarity = (1.0 - ADAPTIVE_PROJECT_BLEND) * similarity + ADAPTIVE_PROJECT_BLEND * sim2_mapped
            except Exception:
                pass
        year = int(a.get('pub_year') or 0)
        nowy = datetime.utcnow().year
        recency = max(0.0, min(1.0, (year - 2015) / (nowy - 2015 + 1))) if year else 0.0
        cites = float(a.get('citation_count') or 0.0)
        cpy = cites / max(1, (nowy - year + 1)) if year else 0.0
        score = 0.5 * similarity + 0.2 * (min(mech_hits, 5) / 5.0) + 0.2 * (cpy / 100.0) + 0.1 * recency
        # Penalize lack of PD-1/PD-L1 signal when objective is about PD-1
        if is_pd1_objective and not has_icp:
            score -= 0.2
        elif is_pd1_objective and has_icp:
            score += 0.05
        # Generic gating: if neither molecule nor required signals appear, demote
        if not has_molecule and not has_required:
            score -= 0.15
        # Tangential demotion: if oncolytic/virotherapy appears without molecule co-mention, demote more strongly
        if any(tt in text for tt in tangential_terms) and not has_molecule:
            score -= 0.25
        # Demote social/aesthetic drift
        if any(term in text for term in social_terms):
            score -= 0.2
        # Boost GLP-1 mechanistic context
        if is_glp1_context and any(term in text for term in glp1_lexicon):
            score += 0.1
        return score
    for a in candidates:
        try:
            a["score"] = round(score_one(a), 3)
        except Exception:
            a["score"] = 0.0
    ranked = sorted(candidates, key=lambda x: x.get("score", 0.0), reverse=True)
    return ranked[:max_keep]


def _filter_candidates_by_molecule(candidates: list[dict], molecule: str | None, minimum_keep: int = 6) -> list[dict]:
    """If a molecule is specified, prefer items that explicitly mention the molecule or a synonym
    in the title or abstract. Always keep at least `minimum_keep` to avoid over-filtering."""
    mol = _sanitize_molecule_name(molecule or "").strip()
    if not mol:
        return candidates
    try:
        synonyms = _expand_molecule_synonyms(mol, limit=6)
    except Exception:
        synonyms = [mol]
    tokens = [t.lower() for t in ([mol] + (synonyms or [])) if t]
    hits: list[dict] = []
    non_hits: list[dict] = []
    for a in candidates:
        try:
            txt = f"{a.get('title','')} {a.get('abstract','')}".lower()
            if any(tok in txt for tok in tokens):
                hits.append(a)
            else:
                non_hits.append(a)
        except Exception:
            non_hits.append(a)
    if len(hits) >= minimum_keep:
        return hits + non_hits[: max(0, minimum_keep - len(hits))]
    # If too few explicit hits, keep all hits and top-up with non-hits
    return hits + non_hits[: max(0, minimum_keep - len(hits))]

async def _deep_dive_articles(objective: str, items: list[dict], memories: list[dict], deadline: float) -> list[dict]:
    # Extraction, summarization, justification
    extracted_results: list[dict] = []
    # Pre-compute objective embedding for similarity scoring
    try:
        objective_vec = np.array(EMBED_CACHE.get_or_compute(objective or ""), dtype=float)
        objective_vec_norm = float(np.linalg.norm(objective_vec)) or 1.0
    except Exception:
        objective_vec = None
        objective_vec_norm = 1.0
    extraction_tmpl = """
You are an information extraction bot. From the abstract below, return ONLY JSON with keys: key_methodologies (array), disease_context (array), primary_conclusion (string).
Abstract: {abstract}
"""
    extraction_prompt = PromptTemplate(template=extraction_tmpl, input_variables=["abstract"])
    extraction_chain = LLMChain(llm=llm_analyzer, prompt=extraction_prompt)
    for art in items:
        if _time_left(deadline) < 6.0:
            break
        abstract = art.get("abstract", "")
        extracted = {}
        if abstract.strip() and _time_left(deadline) > 12.0:
            try:
                out = await run_in_threadpool(extraction_chain.invoke, {"abstract": abstract})
                txt = out.get("text", out) if isinstance(out, dict) else str(out)
                if "```" in txt:
                    txt = txt.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
                obj = json.loads(txt)
                if isinstance(obj, dict):
                    extracted = obj
            except Exception:
                extracted = {}
        # Summarize + justification (reuse existing summarization chain via context)
        memory_context = " | ".join(m.get("text", "")[:200] for m in memories) if memories else ""
        enriched_abstract = abstract + ("\nExtracted:" + json.dumps(extracted) if extracted else "")
        try:
            grounded = await run_in_threadpool(summarization_chain.invoke, {
                "objective": objective,
                "abstract": enriched_abstract,
                "memory_context": memory_context,
            })
            _metrics_inc("llm_calls_total", 1)
            grounded_text = grounded.get("text", grounded) if isinstance(grounded, dict) else str(grounded)
            structured = ensure_json_response(grounded_text)
            structured = _validate_or_repair_summary(structured, objective, abstract)
            # Attach evidence to fact anchors if missing; fallback-generate if absent
            try:
                fa = structured.get("fact_anchors")
                if isinstance(fa, list) and len(fa) > 0:
                    for fa in structured["fact_anchors"]:
                        if isinstance(fa, dict):
                            ev = fa.get("evidence") or {}
                            if isinstance(ev, dict):
                                ev.setdefault("title", art.get("title"))
                                ev.setdefault("year", art.get("pub_year"))
                                ev.setdefault("pmid", art.get("pmid"))
                                # Best-effort quote: first 180 chars of abstract
                                if not ev.get("quote"):
                                    ev["quote"] = (abstract or "")[:180]
                                fa["evidence"] = ev
                    # entailment filter (NLI if enabled, else lightweight)
                    structured["fact_anchors"] = _nli_entailment_filter(abstract, structured["fact_anchors"], deadline)  # type: ignore
                else:
                    # Fallback: synthesize simple anchors from abstract (cap to 2)
                    fa_fb = _fallback_fact_anchors(abstract, art, max_items=2)
                    if fa_fb:
                        structured["fact_anchors"] = _lightweight_entailment_filter(abstract, fa_fb)
            except Exception:
                pass
        except Exception:
            structured = {"summary": abstract[:400], "confidence_score": 60, "methodologies": []}
            # Ensure anchors even on summarization failure
            try:
                fa_fb = _fallback_fact_anchors(abstract, art, max_items=2)
                if fa_fb:
                    structured["fact_anchors"] = _lightweight_entailment_filter(abstract, fa_fb)
            except Exception:
                pass
        top_article_payload = {
            "title": art.get("title"),
            "pmid": art.get("pmid"),
            "url": art.get("url"),
            "citation_count": art.get("citation_count"),
            "pub_year": art.get("pub_year"),
        }
        # Compute publication and overall scores for UI
        try:
            pub_score = calculate_publication_score({
                "pub_year": top_article_payload.get("pub_year"),
                "citation_count": top_article_payload.get("citation_count"),
            })
        except Exception:
            pub_score = 0.0
        try:
            llm_conf = float(structured.get("confidence_score", 0))
        except Exception:
            llm_conf = 0.0
        # Contextual match specialist (fast LLM score 0-100)
        contextual_match_score = 0.0
        try:
            if _time_left(deadline) > 2.0:
                cm_tmpl = """
                You are a relevance scoring expert. Rate how well the article abstract matches the user's objective on a 0-100 scale.
                Return ONLY the integer.
                User Objective: {objective}
                Abstract: {abstract}
                """
                cm_prompt = PromptTemplate(template=cm_tmpl, input_variables=["objective", "abstract"])
                cm_chain = LLMChain(llm=llm_analyzer, prompt=cm_prompt)
                cm = await run_in_threadpool(cm_chain.invoke, {"objective": objective, "abstract": abstract})
                txt = str(cm.get("text", cm))
                contextual_match_score = float(int(''.join(ch for ch in txt if ch.isdigit()) or '0'))
        except Exception:
            contextual_match_score = 0.0
        # Compute objective similarity / recency / impact (0-100) so UI never shows "—"
        try:
            if objective_vec is not None:
                abs_vec = np.array(EMBED_CACHE.get_or_compute(abstract or art.get("title") or ""), dtype=float)
                abs_norm = float(np.linalg.norm(abs_vec)) or 1.0
                sim_raw = float(np.dot(objective_vec, abs_vec) / (objective_vec_norm * abs_norm))
                # map cosine [-1,1] → [0,100]
                objective_similarity_score = max(0.0, min(100.0, ((sim_raw + 1.0) / 2.0) * 100.0))
            else:
                objective_similarity_score = 0.0
        except Exception:
            objective_similarity_score = 0.0
        try:
            year = int(top_article_payload.get("pub_year") or 0)
            nowy = datetime.utcnow().year
            recency_score = 0.0
            if year:
                # newer → closer to 100; baseline 2015
                rec_norm = max(0.0, min(1.0, (year - 2015) / float((nowy - 2015 + 1))))
                recency_score = round(rec_norm * 100.0, 1)
        except Exception:
            recency_score = 0.0
        try:
            year = int(top_article_payload.get("pub_year") or 0)
            cites = float(top_article_payload.get("citation_count") or 0.0)
            cpy = (cites / max(1, (datetime.utcnow().year - year + 1))) if year else 0.0
            # simple cap at 100 cpy → 100
            impact_score = max(0.0, min(100.0, (cpy / 100.0) * 100.0))
        except Exception:
            impact_score = 0.0
        # Weighted overall score (Glass-Box)
        # Default: 40% similarity, 20% recency, 20% impact, 20% contextual match (all 0-100)
        # Mechanism objectives: boost similarity/contextual
        obj_lc = (objective or "").lower()
        is_mechanism = ("mechanism" in obj_lc) or ("moa" in obj_lc) or ("mechanism of action" in obj_lc)
        if is_mechanism:
            w_sim, w_rec, w_imp, w_ctx = 0.55, 0.10, 0.10, 0.25
        else:
            w_sim, w_rec, w_imp, w_ctx = 0.40, 0.20, 0.20, 0.20
        overall = (
            w_sim * objective_similarity_score +
            w_rec * recency_score +
            w_imp * impact_score +
            w_ctx * contextual_match_score
        )
        structured.setdefault("score_breakdown", {})
        structured["score_breakdown"]["objective_similarity_score"] = round(objective_similarity_score, 1)
        structured["score_breakdown"]["recency_score"] = round(recency_score, 1)
        structured["score_breakdown"]["impact_score"] = round(impact_score, 1)
        structured["score_breakdown"]["contextual_match_score"] = round(contextual_match_score, 1)
        # Guaranteed population for UI
        _ensure_score_breakdown(structured, objective, abstract, top_article_payload, contextual_match_score)
        structured["publication_score"] = round(pub_score, 1)
        structured["overall_relevance_score"] = round(overall, 1)
        # Specialist-tailored relevance justification
        try:
            # Guarantee a small slice for specialist relevance if current text is empty or too generic
            cur = str(structured.get("relevance_justification", "")).strip()
            need_specialist = (len(cur) < 40)
            if need_specialist and _time_left(deadline) > 1.5:
                # Reserve ~1.5s within the remaining deadline
                rj = _specialist_relevance_justification(objective, art, structured.get("summary", ""), deadline)
                if isinstance(rj, dict):
                    if rj.get("text"):
                        structured["relevance_justification"] = rj["text"]
                    if rj.get("tags"):
                        structured.setdefault("specialist_tags", rj["tags"])
        except Exception:
            pass
        _ensure_relevance_fields(structured, "", objective, top_article_payload)
        extracted_results.append({
            "result": structured,
            "article": art,
            "top_article": top_article_payload,
        })
    return extracted_results

async def orchestrate_v2(request, memories: list[dict]) -> dict:
    deadline = time.time() + TOTAL_BUDGET_S
    # Timings
    plan_ms = 0
    harvest_ms = 0
    triage_ms = 0
    deepdive_ms = 0

    # Strategist
    mem_txt = " | ".join(m.get("text", "")[:200] for m in memories) if memories else ""
    _t0 = _now_ms()
    plan = _build_query_plan(request.objective, mem_txt, deadline, getattr(request, "molecule", None))
    plan = _inject_molecule_into_plan(plan, getattr(request, "molecule", None))
    plan_ms = _now_ms() - _t0
    if not plan:
        plan = {}

    # Harvest (parallel-ish, but respect time)
    arts: list[dict] = []
    _t0 = _now_ms()
    if _time_left(deadline) > 1.0:
        pubmed_items: list[dict] = []
        for key in ("review_query", "mechanism_query", "broad_query", "recall_mechanism_query", "recall_broad_query"):
            if _time_left(deadline) < (TOTAL_BUDGET_S - HARVEST_BUDGET_S):
                break
            q = plan.get(key)
            if q:
                pubmed_items += _harvest_pubmed(q, deadline)
            if len(pubmed_items) >= PUBMED_POOL_MAX:
                break
        arts += pubmed_items[:PUBMED_POOL_MAX]
    if _time_left(deadline) > 1.0 and plan.get("clinical_query"):
        trials_items = _harvest_trials(plan.get("clinical_query"), deadline)
        arts += trials_items[:TRIALS_POOL_MAX]
    # Patents (lightweight)
    if _time_left(deadline) > 1.0 and plan.get("broad_query") and PATENTS_RETMAX > 0:
        try:
            pt = PatentsSearchTool()
            raw = pt._run(plan.get("broad_query"))
            import json as _json
            pats = _json.loads(raw) if isinstance(raw, str) else (raw or [])
            arts += pats[:PATENTS_POOL_MAX]
        except Exception:
            pass
    harvest_ms = _now_ms() - _t0

    # Normalize and triage
    _t0 = _now_ms()
    norm = _normalize_candidates(arts)
    # Prefer items mentioning the molecule when provided
    try:
        mol = getattr(request, "molecule", None)
    except Exception:
        mol = None
    if mol:
        norm = _filter_by_molecule(norm, mol)
    # Time-aware caps
    triage_cap = min(TRIAGE_TOP_K, 50)
    if _time_left(deadline) < 15.0:
        triage_cap = min(triage_cap, 24)
    proj_vec = _project_interest_vector(memories)
    # Build molecule tokens for generalization across molecules
    mol_tokens: list[str] = []
    try:
        mol_v2 = getattr(request, "molecule", None)
        if mol_v2:
            mol_tokens = [mol_v2] + _expand_molecule_synonyms(mol_v2)
    except Exception:
        mol_tokens = []
    shortlist = _triage_rank(request.objective, norm, triage_cap, proj_vec, mol_tokens)
    # Cross-encoder re-ranking for V2 shortlist
    try:
        if cross_encoder is not None and _time_left(deadline) > 5.0:
            pairs = [(request.objective or "", (a.get('title') or '') + ". " + (a.get('abstract') or '')) for a in shortlist[:30]]
            scores = cross_encoder.predict(pairs)
            for i, s in enumerate(scores):
                shortlist[i]["score"] = 0.8 * float(shortlist[i].get("score", 0.0)) + 0.2 * float(s)
            shortlist = sorted(shortlist, key=lambda x: x.get("score", 0.0), reverse=True)
    except Exception:
        pass
    # Controller for deep dive cap
    try:
        pref = str(getattr(request, "preference", "precision") or "precision").lower()
    except Exception:
        pref = "precision"
    desired = 13 if pref == "recall" else 8
    deep_cap = min(len(shortlist), max(DEEPDIVE_TOP_K, desired))
    try:
        if pref == "precision":
            _metrics_inc("controller_precision_deep", deep_cap)
        else:
            _metrics_inc("controller_recall_deep", deep_cap)
    except Exception:
        pass
    top_k = shortlist[:deep_cap]
    triage_ms = _now_ms() - _t0

    # Deep-dive
    _t0 = _now_ms()
    deep = await _deep_dive_articles(request.objective, top_k, memories, deadline)
    deepdive_ms = _now_ms() - _t0
    # Assemble into sections compatible with UI (each as a primary section)
    results_sections: list[dict] = []
    seen_pmids: set[str] = set()
    seen_titles: set[str] = set()
    for d in deep:
        art = d["article"]
        top = d["top_article"]
        if _is_duplicate_section(top, seen_pmids, seen_titles):
            continue
        _mark_seen(top, seen_pmids, seen_titles)
        _q = art.get("source_query") or plan.get("mechanism_query") or plan.get("review_query") or request.objective
        results_sections.append({
            "query": _q,
            "result": d["result"],
            "articles": [art],
            "top_article": top,
            "source": "primary",
            "memories_used": len(memories or []),
        })
    # Strategic synthesis via specialist analysts
    executive_summary = _synthesize_executive_summary(request.objective, results_sections, time.time() + 6.0)

    diagnostics = {
        "pool_size": len(norm),
        "shortlist_size": len(shortlist),
        "deep_dive_count": len(results_sections),
        "timings_ms": {
            "plan_ms": int(plan_ms),
            "harvest_ms": int(harvest_ms),
            "triage_ms": int(triage_ms),
            "deepdive_ms": int(deepdive_ms),
        },
        "pool_caps": {"pubmed": PUBMED_POOL_MAX, "trials": TRIALS_POOL_MAX, "patents": PATENTS_POOL_MAX},
    }
    return {
        "queries": [v for k, v in plan.items() if isinstance(v, str)],
        "results": results_sections,
        "diagnostics": diagnostics,
        "executive_summary": executive_summary,
    }


# Step 2.2.2: Define the Prompt Template
query_generation_template = """
You are a biomedical research expert. Your task is to generate 3 diverse and effective search queries for scientific databases based on the user's research objective.

Return the output as a JSON-formatted list of strings.

For example:
Objective: "Characterize the role of mTOR signaling in autophagy."
Output:
["mTOR signaling pathway and autophagy regulation", "autophagy induction mechanisms involving mTORC1", "rapamycin effect on mTOR and autophagy in cancer cells"]

Now, generate queries for this objective:
Objective: "{objective}"
Output:
"""

# Step 2.2.3: Create the Prompt and LLMChain
prompt = PromptTemplate(template=query_generation_template, input_variables=["objective"])
query_generation_chain = LLMChain(llm=llm_analyzer, prompt=prompt)
# Dedicated summarization prompt-chain that grounds the summary in a specific article abstract
summarization_template = """
You are writing a grounded summary based strictly on an article abstract and the user's objective.

Think step-by-step first (silently) about: the user's goal, core mechanisms in the abstract, their direct alignment, and whether the article corroborates or contrasts with prior context below. Do not reveal your steps.

Context from user's prior saved items (optional):
{memory_context}

STRICT OUTPUT REQUIREMENTS (must follow exactly):
- Output MUST be a single valid JSON object with EXACTLY these keys:
  1) "summary": a concise 4-6 sentence factual summary grounded in the abstract and tailored to the objective
  2) "relevance_justification": a separate 1-2 sentence explanation of why this article is highly relevant to the user's objective, explicitly mentioning which signal(s) triggered inclusion (e.g., PD-1/PD-L1 hit, TMB/GEP mention, resistance pathway) and selection rationale (e.g., citation impact, recency). When helpful, state whether it corroborates or contrasts prior context.
  3) "fact_anchors": an array of 3-5 atomic claims extracted from the abstract; each claim must include: {"claim": string, "evidence": {"title": string, "year": number, "pmid": string|null, "quote": string}}
- Do NOT add any additional keys.
- Do NOT add code fences, markdown, or any text outside the JSON.
- Do NOT include placeholders. Both keys MUST be present and non-empty.

Objective: {objective}
Abstract:
{abstract}
"""
summarization_prompt = PromptTemplate(template=summarization_template, input_variables=["objective", "abstract", "memory_context"])
summarization_chain = LLMChain(llm=llm_summary, prompt=summarization_prompt)

# Critic/refiner prompt to self-correct for factual alignment and clarity
critic_refine_template = """
You are a critical editor. Review the JSON object produced by a summarizer for the given abstract and objective.

Return ONLY a corrected JSON object with EXACTLY these keys: "summary", "relevance_justification". Improve factual alignment with the abstract, clarity, and tightness. Do not add keys. Do not include any text outside the JSON.

Objective: {objective}
Abstract:
{abstract}

Draft JSON:
{draft_json}
"""
critic_refine_prompt = PromptTemplate(template=critic_refine_template, input_variables=["objective", "abstract", "draft_json"])
critic_refine_chain = LLMChain(llm=llm_critic, prompt=critic_refine_prompt)


# Step 2.2.4: Build the wrapper function

# Specialist analyst prompts for strategic synthesis
mechanism_analyst_template = """
You are a Core Mechanism Analyst.
Return ONLY 3-5 lines describing the mechanism of action relevant to the user's objective. Schema:
- Target/Pathway:
- Modulation:
- Immediate Effects:
- Downstream Immune/Cellular Consequences:

User Objective: {objective}

Findings:
{findings}

Output:
- Keep strictly to mechanism of action; no citations, no repetition
"""
mechanism_analyst_prompt = PromptTemplate(template=mechanism_analyst_template, input_variables=["objective", "findings"])
mechanism_analyst_chain = LLMChain(llm=llm_summary, prompt=mechanism_analyst_prompt)

biomarker_analyst_template = """
You are an Efficacy & Biomarker Analyst.
Return ONLY 3-5 lines focused on predictive biomarkers and response correlates. Schema:
- Predictive Biomarkers:
- Response Correlates:
- Modulators of Efficacy:

User Objective: {objective}

Findings:
{findings}

Output:
- Focus on PD-1/PD-L1, CTLA-4, TMB, GEP where relevant; no citations
"""
biomarker_analyst_prompt = PromptTemplate(template=biomarker_analyst_template, input_variables=["objective", "findings"])
biomarker_analyst_chain = LLMChain(llm=llm_summary, prompt=biomarker_analyst_prompt)

resistance_analyst_template = """
You are a Resistance & Limitations Analyst.
Return ONLY 3-5 lines summarizing resistance mechanisms. Schema:
- Resistance Pathways:
- Phenotypes (e.g., exclusion):
- Mitigation Strategies:

User Objective: {objective}

Findings:
{findings}

Output:
- Identify WNT/β-catenin, IFN signaling defects, T-cell exclusion where applicable; no citations
"""
resistance_analyst_prompt = PromptTemplate(template=resistance_analyst_template, input_variables=["objective", "findings"])
resistance_analyst_chain = LLMChain(llm=llm_summary, prompt=resistance_analyst_prompt)

chief_scientist_template = """
You are the Chief Scientist presenting a strategic executive summary to an R&D lead. Using the analyst briefs below, write a cohesive narrative that connects the dots and directly addresses the user's objective.

Requirements:
- 1-2 tight paragraphs (8-12 sentences total)
- Start with the core mechanism in plain language
- Integrate how biomarkers/efficacy determinants relate to that mechanism
- Note key resistance mechanisms and what they imply for strategy
- Include clinical context and, if applicable, patent/commercial landscape cues
- Close with actionable guidance (e.g., when to consider combinations, which biomarkers to check)
- No citations, no bullet lists

User Objective: {objective}

Mechanism Brief:
{mechanism_report}

Biomarker & Efficacy Brief:
{biomarker_report}

Resistance & Limitations Brief:
{resistance_report}

Clinical Context Brief:
{clinical_report}

Patent/Commercial Brief:
{patent_report}
"""
chief_scientist_prompt = PromptTemplate(template=chief_scientist_template, input_variables=[
    "objective", "mechanism_report", "biomarker_report", "resistance_report", "clinical_report", "patent_report"
])
chief_scientist_chain = LLMChain(llm=llm_summary, prompt=chief_scientist_prompt)


def _build_synthesis_plan(objective: str) -> list[str]:
    obj = (objective or "").lower()
    plan: list[str] = ["mechanism", "biomarker", "resistance", "clinical", "patent"]
    # Prioritize based on hints
    if any(k in obj for k in ["biomarker", "efficacy", "predictive", "tmb", "gep", "pd-l1"]):
        plan = ["mechanism", "biomarker", "resistance", "clinical", "patent"]
    if any(k in obj for k in ["resistance", "nonresponse", "failure", "escape"]):
        plan = ["mechanism", "resistance", "biomarker", "clinical", "patent"]
    if any(k in obj for k in ["trial", "neoadjuvant", "adjuvant", "clinical", "metastatic", "approved", "indication"]):
        plan = ["mechanism", "clinical", "biomarker", "resistance", "patent"]
    if any(k in obj for k in ["patent", "commercial", "ip", "market"]):
        plan = ["mechanism", "patent", "clinical", "biomarker", "resistance"]
    return plan


def _collect_findings(results_sections: list[dict], limit: int = 8) -> str:
    snippets: list[str] = []
    for sec in results_sections[:limit]:
        res = sec.get("result") or {}
        summ = str(res.get("summary", "")).strip()
        rel = str(res.get("relevance_justification", "")).strip()
        title = (sec.get("top_article") or {}).get("title") or ""
        piece = f"Title: {title}\nSummary: {summ}\nRelevance: {rel}"
        snippets.append(piece)
    return "\n\n".join(snippets)


def _synthesize_executive_summary(objective: str, results_sections: list[dict], deadline: float) -> str:
    if not results_sections or _time_left(deadline) < 3.0:
        return ""
    findings = _collect_findings(results_sections)
    plan = _build_synthesis_plan(objective)
    mech = bio = resis = clin = pat = ""
    try:
        if "mechanism" in plan and _time_left(deadline) > 2.0:
            mech = mechanism_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
    except Exception:
        mech = ""
    try:
        if "biomarker" in plan and _time_left(deadline) > 2.0:
            bio = biomarker_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
    except Exception:
        bio = ""
    try:
        if "resistance" in plan and _time_left(deadline) > 2.0:
            resis = resistance_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
    except Exception:
        resis = ""
    try:
        if "clinical" in plan and _time_left(deadline) > 2.0:
            clin = clinical_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
    except Exception:
        clin = ""
    try:
        if "patent" in plan and _time_left(deadline) > 2.0:
            # Lightweight patent context using the same findings; optional
            patent_tmpl = """
            You are a Patent/Commercial Analyst. From the input findings, state in 1-2 sentences any commercial or translational cues (e.g., combination strategies, broad indications, competing mechanisms) that would matter for IP or market context.
            Findings:\n{findings}
            """
            patent_prompt = PromptTemplate(template=patent_tmpl, input_variables=["findings"])
            patent_chain = LLMChain(llm=llm_summary, prompt=patent_prompt)
            pat = patent_chain.invoke({"findings": findings}).get("text", "")
    except Exception:
        pat = ""
    try:
        if _time_left(deadline) > 2.0:
            final = chief_scientist_chain.invoke({
                "objective": objective,
                "mechanism_report": mech,
                "biomarker_report": bio,
                "resistance_report": resis,
                "clinical_report": clin,
                "patent_report": pat,
            })
            return str(final.get("text", "")).strip()
    except Exception:
        return ""
    return ""


# Objective deconstruction to guide specialist routing
objective_deconstruction_template = """
You are a research planner. Analyze the user's objective and return ONLY JSON with key "interest" as one of:
- "Mechanism of Action"
- "Predictive Biomarkers"
- "Resistance Mechanisms"
- "Clinical Application"

User Objective: {objective}
"""
objective_deconstruction_prompt = PromptTemplate(
    template=objective_deconstruction_template,
    input_variables=["objective"],
)
objective_deconstruction_chain = LLMChain(llm=llm_analyzer, prompt=objective_deconstruction_prompt)


# Clinical Context analyst
clinical_analyst_template = """
You are a Clinical Context Analyst.
Return ONLY 3-4 lines. Schema:
- Indications/Settings:
- Trial Signals:
- Practical Considerations:

User Objective: {objective}

Findings:
{findings}
"""
clinical_analyst_prompt = PromptTemplate(template=clinical_analyst_template, input_variables=["objective", "findings"])
clinical_analyst_chain = LLMChain(llm=llm_summary, prompt=clinical_analyst_prompt)


def _strip_code_fences(text: str) -> str:
    t = text or ""
    if "```" in t:
        return t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    return t


def _objective_interest(objective: str) -> str:
    """Return one of the four categories to prioritize specialist routing."""
    try:
        out = objective_deconstruction_chain.invoke({"objective": objective})
        txt = out.get("text", "") if isinstance(out, dict) else str(out)
        txt = _strip_code_fences(txt)
        import json as _json
        obj = _json.loads(txt)
        val = str((obj or {}).get("interest", "")).strip()
        if val:
            return val
    except Exception:
        pass
    obj = (objective or "").lower()
    if any(k in obj for k in ["biomarker", "pd-l1", "tmb", "gep", "predictive", "efficacy"]):
        return "Predictive Biomarkers"
    if any(k in obj for k in ["resistance", "nonresponse", "escape", "failure"]):
        return "Resistance Mechanisms"
    if any(k in obj for k in ["trial", "neoadjuvant", "adjuvant", "clinical", "metastatic", "approved"]):
        return "Clinical Application"
    return "Mechanism of Action"


def _specialist_relevance_justification(objective: str, article: dict, summary: str, deadline: float) -> dict:
    """Build a tailored relevance_justification via specialist analysts and synthesis.
    Returns {"text": str, "tags": list[str]}.
    """
    if _time_left(deadline) < 3.0:
        return {"text": "", "tags": []}
    # Build findings snippet from available fields
    title = article.get("title") or ""
    abstract = article.get("abstract") or ""
    journal = article.get("journal") or ""
    pub_year = article.get("pub_year") or ""
    findings = f"Title: {title}\nJournal: {journal} ({pub_year})\nSummary: {summary}\nAbstract: {abstract}"
    interest = _objective_interest(objective)
    # Choose up to 2 specialists based on interest
    pieces: list[str] = []
    tags: list[str] = []
    try:
        if interest in ("Mechanism of Action", "Predictive Biomarkers", "Resistance Mechanisms", "Clinical Application"):
            if _time_left(deadline) > 2.0:
                mech = mechanism_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
                pieces.append(mech)
                tags.append("Mechanism")
            if interest == "Predictive Biomarkers" and _time_left(deadline) > 2.0:
                bio = biomarker_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
                pieces.append(bio)
                tags.append("Biomarker")
            elif interest == "Resistance Mechanisms" and _time_left(deadline) > 2.0:
                resis = resistance_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
                pieces.append(resis)
                tags.append("Resistance")
            elif interest == "Clinical Application" and _time_left(deadline) > 2.0:
                clin = clinical_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
                pieces.append(clin)
                tags.append("Clinical")
            else:
                # Default second lens if time permits
                if _time_left(deadline) > 2.0:
                    bio = biomarker_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
                    pieces.append(bio)
                    if "Biomarker" not in tags:
                        tags.append("Biomarker")
    except Exception:
        pass
    # Synthesize into a 1-2 sentence justification
    try:
        if pieces and _time_left(deadline) > 2.0:
            synth_prompt = """
            You are the Project Manager. Synthesize the analyst notes below into a single 1-2 sentence, plain-language relevance_justification tailored to the user's objective. Mention which signal(s) triggered inclusion (e.g., PD-1/PD-L1, TMB/GEP, resistance pathway) and the molecule/pathway where applicable.
            Analyst Notes:\n{notes}
            """
            p = PromptTemplate(template=synth_prompt, input_variables=["notes"])
            chain = LLMChain(llm=llm_summary, prompt=p)
            out = chain.invoke({"notes": "\n\n".join(pieces)}).get("text", "")
            return {"text": _strip_code_fences(out), "tags": tags}
    except Exception:
        return {"text": "", "tags": tags}
    return {"text": "", "tags": tags}

def generate_search_queries(objective: str) -> List[str]:
    """Generate 3 diverse search queries from a high-level research objective.

    Args:
        objective: High-level research goal provided by the user.

    Returns:
        List[str]: A list of search query strings.
    """
    def _fallback(objective_text: str) -> List[str]:
        base = objective_text.strip().rstrip('.')
        return [
            base,
            f"{base} review 2023..2025",
            f"{base} mechanisms site:nih.gov OR site:nature.com OR site:sciencedirect.com",
        ]

    try:
        result = query_generation_chain.invoke({"objective": objective})
        raw_output = result.get("text", result) if isinstance(result, dict) else str(result)
        if not isinstance(raw_output, str):
            raw_output = str(raw_output)

        # Primary attempt: direct JSON parse
        try:
            return json.loads(raw_output)
        except json.JSONDecodeError:
            # Secondary attempt: extract the first JSON array substring
            start = raw_output.find("[")
            end = raw_output.rfind("]")
            if start != -1 and end != -1 and end > start:
                candidate = raw_output[start : end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass

            # Tertiary attempt: line-based heuristic extraction
            lines = [ln.strip() for ln in raw_output.splitlines() if ln.strip()]
            # Remove leading numbering/bullets and quotes
            cleaned: List[str] = []
            for ln in lines:
                # Remove markdown bullets or numbering
                ln = re.sub(r"^[-*\d\.\)\s]+", "", ln)
                # Strip enclosing quotes or trailing commas
                ln = ln.strip().strip(",")
                ln = ln.strip("'\"")
                # Keep only non-empty, reasonably short lines
                if ln and len(ln) < 300:
                    cleaned.append(ln)
            # Deduplicate while preserving order
            seen = set()
            unique = []
            for q in cleaned:
                if q not in seen:
                    seen.add(q)
                    unique.append(q)
            # Return top 3 items as a best-effort fallback
            return unique[:3] if unique else _fallback(objective)

    except Exception:
        # Final fallback in case of unexpected errors
        return _fallback(objective)


class ReviewRequest(BaseModel):
    molecule: str
    objective: str
    # Accept either `project_id` (default) or `projectId` (alias)
    project_id: str | None = Field(default=None, alias="projectId")
    # Clinical profile and precision/recall preference
    clinical_mode: bool = Field(default=False, alias="clinicalMode")
    preference: str | None = Field(default=None)  # 'precision' | 'recall'
    # Optional: enable experimental DAG orchestration
    dag_mode: bool = Field(default=False, alias="dagMode")

    class Config:
        allow_population_by_field_name = True
        allow_population_by_alias = True


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> dict:
    pc_ok = False
    try:
        index = _get_pinecone_index()
        if index is not None:
            _ = index.describe_index_stats()
            pc_ok = True
    except Exception as e:
        try:
            log_event({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "event": "pinecone_ready_exception", "error": str(e)})
        except Exception:
            pass
        pc_ok = False
    keys_ok = bool(os.getenv("GOOGLE_API_KEY")) and bool(os.getenv("GOOGLE_CSE_ID")) and bool(os.getenv("PINECONE_API_KEY"))
    return {"pinecone": pc_ok, "keys": keys_ok}


@app.get("/version")
async def version() -> dict:
    return {"version": APP_VERSION, "git": GIT_SHA}


def _retrieve_memories(project_id: str | None, objective: str) -> list[dict]:
    if not project_id:
        return []
    index = _get_pinecone_index()
    if index is None:
        return []
    # Embed objective
    vector = EMBED_CACHE.get_or_compute(objective)
    # Read-after-write retries
    for attempt in range(3):
        try:
            res = index.query(vector=vector, top_k=3, filter={"project_id": {"$eq": project_id}}, include_metadata=True)
            items: list[dict] = []
            for match in res.get("matches", []) or []:
                meta = match.get("metadata") or {}
                items.append({"text": meta.get("text", ""), "score": match.get("score", 0)})
            if items:
                return items
            time.sleep(0.2 * (attempt + 1))
        except Exception:
            time.sleep(0.2 * (attempt + 1))
    return []

def _project_interest_vector(memories: list[dict]) -> np.ndarray | None:
    """Compute a simple interest vector from project memories (mean embedding)."""
    if not memories:
        return None
    vecs: list[np.ndarray] = []
    for m in memories:
        txt = (m.get("text") or "").strip()
        if not txt:
            continue
        try:
            v = np.array(EMBED_CACHE.get_or_compute(txt), dtype=float)
            if v.size:
                vecs.append(v)
        except Exception:
            continue
    if not vecs:
        return None
    try:
        mean = np.mean(vecs, axis=0)
        return mean
    except Exception:
        return None

def _fetch_pubchem_synonyms(name: str) -> list[str]:
    key = f"syn:{name.strip().lower()}"
    if ENABLE_CACHING:
        cached = synonyms_cache.get(key)
        if cached is not None:
            return cached  # type: ignore
    out: list[str] = []
    try:
        q = urllib.parse.quote(name.strip())
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{q}/synonyms/JSON"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode())
            info_list = (data.get("InformationList") or {}).get("Information") or []
            if info_list and isinstance(info_list, list):
                syns = (info_list[0] or {}).get("Synonym") or []
                if isinstance(syns, list):
                    out = [s for s in syns if isinstance(s, str)][:20]
    except Exception:
        out = []
    if ENABLE_CACHING:
        synonyms_cache.set(key, out)
    return out

async def _run_pubmed_with_retry(query: str, attempts: int = 3) -> list[dict]:
    """Run PubMed tool with retries and jitter in a threadpool, parse JSON."""
    for i in range(attempts):
        try:
            pubmed_tool = PubMedSearchTool()
            raw = await run_in_threadpool(pubmed_tool._run, query)
            _metrics_inc("pubmed_calls_total", 1)
            import json as _json
            return _json.loads(raw) if isinstance(raw, str) else (raw or [])
        except Exception:
            await asyncio.sleep(0.2 + random.random() * 0.3)
    return []

def _negative_terms_for_objective(objective: str, clinical_mode: bool) -> list[str]:
    obj_l = (objective or "").lower()
    mech = "mechan" in obj_l  # mechanism/mechanistic
    neg = []
    if clinical_mode or mech:
        neg += ["formulation", "assay", "analytical", "sers", "raman"]
    return neg

def _fetch_chembl_synonyms(name: str) -> list[str]:
    key = f"chembl:{name.strip().lower()}"
    if ENABLE_CACHING:
        cached = synonyms_cache.get(key)
        if cached is not None:
            return cached  # type: ignore
    out: list[str] = []
    try:
        q = urllib.parse.quote(name.strip())
        # Search molecule by name
        url = f"https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q={q}"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode())
            mols = (data.get("molecules") or [])
            chembl_id = None
            if mols and isinstance(mols, list):
                chembl_id = (mols[0] or {}).get("molecule_chembl_id")
            if chembl_id:
                syn_url = f"https://www.ebi.ac.uk/chembl/api/data/molecule_synonyms.json?molecule_chembl_id={chembl_id}"
                with urllib.request.urlopen(syn_url, timeout=10) as r2:
                    sdata = json.loads(r2.read().decode())
                    syns = [row.get("synonyms", "") for row in (sdata.get("molecule_synonyms") or [])]
                    out = [s for s in syns if isinstance(s, str) and s]
    except Exception:
        out = []
    if ENABLE_CACHING:
        synonyms_cache.set(key, out)
    return out


@app.post("/feedback")
async def feedback(payload: dict):
    """Store positive feedback into Pinecone memory.
    Expected payload: { project_id: str, article_data: {pmid,title,abstract,...}, feedback: 'relevant' }
    """
    project_id = payload.get("project_id")
    article = payload.get("article_data") or {}
    feedback = payload.get("feedback")
    if not (project_id and feedback == "relevant" and article.get("abstract")):
        return {"status": "ignored"}
    text = article.get("abstract", "")
    vec = EMBED_CACHE.get_or_compute(text)
    try:
        index = _get_pinecone_index()
        if index is None:
            return {"status": "disabled", "message": "Pinecone not configured"}
        index.upsert(vectors=[{
            "id": f"{project_id}:{article.get('pmid') or article.get('title')}",
            "values": vec,
            "metadata": {"project_id": project_id, "text": text}
        }])
        return {"status": "stored"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/generate-review")
async def generate_review(request: ReviewRequest):
    req_start = _now_ms()
    _metrics_inc("requests_total", 1)
    deadline = time.time() + TOTAL_BUDGET_S

    def time_left_s() -> float:
        return max(0.0, deadline - time.time())
    # Response cache lookup
    cache_key = None
    if ENABLE_CACHING:
        try:
            # Adapt TTL by objective length
            obj_len = len((request.objective or "").split())
            ttl_hint = 300 if obj_len < 6 else (900 if obj_len < 20 else 1800)
            cache_key = json.dumps({
                "molecule": request.molecule,
                "objective": request.objective,
                "project_id": request.project_id,
                "clinical": getattr(request, "clinical_mode", False),
                "preference": request.preference or "precision",
            }, sort_keys=True)
            cached = response_cache.get(cache_key)
            if cached is not None:
                _metrics_inc("response_cached_hits", 1)
                log_event({"event": "response_cache_hit", "molecule": request.molecule})
                return cached
        except Exception:
            pass
    # Retrieve memory if available
    memories = _retrieve_memories(request.project_id, request.objective)
    memory_hint = ""
    if memories:
        hints = " | ".join(m.get("text", "")[:200] for m in memories)
        memory_hint = f"\nContext: Prior relevant topics for project {request.project_id}: {hints}\n"

    # Branch to V2 orchestrated flow when enabled
    if MULTISOURCE_ENABLED and not getattr(request, "dag_mode", False):
        try:
            v2 = await orchestrate_v2(request, memories)
            resp = {
                "molecule": request.molecule,
                "objective": request.objective,
                "project_id": request.project_id,
                "queries": v2.get("queries", []),
                "results": v2.get("results", []),
                "diagnostics": v2.get("diagnostics", {}),
                "executive_summary": v2.get("executive_summary", ""),
                "memories": memories,
            }
            took = _now_ms() - req_start
            _metrics_inc("latency_ms_sum", took)
            log_event({"event": "generate_review_v2", "sections": len(resp["results"]), "latency_ms": took})
            return resp
        except Exception as e:
            log_event({"event": "v2_error_fallback_v1", "error": str(e)[:200]})

    # Optional: DAG orchestration path
    if getattr(request, "dag_mode", False) and StateGraph is not None:
        try:
            # Build and run the DAG
            global _DAG_APP
            if _DAG_APP is None:
                _DAG_APP = _build_dag_app()
            state = {
                "request": request,
                "memories": memories,
                "deadline": time.time() + TOTAL_BUDGET_S,
            }
            if _DAG_APP is None:
                raise RuntimeError("DAG graph unavailable")
            out = await _DAG_APP.ainvoke(state)
            results_sections = out.get("results_sections", [])
            # If DAG produced no results, fall back to V2 to avoid empty responses
            if not results_sections:
                try:
                    v2 = await orchestrate_v2(request, memories)
                    resp = {
                        "molecule": request.molecule,
                        "objective": request.objective,
                        "project_id": request.project_id,
                        "queries": v2.get("queries", []),
                        "results": v2.get("results", []),
                        "diagnostics": {**(out.get("diagnostics", {}) or {}), "dag_fallback_v2": True, "dag_empty": True},
                        "executive_summary": v2.get("executive_summary", ""),
                        "memories": memories,
                    }
                    took = _now_ms() - req_start
                    _metrics_inc("latency_ms_sum", took)
                    log_event({"event": "generate_review_dag_fallback_v2", "sections": len(resp["results"]), "latency_ms": took})
                    return resp
                except Exception as e2:
                    log_event({"event": "dag_empty_v2_error", "error": str(e2)[:200]})

            resp = {
                "molecule": request.molecule,
                "objective": request.objective,
                "project_id": request.project_id,
                "queries": [v for k, v in (out.get("plan") or {}).items() if isinstance(v, str)],
                "results": results_sections,
                "diagnostics": out.get("diagnostics", {}),
                "executive_summary": out.get("executive_summary", ""),
                "memories": memories,
            }
            took = _now_ms() - req_start
            _metrics_inc("latency_ms_sum", took)
            log_event({"event": "generate_review_dag", "sections": len(resp["results"]), "latency_ms": took})
            return resp
        except Exception as e:
            log_event({"event": "dag_error_fallback_v1", "error": str(e)[:200]})

    # Use memory as slight prefix to objective for query generation (V1 flow)
    objective_with_memory = (request.objective + memory_hint) if memory_hint else request.objective

    # Objective analyzer to extract mechanisms/methods to guide query building
    analyzer_template = """
Extract structured fields from a biomedical research objective.
Return ONLY JSON with keys: molecule (string), mechanisms (array of strings), methods (array of strings), disease_context (array of strings), keywords (array of strings).
Objective: {objective}
"""
    analyzer_prompt = PromptTemplate(template=analyzer_template + "\nExamples:\n- Objective: 'mechanism of action of aspirin in inflammation' -> mechanisms: ['COX inhibition','SPMs'], methods: ['ELISA','WB']\n- Objective: 'clinical effects of propranolol in hypertension' -> mechanisms: ['beta-adrenergic blockade'], methods: ['RCT','meta-analysis']\n", input_variables=["objective"])
    analyzer_chain = LLMChain(llm=llm_analyzer, prompt=analyzer_prompt)
    analyzed_mechs: list[str] = []
    analyzed_methods: list[str] = []
    analyzed_diseases: list[str] = []
    try:
        # Analyzer cache
        analysis_text = None
        if ENABLE_CACHING:
            ck = f"analyzer:{hash(request.objective)}"
            cached = analyzer_cache.get(ck)
            if cached:
                analysis_text = cached
        if analysis_text is None:
            analysis_raw = analyzer_chain.invoke({"objective": request.objective})
            _metrics_inc("llm_calls_total", 1)
            analysis_text = analysis_raw.get("text", analysis_raw) if isinstance(analysis_raw, dict) else str(analysis_raw)
            if ENABLE_CACHING:
                analyzer_cache.set(ck, analysis_text)
        if "```" in analysis_text:
            analysis_text = analysis_text.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
        parsed = json.loads(analysis_text)
        if isinstance(parsed, dict):
            analyzed_mechs = parsed.get("mechanisms") or []
            analyzed_methods = parsed.get("methods") or []
            analyzed_diseases = parsed.get("disease_context") or []
            if not isinstance(analyzed_mechs, list):
                analyzed_mechs = []
            if not isinstance(analyzed_methods, list):
                analyzed_methods = []
            if not isinstance(analyzed_diseases, list):
                analyzed_diseases = []
    except Exception:
        analyzed_mechs = []
        analyzed_methods = []
        analyzed_diseases = []

    # Build deterministic queries (skip per-query agent)
    queries: List[str] = []
    if request.molecule:
        # Build a stricter PubMed-style fielded query when possible
        mech_term = analyzed_mechs[0] if analyzed_mechs else "mechanism"
        # Expand synonyms (PubChem) to improve recall
        synonyms = []
        try:
            synonyms = _fetch_pubchem_synonyms(request.molecule)[:5]
        except Exception:
            synonyms = []
        try:
            if len(synonyms) < 8:
                syn2 = _fetch_chembl_synonyms(request.molecule)
                synonyms += [s for s in syn2 if s not in synonyms][:8-len(synonyms)]
        except Exception:
            pass
        # Build PubMed eUtils-friendly fielded clauses
        mol_tokens = [request.molecule] + (synonyms or [])
        mol_clause_tiab = "(" + " OR ".join([f'"{t}"[tiab]' for t in mol_tokens if t]) + ")"
        # Review query (simple, valid)
        review_query = f"({mol_clause_tiab} AND (review[pt] OR systematic[sb]) AND (2015:3000[dp]))"
        if getattr(request, "clinical_mode", False):
            review_query += " AND humans[mesh] NOT plants[mesh] NOT fungi[mesh]"
        # Mechanism lexicon; split into simpler queries
        mech_lex = [mech_term, "mechanism of action", "mechanism", "signaling", "pathway"]
        # If GLP-1 context, enrich
        obj_l = (request.objective or "").lower()
        if any(k in obj_l for k in ["glp-1", "glp1", "semaglutide", "incretin"]):
            mech_lex += ["glp-1 receptor", "cAMP", "PKA", "insulin secretion", "gastric emptying", "beta-cell"]
        mech_queries = []
        for term in mech_lex[:6]:
            q = f"({mol_clause_tiab} AND \"{term}\"[tiab])"
            if getattr(request, "clinical_mode", False):
                q += " AND humans[mesh] NOT plants[mesh] NOT fungi[mesh]"
            mech_queries.append(q)
        # Title-biased precision query
        mol_clause_title = "(" + " OR ".join([f'"{t}"[Title]' for t in mol_tokens if t]) + ")"
        title_query = f"({mol_clause_title} AND (\"{mech_term}\"[Title] OR mechanism[Title]))"
        if getattr(request, "clinical_mode", False):
            title_query += " AND humans[mesh] NOT plants[mesh] NOT fungi[mesh]"
        # Assembled
        queries = [review_query, title_query] + mech_queries[:3]
    else:
        # Fall back to objective-only variants when molecule missing
        base = (request.objective or "").strip()
        queries = [base, f"ti:({base})"]
    results = []
    # Pre-compute objective embedding for cosine similarity
    try:
        objective_vec = np.array(EMBED_CACHE.get_or_compute(request.objective or ""), dtype=float)
        obj_norm = np.linalg.norm(objective_vec) or 1.0
    except Exception:
        objective_vec = None
        obj_norm = 1.0

    # Parallelize PubMed fetches per query
    # Explicit shortlist controller goals: precision=24–28, recall=40–50 → widen queries accordingly
    try:
        _pref_local = (request.preference or "precision").lower()
    except Exception:
        _pref_local = "precision"
    queries = queries[:4] if _pref_local == "recall" else queries[:3]
    fetch_tasks = [asyncio.create_task(_run_pubmed_with_retry(q, attempts=2)) for q in queries]
    seen_pmids_global: set[str] = set()
    seen_titles_global: set[str] = set()
    for idx, q in enumerate(queries):
        if time_left_s() <= 1.0:
            break
        try:
            output = await run_in_threadpool(agent_executor.run, q)
            _metrics_inc("llm_calls_total", 1)
        except Exception as e:
            output = f"Error running agent: {e}"

        # Fetch PubMed articles and score (from parallel task)
        try:
            articles = await fetch_tasks[idx]
        except Exception:
            articles = []

        structured = ensure_json_response(output)
        pub_score = 0.0
        for a in articles:
            try:
                pub_score = max(pub_score, calculate_publication_score(a))
            except Exception:
                pass
        try:
            llm_conf = float(structured.get("confidence_score", 0))
        except Exception:
            llm_conf = 0.0
        overall = 0.6 * llm_conf + 0.4 * pub_score

        structured["publication_score"] = round(pub_score, 1)
        structured["overall_relevance_score"] = round(overall, 1)
        # Rank articles by combined mechanism relevance, cosine similarity, citations per year, recency, review bias
        mech_lexicon = [
            "cox", "cox-1", "cox-2", "cyclooxygenase", "nf-kb", "nf-κb", "p65", "rela",
            "hmgb1", "tlr4", "lipoxin", "15-epi-lipoxin a4", "resolvin", "spm", "specialized pro-resolving",
            "cytokine", "il-6", "tnf-α", "tnf-alpha", "pge2", "pla2", "arachidonic acid",
        ]
        # Include analyzer-derived tokens (lowercased)
        mech_lexicon += [m.lower() for m in analyzed_mechs if isinstance(m, str)]
        mech_lexicon += [m.lower() for m in analyzed_methods if isinstance(m, str)]
        mech_lexicon += [d.lower() for d in analyzed_diseases if isinstance(d, str)]

        def _score_article(a: dict) -> float:
            text = f"{a.get('title','')} {a.get('abstract','')}".lower()
            mech_hits = sum(1 for kw in mech_lexicon if kw and kw in text)
            # Cosine similarity using embeddings
            try:
                if objective_vec is not None:
                    abs_vec = np.array(EMBED_CACHE.get_or_compute(a.get('abstract') or a.get('title') or ""), dtype=float)
                    sim = float(np.dot(objective_vec, abs_vec) / ((obj_norm) * (np.linalg.norm(abs_vec) or 1.0)))
                    # Clamp to [0,1]
                    similarity = max(0.0, min(1.0, (sim + 1.0) / 2.0))  # in case model returns negative values
                else:
                    similarity = 0.0
            except Exception:
                similarity = 0.0
            year = int(a.get('pub_year') or 0)
            nowy = datetime.utcnow().year
            recency = max(0.0, min(1.0, (year - 2015) / (nowy - 2015 + 1))) if year else 0.0
            cites = float(a.get('citation_count') or 0.0)
            cpy = cites / max(1, (nowy - year + 1)) if year else 0.0
            review_flag = 1.0 if 'review' in text else 0.0
            # Penalize history-only reviews when objective asks for mechanisms
            history_pen = -0.05 if (('history' in text) and ('mechan' in (request.objective or '').lower())) else 0.0
            # Generic penalties/boosts (molecule-agnostic)
            mol = (request.molecule or "").lower()
            has_molecule = bool(mol) and (mol in text)
            non_mol_pen = -0.2 if (mol and (f"non-{mol}" in text) and ("non-" + mol not in (request.objective or "").lower())) else 0.0
            drift_terms = ["hypersensitivity", "allergy"]
            detect_terms = [
                "detection", "quantitative", "assay", "sers", "raman", "hplc", "lc-ms", "formulation",
                "nanoparticle", "mesomorphism", "nmr", "ssnmr", "oleate", "analytical"
            ]
            # Non-biomedical/agricultural drift (penalize unless requested)
            agri_terms = [
                "fungicide", "phytopathology", "crop", "agricultur", "field trial", "barley", "wheat",
                "maize", "rice", "magnarpthe oryzae", "magnaporthe oryzae", "arabidopsis"
            ]
            drift_pen = -0.15 if any(dt in text for dt in drift_terms) and not any(dt in (request.objective or "").lower() for dt in drift_terms) else 0.0
            detect_pen = -0.15 if any(dt in text for dt in detect_terms) and not any(dt in (request.objective or "").lower() for dt in detect_terms) else 0.0
            agri_pen = -0.2 if any(dt in text for dt in agri_terms) and not any(dt in (request.objective or "").lower() for dt in agri_terms) else 0.0
            prox_boost = 0.1 if (has_molecule and mech_hits > 0) else 0.0
            # Component appraisers for transparent scorecard
            objective_similarity_score = round(100.0 * similarity, 1)
            recency_score = round(60.0 * max(0.0, min(1.0, recency)), 1)
            impact_score = round(40.0 * (1.0 - math.exp(-max(0.0, cpy))), 1)

            score = 0.5 * similarity + 0.2 * (min(mech_hits, 5) / 5.0) + 0.15 * (cpy / 100.0) + 0.1 * recency + 0.05 * review_flag
            score += prox_boost + non_mol_pen + drift_pen + detect_pen + agri_pen + history_pen
            a["score_breakdown"] = {
                "similarity": round(similarity, 3),
                "mechanism_hits": mech_hits,
                "citations_per_year": round(cpy, 2),
                "recency": round(recency, 3),
                "review": review_flag,
                "molecule_match": 1 if has_molecule else 0,
                "non_molecule_penalty": non_mol_pen,
                "domain_drift_penalty": drift_pen,
                "proximity_boost": prox_boost,
                "analytical_penalty": detect_pen,
                "agri_penalty": agri_pen,
                "history_penalty": history_pen,
                # Appraiser raw components for UI scorecard
                "objective_similarity_score": objective_similarity_score,
                "recency_score": recency_score,
                "impact_score": impact_score,
            }
            a["score"] = round(score, 3)
            return score

        selected_top_for_summary = None
        if articles:
            try:
                articles = sorted(articles, key=_score_article, reverse=True)
                # Cross-encoder re-rank top 30 for sharper order (skip if budget nearly spent)
                if cross_encoder is not None and time_left_s() > 10.0:
                    pairs = [(request.objective or "", (a.get('title') or '') + ". " + (a.get('abstract') or '')) for a in articles[:30]]
                    scores = cross_encoder.predict(pairs)
                    for i, s in enumerate(scores):
                        articles[i]["score_breakdown"]["cross_score"] = float(s)
                        # blend: 80% original + 20% cross
                        articles[i]["score"] = round(0.8 * float(articles[i]["score"]) + 0.2 * float(s), 3)
                    articles = sorted(articles, key=lambda a: a.get("score", 0), reverse=True)
            except Exception:
                pass
            # Normalize scores to 0..1 and drop marginal results below threshold if any
            try:
                # score only top 12 for efficiency
                articles = articles[:12]
                scores = [float(a.get("score", 0.0)) for a in articles]
                if scores:
                    mn, mx = min(scores), max(scores)
                    rng = (mx - mn) or 1.0
                    for a in articles:
                        a["score_norm"] = round((float(a.get("score", 0.0)) - mn) / rng, 3)
                    # Filter if we have enough results
                    # Eligibility: must mention molecule (including synonyms) and some mechanism indication
                    mol = (request.molecule or "").lower()
                    # Include synonyms as molecule tokens (lowercased)
                    syn_l = []
                    try:
                        syn_l = [s.lower() for s in (synonyms or []) if isinstance(s, str)]
                    except Exception:
                        syn_l = []
                    mol_tokens = [mol] + [s for s in syn_l if s]
                    # Preference-based threshold
                    try:
                        _pref_local = (request.preference or "precision").lower()
                    except Exception:
                        _pref_local = "precision"
                    primary_thresh = 0.35 if _pref_local == "precision" else 0.30
                    def eligible(a: dict) -> bool:
                        text_l = f"{a.get('title','')} {a.get('abstract','')}".lower()
                        mech_flag = (a.get('score_breakdown', {}).get('mechanism_hits', 0) or 0) > 0 or ("mechanism" in text_l) or any((m or "").lower() in text_l for m in (analyzed_mechs or []))
                        mol_flag = (bool(mol) and any(tok and tok in text_l for tok in mol_tokens)) if mol else True
                        return mol_flag and mech_flag
                    filtered = [a for a in articles if a.get("score_norm", 0.0) >= primary_thresh and eligible(a)]
                    # If filtering removes everything, keep top 2-3 to avoid empty sections
                    if filtered:
                        articles = filtered
            except Exception:
                pass
        # If objective is vague (very short) or articles exist, generate a grounded summary from the top article
        if articles and time_left_s() > 5.0:
            try:
                # Safety net: prefer explicit "mechanism of action" titles including molecule if available
                mol = (request.molecule or "").lower()
                moa_idx = None
                for idx, aa in enumerate(articles):
                    title_l = (aa.get("title") or "").lower()
                    if ("mechanism of action" in title_l) and (not mol or mol in title_l):
                        moa_idx = idx
                        break
                top = articles[moa_idx] if moa_idx is not None else articles[0]
                selected_top_for_summary = top
                abstract_text = top.get("abstract", "")
                if abstract_text.strip():
                    memory_context = " | ".join(m.get("text", "")[:200] for m in memories) if memories else ""
                    grounded = await run_in_threadpool(summarization_chain.invoke, {
                        "objective": request.objective,
                        "abstract": abstract_text,
                        "memory_context": memory_context,
                    })
                    _metrics_inc("llm_calls_total", 1)
                    grounded_text = grounded.get("text", grounded) if isinstance(grounded, dict) else str(grounded)
                    try:
                        text_for_parse = grounded_text
                        # Strip possible code fences like ```json ... ```
                        if "```" in text_for_parse:
                            text_for_parse = text_for_parse.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
                        # Try direct JSON parse
                        _parsed = json.loads(text_for_parse) if isinstance(text_for_parse, str) else text_for_parse
                        # If that failed previously, attempt extracting first JSON object substring
                        if not isinstance(_parsed, dict):
                            raise ValueError("not a dict")
                        if isinstance(_parsed, dict):
                            if _parsed.get("summary"):
                                structured["summary"] = _parsed["summary"].strip()
                            if _parsed.get("relevance_justification"):
                                structured["relevance_justification"] = _parsed["relevance_justification"].strip()
                            # Self-correct via critic chain
                            corrected = await run_in_threadpool(critic_refine_chain.invoke, {
                                "objective": request.objective,
                                "abstract": abstract_text,
                                "draft_json": json.dumps({
                                    "summary": structured.get("summary", ""),
                                    "relevance_justification": structured.get("relevance_justification", ""),
                                })
                            })
                            _metrics_inc("llm_calls_total", 1)
                            corr_text = corrected.get("text", corrected) if isinstance(corrected, dict) else str(corrected)
                            try:
                                corr_parsed = json.loads(corr_text)
                                if isinstance(corr_parsed, dict):
                                    structured["summary"] = corr_parsed.get("summary", structured.get("summary", "")).strip()
                                    structured["relevance_justification"] = corr_parsed.get("relevance_justification", structured.get("relevance_justification", "")).strip()
                            except Exception:
                                pass
                    except Exception:
                        # Last-resort attempt: extract between first { and last }
                        try:
                            s = grounded_text
                            if "```" in s:
                                s = s.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
                            start = s.find("{")
                            end = s.rfind("}")
                            if start != -1 and end != -1 and end > start:
                                candidate = s[start:end+1]
                                obj = json.loads(candidate)
                                if isinstance(obj, dict):
                                    structured["summary"] = obj.get("summary", structured.get("summary", "")).strip()
                                    structured["relevance_justification"] = obj.get("relevance_justification", structured.get("relevance_justification", "")).strip()
                                else:
                                    structured["summary"] = str(grounded_text).strip()
                            else:
                                structured["summary"] = str(grounded_text).strip()
                        except Exception:
                            # Fallback: keep the raw grounded text as summary
                            structured["summary"] = str(grounded_text).strip()
                        # Fallback: keep the raw grounded text as summary
                        structured["summary"] = str(grounded_text).strip()
            except Exception:
                pass

        # Attach the exact top article used (if computed) so UI can header-link it
        top_article_payload = None
        if articles:
            try:
                top = selected_top_for_summary or articles[0]
                top_article_payload = {
                    "title": top.get("title"),
                    "pmid": top.get("pmid"),
                    "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                    "citation_count": top.get("citation_count"),
                    "pub_year": top.get("pub_year"),
                }
            except Exception:
                top_article_payload = None

        # Only include sections that actually have articles and a usable top article
        if articles and top_article_payload and not _is_duplicate_section(top_article_payload, seen_pmids_global, seen_titles_global):
            try:
                _ensure_relevance_fields(structured, request.molecule, request.objective, top_article_payload)
            except Exception:
                pass
            try:
                _ensure_relevance_fields(structured, request.molecule, request.objective, {
                    "title": top_article_payload.get("title"),
                    "pub_year": top_article_payload.get("pub_year"),
                    "abstract": (articles[0] or {}).get("abstract", "") if isinstance(articles, list) and articles else "",
                })
            except Exception:
                pass
            results.append({
                "query": q,
                "result": structured,
                "articles": articles,
                "top_article": top_article_payload,
                "source": "primary",
                "memories_used": len(memories or []),
            })
            _mark_seen(top_article_payload, seen_pmids_global, seen_titles_global)

    # If no primary sections were produced, try one conditional broader primary query before fallback
    try:
        if time_left_s() > 5.0 and not any(sec.get("source") == "primary" for sec in results):
            q = conditional_broad_query
            # Run agent best-effort (non-blocking if it fails)
            try:
                output = await run_in_threadpool(agent_executor.run, q)
                _metrics_inc("llm_calls_total", 1)
            except Exception as e:
                output = f"Error running agent: {e}"
            # Fetch PubMed with retry
            try:
                articles = await _run_pubmed_with_retry(q, attempts=2)
            except Exception:
                articles = []
            structured = ensure_json_response(output)
            pub_score = 0.0
            for a in articles:
                try:
                    pub_score = max(pub_score, calculate_publication_score(a))
                except Exception:
                    pass
            try:
                llm_conf = float(structured.get("confidence_score", 0))
            except Exception:
                llm_conf = 0.0
            overall = 0.6 * llm_conf + 0.4 * pub_score
            structured["publication_score"] = round(pub_score, 1)
            structured["overall_relevance_score"] = round(overall, 1)
            if articles:
                try:
                    articles = sorted(articles, key=_score_article, reverse=True)[:12]
                    scores = [float(a.get("score", 0.0)) for a in articles]
                    if scores:
                        mn, mx = min(scores), max(scores)
                        rng = (mx - mn) or 1.0
                        for a in articles:
                            a["score_norm"] = round((float(a.get("score", 0.0)) - mn) / rng, 3)
                except Exception:
                    pass
                # Choose top for header
                try:
                    top = articles[0]
                    top_article_payload = {
                        "title": top.get("title"),
                        "pmid": top.get("pmid"),
                        "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                        "citation_count": top.get("citation_count"),
                        "pub_year": top.get("pub_year"),
                    }
                except Exception:
                    top_article_payload = None
                if top_article_payload and not _is_duplicate_section(top_article_payload, seen_pmids_global, seen_titles_global):
                    try:
                        _ensure_relevance_fields(structured, request.molecule, request.objective, top_article_payload)
                    except Exception:
                        pass
                    results.append({
                        "query": q,
                        "result": structured,
                        "articles": articles,
                        "top_article": top_article_payload,
                        "source": "primary",
                        "memories_used": len(memories or []),
                    })
                    _mark_seen(top_article_payload, seen_pmids_global, seen_titles_global)
    except Exception:
        pass

    # Optional aggressive-primary: if we still have <3 primary sections and have time, try up to 1 extra broad primary query
    try:
        if AGGRESSIVE_PRIMARY_ENABLED and time_left_s() > 12.0:
            primary_sections = [sec for sec in results if sec.get("source") == "primary"]
            if len(primary_sections) < 3:
                q = conditional_broad_query
                if all(sec.get("query") != q for sec in results):
                    try:
                        output = await run_in_threadpool(agent_executor.run, q)
                        _metrics_inc("llm_calls_total", 1)
                    except Exception as e:
                        output = f"Error running agent: {e}"
                    try:
                        articles = await _run_pubmed_with_retry(q, attempts=2)
                    except Exception:
                        articles = []
                    structured = ensure_json_response(output)
                    if articles:
                        try:
                            articles = sorted(articles, key=_score_article, reverse=True)[:12]
                        except Exception:
                            pass
                        top = articles[0]
                        top_article_payload = {
                            "title": top.get("title"),
                            "pmid": top.get("pmid"),
                            "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                            "citation_count": top.get("citation_count"),
                            "pub_year": top.get("pub_year"),
                        }
                        try:
                            _ensure_relevance_fields(structured, request.molecule, request.objective, top_article_payload)
                        except Exception:
                            pass
                        if not _is_duplicate_section(top_article_payload, seen_pmids_global, seen_titles_global):
                            _mark_seen(top_article_payload, seen_pmids_global, seen_titles_global)
                            results.append({
                            "query": q,
                            "result": structured,
                            "articles": articles,
                            "top_article": top_article_payload,
                            "source": "primary",
                            "memories_used": len(memories or []),
                            })
    except Exception:
        pass

    # Min-3 sections fallback and low-recall augmentation
    try:
        # Stats from primary pass
        initial_sections = len(results)
        total_articles = sum(len(sec.get("articles") or []) for sec in results)
        seen_pmids: set[str] = set()
        for sec in results:
            for a in sec.get("articles", []) or []:
                pm = a.get("pmid")
                if pm:
                    seen_pmids.add(str(pm))

        # Ensure minimum sections based on preference: precision>=8, recall>=13
        try:
            _pref_local = (request.preference or "precision").lower()
        except Exception:
            _pref_local = "precision"
        target_sections = 13 if (_pref_local == "recall") else 8
        need_sections = max(0, target_sections - initial_sections)
        low_recall = total_articles <= 3 or len(seen_pmids) <= 3
        if need_sections > 0 or low_recall:
            # Build targeted fallback candidates (molecule + top analyzer mechanisms); if no molecule, use objective
            def _quote(term: str) -> str:
                term = (term or "").strip()
                if not term:
                    return ""
                return f'"{term}"' if (" " in term or "-" in term) else term
            mol = (request.molecule or "").strip()
            # Broaden candidates: analyzer mechs + generic mechanism lexicon
            generic_terms = [
                "mechanism of action", "mechanism", "signaling pathway", "signal transduction",
                "receptor antagonism", "enzyme inhibition", "inflammation resolution",
                "cyclooxygenase", "NF-κB", "NF-kB", "resolvin", "lipoxin"
            ]
            mech_terms = [t for t in analyzed_mechs if isinstance(t, str) and t.strip()][:8] or []
            if len(mech_terms) < 8:
                for gt in generic_terms:
                    if gt not in mech_terms:
                        mech_terms.append(gt)
                    if len(mech_terms) >= 8:
                        break
            candidates: list[str] = []
            for mt in mech_terms:
                if mol:
                    candidates.append(f'("{mol}"[tiab] AND ("{_quote(mt)}"[tiab]))')
                else:
                    candidates.append(f'("{_quote(request.objective)}"[tiab] AND ("{_quote(mt)}"[tiab]))')
            # De-duplicate against existing queries
            existing = {sec.get("query") for sec in results}
            cand = [q for q in candidates if q and q not in existing]
            # Issue fallbacks until we reach 3 sections or run out
            for fallback_query in cand:
                if len(results) >= 3:
                    break
                try:
                    output = await run_in_threadpool(agent_executor.run, fallback_query)
                    _metrics_inc("llm_calls_total", 1)
                except Exception as e:
                    output = f"Error running agent: {e}"
                # Fetch and score
                try:
                    pubmed_tool = PubMedSearchTool()
                    raw_articles = pubmed_tool._run(fallback_query)
                    _metrics_inc("pubmed_calls_total", 1)
                    import json as _json
                    articles = _json.loads(raw_articles) if isinstance(raw_articles, str) else (raw_articles or [])
                except Exception:
                    articles = []
                structured = ensure_json_response(output)
        pub_score = 0.0
        for a in articles:
            try:
                pub_score = max(pub_score, calculate_publication_score(a))
            except Exception:
                pass
        try:
            llm_conf = float(structured.get("confidence_score", 0))
        except Exception:
            llm_conf = 0.0
        overall = 0.6 * llm_conf + 0.4 * pub_score
        structured["publication_score"] = round(pub_score, 1)
        structured["overall_relevance_score"] = round(overall, 1)
        # Score and filter
        if articles:
            try:
                articles = sorted(articles, key=_score_article, reverse=True)
            except Exception:
                pass
            try:
                scores = [float(a.get("score", 0.0)) for a in articles]
                if scores:
                    mn, mx = min(scores), max(scores)
                    rng = (mx - mn) or 1.0
                    for a in articles:
                        a["score_norm"] = round((float(a.get("score", 0.0)) - mn) / rng, 3)
                    mol_l = (request.molecule or "").lower()
                    def eligible(a: dict) -> bool:
                        text_l = f"{a.get('title','')} {a.get('abstract','')}".lower()
                        mech_hits = a.get('score_breakdown', {}).get('mechanism_hits', 0) or 0
                        strong_mech = mech_hits >= 3 or ("mechanism of action" in text_l)
                        mech_flag = mech_hits > 0 or ("mechanism" in text_l) or any(m.lower() in text_l for m in (analyzed_mechs or []))
                        mol_flag = bool(mol_l) and (mol_l in text_l) if mol_l else True
                        # Loosen molecule requirement if mechanism evidence is strong
                        mol_or_strong_mech = mol_flag or strong_mech
                        return mol_or_strong_mech and mech_flag
                    filtered = [a for a in articles if a.get("score_norm", 0.0) >= 0.25 and eligible(a)]
                    if filtered:
                        articles = filtered
            except Exception:
                pass
                # Grounded summary only if we have articles
                top_article_payload = None
                if articles:
                    try:
                        mol_l = (request.molecule or "").lower()
                        moa_idx = None
                        for idx, aa in enumerate(articles):
                            title_l = (aa.get("title") or "").lower()
                            if ("mechanism of action" in title_l) and (not mol_l or mol_l in title_l):
                                moa_idx = idx
                                break
                        top = articles[moa_idx] if moa_idx is not None else articles[0]
                        abstract_text = top.get("abstract", "")
                        if abstract_text.strip():
                            memory_context = " | ".join(m.get("text", "")[:200] for m in memories) if memories else ""
                            grounded = await run_in_threadpool(summarization_chain.invoke, {
                                "objective": request.objective,
                                "abstract": abstract_text,
                                "memory_context": memory_context,
                            })
                            _metrics_inc("llm_calls_total", 1)
                            grounded_text = grounded.get("text", grounded) if isinstance(grounded, dict) else str(grounded)
                            try:
                                s_txt = grounded_text.replace("```json", "").replace("```JSON", "").replace("```", "") if "```" in grounded_text else grounded_text
                                obj = json.loads(s_txt)
                                if isinstance(obj, dict):
                                    structured["summary"] = obj.get("summary", structured.get("summary", "")).strip()
                                    structured["relevance_justification"] = obj.get("relevance_justification", structured.get("relevance_justification", "")).strip()
                            except Exception:
                                pass
                    except Exception:
                        pass
                    try:
                        top = max(articles, key=lambda a: float(a.get("citation_count", 0) or 0))
                        top_article_payload = {
                            "title": top.get("title"),
                            "pmid": top.get("pmid"),
                            "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                            "citation_count": top.get("citation_count"),
                            "pub_year": top.get("pub_year"),
                        }
                    except Exception:
                        top_article_payload = None
                if articles and top_article_payload:
                    try:
                        # Compute publication/overall scores and enforce relevance fields
                        try:
                            pub_score = calculate_publication_score({
                                "pub_year": top_article_payload.get("pub_year"),
                                "citation_count": top_article_payload.get("citation_count"),
                            })
                        except Exception:
                            pub_score = 0.0
                        try:
                            llm_conf = float(structured.get("confidence_score", 0))
                        except Exception:
                            llm_conf = 0.0
                        overall = 0.6 * llm_conf + 0.4 * pub_score
                        structured["publication_score"] = round(pub_score, 1)
                        structured["overall_relevance_score"] = round(overall, 1)
                        _ensure_relevance_fields(structured, request.molecule, request.objective, top_article_payload)
                    except Exception:
                        pass
                    results.append({
                        "query": fallback_query,
                        "result": structured,
                        "articles": articles,
                        "top_article": top_article_payload,
                        "source": "fallback",
                        "memories_used": len(memories or []),
                    })

            # Final review-only fallback to ensure 3 sections if still short
            if len(results) < target_sections:
                if mol:
                    review_query = f'("{mol}"[tiab] AND (mechanism[tiab] OR "mechanism of action"[tiab])) AND (review[pt] OR systematic[sb])'
                else:
                    review_query = f'("{_quote(request.objective)}"[tiab] AND (review[pt] OR systematic[sb]))'
                if review_query not in existing:
                    try:
                        output = await run_in_threadpool(agent_executor.run, review_query)
                        _metrics_inc("llm_calls_total", 1)
                    except Exception as e:
                        output = f"Error running agent: {e}"
                    try:
                        pubmed_tool = PubMedSearchTool()
                        raw_articles = pubmed_tool._run(review_query)
                        _metrics_inc("pubmed_calls_total", 1)
                        import json as _json
                        articles = _json.loads(raw_articles) if isinstance(raw_articles, str) else (raw_articles or [])
                    except Exception:
                        articles = []
                    structured = ensure_json_response(output)
                    pub_score = 0.0
                    for a in articles:
                        try:
                            pub_score = max(pub_score, calculate_publication_score(a))
                        except Exception:
                            pass
                    try:
                        llm_conf = float(structured.get("confidence_score", 0))
                    except Exception:
                        llm_conf = 0.0
                    overall = 0.6 * llm_conf + 0.4 * pub_score
                    structured["publication_score"] = round(pub_score, 1)
                    structured["overall_relevance_score"] = round(overall, 1)
                    if articles:
                        try:
                            articles = sorted(articles, key=_score_article, reverse=True)
                        except Exception:
                            pass
                        try:
                            scores = [float(a.get("score", 0.0)) for a in articles]
                            if scores:
                                mn, mx = min(scores), max(scores)
                                rng = (mx - mn) or 1.0
                                for a in articles:
                                    a["score_norm"] = round((float(a.get("score", 0.0)) - mn) / rng, 3)
                                mol_l = (request.molecule or "").lower()
                                def eligible(a: dict) -> bool:
                                    text_l = f"{a.get('title','')} {a.get('abstract','')}".lower()
                                    mech_hits = a.get('score_breakdown', {}).get('mechanism_hits', 0) or 0
                                    # Tighten mechanism specificity: require PD-1/PD-L1 or molecule mention, or strong mechanism hits
                                    pd_flag = ("pd-1" in text_l) or ("pd1" in text_l) or ("pd-l1" in text_l) or ("pdl1" in text_l)
                                    mol_flag = ((mol_l in text_l) if mol_l else True)
                                    mech_flag = (mech_hits >= 2) or ("mechanism of action" in text_l) or ("mechanism" in text_l)
                                    return (pd_flag or mol_flag) and mech_flag
                                # Final relaxation to 0.20 for review-only
                                filtered = [a for a in articles if a.get("score_norm", 0.0) >= 0.20 and eligible(a)]
                                if filtered:
                                    articles = filtered
                        except Exception:
                            pass
                    top_article_payload = None
                    if articles:
                        try:
                            top = max(articles, key=lambda a: float(a.get("citation_count", 0) or 0))
                            top_article_payload = {
                                "title": top.get("title"),
                                "pmid": top.get("pmid"),
                                "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                                "citation_count": top.get("citation_count"),
                                "pub_year": top.get("pub_year"),
                            }
                        except Exception:
                            top_article_payload = None
                    if articles and top_article_payload:
                        try:
                            _ensure_relevance_fields(structured, request.molecule, request.objective, top_article_payload)
                        except Exception:
                            pass
                        results.append({
                            "query": review_query,
                            "result": structured,
                            "articles": articles,
                            "top_article": top_article_payload,
                            "source": "fallback",
                            "memories_used": len(memories or []),
                        })
    except Exception as e:
        _metrics_inc("requests_errors", 1)
        log_event({"event": "generate_review_error", "error": str(e)[:300]})

    # If still no sections, run a relaxed single-query fallback to avoid empty UI
    if not results and (request.molecule or request.objective):
        try:
            base_mol = (request.molecule or "").strip()
            mech_term = (analyzed_mechs[0] if analyzed_mechs else "mechanism")
            if base_mol:
                fallback_q = f"tiab:({base_mol} AND ({mech_term} OR mechanism)) AND 2010:3000[dp]"
            else:
                fallback_q = (request.objective or "").strip()
            arts = await _run_pubmed_with_retry(fallback_q, attempts=2)
            if arts:
                # score and take top few
                try:
                    arts = sorted(arts, key=_score_article, reverse=True)[:8]
                except Exception:
                    arts = arts[:8]
                # choose top for header
                top = arts[0]
                top_article_payload = {
                    "title": top.get("title"),
                    "pmid": top.get("pmid"),
                    "url": top.get("url") or (f"https://pubmed.ncbi.nlm.nih.gov/{top.get('pmid')}/" if top.get('pmid') else ""),
                    "citation_count": top.get("citation_count"),
                    "pub_year": top.get("pub_year"),
                }
                # minimal structured result
                structured = {"summary": "", "confidence_score": 60, "methodologies": [], "publication_score": 0, "overall_relevance_score": 60}
                results.append({"query": fallback_q, "result": structured, "articles": arts[:3], "top_article": top_article_payload, "source": "fallback", "memories_used": len(memories or [])})
        except Exception:
            pass
    resp = {
        "molecule": request.molecule,
        "objective": request.objective,
        "project_id": request.project_id,
        "queries": queries,
        "results": results,
        "memories": memories,
    }
    # Cache response
    if ENABLE_CACHING and cache_key:
        try:
            obj_len = len((request.objective or "").split())
            ttl_hint = 300 if obj_len < 6 else (900 if obj_len < 20 else 1800)
            response_cache.set_with_ttl(cache_key, resp, ttl_hint)
        except Exception:
            pass
    # Latency metric and structured log
    took = _now_ms() - req_start
    _metrics_inc("latency_ms_sum", took)
    log_event({
        "event": "generate_review",
        "molecule": request.molecule,
        "objective": request.objective[:120],
        "sections": len(results),
        "latency_ms": took,
        "fallback_sections": sum(1 for r in results if r.get("source") == "fallback"),
    })
    return resp


@app.options("/generate-review")
async def preflight_generate_review() -> Response:
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })
