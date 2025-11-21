# LLM Optimization Assessment & Cost Analysis

**Date**: November 21, 2025  
**Context**: Evaluating advanced LLM techniques for R-D Agent to avoid cost explosion

---

## 📊 **CURRENT LLM USAGE ANALYSIS**

### Current Architecture

**Models Used**:
- **GPT-4o-mini** (all services) - Cost-effective choice ✅
- Temperature: 0.1-0.5 depending on task
- JSON mode for structured outputs

**Services Using LLM**:

1. **Enhanced AI Triage Service** (`enhanced_ai_triage_service.py`)
   - Model: `gpt-4o-mini`
   - Temperature: `0.5`
   - Calls per paper: **1 call**
   - Input: Abstract + project context (questions, hypotheses)
   - Output: Triage status, relevance score, evidence, reasoning
   - Cache: 7 days TTL ✅

2. **Intelligent Protocol Extractor** (`intelligent_protocol_extractor.py`)
   - Model: `gpt-4o-mini`
   - Temperature: `0.1` (extraction), `0.3` (recommendations)
   - Calls per protocol: **4 calls** (context → extract → score → recommend)
   - Input: Abstract (400 words max) + project context (top 10 Q/H)
   - Output: Enhanced protocol with relevance, insights, recommendations
   - Cache: None (fresh recommendations)

3. **AI Recommendations Service** (`ai_recommendations_service.py`)
   - Model: `gpt-4o-mini`
   - Temperature: `0.3`
   - Cache: 6 hours TTL ✅

### Current Cost Optimizations ✅

1. ✅ **GPT-4o-mini** instead of GPT-4 (10x cheaper)
2. ✅ **Abstract truncation** (400 words max)
3. ✅ **Context limiting** (top 10 questions/hypotheses)
4. ✅ **Caching** (triage: 7 days, recommendations: 6 hours)
5. ✅ **JSON mode** (reliable parsing, no retry loops)
6. ✅ **Low temperature** (0.1-0.5, fewer tokens generated)

---

## 🎯 **ASSESSMENT OF PROPOSED IDEAS**

### 1. LangGraph State Machine

**What it is**: Sophisticated orchestration framework for multi-agent workflows

**Current State**: Already using multi-agent pattern (4 sequential calls in protocol extractor)

**Pros**:
- ✅ Better error handling and retry logic
- ✅ Conditional branching (skip steps if not needed)
- ✅ Parallel execution of independent agents
- ✅ State persistence for debugging
- ✅ Visual workflow graphs

**Cons**:
- ❌ Additional dependency (LangGraph)
- ❌ Learning curve for team
- ❌ Overkill for simple sequential workflows
- ❌ May increase complexity without cost savings

**Cost Impact**: **NEUTRAL** (same number of LLM calls, just better orchestrated)

**Recommendation**: **⏳ DEFER TO WEEK 23 (Integration & Polish)**
- Current sequential approach works fine
- Add LangGraph only if you need:
  - Conditional logic (e.g., skip relevance scoring if protocol extraction fails)
  - Parallel execution (e.g., extract protocol + triage paper simultaneously)
  - Complex retry logic
- **Priority**: LOW (nice-to-have, not critical)

---

### 2. RAG (Retrieval-Augmented Generation)

**What it is**: Retrieve similar past protocols/triages to improve current extraction

**Example Use Cases**:
- "Find 5 similar protocols we've extracted before"
- "Show me how we triaged similar papers in the past"
- "Use past protocols as examples for extraction"

**Pros**:
- ✅ Improve consistency across extractions
- ✅ Learn from past successes
- ✅ Reduce hallucinations (use real examples)
- ✅ Better quality outputs

**Cons**:
- ❌ **INCREASES COST** (embedding generation + vector search + longer prompts)
- ❌ Requires vector database (Pinecone, Weaviate, or pgvector)
- ❌ Embedding costs (OpenAI ada-002: $0.0001/1K tokens)
- ❌ Longer prompts = more input tokens
- ❌ Cold start problem (need good examples first)

**Cost Impact**: **🔴 INCREASES COST BY 20-40%**

**Cost Breakdown**:
- Embedding generation: $0.0001/1K tokens × 1000 protocols = $0.10
- Vector search: Minimal (pgvector is free with PostgreSQL)
- Longer prompts: +500 tokens per call = +$0.0001 per call
- **Total**: +20-40% cost increase

**Recommendation**: **❌ NOT RECOMMENDED FOR NOW**
- Your current system already has evidence-based extraction with source citations
- RAG is most valuable when you have 1000+ high-quality protocols
- You currently have 4 protocols (all low confidence)
- **Wait until you have 100+ high-quality protocols**, then revisit
- **Priority**: LOW (future enhancement after you have data)

**Alternative**: Use simple database queries instead of RAG
```python
# Instead of RAG, just query similar protocols
similar_protocols = db.query(Protocol).filter(
    Protocol.protocol_type == current_type,
    Protocol.extraction_confidence >= 80
).limit(3).all()
```

---

### 3. Fine-Tuned Models

**What it is**: Train custom GPT-4o-mini model on your specific protocol extraction task

**Requirements**:
- Minimum 50-100 labeled examples (protocol extractions)
- Training cost: ~$10-50 per training run
- Inference cost: Same as base model (no savings)

**Pros**:
- ✅ Better quality for specific domain
- ✅ Shorter prompts (model "knows" your format)
- ✅ More consistent outputs
- ✅ Can reduce temperature further (more deterministic)

**Cons**:
- ❌ Requires labeled training data (you don't have this yet)
- ❌ Training cost ($10-50 per run)
- ❌ Maintenance overhead (retrain when format changes)
- ❌ **NO COST SAVINGS** (inference cost same as base model)
- ❌ Risk of overfitting to training data

**Cost Impact**: **🟡 NEUTRAL TO SLIGHTLY HIGHER**
- Training: $10-50 per run
- Inference: Same as GPT-4o-mini
- Shorter prompts: -100 tokens per call = -$0.00002 per call (negligible)

**Recommendation**: **❌ NOT RECOMMENDED FOR NOW**
- You don't have training data yet (only 4 protocols)
- GPT-4o-mini already performs well with good prompts
- Fine-tuning is for mature products with 1000+ examples
- **Wait until you have 500+ high-quality protocols**, then consider
- **Priority**: VERY LOW (future optimization, not needed now)

**When to revisit**:
- You have 500+ protocols with confidence scores
- You notice consistent quality issues
- You want to reduce prompt length significantly
- You have budget for experimentation

---

### 4. Agentic Workflow with Tool Use

**What it is**: Give LLM agents tools to search PubMed, query database, validate protocols

**Example Tools**:
- `search_pubmed(query)` - Search for related papers
- `query_protocols(filters)` - Find similar protocols in DB
- `validate_protocol(protocol)` - Check if protocol is valid
- `get_full_text(pmid)` - Fetch full paper text

**Pros**:
- ✅ Agents can gather more context autonomously
- ✅ Better quality (more information available)
- ✅ Can validate extractions automatically
- ✅ More powerful and flexible

**Cons**:
- ❌ **SIGNIFICANTLY INCREASES COST** (multiple tool calls = multiple LLM calls)
- ❌ Unpredictable cost (agent decides how many tools to use)
- ❌ Slower (sequential tool calls)
- ❌ Requires tool implementation and maintenance
- ❌ Risk of infinite loops or excessive tool use

**Cost Impact**: **🔴 INCREASES COST BY 100-300%**

**Cost Example**:
- Current: 4 LLM calls per protocol = $0.004
- With tools: 4 LLM calls + 3 tool calls × 2 LLM calls each = 10 LLM calls = $0.010
- **Cost increase**: 150%

**Recommendation**: **❌ NOT RECOMMENDED FOR NOW**
- Your current system already has project context (questions, hypotheses)
- You already query the database for context
- Agentic workflows are for complex, open-ended tasks
- Your task is well-defined (extract protocol from abstract)
- **Only consider if you need agents to make complex decisions**
- **Priority**: VERY LOW (overkill for current needs)

**When to revisit**:
- You want agents to autonomously research topics
- You need agents to make complex multi-step decisions
- You have budget for 2-3x cost increase
- You need agents to interact with external APIs

---

## 💰 **COST PROJECTION ANALYSIS**

### Current Cost Structure (GPT-4o-mini pricing)

**Pricing**:
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens

**Per-Operation Costs**:

1. **Triage (1 call)**:
   - Input: ~1500 tokens (abstract + context)
   - Output: ~500 tokens (triage result)
   - Cost: (1500 × $0.15 + 500 × $0.60) / 1M = **$0.00053 per paper**

2. **Protocol Extraction (4 calls)**:
   - Call 1 (Context): 1000 input + 300 output = $0.00033
   - Call 2 (Extract): 2000 input + 800 output = $0.00078
   - Call 3 (Score): 1500 input + 400 output = $0.00047
   - Call 4 (Recommend): 1500 input + 600 output = $0.00059
   - **Total: $0.00217 per protocol**

**Monthly Cost Estimates** (based on usage):

| Scenario | Papers/Month | Protocols/Month | Monthly Cost |
|----------|--------------|-----------------|--------------|
| Light User | 100 | 10 | $0.05 + $0.02 = **$0.07** |
| Medium User | 500 | 50 | $0.27 + $0.11 = **$0.38** |
| Heavy User | 2000 | 200 | $1.06 + $0.43 = **$1.49** |
| Power User | 10000 | 1000 | $5.30 + $2.17 = **$7.47** |

**Annual Cost Estimates**:

| User Type | Annual Cost |
|-----------|-------------|
| Light | **$0.84** |
| Medium | **$4.56** |
| Heavy | **$17.88** |
| Power | **$89.64** |

### Cost Impact of Proposed Ideas

| Idea | Cost Impact | Monthly Cost (Heavy User) |
|------|-------------|---------------------------|
| **Current System** | Baseline | **$1.49** |
| + LangGraph | 0% | $1.49 (same) |
| + RAG | +30% | $1.94 |
| + Fine-Tuning | +5% (training) | $1.56 |
| + Agentic Tools | +150% | $3.73 |
| **All Combined** | +200% | $4.47 |

---

## ✅ **RECOMMENDED OPTIMIZATIONS**

### Immediate (Week 19-20) - **ALREADY DONE** ✅

1. ✅ **Use GPT-4o-mini** (not GPT-4)
2. ✅ **Truncate abstracts** (400 words max)
3. ✅ **Limit context** (top 10 Q/H)
4. ✅ **Cache triage results** (7 days)
5. ✅ **JSON mode** (no retry loops)
6. ✅ **Evidence-based extraction** (no hallucinations)

### Short-Term (Week 21-22) - **RECOMMENDED** 🟢

1. **Add prompt caching** (OpenAI Prompt Caching)
   - Cache system prompts (save 50% on input tokens)
   - Cost savings: **-25% overall**
   - Implementation: 1 hour
   ```python
   response = await client.chat.completions.create(
       model=self.model,
       messages=[
           {"role": "system", "content": system_prompt, "cache_control": {"type": "ephemeral"}},
           {"role": "user", "content": user_prompt}
       ]
   )
   ```

2. **Batch processing** (process multiple papers in one call)
   - Process 5 papers per API call instead of 1
   - Cost savings: **-20% (fewer API calls)**
   - Implementation: 2 hours

3. **Smart caching strategy**
   - Cache protocol extractions (30 days)
   - Cache relevance scores per project (7 days)
   - Cost savings: **-40% for repeat users**

4. **Conditional extraction**
   - Only extract protocols from "must_read" papers
   - Skip protocol extraction for "ignore" papers
   - Cost savings: **-50% on protocol extraction**

### Medium-Term (Week 23) - **CONSIDER** 🟡

1. **LangGraph for conditional workflows**
   - Skip relevance scoring if extraction fails
   - Parallel execution where possible
   - Cost impact: **Neutral** (better orchestration, same calls)

2. **Simple database retrieval** (not full RAG)
   - Query similar protocols from DB
   - No embeddings, just SQL queries
   - Cost impact: **+0%** (no LLM calls)

### Long-Term (Post-Launch) - **DEFER** ⏳

1. **RAG** - Wait until 100+ high-quality protocols
2. **Fine-Tuning** - Wait until 500+ protocols
3. **Agentic Tools** - Only if needed for complex tasks

---

## 🎯 **FINAL RECOMMENDATIONS**

### DO NOW (Week 19-20):
1. ✅ **Keep current architecture** - It's already well-optimized!
2. ✅ **Monitor costs** - Add logging for token usage
3. ✅ **Set budget alerts** - Alert if monthly cost > $10

### DO NEXT (Week 21-22):
1. 🟢 **Add prompt caching** - Easy 25% savings
2. 🟢 **Implement conditional extraction** - Only extract from must_read papers
3. 🟢 **Add token usage dashboard** - Show users their usage

### DON'T DO:
1. ❌ **RAG** - Too early, not enough data
2. ❌ **Fine-Tuning** - Too early, not enough data
3. ❌ **Agentic Tools** - Overkill, 2-3x cost increase

### Cost Target:
- **Current**: $1.49/month for heavy user ✅
- **With optimizations**: $0.75/month for heavy user 🎯
- **Acceptable ceiling**: $5/month for heavy user 📊

---

## 📋 **NEXT STEPS**

1. **Implement prompt caching** (Week 21)
2. **Add conditional extraction** (Week 21)
3. **Monitor token usage** (Week 21-22)
4. **Revisit RAG/Fine-Tuning** after 100+ protocols (Post-launch)

**Your current system is already well-optimized! Focus on features, not premature optimization.** 🚀

