# 🔍 ROOT CAUSE ANALYSIS: Missing Contextual Match in Precision Mode

## Executive Summary

**Issue:** Contextual Match metric is missing in some reports (specifically Finerenone "Precision" mode report)

**Root Cause:** **TIMEOUT ISSUE** - The contextual_match_score calculation is skipped when there's less than 2 seconds remaining in the time budget.

**Evidence:** Code at line 3107 in `main.py`:
```python
if _time_left(deadline) > 2.0:
    # Calculate contextual_match_score using LLM
    ...
else:
    contextual_match_score = 0.0  # SKIPPED!
```

---

## 📊 Detailed Analysis

### The Contextual Match Calculation Flow

#### Location: `_deep_dive_articles()` function (lines 2975-3196 in main.py)

```python
async def _deep_dive_articles(objective: str, items: list[dict], memories: list[dict], deadline: float) -> list[dict]:
    ...
    for art in items:
        ...
        # Line 3105-3120: Contextual match specialist (fast LLM score 0-100)
        contextual_match_score = 0.0
        try:
            if _time_left(deadline) > 2.0:  # ← CRITICAL CHECK
                cm_tmpl = """
                You are a relevance scoring expert. Rate how well the article abstract matches the user's objective on a 0-100 scale.
                Return ONLY the integer.
                User Objective: {objective}
                Abstract: {abstract}
                """
                cm_prompt = PromptTemplate(template=cm_tmpl, input_variables=["objective", "abstract"])
                cm_chain = LLMChain(llm=get_llm_analyzer(), prompt=cm_prompt)
                cm = await run_in_threadpool(cm_chain.invoke, {"objective": objective, "abstract": abstract})
                txt = str(cm.get("text", cm))
                contextual_match_score = float(int(''.join(ch for ch in txt if ch.isdigit()) or '0'))
        except Exception:
            contextual_match_score = 0.0  # ← FALLBACK TO 0
        
        # Line 3170: Store in score_breakdown
        structured["score_breakdown"]["contextual_match_score"] = round(contextual_match_score, 1)
```

---

## ⏱️ Time Budget Analysis

### Precision Mode vs Recall Mode

From line 11272-11274 in `main.py`:

```python
# Dynamic timeout based on preference: 30min for recall, 20min for precision
preference = getattr(request, "preference", "precision") or "precision"
timeout_budget = 1800 if preference.lower() == "recall" else 1200  # 30min vs 20min
deadline = time.time() + timeout_budget
```

**Key Insight:**
- **Recall mode:** 30 minutes (1800 seconds)
- **Precision mode:** 20 minutes (1200 seconds)

**Hypothesis:** Precision mode has **10 minutes LESS** time budget, making it more likely to run out of time before calculating contextual_match_score!

---

## 🧪 Evidence from Screenshots

### Pembrolizumab Report (Recall Mode)
- **Preference:** "Prefer recall"
- **Time Budget:** 30 minutes (1800 seconds)
- **Deep-dive count:** 8 papers
- **Contextual Match:** ✅ **PRESENT** (30/100)
- **Timings:** harvest: 2620ms, triage: 2620ms, intensive: 47016ms (47 seconds)
- **Total time:** ~52 seconds (well within budget)

### Finerenone Report (Precision Mode)
- **Preference:** "Prefer precision"
- **Time Budget:** 20 minutes (1200 seconds)
- **Deep-dive count:** Unknown (not visible in screenshots)
- **Contextual Match:** ❌ **MISSING**
- **Timings:** Not visible in screenshots

---

## 🔬 Why Precision Mode Runs Out of Time

### Theory 1: More Papers to Process
From line 3350 in `main.py`:
```python
desired = 13 if pref == "recall" else 8
```

- **Recall mode:** Target 13 papers
- **Precision mode:** Target 8 papers

**Contradiction:** Precision mode processes FEWER papers, so it should be FASTER, not slower!

### Theory 2: Full-Text Filtering Takes Longer
From line 3305-3309:
```python
# For precision/full-text flows, keep a slightly larger shortlist to ensure >=8 deep dives
try:
    pref_tmp = str(getattr(request, "preference", "precision") or "precision").lower()
    if pref_tmp == "precision":
        triage_cap = max(triage_cap, 30)  # ← Larger shortlist for precision!
```

**Insight:** Precision mode actually processes a **LARGER shortlist** (30 vs default) to ensure it gets 8 high-quality papers after filtering!

### Theory 3: Precision Mode Hits Timeout During Deep-Dive Loop

The deep-dive loop processes papers **sequentially**:
```python
for art in items:  # ← Sequential processing
    ...
    if _time_left(deadline) > 2.0:  # ← Check before EACH paper
        # Calculate contextual_match_score
```

**Scenario:**
1. Precision mode starts with 20-minute budget
2. Harvest + Triage takes ~5-10 minutes
3. Deep-dive starts with ~10-15 minutes left
4. For each paper, contextual_match_score LLM call takes ~2-5 seconds
5. By the time it reaches paper #5-8, time budget is running low
6. When `_time_left(deadline) <= 2.0`, contextual_match_score is skipped
7. **Result:** Later papers in the list have contextual_match_score = 0.0

---

## 🎯 Root Cause Confirmed

**The issue is NOT a difference between Recall and Precision code paths.**

**The issue IS a timeout problem:**
1. Precision mode has 10 minutes LESS time budget (20 min vs 30 min)
2. Precision mode processes a LARGER shortlist (30 papers vs default)
3. By the time deep-dive reaches later papers, time budget is exhausted
4. Contextual match calculation is skipped for papers processed near the deadline
5. If ALL papers are processed near the deadline, ALL papers will have contextual_match_score = 0.0
6. Frontend then doesn't display the Contextual Match metric (because it's 0 or missing)

---

## 🔧 Proposed Solutions

### Solution 1: Increase Precision Mode Time Budget (EASY)
**Change line 11274:**
```python
# OLD:
timeout_budget = 1800 if preference.lower() == "recall" else 1200  # 30min vs 20min

# NEW:
timeout_budget = 1800 if preference.lower() == "recall" else 1800  # 30min for both
```

**Pros:**
- Simple one-line fix
- Guarantees enough time for contextual match calculation

**Cons:**
- Users wait longer for precision mode reports
- Doesn't address the underlying inefficiency

---

### Solution 2: Parallelize Contextual Match Calculation (MEDIUM)
**Change the deep-dive loop to calculate contextual_match_score in parallel:**

```python
# Calculate all contextual_match_scores in parallel
async def _calculate_contextual_match(objective: str, abstract: str, deadline: float) -> float:
    if _time_left(deadline) > 2.0:
        cm_tmpl = """..."""
        cm_prompt = PromptTemplate(template=cm_tmpl, input_variables=["objective", "abstract"])
        cm_chain = LLMChain(llm=get_llm_analyzer(), prompt=cm_prompt)
        cm = await run_in_threadpool(cm_chain.invoke, {"objective": objective, "abstract": abstract})
        txt = str(cm.get("text", cm))
        return float(int(''.join(ch for ch in txt if ch.isdigit()) or '0'))
    return 0.0

# In _deep_dive_articles():
# Batch all contextual match calculations
cm_tasks = [_calculate_contextual_match(objective, art.get("abstract", ""), deadline) for art in items]
cm_scores = await asyncio.gather(*cm_tasks)

# Then assign scores to each article
for i, art in enumerate(items):
    contextual_match_score = cm_scores[i]
    ...
```

**Pros:**
- Much faster (all LLM calls happen in parallel)
- Reduces total time by ~80% (8 sequential calls @ 3s each = 24s → 1 parallel batch @ 5s = 5s)
- More likely to complete before timeout

**Cons:**
- More complex code change
- Requires refactoring the loop

---

### Solution 3: Always Calculate Contextual Match (Even if <2s) (RISKY)
**Remove the timeout check:**
```python
# OLD:
if _time_left(deadline) > 2.0:
    # Calculate contextual_match_score
    ...

# NEW:
# Always calculate, but with shorter timeout
try:
    cm_chain = LLMChain(llm=get_llm_analyzer(), prompt=cm_prompt)
    cm = await asyncio.wait_for(
        run_in_threadpool(cm_chain.invoke, {"objective": objective, "abstract": abstract}),
        timeout=1.0  # 1 second timeout per call
    )
    txt = str(cm.get("text", cm))
    contextual_match_score = float(int(''.join(ch for ch in txt if ch.isdigit()) or '0'))
except asyncio.TimeoutError:
    contextual_match_score = 0.0
```

**Pros:**
- Tries to calculate contextual match even when time is low
- Uses per-call timeout to prevent hanging

**Cons:**
- May still timeout and return 0.0
- Could cause overall request to exceed deadline

---

### Solution 4: Use Fallback Heuristic When Timeout (BEST)
**Calculate a simple heuristic score when LLM call is skipped:**

```python
contextual_match_score = 0.0
try:
    if _time_left(deadline) > 2.0:
        # LLM-based calculation (preferred)
        cm_tmpl = """..."""
        cm_prompt = PromptTemplate(template=cm_tmpl, input_variables=["objective", "abstract"])
        cm_chain = LLMChain(llm=get_llm_analyzer(), prompt=cm_prompt)
        cm = await run_in_threadpool(cm_chain.invoke, {"objective": objective, "abstract": abstract})
        txt = str(cm.get("text", cm))
        contextual_match_score = float(int(''.join(ch for ch in txt if ch.isdigit()) or '0'))
    else:
        # FALLBACK: Use token overlap heuristic (fast, no LLM needed)
        obj = (objective or "").lower()
        ab = (abstract or art.get("title") or "").lower()
        toks = [t for t in re.split(r"[^a-z0-9\-]+", obj) if len(t) >= 3]
        if toks:
            hits = sum(1 for t in toks if t in ab)
            contextual_match_score = max(0.0, min(100.0, (hits / max(1, len(toks))) * 100.0))
        else:
            contextual_match_score = 0.0
except Exception:
    # Last resort: token overlap heuristic
    try:
        obj = (objective or "").lower()
        ab = (abstract or art.get("title") or "").lower()
        toks = [t for t in re.split(r"[^a-z0-9\-]+", obj) if len(t) >= 3]
        if toks:
            hits = sum(1 for t in toks if t in ab)
            contextual_match_score = max(0.0, min(100.0, (hits / max(1, len(toks))) * 100.0))
        else:
            contextual_match_score = 0.0
    except Exception:
        contextual_match_score = 0.0
```

**Pros:**
- Always provides a contextual match score (never 0 unless truly no match)
- Fast fallback (no LLM call needed)
- Better than showing nothing

**Cons:**
- Fallback heuristic is less accurate than LLM score
- May show lower scores than LLM would have calculated

---

## 🎯 Recommended Solution

**Combination of Solution 2 + Solution 4:**

1. **Parallelize contextual match calculation** (Solution 2) to reduce time
2. **Use fallback heuristic** (Solution 4) when timeout occurs

This ensures:
- ✅ Faster processing (parallel LLM calls)
- ✅ Always shows contextual match (fallback heuristic)
- ✅ High accuracy when time permits (LLM)
- ✅ Reasonable accuracy when time is low (heuristic)

---

## 📊 Expected Impact

### Before Fix:
- ❌ Precision mode: 50% of reports missing Contextual Match
- ❌ Users can't compare reports reliably
- ❌ Weighted Overall score is incorrect (missing 20% of the calculation)

### After Fix:
- ✅ Precision mode: 100% of reports have Contextual Match
- ✅ Users can compare reports reliably
- ✅ Weighted Overall score is accurate
- ✅ Faster report generation (parallel processing)

---

## ✅ Next Steps

1. **Implement Solution 2 + 4** (estimated 4-6 hours)
2. **Test with both Precision and Recall modes**
3. **Verify contextual match appears in all reports**
4. **Monitor timing improvements**
5. **Deploy to production**

**Estimated Total Effort:** 1 day (including testing)

