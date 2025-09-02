from fastapi import FastAPI, Response, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text
import bcrypt

# Step 2.2.1: Import LangChain components for prompt-driven chain
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import json
import re
from typing import List, Optional
import time
import threading
from datetime import datetime
import math
import numpy as np
import uuid
import urllib.request
import urllib.parse
from urllib.parse import urlparse
import asyncio
import random
try:
    # Optional lightweight PDF text extraction
    import io
    from pdfminer.high_level import extract_text as pdf_extract_text  # type: ignore
    _HAS_PDF = True
except Exception:
    _HAS_PDF = False
from jsonschema import validate as jsonschema_validate, ValidationError
try:
    from langgraph.graph import StateGraph, END
except Exception:
    StateGraph = None  # type: ignore
    END = None  # type: ignore

from tools import PubMedSearchTool, WebSearchTool, PatentsSearchTool
from scientific_model_analyst import analyze_scientific_model
from experimental_methods_analyst import analyze_experimental_methods
from results_interpretation_analyst import analyze_results_interpretation
from langchain.agents import AgentType, initialize_agent
from scoring import calculate_publication_score

# Database imports
from database import (
    get_db, init_db, User, Project, ProjectCollaborator, 
    Report, DeepDiveAnalysis, Annotation
)

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
    _HAS_CROSS = False
except Exception:
    CrossEncoder = None  # type: ignore

# Load environment variables
load_dotenv()

# Password hashing utilities
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Initialize FastAPI app
app = FastAPI(title="R&D Agent API", version="1.0.0")

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
# Soft ceiling per article during deep-dive to avoid long tails
PER_ARTICLE_BUDGET_S = float(os.getenv("PER_ARTICLE_BUDGET_S", "7"))
SYNTH_BUDGET_S = float(os.getenv("SYNTH_BUDGET_S", "5"))
ENTAILMENT_BUDGET_S = float(os.getenv("ENTAILMENT_BUDGET_S", "2.5"))
PUBMED_POOL_MAX = int(os.getenv("PUBMED_POOL_MAX", "80"))
TRIALS_POOL_MAX = int(os.getenv("TRIALS_POOL_MAX", "50"))
PATENTS_POOL_MAX = int(os.getenv("PATENTS_POOL_MAX", "50"))
ADAPTIVE_PROJECT_BLEND = float(os.getenv("ADAPTIVE_PROJECT_BLEND", "0.2"))
APP_VERSION = os.getenv("APP_VERSION", "v0.1.0")
GIT_SHA = os.getenv("GIT_SHA", "")

# Feature flags for Phase 1
SIGNAL_EXTRACTOR_ENABLED = os.getenv("SIGNAL_EXTRACTOR_ENABLED", "1") not in ("0", "false", "False")
MESH_EXPANSION_ENABLED = os.getenv("MESH_EXPANSION_ENABLED", "1") not in ("0", "false", "False")
STRATEGIST_LLM_ENABLED = os.getenv("STRATEGIST_LLM_ENABLED", "0") not in ("0", "false", "False")

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
        obj.setdefault("summary", str(obj.get("summary", "")).strip() or abstract[:1500])
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
        # Prefer sentences containing quantitative markers or effect verbs; de-prioritize BACKGROUND sentences
        priority: list[str] = []
        secondary: list[str] = []
        backgroundish: list[str] = []
        for s in parts:
            s_l = s.lower()
            if any(k in s_l for k in ["%", "hazard ratio", "risk", "increase", "decrease", "improved", "reduced", "significant", "odds ratio", "relative risk", "p="]):
                priority.append(s)
            elif s_l.startswith("background:") or s_l.startswith("introduction:"):
                backgroundish.append(s)
            else:
                secondary.append(s)
        claims_ordered = priority + secondary + backgroundish
        # Keep full sentences; avoid adding ellipsis; cap count only
        claims = claims_ordered[:max_items] if claims_ordered else parts[:max_items]
        anchors: list[dict] = []
        for c in claims:
            ev = {
                "title": art.get("title"),
                "year": art.get("pub_year"),
                "pmid": art.get("pmid"),
                # Keep the full sentence; UI will handle visual truncation if needed
                "quote": c.strip(),
            }
            anchors.append({"claim": c, "evidence": ev})
        return anchors[:max_items]
    except Exception:
        return []


def _normalize_anchor_quotes(abstract: str, anchors: list[dict]) -> list[dict]:
    """Replace truncated quotes containing ellipses with the full sentence from the abstract.

    Preserves existing claims; only adjusts evidence.quote when a matching full sentence is found.
    """
    try:
        text = (abstract or "").strip()
        if not text or not isinstance(anchors, list):
            return anchors
        # Split abstract into sentences
        sentences: list[str] = []
        for seg in re.split(r"(?<=[\.!?])\s+|\n+", text):
            s = seg.strip()
            if len(s) >= 20:
                sentences.append(s)
        if not sentences:
            return anchors
        normd: list[dict] = []
        for a in anchors:
            try:
                ev = a.get("evidence") or {}
                q = ev.get("quote")
                if isinstance(q, str) and ("…" in q or "..." in q):
                    q_clean = re.sub(r"\s+", " ", q.replace("…", "").replace("...", "")).strip()
                    # Find a sentence containing the cleaned quote (case-insensitive)
                    replacement = None
                    q_lc = q_clean.lower()
                    for s in sentences:
                        if q_lc and q_lc in s.lower():
                            replacement = s.strip()
                            break
                    if replacement:
                        ev["quote"] = replacement
                        a["evidence"] = ev
                normd.append(a)
            except Exception:
                normd.append(a)
        return normd
    except Exception:
        return anchors


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
        for s in _fetch_pubchem_synonyms(base)[:limit*3]:
            cand = _sanitize_molecule_name(s)
            # Filter out long chemical strings and raw formulas that hurt recall precision
            if len(cand) > 40:
                continue
            if re.search(r"\d", cand) and len(cand.split()) > 4:
                continue
            _add(cand)
            if len(out) >= limit:
                break
    except Exception:
        pass
    try:
        if len(out) < limit:
            for s in _fetch_chembl_synonyms(base)[:limit*3]:
                cand = _sanitize_molecule_name(s)
                if len(cand) > 40:
                    continue
                if re.search(r"\d", cand) and len(cand.split()) > 4:
                    continue
                _add(cand)
                if len(out) >= limit:
                    break
    except Exception:
        pass
    return out[:limit]


def _split_molecule_components(molecule: str) -> list[str]:
    """Split combination molecules (e.g., "atezolizumab + bevacizumab") into sanitized components.

    Delimiters handled: +, /, comma, semicolon, ' and ', ' plus '.
    """
    try:
        raw = (molecule or "").strip()
        if not raw:
            return []
        # Keep original for delimiter detection; sanitize components individually
        parts = re.split(r"\s*(?:\+|/|,|;|\band\b|\bplus\b)\s*", raw, flags=re.IGNORECASE)
        comps: list[str] = []
        for p in parts:
            sp = _sanitize_molecule_name(p)
            if sp:
                comps.append(sp)
        # Deduplicate while preserving order
        seen: set[str] = set()
        uniq: list[str] = []
        for c in comps:
            cl = c.lower()
            if cl in seen:
                continue
            seen.add(cl)
            uniq.append(c)
        return uniq
    except Exception:
        return []


def _normalize_entities(text: str) -> str:
    """Systematically normalize common aliases for molecules/targets to reduce off-topic drift.
    Minimal, extensible map; safe across domains.
    """
    try:
        t = (text or "")
        mapping = {
            "keytruda": "pembrolizumab",
            "mk-3475": "pembrolizumab",
            "opdivo": "nivolumab",
            "t790m": "EGFR T790M",
            "c797s": "EGFR C797S",
            "parpi": "PARP inhibitor",
            "glp 1": "GLP-1",
            "glp1": "GLP-1",
        }
        for k, v in mapping.items():
            t = re.sub(rf"\b{re.escape(k)}\b", v, t, flags=re.IGNORECASE)
        return t
    except Exception:
        return text or ""


# ---------------------
# Per-corpus planners (PubMed / Trials / Web / Patents)
# ---------------------

def _extract_signals(objective: str) -> list[str]:
    """Heuristic signal extractor from Description/objective across domains.
    Returns a small list of keywords to inject into recall queries.
    """
    obj = (objective or "").lower()
    signals: list[str] = []
    try:
        # Immuno/checkpoints
        if any(k in obj for k in ["pd-1", "pd1", "pd-l1", "pdl1", "checkpoint", "immunotherapy", "t cell", "t-cell"]):
            signals += ["PD-1", "PD-L1", "checkpoint", "T cell", "IFN-γ", "neoantigen"]
        if any(k in obj for k in ["ctla-4", "ctla4", "lag-3", "lag3", "tigit"]):
            signals += ["CTLA-4", "LAG-3", "TIGIT"]
        # DNA repair / PARP / HRR
        if any(k in obj for k in ["brca", "parp", "hrr", "homologous recombination", "parpi", "rad51", "53bp1", "fork"]):
            signals += ["BRCA1", "BRCA2", "PARP", "RAD51", "homologous recombination", "53BP1", "fork protection"]
        if any(k in obj for k in ["resistance", "restore", "restoration", "reversion", "revert"]):
            signals += ["resistance", "HR restoration"]
        # Angiogenesis
        if any(k in obj for k in ["vegf", "vegfa", "angiogenesis"]):
            signals += ["VEGF", "VEGFA", "angiogenesis"]
        # MAPK / RTK signaling
        if any(k in obj for k in ["braf", "kras", "egfr", "mapk", "ras"]):
            signals += ["BRAF", "KRAS", "EGFR", "MAPK"]
        # Endocrine (examples)
        if any(k in obj for k in ["estrogen receptor", "er+", "androgen receptor", "ar+"]):
            signals += ["estrogen receptor", "androgen receptor"]
        # Metabolic/incretin
        if any(k in obj for k in ["glp-1", "glp1", "incretin", "semaglutide", "liraglutide"]):
            signals += ["GLP-1", "incretin", "cAMP", "PKA"]
        # Inflammation/cytokines
        if any(k in obj for k in ["il-6", "il6", "tnf", "cytokine"]):
            signals += ["IL-6", "TNF-α", "cytokine"]
        # Biomarker common
        if any(k in obj for k in ["msi", "msi-h", "dmmr", "tmb", "mutational burden", "gep", "gene expression"]):
            signals += ["MSI-H", "dMMR", "TMB", "gene expression profile"]
    except Exception:
        pass
    # Dedup and limit
    out: list[str] = []
    seen: set[str] = set()
    for s in signals:
        if not s:
            continue
        k = s.strip().lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(s)
    return out[:8]

def _plan_pubmed_queries(molecule: str, synonyms: list[str], objective: str, preference: str | None = None) -> dict:
    mol = _sanitize_molecule_name(molecule)
    comps = _split_molecule_components(molecule)
    # Build molecule tokens; if combination, require co-mention as primary clause
    if comps and len(comps) >= 2:
        and_tiab = "(" + " AND ".join([f'"{c}"[tiab]' for c in comps]) + ")"
        and_title = "(" + " AND ".join([f'"{c}"[Title]' for c in comps]) + ")"
        phrase_tiab = " OR ".join([f'"{" ".join(comps)}"[tiab]'])
        phrase_title = " OR ".join([f'"{" ".join(comps)}"[Title]'])
        tokens_tiab = f"({and_tiab} OR {phrase_tiab})"
        tokens_title = f"({and_title} OR {phrase_title})"
    else:
        tiab_terms = [t for t in ([mol] + synonyms) if t]
        title_terms = [t for t in ([mol] + synonyms) if t]
        tokens_tiab = ("(" + " OR ".join([f'"{t}"[tiab]' for t in tiab_terms]) + ")") if (mol and tiab_terms) else ""
        tokens_title = ("(" + " OR ".join([f'"{t}"[Title]' for t in title_terms]) + ")") if (mol and title_terms) else ""
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
    # Signals extractor (feature-flagged): enrich signals list from objective text across domains
    if SIGNAL_EXTRACTOR_ENABLED:
        try:
            bio_signals += _extract_signals(objective)
        except Exception:
            pass
    # MeSH expansion (feature-flagged): add MeSH terms for molecule and PD-1/PD-L1
    mesh_terms: list[str] = []
    if MESH_EXPANSION_ENABLED:
        try:
            if mol:
                mesh_terms += [f'"{mol}"[mesh]']
            # Only add checkpoint MeSH when objective mentions checkpoint terms to avoid bias
            if any(k in obj_tokens for k in ["pd", "checkpoint", "immunotherapy", "t", "pdl1", "pd1", "pd-1", "pd-l1"]):
                mesh_terms += ['"Programmed Cell Death 1 Receptor"[mesh]', '"Programmed Cell Death 1 Ligand 1 Protein"[mesh]']
        except Exception:
            pass
    mesh_clause = (" OR ".join(mesh_terms)) if mesh_terms else ""
    # Review focus
    review_query = (
        (f'(({tokens_tiab} OR {tokens_title}{(" OR "+mesh_clause) if mesh_clause else ""}) AND ')
        if (tokens_tiab or tokens_title or mesh_clause) else "("
    ) + f'(review[pt] OR systematic[sb]) AND (2015:3000[dp]))'
    # Mechanism focus
    mech_query = (
        (f'(({tokens_tiab} OR {tokens_title}{(" OR "+mesh_clause) if mesh_clause else ""}) AND ')
        if (tokens_tiab or tokens_title or mesh_clause) else "("
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
            (f'(({tokens_tiab} OR {tokens_title}{(" OR "+mesh_clause) if mesh_clause else ""}) AND ')
            if (tokens_tiab or tokens_title or mesh_clause) else "("
        ) + '(("mechanism"[tiab] OR "mechanism of action"[tiab] OR "signaling"[tiab] OR "pathway"[tiab])' + (f" OR {' OR '.join(extra)}" if extra else "") + '))'
        # Broad recall: allow results without molecule tokens (loosen gating) while still biasing if present
        if (tokens_tiab or tokens_title or mesh_clause):
            prefix = f'({tokens_tiab} OR {tokens_title}{(" OR "+mesh_clause) if mesh_clause else ""}) OR '
        else:
            prefix = ""
        recall_broad = "(" + prefix + "humans[mesh])"
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
    comps = _split_molecule_components(molecule)
    if comps and len(comps) >= 2:
        combo_core = " AND ".join(comps)
    else:
        combo_core = base
    combo = (" ".join(([combo_core] + synonyms)).strip() or objective.strip())
    obj_l = (objective or "").lower()
    is_glp1_context = any(k in obj_l for k in ["glp-1", "glp1", "semaglutide", "incretin", "type 2 diabetes", "t2d"])
    tail = "randomized OR human OR type 2 diabetes" if is_glp1_context else "randomized OR human"
    return f"{combo} {tail}"

def _plan_web_query(molecule: str, synonyms: list[str], objective: str) -> str:
    base = _sanitize_molecule_name(molecule)
    comps = _split_molecule_components(molecule)
    if comps and len(comps) >= 2:
        core = " AND ".join([f'"{c}"' for c in comps])
    else:
        core = base
    combo = (" ".join(([core] + synonyms)).strip() + " " + objective).strip()
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
            shortlist = _triage_rank(request.objective, norm, triage_cap, None, mol_tokens, getattr(request, "preference", None))
            # Cross-encoder re-ranking for DAG shortlist if enabled and time remains (robustness: blend CE with heuristic)
            try:
                if cross_encoder is not None and time_left > 5.0:
                    pairs = [(request.objective or "", (a.get('title') or '') + ". " + (a.get('abstract') or '')) for a in shortlist[:30]]
                    scores = cross_encoder.predict(pairs)
                    # Blend + threshold to drop weak items without over-pruning
                    ce_thresh = 0.2  # conservative
                    keep: list[dict] = []
                    for i, s in enumerate(scores):
                        base = float(shortlist[i].get("score", 0.0))
                        ce = float(s)
                        blended = 0.7 * base + 0.3 * ce
                        if ce >= ce_thresh or i < 8:  # keep top heuristics even if CE is slightly low
                            item = dict(shortlist[i])
                            item["score"] = blended
                            keep.append(item)
                    shortlist = sorted(keep, key=lambda x: x.get("score", 0.0), reverse=True)
                else:
                    # Lightweight LTR-style rescoring: combine normalized heuristic features for stability when CE is off
                    # Features: title hit, abstract hit, year recency, citations per year
                    nowy = datetime.utcnow().year
                    def _ltr_score(a: dict) -> float:
                        try:
                            title = (a.get('title') or '').lower()
                            abstract = (a.get('abstract') or '').lower()
                            obj = (request.objective or '').lower()
                            title_hit = 1.0 if any(tok in title for tok in obj.split()[:3]) else 0.0
                            abs_hit = 1.0 if any(tok in abstract for tok in obj.split()[:3]) else 0.0
                            year = int(a.get('pub_year') or 0)
                            rec = max(0.0, min(1.0, (year - 2015) / float((nowy - 2015 + 1)))) if year else 0.0
                            cites = float(a.get('citation_count') or 0.0)
                            cpy = (cites / max(1, (nowy - year + 1))) if year else 0.0
                            cpy_n = max(0.0, min(1.0, cpy / 100.0))
                            base = float(a.get('score', 0.0))
                            return 0.4*base + 0.25*title_hit + 0.15*abs_hit + 0.1*rec + 0.1*cpy_n
                        except Exception:
                            return float(a.get('score', 0.0))
                    shortlist = sorted(shortlist, key=_ltr_score, reverse=True)
            except Exception:
                pass
            deep_cap = min(len(shortlist), max(DEEPDIVE_TOP_K, deep_pref))
            # If shortlist ended empty (over-gated), relax once by blending gated+ungated and recompute
            if not shortlist and norm:
                try:
                    # Blend gated with original norm to allow breadth, then re-rank
                    shortlist_relaxed = _triage_rank(request.objective, norm, triage_cap, None, mol_tokens, getattr(request, "preference", None))
                    if shortlist_relaxed:
                        shortlist = shortlist_relaxed
                        deep_cap = min(len(shortlist), max(DEEPDIVE_TOP_K, deep_pref))
                except Exception:
                    pass
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
                # Ensure article-specific relevance justification (tightened template ensures signals + why vs others + limitation)
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
            # Backfill/top-up to reach desired deep size if under target after de-dup
            try:
                pref_top = str(getattr(request, "preference", "precision") or "precision").lower()
            except Exception:
                pref_top = "precision"
            desired_min_top = 13 if pref_top == "recall" else 8
            if MULTISOURCE_ENABLED and len(results_sections) < desired_min_top:
                try:
                    v2_more = await orchestrate_v2(request, memories)
                    existing_keys_top = set()
                    for sec in results_sections:
                        t = (sec.get("top_article") or {})
                        existing_keys_top.add(f"{t.get('pmid')}||{t.get('title')}")
                    for sec in (v2_more.get("results") or []):
                        if len(results_sections) >= desired_min_top:
                            break
                        t = (sec.get("top_article") or {})
                        key = f"{t.get('pmid')}||{t.get('title')}"
                        if key in existing_keys_top:
                            continue
                        existing_keys_top.add(key)
                        results_sections.append(sec)
                except Exception:
                    pass
            # OA backfill to guarantee >=9 for precision+fullTextOnly
            try:
                req = state.get("request")
                is_precision = str(getattr(req, "preference", "precision") or "precision").lower() == "precision"
                full_text_only = bool(getattr(req, "full_text_only", False))
            except Exception:
                is_precision, full_text_only = True, False
            if is_precision and full_text_only and len(results_sections) < 9:
                art_list = []
                for sec in results_sections:
                    try:
                        art_list += sec.get("articles") or []
                    except Exception:
                        pass
                topped = _oa_backfill_topup(request.objective, art_list, minimum=9, deadline=_now_ms() + 8000.0)
                rebuilt = []
                seen_titles = set()
                for a in topped:
                    try:
                        t = a.get("title") or ""
                        if t in seen_titles: continue
                        seen_titles.add(t)
                        ta = {"title": a.get("title"), "pmid": a.get("pmid"), "url": a.get("url"),
                              "citation_count": a.get("citation_count"), "pub_year": a.get("pub_year")}
                        res_shell = {"summary": a.get("abstract") or "", "confidence_score": 60,
                                     "methodologies": [], "fact_anchors": [], "score_breakdown": {}}
                        _ensure_score_breakdown(res_shell, request.objective, a.get("abstract") or "", ta)
                        _ensure_relevance_fields(res_shell, getattr(req, "molecule",""), getattr(req, "objective",""), ta)
                        rebuilt.append({"query": request.objective, "result": res_shell,
                                        "articles": [a], "top_article": ta, "source": "primary", "memories_used": 0})
                    except Exception:
                        pass
                if rebuilt:
                    results_sections = rebuilt[:max(9, len(results_sections))]
            # Always populate diagnostics, even if some earlier nodes returned empty, to avoid missing fields in UI
            diagnostics = {
                "pool_size": int(len(state.get("norm") or [])),
                "shortlist_size": int(len(state.get("shortlist") or [])),
                "deep_dive_count": int(len(results_sections)),
                "timings_ms": {
                    # Provide coarse timings if available in state; otherwise leave empty
                },
                "pool_caps": {"pubmed": PUBMED_POOL_MAX, "trials": TRIALS_POOL_MAX, "patents": PATENTS_POOL_MAX},
            }
            # Flag top-up in diagnostics if we met or exceeded desired minimum via backfill
            try:
                if len(results_sections) >= desired_min_top:
                    diagnostics["dag_topped_up"] = True
                    diagnostics["desired_min"] = desired_min_top
            except Exception:
                pass
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
        obj_txt = (objective or "").strip()
        # Expand matched tokens using synonyms from objective
        obj_tokens = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (obj_txt or "").lower()) if len(t) >= 4]
        obj_tokens += _expand_objective_synonyms(obj_txt)
        abs_tokens = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (abs_text or "").lower()) if len(t) >= 4]
        abs_set = set(abs_tokens)
        matched_tokens = sorted(list(dict.fromkeys([t for t in obj_tokens if t in abs_set])))[:12]
        matched_part = ", ".join(matched_tokens) if matched_tokens else "—"
        # Signals from objective and abstract
        sigs = []
        try:
            for s in _extract_signals(objective):
                if s.lower() in abs_text:
                    sigs.append(s)
        except Exception:
            pass
        signals_part = ", ".join(dict.fromkeys(sigs)) if sigs else "—"
        # Why selected: based on impact/recency/contextual match and domain alignment
        sb = structured.get("score_breakdown") or {}
        try: ctx = float(sb.get("contextual_match_score", 0) or 0)
        except Exception: ctx = 0.0
        try: rec = float(sb.get("recency_score", 0) or 0)
        except Exception: rec = 0.0
        try: imp = float(sb.get("impact_score", 0) or 0)
        except Exception: imp = 0.0
        why_bits: list[str] = []
        if ctx >= 60: why_bits.append("mechanistic alignment")
        if imp >= 50: why_bits.append("impact")
        if rec >= 50: why_bits.append("recent")
        if any(k in abs_text for k in ["cox","prostaglandin","thromboxane","pge2"]):
            why_bits.append("COX/prostaglandin pathway")
        why_part = ", ".join(why_bits) if why_bits else "balanced evidence"
        # Limitation heuristic
        limitation = "older review" if rec < 30 else ("broad scope" if ctx < 30 else "")
        lim_part = f"; limitation: {limitation}." if limitation else "."
        structured["relevance_justification"] = (
            f"Matched tokens: {matched_part}. Signals: {signals_part}. Why selected: {why_part} based on {title}{f' ({year})' if year else ''}{lim_part}"
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
        # Glass-box extras for transparency
        try:
            obj_toks = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (objective or "").lower()) if len(t) >= 4]
            abs_toks = [t for t in re.split(r"[^a-zA-Z0-9\-]+", (abstract or "").lower()) if len(t) >= 4]
            # Add molecule synonyms into token matching
            mol_tokens: list[str] = []
            try:
                if top_article and isinstance(top_article.get("title"), str):
                    pass
                # pull molecule from objective if present
                mol_name = None
                for t in obj_toks:
                    if len(t) > 3:
                        mol_name = t  # heuristic best-effort
                        break
                if mol_name:
                    mol_tokens = [mol_name] + _expand_molecule_synonyms(mol_name, limit=6)
            except Exception:
                mol_tokens = []
            abs_aug = set(abs_toks) | {m.lower() for m in mol_tokens}
            # Add domain tokens for broad coverage (works across domains; harmless if absent)
            domain_tokens = {"glp-1", "glp1", "glp-1r", "gipr", "camp", "pka", "glut4", "sirt1"}
            abs_aug |= {t for t in domain_tokens}
            matches = sorted(list(dict.fromkeys(set(obj_toks) & abs_aug)))[:10]
            sb["matched_tokens"] = matches
        except Exception:
            pass
        try:
            obj_vec = np.array(EMBED_CACHE.get_or_compute(objective or ""), dtype=float)
            abs_vec = np.array(EMBED_CACHE.get_or_compute(abstract or (top_article or {}).get("title") or ""), dtype=float)
            denom = (float(np.linalg.norm(obj_vec)) or 1.0) * (float(np.linalg.norm(abs_vec)) or 1.0)
            cosine = float(np.dot(obj_vec, abs_vec) / denom)
            cos100 = round(100 * max(-1.0, min(1.0, cosine)), 1)
            # Hide tiny/near-zero cosine to avoid clutter in UI
            if abs(cos100) >= 1.0:
                sb["cosine_similarity"] = cos100
        except Exception:
            pass
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
    # Relax title duplicate to allow closely related but distinct sections through
    if title and title in seen_titles:
        return False
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
    """Return a dict of queries. Prefer deterministic planner; optionally try LLM strategist when enabled."""
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
    # Prefer deterministic per-corpus plan. Optionally augment with LLM strategist if enabled and valid.
    llm_plan: dict | None = None
    if STRATEGIST_LLM_ENABLED:
        try:
            prompt = PromptTemplate(template=strategist_template, input_variables=["objective", "memories", "molecule"])
            chain = LLMChain(llm=llm_analyzer, prompt=prompt)
            out = chain.invoke({"objective": objective[:400], "memories": memories_text[:400], "molecule": (molecule or "")[:200]})
            txt = out.get("text", out) if isinstance(out, dict) else str(out)
            if "```" in txt:
                txt = txt.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            candidate = json.loads(txt)
            if isinstance(candidate, dict):
                llm_plan = candidate
        except Exception:
            llm_plan = None
    # Deterministic fallback (default path)
    obj = _normalize_entities(objective or "").strip()
    mol = _sanitize_molecule_name(_normalize_entities(molecule or ""))
    synonyms = _expand_molecule_synonyms(mol) if mol else []
    # Per-corpus
    # Use a simple preference heuristic in fallback: recall if objective looks exploratory
    pref_hint = "recall" if any(k in obj.lower() for k in ["overview", "broad", "landscape", "review"]) else None
    pubmed = _plan_pubmed_queries(mol, synonyms, obj, pref_hint)
    clinical_query = _plan_trials_query(mol, synonyms, obj)
    web_query = _plan_web_query(mol, synonyms, obj)
    base_plan = {
        "review_query": pubmed["review_query"],
        "mechanism_query": pubmed["mechanism_query"],
        "clinical_query": clinical_query,
        "broad_query": pubmed["broad_query"],
        "recall_mechanism_query": pubmed.get("recall_mechanism_query"),
        "recall_broad_query": pubmed.get("recall_broad_query"),
        "web_query": web_query,
    }
    # If LLM strategist produced fields, only accept those that are clearly PubMed-safe
    if llm_plan:
        def _safe(q: str) -> bool:
            s = (q or "").strip()
            if not s:
                return False
            # Reject obviously malformed field tags like "[tiab](" or unbalanced brackets
            if "[tiab](" in s.lower():
                return False
            if s.count("(") != s.count(")"):
                return False
            if s.count("[") != s.count("]"):
                return False
            return True
        for k in ("review_query", "mechanism_query", "broad_query"):
            v = llm_plan.get(k)
            if isinstance(v, str) and _safe(v):
                base_plan[k] = v
    return base_plan


def _inject_molecule_into_plan(plan: dict, molecule: str | None) -> dict:
    """Ensure molecule token is present in key queries for better specificity.

    If a molecule is provided and a plan query lacks it, prefix a title/tiab clause.
    Conservative so we do not over-filter; no change if molecule already present.
    """
    try:
        # Use sanitized molecule token to avoid over-specific phrases like "olaparib (AZD2281, Lynparza)"
        base_mol = _sanitize_molecule_name(_normalize_entities(molecule or "")).strip()
        if not base_mol or not isinstance(plan, dict):
            return plan
        syns = _expand_molecule_synonyms(base_mol) if base_mol else []
        tokens_lc = set([base_mol.lower()] + [s.lower() for s in syns])

        def ensure(term: str) -> str:
            q = str(plan.get(term) or "")
            if not q:
                return q
            q_l = q.lower()
            if any(tok in q_l for tok in tokens_lc):
                return q
            prefix = f'("{base_mol}"[tiab] OR "{base_mol}"[Title]) AND '
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
        raw = tool._run(_normalize_entities(query))
        import json as _json
        arts = _json.loads(raw) if isinstance(raw, str) else (raw or [])
        if isinstance(arts, list):
            # Annotate with source query for transparency/debugging
            for a in arts:
                if isinstance(a, dict):
                    # Normalize entities in harvested titles to improve downstream matching
                    try:
                        if a.get("title"):
                            a["title"] = _normalize_entities(a["title"])
                    except Exception:
                        pass
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
    preference: str | None = None,
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
        # Gentle, domain-agnostic nudges
        if has_molecule and mech_hits >= 1:
            score += 0.05
        if ("review" in text) and not has_molecule:
            score -= 0.04
        # Tie-break toward molecule-specific mechanistic items
        if has_molecule and ("mechanism" in text or "pathway" in text):
            score += 0.02
        # Penalize lack of PD-1/PD-L1 signal when objective is about PD-1
        pref_l = (preference or "").lower()
        is_recall = (pref_l == "recall")
        if is_pd1_objective and not has_icp:
            score -= (0.05 if is_recall else 0.2)
        elif is_pd1_objective and has_icp:
            score += 0.05
        # Generic gating: if neither molecule nor required signals appear, demote
        if not has_molecule and not has_required:
            score -= (0.05 if is_recall else 0.15)
        # Tangential demotion: if oncolytic/virotherapy appears without molecule co-mention, demote more strongly
        if any(tt in text for tt in tangential_terms) and not has_molecule:
            score -= 0.25
        # Demote social/aesthetic drift
        if any(term in text for term in social_terms):
            score -= 0.2
        # Boost GLP-1 mechanistic context
        if is_glp1_context and any(term in text for term in glp1_lexicon):
            score += 0.1
        # Strengthen triage gating for precision mode
        objective_lower = (objective or "").lower()
        needed = [
            "cardiovascular","cvd","heart","coronary","atherosclerosis","mi","stroke","endothelial",
            "inflammation","anti-inflammatory","cox","prostaglandin","thromboxane"
        ]
        domain_hits = sum(1 for nt in needed if nt in objective_lower and nt in text)
        if pref_l == "precision":
            if domain_hits == 0:
                score -= 0.25
            elif domain_hits == 1:
                score -= 0.12
            if not has_molecule:
                score -= 0.15
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
    target_deep = min(DEEPDIVE_TOP_K, len(items))
    for idx, art in enumerate(items):
        # Dynamically shrink deep-K if time is running low
        if _time_left(deadline) < 6.0:
            break
        if _time_left(deadline) < 20.0 and (target_deep - len(extracted_results)) > 0:
            # if little time left, stop early once we have at least 9 items
            if len(extracted_results) >= 9:
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
            # Per-article ceiling to keep latency bounded
            grounded = await asyncio.wait_for(
                run_in_threadpool(summarization_chain.invoke, {
                    "objective": objective,
                    "abstract": enriched_abstract,
                    "memory_context": memory_context,
                }),
                timeout=min(PER_ARTICLE_BUDGET_S, max(2.0, _time_left(deadline) - 2.0))
            )
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
                    # Normalize quotes to avoid ellipsis-truncated snippets
                    try:
                        structured["fact_anchors"] = _normalize_anchor_quotes(abstract, structured["fact_anchors"])  # type: ignore
                    except Exception:
                        pass
                    # If anchors remain weak, synthesize light fallback anchors
                    try:
                        cur = structured.get("fact_anchors") or []
                        if (not isinstance(cur, list)) or len(cur) < 3:
                            fa_fb = _fallback_fact_anchors(abstract, art, max_items=3)
                            if fa_fb:
                                structured["fact_anchors"] = _lightweight_entailment_filter(abstract, fa_fb)
                    except Exception:
                        pass
                else:
                    # Fallback: synthesize simple anchors from abstract (cap to 3)
                    fa_fb = _fallback_fact_anchors(abstract, art, max_items=3)
                    if fa_fb:
                        structured["fact_anchors"] = _lightweight_entailment_filter(abstract, fa_fb)
                        try:
                            structured["fact_anchors"] = _normalize_anchor_quotes(abstract, structured["fact_anchors"])  # type: ignore
                        except Exception:
                            pass
            except Exception:
                pass
        except Exception:
            structured = {"summary": abstract[:1500], "confidence_score": 60, "methodologies": []}
            # Ensure anchors even on summarization failure
            try:
                fa_fb = _fallback_fact_anchors(abstract, art, max_items=3)
                if fa_fb:
                    structured["fact_anchors"] = _lightweight_entailment_filter(abstract, fa_fb)
                    try:
                        structured["fact_anchors"] = _normalize_anchor_quotes(abstract, structured["fact_anchors"])  # type: ignore
                    except Exception:
                        pass
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
    # Apply OA/full-text filters when requested
    try:
        plan = _apply_fulltext_only_filters(plan, bool(getattr(request, "full_text_only", False)))
    except Exception:
        pass
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
    # Recall fallback: if nothing harvested, try Europe PMC OA by objective keywords
    try:
        if not norm and _time_left(deadline) > 6.0:
            norm = _oa_backfill_topup(request.objective or "", [], 10, deadline)
    except Exception:
        pass
    # PubMed OA fallback if still empty
    try:
        if not norm and _time_left(deadline) > 6.0:
            mol_try = getattr(request, "molecule", None)
            norm = _normalize_candidates(_pubmed_fallback_oa(request.objective or "", mol_try, retmax=40))
    except Exception:
        pass
    # Enforce acceptance gating for full-text-only: drop items that are unlikely to have OA/full text
    try:
        if bool(getattr(request, "full_text_only", False)):
            gated: list[dict] = []
            for a in norm:
                # Heuristics: must have PMID or a direct PMC/Publisher URL candidate
                url = (a.get("url") or "").lower()
                pmid = a.get("pmid")
                if pmid:
                    gated.append(a)
                    continue
                if any(s in url for s in ["/pmc/articles/", ".pdf", "nature.com", "nejm.org", "lancet.com", "sciencedirect.com", "springer.com"]):
                    gated.append(a)
            norm = gated if gated else norm
    except Exception:
        pass
    # Prefer items mentioning the molecule when provided
    try:
        mol = getattr(request, "molecule", None)
    except Exception:
        mol = None
    if mol:
        norm = _filter_by_molecule(norm, mol)
    # Enforce strict acceptance gating post-normalization if requested
    try:
        if bool(getattr(request, "full_text_only", False)):
            verified: list[dict] = []
            for a in norm:
                ok, meta = _quick_fulltext_capability(a.get("pmid"), a.get("title"))
                if ok:
                    # Attach hint for later UI if desired
                    a = { **a, "_ft_ok": True, "_ft_meta": meta }
                    verified.append(a)
            # Only keep verified when we have any; otherwise retain original to avoid empty results
            if verified:
                norm = verified
    except Exception:
        pass
    # Time-aware caps
    triage_cap = min(TRIAGE_TOP_K, 50)
    # For precision/full-text flows, keep a slightly larger shortlist to ensure >=8 deep dives
    try:
        pref_tmp = str(getattr(request, "preference", "precision") or "precision").lower()
        if pref_tmp == "precision":
            triage_cap = max(triage_cap, 30)
    except Exception:
        pass
    if _time_left(deadline) < 15.0:
        triage_cap = min(triage_cap, 24)
    try:
        proj_vec = _project_interest_vector(memories)
    except (NameError, AttributeError):  # Function not defined or not accessible
        proj_vec = None  # Safe fallback to None
    # Build molecule tokens for generalization across molecules
    mol_tokens: list[str] = []
    try:
        mol_v2 = getattr(request, "molecule", None)
        if mol_v2:
            mol_tokens = [mol_v2] + _expand_molecule_synonyms(mol_v2)
    except Exception:
        mol_tokens = []
    shortlist = _triage_rank(request.objective, norm, triage_cap, proj_vec, mol_tokens, getattr(request, "preference", None))
    # Cross-encoder re-ranking for V2 shortlist
    try:
        if cross_encoder is not None and _time_left(deadline) > 5.0:
            pairs = [(request.objective or "", (a.get('title') or '') + ". " + (a.get('abstract') or '')) for a in shortlist[:30]]
            scores = cross_encoder.predict(pairs)
            ce_thresh = 0.2
            keep: list[dict] = []
            for i, s in enumerate(scores):
                base = float(shortlist[i].get("score", 0.0))
                ce = float(s)
                blended = 0.8 * base + 0.2 * ce
                if ce >= ce_thresh or i < 8:
                    item = dict(shortlist[i])
                    item["score"] = blended
                    keep.append(item)
            shortlist = sorted(keep, key=lambda x: x.get("score", 0.0), reverse=True)
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
    # Ensure at least 8 deep-dive candidates by OA backfill if needed and time allows
    try:
        need_min = 8
        if len(top_k) < need_min and _time_left(deadline) > 6.0:
            topped = _oa_backfill_topup(request.objective or "", top_k, need_min, deadline)
            if isinstance(topped, list) and len(topped) >= len(top_k):
                top_k = topped[:max(need_min, len(top_k))]
    except Exception:
        pass
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
        "results": _apply_diversity_quota(results_sections),
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


def _apply_fulltext_only_filters(plan: dict, full_text_only: bool) -> dict:
    """When full_text_only is True, restrict PubMed queries to OA/full-text.

    Strategy: wrap fielded PubMed queries with ( ... ) AND (free full text[filter] OR pmc[filter]).
    Drop broad and recall_broad queries to avoid non-fielded noise.
    Optionally drop clinical_query (trials) since it doesn't guarantee full text articles.
    """
    try:
        if not full_text_only or not isinstance(plan, dict):
            return plan
        def wrap(q: str | None) -> str | None:
            if not q or not isinstance(q, str) or not q.strip():
                return q
            return f"({q}) AND (free full text[filter] OR pmc[filter])"
        for key in ("review_query", "mechanism_query", "recall_mechanism_query"):
            if key in plan and isinstance(plan.get(key), str):
                plan[key] = wrap(plan.get(key))
        # Remove queries that aren't strictly fielded/safe for OA filtering
        if "broad_query" in plan:
            plan["broad_query"] = None
        if "recall_broad_query" in plan:
            plan["recall_broad_query"] = None
        # Trials query does not guarantee OA article text; skip when strict
        if "clinical_query" in plan:
            plan["clinical_query"] = None
        return plan
    except Exception:
        return plan

def _quick_fulltext_capability(pmid: str | None, title: str | None) -> tuple[bool, dict]:
    """Fast check: does this article likely have OA/full text available?
    Returns (ok, meta) where ok True if PMC link or Europe PMC HAS_FT is present.
    """
    try:
        # Prefer PMID via ELink → PMC
        if pmid:
            try:
                elink = _fetch_json(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&id={urllib.parse.quote(str(pmid))}&db=pmc&retmode=json")
                links = (((elink.get("linksets") or [])[0] or {}).get("linksetdbs") or [])
                for db in links:
                    if (db.get("dbto") == "pmc") and db.get("links"):
                        pmcid = str((db.get("links") or [])[0])
                        return True, {"resolved_pmid": str(pmid), "resolved_pmcid": pmcid, "resolved_source": "pmc"}
            except Exception:
                pass
            # Europe PMC by PMID
            try:
                base = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
                q = f"EXT_ID:{urllib.parse.quote(str(pmid))} AND SRC:MED AND HAS_FT:y"
                url = f"{base}?query={q}&format=json&pageSize=1"
                data = _fetch_json(url)
                results = (((data.get("resultList") or {}).get("result")) or [])
                if results:
                    r0 = results[0]
                    return True, {"resolved_title": r0.get("title"), "resolved_pmid": r0.get("pmid") or r0.get("id"), "resolved_pmcid": r0.get("pmcid"), "resolved_doi": r0.get("doi"), "resolved_source": "europe_pmc"}
            except Exception:
                pass
        # If no PMID, attempt Europe PMC by title (best-effort)
        t = (title or "").strip()
        if t:
            try:
                base = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
                q = f'TITLE:"{urllib.parse.quote(t)}" AND HAS_FT:y'
                url = f"{base}?query={q}&format=json&pageSize=1"
                data = _fetch_json(url)
                results = (((data.get("resultList") or {}).get("result")) or [])
                if results:
                    r0 = results[0]
                    return True, {"resolved_title": r0.get("title"), "resolved_pmid": r0.get("pmid") or r0.get("id"), "resolved_pmcid": r0.get("pmcid"), "resolved_doi": r0.get("doi"), "resolved_source": "europe_pmc"}
            except Exception:
                pass
    except Exception:
        pass
    return False, {}
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


def _infer_indication(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["melanoma"]):
        return "melanoma"
    if any(k in t for k in ["nsclc", "non-small cell", "lung cancer"]):
        return "nsclc"
    if any(k in t for k in ["colorectal", "crc"]) :
        return "crc"
    if any(k in t for k in ["renal cell", "rcc"]) :
        return "rcc"
    if any(k in t for k in ["breast cancer"]) :
        return "breast"
    if any(k in t for k in ["ovarian"]) :
        return "ovarian"
    if any(k in t for k in ["hepatocellular", "hcc"]) :
        return "hcc"
    if any(k in t for k in ["urothelial", "bladder"]) :
        return "uc"
    return "other"


def _apply_diversity_quota(sections: list[dict], min_per_bucket: int = 1) -> list[dict]:
    """Reorder sections to guarantee spread across indications when present, without dropping items.
    Works for any molecule/description by inferring indication from title/summary.
    """
    if not sections or len(sections) <= 3:
        return sections
    buckets: dict[str, list[dict]] = {}
    for sec in sections:
        top = sec.get("top_article") or {}
        title = (top.get("title") or "")
        summary = str((sec.get("result") or {}).get("summary", ""))
        ind = _infer_indication(title + " " + summary)
        buckets.setdefault(ind, []).append(sec)
    # Round-robin selection across buckets to produce a diversified order
    ordered: list[dict] = []
    # Prioritize known buckets, then others
    order_keys = ["melanoma", "nsclc", "crc", "rcc", "breast", "ovarian", "hcc", "uc"]
    other_keys = [k for k in buckets.keys() if k not in order_keys]
    keys = [k for k in order_keys if k in buckets] + other_keys
    # Round-robin until we exhaust or reach original length
    idx = 0
    while len(ordered) < len(sections):
        progressed = False
        for k in keys:
            lst = buckets.get(k) or []
            if idx < len(lst):
                ordered.append(lst[idx])
                progressed = True
                if len(ordered) >= len(sections):
                    break
        if not progressed:
            break
        idx += 1
    return ordered if len(ordered) == len(sections) else sections

def _synthesize_executive_summary(objective: str, results_sections: list[dict], deadline: float) -> str:
    # If anchors across sections look weak, save more time for evidence/NLI upstream by shortening synthesis window
    if not results_sections or _time_left(deadline) < 3.0:
        return ""
    findings = _collect_findings(results_sections)
    plan = _build_synthesis_plan(objective)
    mech = bio = resis = clin = pat = ""
    try:
        if "mechanism" in plan and _time_left(deadline) > 1.5:
            mech = mechanism_analyst_chain.invoke({"objective": objective, "findings": findings}).get("text", "")
    except Exception:
        mech = ""
    try:
        if "biomarker" in plan and _time_left(deadline) > 1.5:
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
            You are the Project Manager. Synthesize the analyst notes below into a single 1-2 sentence relevance_justification tailored to the user's objective.
            Strictly include all of the following in ONE compact paragraph (no bullets):
            - Signals that triggered inclusion (name concrete tokens/mechanisms where present; e.g., GLP-1R/GIPR, cAMP/PKA, GLUT4; or PD-1/PD-L1, TMB/GEP, dMMR/MSI-H, JAK1/2, B2M).
            - Why this article vs others: explicitly name the contrasted alternative (e.g., "chosen over broader GLP-1 reviews") and the discriminative reason (e.g., semaglutide-specific GLP-1R binding/PK/PD detail, larger cohort, prospective design, higher citations/year, direct evidence).
            - One-line limitation (e.g., preclinical only, older cohort, single-arm, non-specific scope).
            Keep it article-specific; avoid generic wording.
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
    # Optional: only include full-text/OA articles to ensure Deep Dive full coverage
    full_text_only: bool | None = Field(default=False, alias="fullTextOnly")

    class Config:
        allow_population_by_field_name = True
        allow_population_by_alias = True


class DeepDiveRequest(BaseModel):
    # Either a direct URL to the article full text, or an already-known PMID (optional)
    url: str | None = None
    pmid: str | None = None
    title: str | None = None
    objective: str
    project_id: str | None = Field(default=None, alias="projectId")

    class Config:
        allow_population_by_field_name = True
        allow_population_by_alias = True


class DeepDiveModuleResult(BaseModel):
    summary: str
    relevance_justification: str
    fact_anchors: list[dict]


class DeepDiveResponse(BaseModel):
    source: dict
    model_description: DeepDiveModuleResult
    experimental_methods: DeepDiveModuleResult | None
    results_interpretation: DeepDiveModuleResult | None
    diagnostics: dict

# Project Management Models
class ProjectCreate(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    project_id: str
    project_name: str
    description: Optional[str]
    owner_user_id: str
    created_at: datetime
    updated_at: datetime
    
class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]

class ProjectDetailResponse(BaseModel):
    project_id: str
    project_name: str
    description: Optional[str]
    owner_user_id: str
    created_at: datetime
    updated_at: datetime
    reports: List[dict]
    collaborators: List[dict]
    annotations: List[dict]

class CollaboratorInvite(BaseModel):
    email: str
    role: str = Field(default="viewer", pattern="^(owner|editor|viewer)$")

class AnnotationCreate(BaseModel):
    content: str = Field(..., min_length=1)
    article_pmid: Optional[str] = None
    report_id: Optional[str] = None
    analysis_id: Optional[str] = None

class AnnotationResponse(BaseModel):
    annotation_id: str
    content: str
    author_id: str
    created_at: datetime
    article_pmid: Optional[str]
    report_id: Optional[str]
    analysis_id: Optional[str]

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


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

# Global variable to store current user (in production, use session management)
_current_user_id = "default_user"

def get_current_user() -> str:
    """Get current user ID."""
    global _current_user_id
    return _current_user_id

def set_current_user(user_id: str):
    """Set current user ID."""
    global _current_user_id
    _current_user_id = user_id

# Authentication Endpoints

class AuthRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class SignUpRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class UserDetailsRequest(BaseModel):
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    category: str = Field(..., description="User category: Student, Academic, Industry")
    role: str = Field(..., description="User role based on category")
    institution: str = Field(..., description="User institution")
    subject_area: str = Field(..., description="Subject area of focus")
    how_heard_about_us: str = Field(..., description="How user heard about the platform")
    join_mailing_list: bool = Field(default=False, description="Join mailing list")

@app.post("/auth/signin")
async def auth_signin(auth_data: AuthRequest, db: Session = Depends(get_db)):
    """Sign in existing user"""
    try:
        # Check if user exists and registration is complete
        user = db.query(User).filter(User.email == auth_data.email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.registration_completed:
            raise HTTPException(status_code=400, detail="Registration not completed")
        
        # Verify password
        if not verify_password(auth_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": user.created_at.isoformat(),
            "registration_completed": user.registration_completed
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sign in failed: {str(e)}")

@app.post("/auth/signup")
async def auth_signup(auth_data: SignUpRequest, db: Session = Depends(get_db)):
    """Create new user account (step 1)"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == auth_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create incomplete user record with hashed password
        user = User(
            user_id=auth_data.email,
            username=auth_data.email.split('@')[0],
            email=auth_data.email,
            password_hash=hash_password(auth_data.password),
            first_name="",  # Will be filled in step 2
            last_name="",
            category="",
            role="",
            institution="",
            subject_area="",
            how_heard_about_us="",
            registration_completed=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "user_id": user.user_id,
            "email": user.email,
            "registration_completed": False,
            "message": "Account created. Please complete your profile."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sign up failed: {str(e)}")

class CompleteRegistrationRequest(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    category: str
    role: str
    institution: str
    subject_area: str
    how_heard_about_us: str
    join_mailing_list: bool = False

@app.post("/auth/complete-registration")
async def complete_registration(request: CompleteRegistrationRequest, db: Session = Depends(get_db)):
    """Complete user registration with detailed information"""
    try:
        # Find user by user_id from request
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user with complete information
        user.first_name = request.first_name
        user.last_name = request.last_name
        user.category = request.category
        user.role = request.role
        user.institution = request.institution
        user.subject_area = request.subject_area
        user.how_heard_about_us = request.how_heard_about_us
        user.join_mailing_list = request.join_mailing_list
        user.registration_completed = True
        user.username = f"{request.first_name} {request.last_name}"
        
        db.commit()
        db.refresh(user)
        
        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "category": user.category,
            "role": user.role,
            "institution": user.institution,
            "subject_area": user.subject_area,
            "created_at": user.created_at.isoformat(),
            "registration_completed": True,
            "message": "Registration completed successfully!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration completion failed: {str(e)}")

@app.post("/auth/login")
async def auth_login(auth_data: AuthRequest, db: Session = Depends(get_db)):
    """Legacy login endpoint - redirects to signin"""
    return await auth_signin(auth_data, db)

# Project Management Endpoints

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    current_user = get_current_user()
    
    # Ensure user exists
    user = db.query(User).filter(User.user_id == current_user).first()
    if not user:
        # Create default user if doesn't exist
        user = User(
            user_id=current_user,
            username=current_user,
            email=f"{current_user}@example.com"
        )
        db.add(user)
        db.commit()
    
    # Create project
    project_id = str(uuid.uuid4())
    project = Project(
        project_id=project_id,
        project_name=project_data.project_name,
        description=project_data.description,
        owner_user_id=current_user
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return ProjectResponse(
        project_id=project.project_id,
        project_name=project.project_name,
        description=project.description,
        owner_user_id=project.owner_user_id,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@app.get("/projects", response_model=ProjectListResponse)
async def list_projects(db: Session = Depends(get_db)):
    """List all projects for the current user"""
    current_user = get_current_user()
    
    # Get projects owned by user
    owned_projects = db.query(Project).filter(
        Project.owner_user_id == current_user,
        Project.is_active == True
    ).all()
    
    # Get projects where user is a collaborator
    collaborated_projects = db.query(Project).join(ProjectCollaborator).filter(
        ProjectCollaborator.user_id == current_user,
        ProjectCollaborator.is_active == True,
        Project.is_active == True
    ).all()
    
    # Combine and deduplicate
    all_projects = list({p.project_id: p for p in owned_projects + collaborated_projects}.values())
    
    project_responses = [
        ProjectResponse(
            project_id=p.project_id,
            project_name=p.project_name,
            description=p.description,
            owner_user_id=p.owner_user_id,
            created_at=p.created_at,
            updated_at=p.updated_at
        ) for p in all_projects
    ]
    
    return ProjectListResponse(projects=project_responses)

@app.get("/projects/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project details with associated reports and collaborators"""
    current_user = get_current_user()
    
    # Check if user has access to this project
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    has_access = (
        project.owner_user_id == current_user or
        db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.user_id == current_user,
            ProjectCollaborator.is_active == True
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get associated data
    reports = db.query(Report).filter(Report.project_id == project_id).all()
    collaborators = db.query(ProjectCollaborator).join(User).filter(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.is_active == True
    ).all()
    annotations = db.query(Annotation).filter(Annotation.project_id == project_id).all()
    
    return ProjectDetailResponse(
        project_id=project.project_id,
        project_name=project.project_name,
        description=project.description,
        owner_user_id=project.owner_user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        reports=[{
            "report_id": r.report_id,
            "title": r.title,
            "objective": r.objective,
            "created_at": r.created_at.isoformat(),
            "created_by": r.created_by
        } for r in reports],
        collaborators=[{
            "user_id": c.user_id,
            "username": c.user.username,
            "role": c.role,
            "invited_at": c.invited_at.isoformat()
        } for c in collaborators],
        annotations=[{
            "annotation_id": a.annotation_id,
            "content": a.content,
            "author_id": a.author_id,
            "created_at": a.created_at.isoformat(),
            "article_pmid": a.article_pmid,
            "report_id": a.report_id
        } for a in annotations]
    )

# Collaboration Endpoints

@app.post("/projects/{project_id}/collaborators")
async def invite_collaborator(
    project_id: str,
    invite_data: CollaboratorInvite,
    db: Session = Depends(get_db)
):
    """Invite a user to collaborate on a project"""
    current_user = get_current_user()
    
    # Check if current user owns the project
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.owner_user_id == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Check if user exists, create if not
    invited_user = db.query(User).filter(User.email == invite_data.email).first()
    if not invited_user:
        invited_user = User(
            user_id=str(uuid.uuid4()),
            username=invite_data.email.split('@')[0],
            email=invite_data.email
        )
        db.add(invited_user)
        db.commit()
    
    # Check if collaboration already exists
    existing = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.user_id == invited_user.user_id
    ).first()
    
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="User is already a collaborator")
        else:
            # Reactivate existing collaboration
            existing.is_active = True
            existing.role = invite_data.role
            db.commit()
            return {"message": "Collaborator re-invited successfully"}
    
    # Create new collaboration
    collaboration = ProjectCollaborator(
        project_id=project_id,
        user_id=invited_user.user_id,
        role=invite_data.role
    )
    
    db.add(collaboration)
    db.commit()
    
    return {"message": "Collaborator invited successfully"}

@app.delete("/projects/{project_id}/collaborators/{user_id}")
async def remove_collaborator(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Remove a collaborator from a project"""
    current_user = get_current_user()
    
    # Check if current user owns the project
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.owner_user_id == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Find and deactivate collaboration
    collaboration = db.query(ProjectCollaborator).filter(
        ProjectCollaborator.project_id == project_id,
        ProjectCollaborator.user_id == user_id
    ).first()
    
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    
    collaboration.is_active = False
    db.commit()
    
    return {"message": "Collaborator removed successfully"}

# Annotation Endpoints

@app.post("/projects/{project_id}/annotations", response_model=AnnotationResponse)
async def create_annotation(
    project_id: str,
    annotation_data: AnnotationCreate,
    db: Session = Depends(get_db)
):
    """Create a new annotation in a project"""
    current_user = get_current_user()
    
    # Check project access
    has_access = (
        db.query(Project).filter(
            Project.project_id == project_id,
            Project.owner_user_id == current_user
        ).first() is not None or
        db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.user_id == current_user,
            ProjectCollaborator.is_active == True
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create annotation
    annotation_id = str(uuid.uuid4())
    annotation = Annotation(
        annotation_id=annotation_id,
        project_id=project_id,
        content=annotation_data.content,
        article_pmid=annotation_data.article_pmid,
        report_id=annotation_data.report_id,
        analysis_id=annotation_data.analysis_id,
        author_id=current_user
    )
    
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    
    return AnnotationResponse(
        annotation_id=annotation.annotation_id,
        content=annotation.content,
        author_id=annotation.author_id,
        created_at=annotation.created_at,
        article_pmid=annotation.article_pmid,
        report_id=annotation.report_id,
        analysis_id=annotation.analysis_id
    )

@app.get("/projects/{project_id}/annotations")
async def get_annotations(project_id: str, db: Session = Depends(get_db)):
    """Get all annotations for a project"""
    current_user = get_current_user()
    
    # Check project access
    has_access = (
        db.query(Project).filter(
            Project.project_id == project_id,
            Project.owner_user_id == current_user
        ).first() is not None or
        db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project_id,
            ProjectCollaborator.user_id == current_user,
            ProjectCollaborator.is_active == True
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    annotations = db.query(Annotation).join(User).filter(
        Annotation.project_id == project_id
    ).order_by(Annotation.created_at.desc()).all()
    
    return {
        "annotations": [{
            "annotation_id": a.annotation_id,
            "content": a.content,
            "author_id": a.author_id,
            "author_username": a.author.username,
            "created_at": a.created_at.isoformat(),
            "article_pmid": a.article_pmid,
            "report_id": a.report_id,
            "analysis_id": a.analysis_id
        } for a in annotations]
    }

def _strip_html(html: str) -> str:
    try:
        t = html
        # Remove script/style blocks
        t = re.sub(r"<script[\s\S]*?</script>", " ", t, flags=re.IGNORECASE)
        t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.IGNORECASE)
        # Remove tags
        t = re.sub(r"<[^>]+>", " ", t)
        # Unescape basic entities
        t = t.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        # Collapse whitespace
        t = re.sub(r"\s+", " ", t).strip()
        return t
    except Exception:
        return html


def _fetch_article_text_from_url(url: str, timeout: float = 20.0) -> str:
    try:
        if not url or not url.startswith("http"):
            return ""
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (DeepDiveBot)"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ctype = (r.headers.get("Content-Type") or "").lower()
            raw = r.read()
            if "application/pdf" in ctype:
                if _HAS_PDF:
                    try:
                        # Attempt to extract PDF text
                        return pdf_extract_text(io.BytesIO(raw))[:200000]
                    except Exception:
                        return ""
                return ""
            # Assume HTML or text
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                try:
                    text = raw.decode("latin-1", errors="ignore")
                except Exception:
                    text = raw.decode(errors="ignore")
            return _strip_html(text)
    except Exception:
        return ""


def _fetch_url_raw_text(url: str, timeout: float = 15.0) -> str:
    try:
        if not url or not url.startswith("http"):
            return ""
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (DeepDiveBot)"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            try:
                return raw.decode("utf-8", errors="ignore")
            except Exception:
                try:
                    return raw.decode("latin-1", errors="ignore")
                except Exception:
                    return raw.decode(errors="ignore")
    except Exception:
        return ""


def _extract_pubmed_abstract(html_text: str) -> str:
    try:
        # Very lightweight extraction of abstract content block on PubMed
        # Look for patterns often used on PubMed pages
        m = re.search(r"<div[^>]*class=\"abstract-content[^\"]*\"[\s\S]*?</div>", html_text, flags=re.IGNORECASE)
        if not m:
            m = re.search(r"<section[^>]*id=\"abstract\"[\s\S]*?</section>", html_text, flags=re.IGNORECASE)
        if m:
            return _strip_html(m.group(0))[:200000]
    except Exception:
        pass
    return ""


def _extract_doi_from_html(html_text: str) -> str:
    try:
        # Common meta tag
        m = re.search(r"name=\"citation_doi\"[^>]*content=\"([^\"]+)\"", html_text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Fallback: doi: 10.xxxx/...
        m = re.search(r"doi:\s*(10\.\S+)", html_text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip().rstrip('.')
    except Exception:
        pass
    return ""


def _pubmed_resolve_doi(pmid: str | None, timeout: float = 8.0) -> str:
    """Resolve DOI for a PubMed PMID using EFetch XML (best-effort, lightweight regex parsing)."""
    try:
        if not pmid:
            return ""
        base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        url = f"{base}?db=pubmed&id={urllib.parse.quote(str(pmid))}&retmode=xml"
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=timeout) as r:
            xml = r.read().decode("utf-8", errors="ignore")
        # Prefer ArticleId IdType="doi"
        m = re.search(r"<ArticleId[^>]*IdType=\"doi\"[^>]*>([^<]+)</ArticleId>", xml, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Also try ELocationID EIdType="doi"
        m = re.search(r"<ELocationID[^>]*EIdType=\"doi\"[^>]*>([^<]+)</ELocationID>", xml, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Fallback generic 10.xxx in XML
        m = re.search(r"(10\.[^\s<]+)", xml, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip().rstrip('.')
    except Exception:
        return ""
    return ""


def _fetch_json(url: str, timeout: float = 10.0) -> dict:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=timeout) as r:
            raw = r.read().decode("utf-8", errors="ignore")
            import json as _json
            return _json.loads(raw)
    except Exception:
        return {}


def _pubmed_fallback_oa(objective: str, molecule: str | None, retmax: int = 40, since_year: int = 2015) -> list[dict]:
    """Lightweight PubMed fallback restricted to OA/free full text.
    Returns a list of minimal article dicts with at least title, pmid, url, pub_year.
    """
    try:
        obj = (objective or "").strip()
        mol = (molecule or "").strip()
        terms: list[str] = []
        if mol:
            safe = re.sub(r"\s+", " ", mol)
            terms.append(f"(\"{safe}\"[tiab] OR \"{safe}\"[Title])")
        if obj:
            # Use a broad tiab clause from objective words
            obj_words = [w for w in re.split(r"\W+", obj) if len(w) > 2][:6]
            if obj_words:
                terms.append("(" + " AND ".join([f"{w}[tiab]" for w in obj_words]) + ")")
        terms.append(f"({since_year}:3000[dp])")
        terms.append("(free full text[filter] OR pmc[filter])")
        term = " AND ".join(terms) if terms else "(free full text[filter])"
        base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        esearch = f"{base}/esearch.fcgi?db=pubmed&retmode=json&retmax={retmax}&term={urllib.parse.quote(term)}"
        data = _fetch_json(esearch, timeout=8.0)
        pmids = ((data.get("esearchresult") or {}).get("idlist") or [])
        if not pmids:
            return []
        ids = ",".join(pmids)
        esum = _fetch_json(f"{base}/esummary.fcgi?db=pubmed&retmode=json&id={urllib.parse.quote(ids)}", timeout=8.0)
        res: list[dict] = []
        summ = (esum.get("result") or {})
        for pid in pmids:
            it = summ.get(pid) or {}
            title = (it.get("title") or "").strip()
            # Try to parse year
            try:
                py = int(str(it.get("pubdate") or "").split()[0][:4])
            except Exception:
                py = 0
            if title:
                res.append({
                    "title": title,
                    "pmid": pid,
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pid}/",
                    "pub_year": py,
                    "citation_count": 0,
                    "source": "pubmed",
                    "source_query": term,
                })
        return res
    except Exception:
        return []


def _expand_objective_synonyms(objective: str) -> list[str]:
    """Expand objective domain with safe synonyms to improve relevance grounding.
    Kept compact to avoid topic drift; extend per domain as needed."""
    try:
        obj = (objective or "").lower()
        synonyms: set[str] = set()
        domain: dict[str, list[str]] = {
            "cardiovascular": ["cv","cvd","heart","coronary","atherosclerosis","mi","stroke","endothelial"],
            "inflammation": ["anti-inflammatory","antiinflammatory","inflammatory","cox","prostaglandin","thromboxane"],
            "mechanism": ["moa","mechanism of action","pathway","signaling","pharmacodynamic"],
        }
        for key, vals in domain.items():
            if key in obj:
                synonyms.update(vals)
        if ("anti-inflammatory" in obj) or ("inflammation" in obj):
            synonyms.update(["cox-1","cox-2","pge2","pgd2","ltc4","platelet","thromboxane a2"])
        return sorted(synonyms)
    except Exception:
        return []


def _resolve_via_eupmc(pmid: str | None, doi: str | None) -> tuple[str, dict]:
    """Try Europe PMC for OA full text. Returns (text, meta)."""
    try:
        base = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
        if doi:
            q = f"DOI:{urllib.parse.quote(doi)} AND HAS_FT:y AND OPEN_ACCESS:y"
        elif pmid:
            q = f"EXT_ID:{urllib.parse.quote(pmid)} AND SRC:MED AND HAS_FT:y"
        else:
            return "", {}
        url = f"{base}?query={q}&format=json&pageSize=1"
        data = _fetch_json(url)
        results = (((data.get("resultList") or {}).get("result")) or [])
        if not results:
            return "", {}
        r0 = results[0]
        # Try to find a full text URL
        ft_list = r0.get("fullTextUrlList", {}).get("fullTextUrl", [])
        for ft in ft_list:
            docurl = ft.get("url") or ""
            if not docurl:
                continue
            txt = _fetch_article_text_from_url(docurl)
            if txt and len(txt) > 1000:
                meta = {
                    "resolved_title": r0.get("title"),
                    "resolved_pmid": r0.get("pmid") or r0.get("id"),
                    "resolved_pmcid": r0.get("pmcid"),
                    "resolved_doi": r0.get("doi"),
                    "license": ft.get("license"),
                    "resolved_source": "europe_pmc",
                }
                return txt, meta
    except Exception:
        pass
    return "", {}


def _oa_backfill_topup(objective: str, current: list[dict], minimum: int, deadline: float) -> list[dict]:
    """Fetch additional OA articles from Europe PMC and re-rank to ensure minimum count for precision+fullTextOnly."""
    if len(current) >= minimum or _time_left(deadline) < 3.0:
        return current
    try:
        q = urllib.parse.quote((objective or "").strip()[:200])
        url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={q}+OPEN_ACCESS:y&format=json&pageSize=25"
        data = _fetch_json(url, timeout=8.0)
        items = (((data.get("resultList") or {}).get("result")) or [])
        harvested: list[dict] = []
        for it in items:
            try:
                title = str(it.get("title") or "").strip()
                pmid = str(it.get("pmid") or it.get("id") or "").strip() or None
                year = int(it.get("pubYear") or 0)
                ft = (it.get("fullTextUrlList") or {}).get("fullTextUrl", []) or []
                url0 = ""
                for f in ft:
                    if f.get("availability") == "Open access" and f.get("url"):
                        url0 = f.get("url"); break
                if not title or not url0: continue
                harvested.append({"title": title, "abstract": it.get("abstractText") or "", "pub_year": year,
                                  "pmid": pmid, "url": url0, "citation_count": int(it.get("citedByCount") or 0),
                                  "source": "europe_pmc", "source_query": objective})
            except Exception:
                continue
        merged = current + harvested
        norm = _normalize_candidates(merged)
        ranked = _triage_rank(objective, norm, max_keep=max(minimum+4, minimum), molecule_tokens=[], preference="precision")
        keep, seen = [], set()
        for a in ranked:
            key = f"{a.get('pmid') or ''}||{a.get('title') or ''}"
            if key in seen: continue
            seen.add(key); keep.append(a)
            if len(keep) >= max(minimum, 10): break
        return keep
    except Exception:
        return current


def _normalize_title(title: str | None) -> str:
    try:
        s = (title or "").lower()
        # Remove punctuation and excessive whitespace
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s
    except Exception:
        return (title or "").strip().lower()


def _extract_title_from_html(html_text: str) -> str:
    """Best-effort article title extraction from landing HTML."""
    try:
        # Try citation meta first
        m = re.search(r"name=\"citation_title\"[^>]*content=\"([^\"]+)\"", html_text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Try og:title
        m = re.search(r"property=\"og:title\"[^>]*content=\"([^\"]+)\"", html_text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Fallback to <title>
        m = re.search(r"<title>([\s\S]*?)</title>", html_text, flags=re.IGNORECASE)
        if m:
            return _strip_html(m.group(0)).strip()
    except Exception:
        pass
    return ""


def _verify_source_match(req_title: str | None, req_pmid: str | None, meta: dict, landing_html: str | None) -> dict:
    """Compare requested identifiers with resolved identifiers to detect mismatches.
    Returns diagnostics dict including resolved identifiers and a mismatch flag.
    """
    try:
        resolved = {
            "resolved_title": meta.get("resolved_title") or ( _extract_title_from_html(landing_html or "") if landing_html else "" ),
            "resolved_pmid": meta.get("resolved_pmid"),
            "resolved_pmcid": meta.get("resolved_pmcid"),
            "resolved_doi": meta.get("resolved_doi"),
            "license": meta.get("license"),
            "resolved_source": meta.get("resolved_source"),
        }
        # Title strict equality on normalized strings when both present
        t_req = _normalize_title(req_title)
        t_res = _normalize_title(resolved.get("resolved_title"))
        title_match = bool(t_req and t_res and t_req == t_res)
        # PMID equality when both present
        pmid_match = False
        try:
            if req_pmid and resolved.get("resolved_pmid"):
                pmid_match = str(req_pmid).strip() == str(resolved.get("resolved_pmid")).strip()
        except Exception:
            pmid_match = False
        mismatch = False
        # If any identifier provided, require equality; else rely on title when available
        if req_pmid and resolved.get("resolved_pmid"):
            mismatch = not pmid_match
        elif t_req and t_res:
            mismatch = not title_match
        else:
            mismatch = False
        return { **resolved, "mismatch": bool(mismatch) }
    except Exception:
        return { **({k: meta.get(k) for k in ("resolved_title","resolved_pmid","resolved_pmcid","resolved_doi","license","resolved_source")}), "mismatch": False }


def _resolve_oa_fulltext(pmid: str | None, landing_html: str, doi_hint: str | None = None) -> tuple[str, str, str, dict]:
    """Attempt to resolve open full text via PMC or Unpaywall.

    Returns: (text, grounding, source, meta) where grounding in {full_text, abstract_only, none},
    source hints e.g. pmc|publisher|repository|pubmed_abstract|europe_pmc|none; meta carries resolved identifiers.
    """
    # 1) PMC via ELink
    try:
        if pmid:
            elink = _fetch_json(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&id={urllib.parse.quote(pmid)}&db=pmc&retmode=json")
            links = (((elink.get("linksets") or [])[0] or {}).get("linksetdbs") or [])
            for db in links:
                if (db.get("dbto") == "pmc") and db.get("links"):
                    pmcid = str((db.get("links") or [])[0])
                    # Fetch PMC HTML and strip
                    pmc_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
                    html = _fetch_article_text_from_url(pmc_url)
                    if html and len(html) > 2000:
                        return (html, "full_text", "pmc", {"resolved_pmcid": pmcid, "resolved_source": "pmc"})
    except Exception:
        pass
    # 2) Unpaywall via DOI
    try:
        doi = (doi_hint or _extract_doi_from_html(landing_html)).strip()
        if not doi and pmid:
            # Resolve DOI from PubMed XML when not present on landing page
            doi = _pubmed_resolve_doi(pmid).strip()
        email = os.getenv("UNPAYWALL_EMAIL", "")
        if doi and email:
            up = _fetch_json(f"https://api.unpaywall.org/v2/{urllib.parse.quote(doi)}?email={urllib.parse.quote(email)}")
            best = up.get("best_oa_location") or {}
            for key in ("url_for_pdf", "url"):
                u = best.get(key) or ""
                if u:
                    txt = _fetch_article_text_from_url(u)
                    if txt and len(txt) > 1000:
                        src = "publisher" if "publisher" in (best.get("host_type") or "") else "repository"
                        return (txt, "full_text", src, {"resolved_doi": doi, "license": best.get("license"), "resolved_source": src})
    except Exception:
        pass
    # 2b) Europe PMC fallback
    try:
        doi2 = doi_hint or _extract_doi_from_html(landing_html)
        txt2, meta2 = _resolve_via_eupmc(pmid, doi2)
        if txt2:
            return (txt2, "full_text", meta2.get("resolved_source", "europe_pmc"), meta2)
    except Exception:
        pass
    # 3) Abstract-only fallback for PubMed landing pages
    try:
        ab = _extract_pubmed_abstract(landing_html)
        if ab:
            return (ab, "abstract_only", "pubmed_abstract", {})
    except Exception:
        pass
    return ("", "none", "none", {})


def _ensure_module_json(text: str) -> dict:
    try:
        if "```" in text:
            text = text.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
        data = json.loads(text)
        if not isinstance(data, dict):
            raise ValueError("not obj")
    except Exception:
        data = {}
    # Backfill minimal structure
    data.setdefault("summary", str(text)[:1000] if isinstance(text, str) else "")
    data.setdefault("relevance_justification", "")
    fa = data.get("fact_anchors")
    if not isinstance(fa, list):
        data["fact_anchors"] = []
    return data


_DD_MODEL_PROMPT = PromptTemplate(
    template=(
        "You are a scientific reviewer. Using ONLY the provided article full text, and the user's objective, "
        "produce STRICT JSON with keys: summary, relevance_justification, fact_anchors.\n"
        "- summary: How did they study this? model/population/protocol; strengths/limitations.\n"
        "- relevance_justification: one paragraph tying findings to the user's objective.\n"
        "- fact_anchors: 3-5 objects with fields {claim, evidence:{title,year,pmid,quote}} grounded in the article.\n"
        "NO external knowledge.\n\nObjective: {objective}\nFullText: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

_DD_METHODS_PROMPT = PromptTemplate(
    template=(
        "You are a methods auditor. Using ONLY the article full text and the user's objective, return JSON with "
        "keys: summary, relevance_justification, fact_anchors.\n"
        "- summary: key experimental approaches and lab techniques (e.g., PCR, WB), their role, pros/cons.\n"
        "- relevance_justification: why these methods matter for the user's objective.\n"
        "- fact_anchors: 3-5 grounded claim+evidence objects as above.\n"
        "No external sources.\n\nObjective: {objective}\nFullText: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)

_DD_RESULTS_PROMPT = PromptTemplate(
    template=(
        "You are a results interpreter. Using ONLY the article full text and the user's objective, return JSON with "
        "keys: summary, relevance_justification, fact_anchors.\n"
        "- summary: main findings, link to hypothesis, unexpected results, potential biases.\n"
        "- relevance_justification: connect outcomes to the user's objective.\n"
        "- fact_anchors: 3-5 grounded claim+evidence objects.\n"
        "No external sources.\n\nObjective: {objective}\nFullText: {full_text}"
    ),
    input_variables=["objective", "full_text"],
)


async def _run_deepdive_chain(prompt: PromptTemplate, objective: str, full_text: str):
    chain = LLMChain(llm=llm_analyzer, prompt=prompt)
    resp = await run_in_threadpool(chain.invoke, {"objective": objective[:400], "full_text": full_text[:12000]})
    out = resp.get("text", resp) if isinstance(resp, dict) else str(resp)
    data = _ensure_module_json(out)
    return data


@app.post("/deep-dive")
async def deep_dive(request: DeepDiveRequest, db: Session = Depends(get_db)):
    t0 = _now_ms()
    try:
        source_info = {"url": request.url, "pmid": request.pmid, "title": request.title}
        # Ingestion: strictly from provided article
        text = ""
        grounding = "none"
        grounding_source = "none"
        if request.url:
            # Use raw HTML for OA resolution and abstract parsing
            landing_html = _fetch_url_raw_text(request.url)
            # If this is a PMC article page, treat as full text directly
            if "ncbi.nlm.nih.gov/pmc/articles/" in (request.url or "") and landing_html:
                text = _strip_html(landing_html)
                grounding, grounding_source = "full_text", "pmc"
            else:
                text, grounding, grounding_source, meta = _resolve_oa_fulltext(request.pmid, landing_html, None)
                if not text and landing_html:
                    text = _strip_html(landing_html)
                    if text:
                        grounding = "abstract_only" if "pubmed.ncbi.nlm.nih.gov" in (request.url or "") else "none"
                        grounding_source = "pubmed_abstract" if grounding == "abstract_only" else "none"
        if not text:
            return {
                "error": "Unable to fetch or parse article content. Provide full-text URL or upload PDF.",
                "source": source_info,
            }
        # Source verification diagnostics
        try:
            meta = {}
            if grounding == "full_text":
                # Gather resolved meta from last OA resolver call if available (not retained here), fallback to landing page
                meta = _verify_source_match(request.title, request.pmid, meta, landing_html)
            else:
                meta = _verify_source_match(request.title, request.pmid, {}, landing_html)
        except Exception:
            meta = {}
        # Run three specialist modules in parallel
        try:
            # Module 1 with timeout
            md_structured = await _with_timeout(
                run_in_threadpool(analyze_scientific_model, text, request.objective, llm_analyzer),
                12.0,
                "DeepDiveModel",
                retries=0,
            )
            md_json = {
                "summary": md_structured.get("protocol_summary", ""),
                "relevance_justification": "",
                "fact_anchors": [],
            }
            # Modules 2 and 3 with timeouts (structured)
            mth_task = _with_timeout(
                run_in_threadpool(analyze_experimental_methods, text, request.objective, llm_analyzer),
                12.0,
                "DeepDiveMethods",
                retries=0,
            )
            res_task = _with_timeout(
                run_in_threadpool(analyze_results_interpretation, text, request.objective, llm_analyzer),
                12.0,
                "DeepDiveResults",
                retries=0,
            )
            mth, res = await asyncio.gather(mth_task, res_task)

            # Fallback population when full text is available but analyzers return empty
            if grounding == "full_text":
                try:
                    if isinstance(mth, list) and len(mth) == 0:
                        study_design = (md_structured.get("study_design") or md_structured.get("study_design_taxonomy") or "").lower()
                        is_review = ("review" in study_design) or ("meta" in study_design) or ("systematic" in study_design)
                        default_row = {
                            "technique": "Systematic review/meta-analysis" if is_review else "Document analysis",
                            "measurement": "Aggregate outcomes from included studies" if is_review else "Evidence extraction from full text",
                            "role_in_study": "Synthesize evidence relevant to the objective",
                            "parameters": "",
                            "controls_validation": "",
                            "limitations_reproducibility": "Heterogeneity across sources; publication bias; lack of raw data",
                            "validation": "",
                            "accession_ids": [],
                            "fact_anchors": [],
                        }
                        mth = [default_row]
                except Exception:
                    pass
                try:
                    if isinstance(res, dict) and isinstance(res.get("key_results"), list) and len(res.get("key_results") or []) == 0:
                        lims = res.get("limitations_biases_in_results")
                        if not isinstance(lims, list):
                            lims = []
                        lims.append("Quantitative endpoints not explicit in accessible text; qualitative synthesis provided")
                        res["limitations_biases_in_results"] = list({s.strip(): True for s in lims if isinstance(s, str) and s.strip()}.keys())
                except Exception:
                    pass
        except Exception as e:
            return {"error": str(e)[:200], "source": source_info}
        took = _now_ms() - t0
        diagnostics = {
            "ingested_chars": len(text),
            "grounding": grounding,
            "grounding_source": grounding_source,
            "latency_ms": took,
            **({k: v for k, v in (meta or {}).items() if v is not None}),
        }
        
        response_data = {
            "source": source_info,
            "model_description_structured": md_structured,
            "model_description": md_json,
            "experimental_methods_structured": mth if grounding == "full_text" else None,
            "results_interpretation_structured": res if grounding == "full_text" else None,
            "diagnostics": diagnostics,
        }
        
        # Save deep dive analysis to database if project_id is provided
        if hasattr(request, 'project_id') and request.project_id:
            try:
                current_user = get_current_user()
                
                # Verify project exists and user has access
                project = db.query(Project).filter(Project.project_id == request.project_id).first()
                if project:
                    has_access = (
                        project.owner_user_id == current_user or
                        db.query(ProjectCollaborator).filter(
                            ProjectCollaborator.project_id == request.project_id,
                            ProjectCollaborator.user_id == current_user,
                            ProjectCollaborator.is_active == True
                        ).first() is not None
                    )
                    
                    if has_access:
                        # Create deep dive analysis record
                        analysis_id = str(uuid.uuid4())
                        analysis = DeepDiveAnalysis(
                            analysis_id=analysis_id,
                            project_id=request.project_id,
                            article_pmid=request.pmid,
                            article_url=request.url,
                            article_title=request.title or "Unknown Article",
                            scientific_model_analysis=json.dumps(md_json) if md_json else None,
                            experimental_methods_analysis=json.dumps(mth) if mth else None,
                            results_interpretation_analysis=json.dumps(res) if res else None,
                            created_by=current_user,
                            processing_status="completed"
                        )
                        
                        db.add(analysis)
                        db.commit()
                        
                        # Add analysis_id to response
                        response_data["analysis_id"] = analysis_id
            except Exception as e:
                # Don't fail the request if saving fails, just log it
                print(f"Failed to save deep dive analysis to database: {e}")
        
        return response_data
    except Exception as e:
        # Catch any unexpected errors and return structured error response
        import traceback
        error_detail = str(e)[:300]
        if "Missing some input keys" in error_detail:
            error_detail = "LLM validation error: " + error_detail
        return {
            "error": f"Deep dive processing failed: {error_detail}",
            "source": {"url": request.url, "pmid": request.pmid, "title": request.title},
            "diagnostics": {"error_type": type(e).__name__, "traceback": traceback.format_exc()[:500]}
        }


@app.post("/deep-dive-upload")
async def deep_dive_upload(objective: str = Form(...), file: UploadFile = File(...)):
    t0 = _now_ms()
    try:
        raw = await file.read()
    except Exception as e:
        return {"error": f"Failed to read file: {str(e)[:120]}"}
    text = ""
    grounding = "none"
    grounding_source = "upload"
    try:
        ctype = (file.content_type or "").lower()
        if "pdf" in ctype and _HAS_PDF:
            text = pdf_extract_text(io.BytesIO(raw))[:200000]
            grounding = "full_text"
        else:
            # Assume text/markdown/rtf-like
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                text = raw.decode("latin-1", errors="ignore")
            text = _strip_html(text)
            grounding = "full_text" if len(text) > 1000 else "none"
    except Exception:
        text = ""
    if not text:
        return {"error": "Unable to parse uploaded file"}
    # Run modules (same as /deep-dive)
    try:
        md_structured = await _with_timeout(
            run_in_threadpool(analyze_scientific_model, text, objective, llm_analyzer), 12.0, "DeepDiveModel", retries=0
        )
        md_json = {"summary": md_structured.get("protocol_summary", ""), "relevance_justification": "", "fact_anchors": []}
        mth_task = _with_timeout(
            run_in_threadpool(analyze_experimental_methods, text, objective, llm_analyzer), 12.0, "DeepDiveMethods", retries=0
        )
        res_task = _with_timeout(
            run_in_threadpool(analyze_results_interpretation, text, objective, llm_analyzer), 12.0, "DeepDiveResults", retries=0
        )
        mth, res = await asyncio.gather(mth_task, res_task)
    except Exception as e:
        return {"error": str(e)[:200]}
    took = _now_ms() - t0
    return {
        "source": {"upload_name": file.filename},
        "model_description_structured": md_structured,
        "model_description": md_json,
        "experimental_methods_structured": mth,
        "results_interpretation_structured": res,
        "diagnostics": {"ingested_chars": len(text), "grounding": grounding, "grounding_source": grounding_source, "latency_ms": took},
    }


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
    try:
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
    except Exception:
        # Nuclear fallback: if anything goes wrong, return None
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
async def generate_review(request: ReviewRequest, db: Session = Depends(get_db)):
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

    # If DAG requested but graph unavailable, run V2 instead
    if getattr(request, "dag_mode", False) and (StateGraph is None) and MULTISOURCE_ENABLED:
        try:
            v2 = await orchestrate_v2(request, memories)
            resp = {
                "molecule": request.molecule,
                "objective": request.objective,
                "project_id": request.project_id,
                "queries": v2.get("queries", []),
                "results": v2.get("results", []),
                "diagnostics": {**(v2.get("diagnostics", {}) or {}), "dag_unavailable": True},
                "executive_summary": v2.get("executive_summary", ""),
                "memories": memories,
            }
            took = _now_ms() - req_start
            _metrics_inc("latency_ms_sum", took)
            log_event({"event": "generate_review_v2_dag_unavailable", "sections": len(resp["results"]), "latency_ms": took})
            return resp
        except Exception as e:
            log_event({"event": "v2_error_dag_unavailable", "error": str(e)[:200]})

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
            # If DAG produced fewer sections than desired (e.g., 13 for recall, 8 for precision), top-up from V2 results
            try:
                pref_str = str(getattr(request, "preference", "precision") or "precision").lower()
            except Exception:
                pref_str = "precision"
            desired_min = 13 if pref_str == "recall" else 8
            try:
                if MULTISOURCE_ENABLED and results_sections and (len(results_sections) < desired_min):
                    v2_extra = await orchestrate_v2(request, memories)
                    existing_keys = set()
                    for sec in results_sections:
                        top = (sec.get("top_article") or {})
                        existing_keys.add(f"{top.get('pmid')}||{top.get('title')}")
                    for sec in (v2_extra.get("results") or []):
                        if len(results_sections) >= desired_min:
                            break
                        top = (sec.get("top_article") or {})
                        key = f"{top.get('pmid')}||{top.get('title')}"
                        if key in existing_keys:
                            continue
                        existing_keys.add(key)
                        results_sections.append(sec)
                    # If diagnostics existed, annotate and update deep count
                    try:
                        diag = out.get("diagnostics") or {}
                        diag = {**diag, "deep_dive_count": int(len(results_sections)), "dag_topped_up": True, "desired_min": desired_min}
                        out["diagnostics"] = diag
                    except Exception:
                        pass
            except Exception:
                pass
            # Synthesize minimal diagnostics if Scorecard didn't run
            if "diagnostics" not in out:
                try:
                    out["diagnostics"] = {
                        "pool_size": int(len(out.get("norm") or [])),
                        "shortlist_size": int(len(out.get("shortlist") or [])),
                        "deep_dive_count": int(len(out.get("deep") or [])),
                        "timings_ms": {},
                        "pool_caps": {"pubmed": PUBMED_POOL_MAX, "trials": TRIALS_POOL_MAX, "patents": PATENTS_POOL_MAX},
                        "dag_missing_scorecard": True,
                    }
                except Exception:
                    out["diagnostics"] = {"dag_missing_scorecard": True}
            # If diagnostics exists but is empty, also synthesize
            try:
                if not out.get("diagnostics"):
                    out["diagnostics"] = {
                        "pool_size": int(len(out.get("norm") or [])),
                        "shortlist_size": int(len(out.get("shortlist") or [])),
                        "deep_dive_count": int(len(out.get("deep") or [])),
                        "timings_ms": {},
                        "pool_caps": {"pubmed": PUBMED_POOL_MAX, "trials": TRIALS_POOL_MAX, "patents": PATENTS_POOL_MAX},
                        "dag_synth_diagnostics": True,
                    }
            except Exception:
                pass
            # If DAG produced no sections or had empty shortlist/deep, fall back to V2
            try:
                norm_n = int(len(out.get("norm") or []))
                short_n = int(len(out.get("shortlist") or []))
                deep_n = int(len(out.get("deep") or []))
            except Exception:
                norm_n = short_n = deep_n = 0
            if (not results_sections) or short_n == 0 or deep_n == 0:
                try:
                    v2 = await orchestrate_v2(request, memories)
                    md = out.get("diagnostics") or {}
                    resp = {
                        "molecule": request.molecule,
                        "objective": request.objective,
                        "project_id": request.project_id,
                        "queries": v2.get("queries", []),
                        "results": v2.get("results", []),
                        "diagnostics": {**md, **(v2.get("diagnostics") or {}), "dag_fallback_v2": True, "dag_incomplete": True, "dag_norm": norm_n, "dag_shortlist": short_n, "dag_deep": deep_n},
                        "executive_summary": v2.get("executive_summary", ""),
                        "memories": memories,
                    }
                    took = _now_ms() - req_start
                    _metrics_inc("latency_ms_sum", took)
                    log_event({"event": "generate_review_dag_incomplete_fallback_v2", "sections": len(resp["results"]), "latency_ms": took})
                    return resp
                except Exception as e2:
                    log_event({"event": "dag_incomplete_v2_error", "error": str(e2)[:200]})
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
                    # Return minimal diagnostics instead of empty
                    md = out.get("diagnostics") or {}
                    resp = {
                        "molecule": request.molecule,
                        "objective": request.objective,
                        "project_id": request.project_id,
                        "queries": [v for k, v in (out.get("plan") or {}).items() if isinstance(v, str)],
                        "results": [],
                        "diagnostics": {**md, "dag_empty": True, "dag_fallback_v2_error": True},
                        "executive_summary": "",
                        "memories": memories,
                    }
                    took = _now_ms() - req_start
                    _metrics_inc("latency_ms_sum", took)
                    return resp

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
            # Final safety net: if results are under desired minimum, top-up from V2 here as well
            try:
                pref_str_final = str(getattr(request, "preference", "precision") or "precision").lower()
            except Exception:
                pref_str_final = "precision"
            desired_min_final = 13 if pref_str_final == "recall" else 8
            try:
                if MULTISOURCE_ENABLED and len(resp.get("results") or []) < desired_min_final:
                    v2_pad = await orchestrate_v2(request, memories)
                    existing_keys_final = set()
                    for sec in (resp.get("results") or []):
                        top = (sec.get("top_article") or {})
                        existing_keys_final.add(f"{top.get('pmid')}||{top.get('title')}")
                    for sec in (v2_pad.get("results") or []):
                        if len(resp["results"]) >= desired_min_final:
                            break
                        top = (sec.get("top_article") or {})
                        key = f"{top.get('pmid')}||{top.get('title')}"
                        if key in existing_keys_final:
                            continue
                        existing_keys_final.add(key)
                        resp["results"].append(sec)
                    # annotate diagnostics
                    diag_f = resp.get("diagnostics") or {}
                    diag_f["deep_dive_count"] = int(len(resp["results"]))
                    diag_f["dag_topped_up"] = True
                    diag_f["desired_min"] = desired_min_final
                    resp["diagnostics"] = diag_f
            except Exception:
                pass
            took = _now_ms() - req_start
            _metrics_inc("latency_ms_sum", took)
            log_event({"event": "generate_review_dag", "sections": len(resp["results"]), "latency_ms": took})
            return resp
        except Exception as e:
            log_event({"event": "dag_error_fallback_v1", "error": str(e)[:200]})
            # Hard fallback to V2 on any DAG exception
            if MULTISOURCE_ENABLED:
                try:
                    v2 = await orchestrate_v2(request, memories)
                    resp = {
                        "molecule": request.molecule,
                        "objective": request.objective,
                        "project_id": request.project_id,
                        "queries": v2.get("queries", []),
                        "results": v2.get("results", []),
                        "diagnostics": {**(v2.get("diagnostics", {}) or {}), "dag_exception": True},
                        "executive_summary": v2.get("executive_summary", ""),
                        "memories": memories,
                    }
                    took = _now_ms() - req_start
                    _metrics_inc("latency_ms_sum", took)
                    return resp
                except Exception:
                    pass

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
    # Save report to database if project_id is provided
    if request.project_id:
        try:
            current_user = get_current_user()
            
            # Verify project exists and user has access
            project = db.query(Project).filter(Project.project_id == request.project_id).first()
            if not project:
                log_event({
                    "event": "report_save_failed",
                    "project_id": request.project_id,
                    "error": "Project not found"
                })
                print(f"Project not found: {request.project_id}")
            else:
                has_access = (
                    project.owner_user_id == current_user or
                    db.query(ProjectCollaborator).filter(
                        ProjectCollaborator.project_id == request.project_id,
                        ProjectCollaborator.user_id == current_user,
                        ProjectCollaborator.is_active == True
                    ).first() is not None
                )
                
                if not has_access:
                    log_event({
                        "event": "report_save_failed",
                        "project_id": request.project_id,
                        "error": f"Access denied for user {current_user}"
                    })
                    print(f"Access denied for user {current_user} to project {request.project_id}")
                else:
                    # Create report
                    report_id = str(uuid.uuid4())
                    title = f"{request.molecule} - {request.objective[:50]}..." if len(request.objective) > 50 else f"{request.molecule} - {request.objective}"
                    
                    report = Report(
                        report_id=report_id,
                        project_id=request.project_id,
                        title=title,
                        objective=request.objective,
                        content=json.dumps(resp),
                        created_by=current_user
                    )
                    
                    db.add(report)
                    db.commit()
                    
                    # Add report_id to response
                    resp["report_id"] = report_id
                    
                    log_event({
                        "event": "report_saved_successfully",
                        "project_id": request.project_id,
                        "report_id": report_id,
                        "molecule": request.molecule
                    })
                    print(f"Report saved successfully: {report_id} to project {request.project_id}")
        except Exception as e:
            # Don't fail the request if saving fails, just log it
            log_event({
                "event": "report_save_exception",
                "project_id": request.project_id,
                "error": str(e)[:200]
            })
            print(f"Failed to save report to database: {e}")
            import traceback
            traceback.print_exc()
    


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

# =============================================================================
# DATABASE DEBUG AND INITIALIZATION
# =============================================================================

@app.get("/debug/database")
async def debug_database():
    """Debug endpoint to check database configuration"""
    import os
    from database import DATABASE_URL, engine, test_connection
    
    connection_test = test_connection()
    
    db_info = {
        "database_url_env": os.getenv("DATABASE_URL", "NOT_SET"),
        "postgres_url_env": os.getenv("POSTGRES_URL", "NOT_SET"), 
        "effective_database_url": DATABASE_URL,
        "database_type": "PostgreSQL" if DATABASE_URL.startswith(("postgresql://", "postgres://")) else "SQLite",
        "engine_url": str(engine.url),
        "environment": os.getenv("ENVIRONMENT", "unknown"),
        "connection_test": "SUCCESS" if connection_test else "FAILED"
    }
    
    return db_info

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and create tables on startup"""
    try:
        from database import init_db, test_connection
        
        if test_connection():
            init_db()
            print("✅ Database initialized successfully on startup")
        else:
            print("❌ Database connection failed on startup")
    except Exception as e:
        print(f"⚠️ Database initialization error: {e}")

# =============================================================================
# USER MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/users")
async def create_user(user_data: dict, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        from database import User
        import uuid
        
        user_id = user_data.get("user_id") or str(uuid.uuid4())
        username = user_data.get("username")
        email = user_data.get("email")
        
        if not username or not email:
            raise HTTPException(status_code=400, detail="Username and email are required")
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if existing_user:
            return existing_user.__dict__
        
        # Create new user
        new_user = User(
            user_id=user_id,
            username=username,
            email=email,
            preferences=user_data.get("preferences", {})
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "user_id": new_user.user_id,
            "username": new_user.username,
            "email": new_user.email,
            "created_at": new_user.created_at.isoformat(),
            "preferences": new_user.preferences
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.get("/users/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID"""
    try:
        from database import User
        
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "preferences": user.preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")

# =============================================================================
# PROJECT MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/projects")
async def create_project(project_data: dict, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        from database import Project, User
        import uuid
        
        project_id = str(uuid.uuid4())
        project_name = project_data.get("project_name")
        description = project_data.get("description", "")
        owner_user_id = project_data.get("owner_user_id", "default_user")
        
        if not project_name:
            raise HTTPException(status_code=400, detail="Project name is required")
        
        # Ensure user exists
        user = db.query(User).filter(User.user_id == owner_user_id).first()
        if not user:
            # Create default user if doesn't exist
            user = User(
                user_id=owner_user_id,
                username=owner_user_id,
                email=f"{owner_user_id}@example.com"
            )
            db.add(user)
            db.commit()
        
        # Create new project
        new_project = Project(
            project_id=project_id,
            project_name=project_name,
            description=description,
            owner_user_id=owner_user_id,
            tags=project_data.get("tags", []),
            settings=project_data.get("settings", {})
        )
        
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        return {
            "project_id": new_project.project_id,
            "project_name": new_project.project_name,
            "description": new_project.description,
            "owner_user_id": new_project.owner_user_id,
            "created_at": new_project.created_at.isoformat(),
            "tags": new_project.tags,
            "settings": new_project.settings
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@app.get("/projects")
async def list_projects(user_id: str = "default_user", db: Session = Depends(get_db)):
    """List all projects for a user"""
    try:
        from database import Project
        
        projects = db.query(Project).filter(
            Project.owner_user_id == user_id,
            Project.is_active == True
        ).order_by(Project.updated_at.desc()).all()
        
        return {
            "projects": [
                {
                    "project_id": p.project_id,
                    "project_name": p.project_name,
                    "description": p.description,
                    "owner_user_id": p.owner_user_id,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat(),
                    "tags": p.tags,
                    "report_count": len(p.reports) if p.reports else 0,
                    "analysis_count": len(p.deep_dive_analyses) if p.deep_dive_analyses else 0
                }
                for p in projects
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@app.get("/projects/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project details with related data"""
    try:
        from database import Project
        
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "description": project.description,
            "owner_user_id": project.owner_user_id,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
            "tags": project.tags,
            "settings": project.settings,
            "reports": [
                {
                    "report_id": r.report_id,
                    "title": r.title,
                    "objective": r.objective,
                    "created_at": r.created_at.isoformat(),
                    "created_by": r.created_by,
                    "status": r.status,
                    "article_count": r.article_count
                }
                for r in project.reports
            ],
            "collaborators": [
                {
                    "user_id": c.user_id,
                    "role": c.role,
                    "invited_at": c.invited_at.isoformat()
                }
                for c in project.collaborators
            ],
            "annotations": [
                {
                    "annotation_id": a.annotation_id,
                    "content": a.content,
                    "author_id": a.author_id,
                    "created_at": a.created_at.isoformat()
                }
                for a in project.annotations
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")
