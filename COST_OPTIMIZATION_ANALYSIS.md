# 💰 Cost Optimization Analysis & Strategy

**Date:** November 12, 2025  
**Current Monthly Costs:** ~£30.20 (£0.61 Gemini API + £0.41 Cloud Run + £45.84 Artifact Registry - £16.90 savings)  
**Projected Costs at Scale:** $500-2000/month (10x-100x user growth)

---

## 📊 CURRENT COST BREAKDOWN

### **Google Cloud Platform**
Based on your screenshots:

| Service | Current Cost | % Change | Notes |
|---------|-------------|----------|-------|
| **Artifact Registry** | £45.84/month | +23% | ⚠️ **HIGHEST COST** - Docker image storage |
| **Gemini API** | £0.61/month | -71% | ✅ Very low - good optimization |
| **Cloud Run** | £0.41/month | -97% | ✅ Minimal usage (likely staging/test) |
| **Secret Manager** | £0.04/month | -20% | ✅ Negligible |
| **Total GCP** | **£46.90/month** | | After £16.90 savings |

### **Other Infrastructure (Estimated)**
| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| **Railway (Backend)** | $5-20/month | Free tier or Hobby plan |
| **Vercel (Frontend)** | $0-20/month | Free tier (likely) |
| **Supabase (Database)** | $0-25/month | Free tier or Pro |
| **OpenAI API** | $10-100/month | GPT-4o + GPT-4o-mini calls |
| **Pinecone (Vector DB)** | $0-70/month | Free tier or Starter |
| **Total Estimated** | **$15-235/month** | **~$50-100/month realistic** |

### **🎯 TOTAL CURRENT MONTHLY COST: ~$70-120/month**

---

## 🚨 CRITICAL COST RISKS AT SCALE

### **1. LLM API Costs (HIGHEST RISK)**

**Current Usage Pattern:**
- **GPT-4o** (main model): $15/1M input tokens, $60/1M output tokens
- **GPT-4o-mini** (analyzer): $0.15/1M input tokens, $0.60/1M output tokens
- **Gemini 1.5 Flash**: Very cheap (£0.61/month currently)

**LLM Call Frequency (from code analysis):**
```python
# Per research query (main.py):
- Query generation: 1 LLM call (analyzer)
- Summarization: 1-10 LLM calls (summary model) per article
- Contextual matching: 1-50 LLM calls (analyzer) in parallel
- Critic/refine: 1 LLM call (critic) per summary
- Deep dive analysis: 3-6 LLM calls (analyzer) per paper
- Report generation: 5-10 LLM calls (summary model)

# Estimated per user per day:
- 5 research queries = 50-100 LLM calls
- 2 deep dives = 6-12 LLM calls
- 1 report = 10 LLM calls
# TOTAL: ~70-120 LLM calls/user/day
```

**Cost Projection:**
| Users | Daily LLM Calls | Monthly Tokens | GPT-4o Cost | GPT-4o-mini Cost |
|-------|----------------|----------------|-------------|------------------|
| 10 | 1,000 | 50M in + 10M out | $1,350 | $13.50 |
| 100 | 10,000 | 500M in + 100M out | $13,500 | $135 |
| 1,000 | 100,000 | 5B in + 1B out | $135,000 | $1,350 |

**⚠️ AT 100 USERS: $13,500/month on GPT-4o OR $135/month on GPT-4o-mini**

---

### **2. Database Query Costs (MEDIUM RISK)**

**Current Issues (from code analysis):**
- ❌ **N+1 Query Problem**: Multiple sequential database queries
- ❌ **No Query Result Caching**: Same queries repeated
- ❌ **Missing Indexes**: Slow queries on large tables
- ❌ **No Connection Pooling Optimization**: Potential connection exhaustion

**Supabase Pricing:**
- Free tier: 500MB database, 2GB bandwidth, 50,000 monthly active users
- Pro tier: $25/month - 8GB database, 250GB bandwidth
- **At scale**: $25-100/month depending on data volume

---

### **3. Vercel Bandwidth Costs (MEDIUM RISK)**

**Current**: Likely on free tier (100GB bandwidth/month)

**At Scale:**
- 100 users × 1GB/month = 100GB (still free)
- 1,000 users × 1GB/month = 1TB = **$400/month** ($0.40/GB over 100GB)

---

### **4. Railway Backend Costs (LOW-MEDIUM RISK)**

**Current**: Likely $5-20/month (Hobby plan)

**At Scale:**
- Pro plan: $20/month + usage
- **At 1,000 users**: $50-150/month

---

## 💡 OPTIMIZATION STRATEGIES

### **🔥 IMMEDIATE ACTIONS (Save $50-200/month)**

#### **1. Delete Unused Docker Images from Artifact Registry**
**Impact**: Save £30-40/month (~$40-50)  
**Effort**: 10 minutes  
**Risk**: None

```bash
# List all images
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/rd-agent-staging/rd-frontend \
  --include-tags

# Delete old images (keep last 3)
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/rd-agent-staging/rd-frontend/IMAGE:TAG \
  --delete-tags --quiet

# Or use lifecycle policy
gcloud artifacts repositories set-cleanup-policies rd-frontend \
  --location=us-central1 \
  --policy=keep-minimum-versions.json
```

**keep-minimum-versions.json:**
```json
{
  "rules": [{
    "action": {"type": "Delete"},
    "condition": {
      "olderThan": "30d",
      "versionNamePrefixes": [""],
      "packageNamePrefixes": [""]
    }
  }]
}
```

---

#### **2. Switch Primary LLM from GPT-4o to GPT-4o-mini**
**Impact**: Save $13,365/month at 100 users (99% cost reduction)  
**Effort**: 5 minutes  
**Risk**: Slight quality reduction (test first)

```python
# In main.py, change default models:
OPENAI_MODEL=gpt-4o-mini  # Instead of gpt-4o
OPENAI_MAIN_MODEL=gpt-4o-mini  # Instead of gpt-4o
OPENAI_SMALL_MODEL=gpt-4o-mini  # Keep as is

# Keep GPT-4o only for critical operations:
# - Final report generation
# - Complex deep dive analysis
```

**Testing Strategy:**
1. Deploy to staging with GPT-4o-mini
2. Run 10 test queries comparing quality
3. If acceptable, deploy to production
4. Monitor user feedback for 1 week

---

#### **3. Implement Response Caching**
**Impact**: Save 30-50% of LLM costs ($4,000-6,750/month at 100 users)  
**Effort**: 2-4 hours  
**Risk**: Low (improves performance)

```python
# Add to main.py
import hashlib
from functools import lru_cache
import redis

# Option 1: In-memory cache (simple, fast)
@lru_cache(maxsize=1000)
def cached_llm_call(prompt_hash: str, prompt: str, model: str):
    """Cache LLM responses for identical prompts"""
    llm = get_llm() if model == "main" else get_llm_analyzer()
    return llm.invoke(prompt)

# Option 2: Redis cache (persistent, scalable)
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cached_llm_call_redis(prompt: str, model: str, ttl: int = 3600):
    """Cache LLM responses in Redis with TTL"""
    cache_key = f"llm:{model}:{hashlib.md5(prompt.encode()).hexdigest()}"
    
    # Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Call LLM
    llm = get_llm() if model == "main" else get_llm_analyzer()
    result = llm.invoke(prompt)
    
    # Store in cache
    redis_client.setex(cache_key, ttl, json.dumps(result))
    return result
```

---

#### **4. Implement Database Query Optimization**
**Impact**: Save 20-30% database costs + improve performance  
**Effort**: 4-6 hours  
**Risk**: Low (requires testing)

```python
# Fix N+1 queries with eager loading
from sqlalchemy.orm import joinedload

# BEFORE (N+1 problem):
project = db.query(Project).filter(Project.project_id == project_id).first()
collections = db.query(Collection).filter(Collection.project_id == project_id).all()
for collection in collections:
    articles = db.query(Article).filter(Article.collection_id == collection.id).all()

# AFTER (single query):
project = db.query(Project).options(
    joinedload(Project.collections).joinedload(Collection.articles)
).filter(Project.project_id == project_id).first()

# Add query result caching
from cachetools import TTLCache
query_cache = TTLCache(maxsize=1000, ttl=300)  # 5 minutes

def get_project_with_collections(project_id: str, db: Session):
    cache_key = f"project:{project_id}"
    if cache_key in query_cache:
        return query_cache[cache_key]
    
    result = db.query(Project).options(
        joinedload(Project.collections),
        joinedload(Project.articles)
    ).filter(Project.project_id == project_id).first()
    
    query_cache[cache_key] = result
    return result
```

---

### **📈 MEDIUM-TERM ACTIONS (Save $100-500/month)**

#### **5. Implement Prompt Optimization**
**Impact**: Reduce token usage by 20-40%  
**Effort**: 8-12 hours  
**Risk**: Low (improves quality)

**Strategy:**
- Reduce prompt verbosity
- Use structured outputs (JSON mode)
- Implement prompt templates
- Remove redundant context

---

#### **6. Add Rate Limiting & Throttling**
**Impact**: Prevent cost spikes from abuse  
**Effort**: 4-6 hours  
**Risk**: Low

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/generate-report")
@limiter.limit("10/hour")  # 10 reports per hour per user
async def generate_report(request: Request, ...):
    ...
```

---

#### **7. Migrate to Cheaper LLM Providers**
**Impact**: Save 50-90% on LLM costs  
**Effort**: 16-24 hours  
**Risk**: Medium (quality testing required)

**Options:**
| Provider | Model | Cost (1M tokens) | vs GPT-4o |
|----------|-------|------------------|-----------|
| **Anthropic** | Claude 3.5 Sonnet | $3 in / $15 out | -80% |
| **Google** | Gemini 1.5 Flash | $0.075 in / $0.30 out | -99% |
| **Cerebras** | Llama 3.1 70B | $0.60 in / $0.60 out | -96% |
| **Groq** | Llama 3.1 70B | $0.59 in / $0.79 out | -96% |

**You already have Cerebras API key in .env.railway!**

```python
# Add Cerebras as fallback
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

def get_llm_with_fallback():
    """Try Cerebras first, fallback to OpenAI"""
    try:
        if CEREBRAS_API_KEY:
            return ChatCerebras(
                model="llama3.1-70b",
                api_key=CEREBRAS_API_KEY,
                temperature=0.3
            )
    except:
        pass
    return get_llm()  # OpenAI fallback
```

---

### **🚀 LONG-TERM ACTIONS (Save $500-2000/month)**

#### **8. Implement Semantic Caching**
**Impact**: 60-80% cache hit rate = massive savings  
**Effort**: 16-24 hours

Use vector similarity to cache semantically similar queries.

---

#### **9. Self-Host Open Source LLMs**
**Impact**: $0 per token (only infrastructure costs)  
**Effort**: 40-80 hours  
**Risk**: High (requires ML ops expertise)

**Options:**
- Llama 3.1 70B on AWS/GCP GPU instances
- vLLM for efficient serving
- Cost: $500-1500/month for GPU instance vs $10,000+/month for API calls

---

## 📋 IMPLEMENTATION ROADMAP

### **Week 1: Quick Wins**
- [ ] Delete old Docker images from Artifact Registry
- [ ] Switch to GPT-4o-mini for non-critical operations
- [ ] Implement basic LLM response caching (in-memory)
- [ ] Add rate limiting to expensive endpoints

**Expected Savings:** $50-200/month

### **Week 2-3: Database & Query Optimization**
- [ ] Fix N+1 query problems
- [ ] Add database query result caching
- [ ] Implement connection pooling optimization
- [ ] Add database indexes

**Expected Savings:** $20-50/month + performance boost

### **Week 4-6: LLM Provider Diversification**
- [ ] Integrate Cerebras API (you already have the key!)
- [ ] Test Gemini 1.5 Flash for simple tasks
- [ ] Implement LLM fallback chain
- [ ] A/B test quality vs cost

**Expected Savings:** $100-500/month

### **Month 2-3: Advanced Optimization**
- [ ] Implement semantic caching
- [ ] Optimize prompts for token efficiency
- [ ] Add comprehensive monitoring & alerting
- [ ] Implement cost attribution per user

**Expected Savings:** $200-1000/month

---

## 🎯 COST TARGETS

| User Count | Current Projected Cost | Optimized Cost | Savings |
|------------|----------------------|----------------|---------|
| **10 users** | $150/month | $50/month | 67% |
| **100 users** | $13,600/month | $500/month | 96% |
| **1,000 users** | $136,000/month | $5,000/month | 96% |

---

## 📊 MONITORING & ALERTS

### **Set Up Cost Alerts**
```bash
# Google Cloud Budget Alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Monthly Budget Alert" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### **Track LLM Usage**
```python
# Add to main.py
LLM_USAGE_METRICS = {
    "total_calls": 0,
    "total_input_tokens": 0,
    "total_output_tokens": 0,
    "estimated_cost": 0.0
}

def track_llm_usage(input_tokens: int, output_tokens: int, model: str):
    """Track LLM usage and costs"""
    LLM_USAGE_METRICS["total_calls"] += 1
    LLM_USAGE_METRICS["total_input_tokens"] += input_tokens
    LLM_USAGE_METRICS["total_output_tokens"] += output_tokens
    
    # Calculate cost based on model
    if model == "gpt-4o":
        cost = (input_tokens / 1_000_000 * 15) + (output_tokens / 1_000_000 * 60)
    elif model == "gpt-4o-mini":
        cost = (input_tokens / 1_000_000 * 0.15) + (output_tokens / 1_000_000 * 0.60)
    
    LLM_USAGE_METRICS["estimated_cost"] += cost

@app.get("/metrics/llm-usage")
async def get_llm_usage():
    return LLM_USAGE_METRICS
```

---

## ✅ NEXT STEPS

1. **Review this analysis** with your team
2. **Prioritize optimizations** based on impact vs effort
3. **Start with Week 1 quick wins** (immediate savings)
4. **Monitor costs daily** during optimization
5. **Test quality** after each change

**Would you like me to implement any of these optimizations now?**

