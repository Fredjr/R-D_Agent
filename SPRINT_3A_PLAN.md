# 🎯 SPRINT 3A: EXPLAINABILITY API V1

**Sprint**: 3A - Explainability API V1  
**Duration**: Week 3, Days 1-3  
**Target Start**: October 25, 2025  
**Status**: 🔄 IN PROGRESS

---

## 📋 OBJECTIVES

Build an explainability system that generates "why shown" explanations for paper recommendations, making the discovery engine transparent and trustworthy.

**Core Goal**: Every recommended paper should have a clear, understandable explanation of why it was shown to the user.

---

## 🎯 KEY DELIVERABLES

### 1. Explanation Service
**File**: `services/explanation_service.py`

**Features**:
- Generate explanations for paper recommendations
- 5 explanation types:
  1. **Semantic Similarity** - "Similar to papers you've viewed"
  2. **Citation Network** - "Cited by papers in your collection"
  3. **Cluster Membership** - "Part of the same research cluster"
  4. **Author Connection** - "By authors you follow"
  5. **Temporal Relevance** - "Recent work in your area"
- Confidence scoring (0.0-1.0)
- Multi-factor explanations (combine multiple reasons)
- Explanation caching

### 2. Explanation API
**File**: `api/explanations.py`

**Endpoints**:
1. `POST /api/v1/explanations/generate` - Generate explanation for a paper
2. `POST /api/v1/explanations/batch` - Generate explanations for multiple papers
3. `GET /api/v1/explanations/{paper_id}` - Get cached explanation
4. `GET /api/v1/explanations/stats` - Get explanation statistics

### 3. Explanation Database Model
**File**: `database.py` (update)

**New Model**: `PaperExplanation`
- `id` (primary key)
- `paper_pmid` (foreign key to Article)
- `user_id` (user who received explanation)
- `explanation_type` (semantic, citation, cluster, author, temporal)
- `explanation_text` (human-readable explanation)
- `confidence_score` (0.0-1.0)
- `evidence` (JSON - supporting data)
- `created_at`
- `updated_at`

### 4. Test Suite
**Files**:
- `tests/test_sprint_3a_explanation.py` - Explanation service tests
- `tests/test_sprint_3a_integration.py` - Integration tests

---

## 📊 ACCEPTANCE CRITERIA

| Criteria | Target | Validation |
|----------|--------|------------|
| **Explanation Coverage** | 95% of recommendations | Track explanation generation rate |
| **Explanation Quality** | Confidence >0.5 for 80% | Measure confidence scores |
| **API Response Time** | <200ms for single explanation | Performance testing |
| **Batch Performance** | <1 second for 10 papers | Batch testing |
| **Cache Hit Rate** | >60% after warmup | Monitor cache statistics |
| **Test Coverage** | 100% | All tests passing |

---

## 🏗️ IMPLEMENTATION ROADMAP

### Day 1: Core Explanation Service (Morning)
- [ ] Create `PaperExplanation` database model
- [ ] Run database migration
- [ ] Create `ExplanationService` class
- [ ] Implement 5 explanation types
- [ ] Add confidence scoring
- [ ] Add explanation caching

### Day 1: Explanation API (Afternoon)
- [ ] Create `api/explanations.py`
- [ ] Implement 4 API endpoints
- [ ] Add request/response models
- [ ] Register in main.py
- [ ] Add error handling

### Day 2: Testing & Integration (Morning)
- [ ] Create explanation service tests
- [ ] Create integration tests
- [ ] Test all 5 explanation types
- [ ] Test confidence scoring
- [ ] Test caching

### Day 2: Enhancement & Documentation (Afternoon)
- [ ] Add multi-factor explanations
- [ ] Optimize performance
- [ ] Update documentation
- [ ] Update JS test script

### Day 3: Deployment & Validation
- [ ] Deploy to production
- [ ] Run integration tests
- [ ] Validate acceptance criteria
- [ ] Create completion report

---

## 🔧 TECHNICAL DESIGN

### Explanation Types

#### 1. Semantic Similarity
```python
"This paper is semantically similar to papers you've viewed, particularly 
'[Paper Title]' (similarity: 0.85). It shares key concepts like [keywords]."
```

**Data Sources**:
- Vector embeddings (Sprint 1B)
- User interaction history (Sprint 1A)
- Cosine similarity scores

#### 2. Citation Network
```python
"This paper is cited by 3 papers in your collection, including '[Paper Title]'. 
It's a foundational work in this research area."
```

**Data Sources**:
- Citation graph (Sprint 2A)
- User's paper collection
- Citation counts

#### 3. Cluster Membership
```python
"This paper belongs to the '[Cluster Name]' research cluster, which contains 
5 other papers you've viewed. This cluster focuses on [keywords]."
```

**Data Sources**:
- Clustering data (Sprint 2B)
- Cluster metadata
- User's viewed papers

#### 4. Author Connection
```python
"This paper is by [Author Name], who has authored 3 other papers in your 
collection. You've shown interest in their work on [topic]."
```

**Data Sources**:
- Article author data
- User interaction history
- Author publication patterns

#### 5. Temporal Relevance
```python
"This is a recent paper (2024) in your research area. It builds on earlier 
work you've viewed and represents the latest developments in [topic]."
```

**Data Sources**:
- Publication dates
- User's temporal viewing patterns
- Citation relationships

### Confidence Scoring

**Formula**:
```python
confidence = weighted_sum([
    semantic_similarity * 0.3,
    citation_strength * 0.25,
    cluster_relevance * 0.2,
    author_familiarity * 0.15,
    temporal_relevance * 0.1
])
```

**Thresholds**:
- High confidence: >0.7
- Medium confidence: 0.5-0.7
- Low confidence: <0.5

### Caching Strategy

**Cache Key**: `explanation:{user_id}:{paper_pmid}:{context_hash}`

**TTL**: 24 hours

**Invalidation**: When user interactions change significantly

---

## 📊 DATABASE SCHEMA

### PaperExplanation Table

```sql
CREATE TABLE paper_explanations (
    id SERIAL PRIMARY KEY,
    paper_pmid VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    explanation_type VARCHAR NOT NULL,
    explanation_text TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    evidence JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (paper_pmid) REFERENCES articles(pmid),
    INDEX idx_paper_user (paper_pmid, user_id),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_confidence (confidence_score)
);
```

---

## 🔗 INTEGRATION POINTS

### Sprint 1A: Event Tracking
- Use user interaction history
- Track which papers user has viewed
- Identify user's research interests

### Sprint 1B: Vector Store
- Use semantic similarity scores
- Leverage embedding cache
- Find similar papers

### Sprint 2A: Graph Builder
- Use citation relationships
- Identify influential papers
- Find connected papers

### Sprint 2B: Clustering
- Use cluster membership
- Leverage cluster metadata
- Find related research areas

---

## 🎯 SUCCESS METRICS

### Functional Metrics
- ✅ All 5 explanation types working
- ✅ Confidence scores computed
- ✅ Explanations cached
- ✅ API endpoints functional

### Performance Metrics
- ⚡ Single explanation: <200ms
- ⚡ Batch (10 papers): <1 second
- 📊 Cache hit rate: >60%

### Quality Metrics
- 🎯 Explanation coverage: >95%
- 🎯 High confidence rate: >80%
- 🎯 Test coverage: 100%

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database migration applied
- [ ] Explanation service deployed
- [ ] API endpoints registered
- [ ] Tests passing (100%)
- [ ] Documentation updated
- [ ] Performance validated
- [ ] Cache monitoring enabled

---

## 📚 REFERENCES

### Related Sprints
- Sprint 1A: Event Tracking Foundation
- Sprint 1B: Vector Store & Candidate API
- Sprint 2A: Graph Builder & Network Analysis
- Sprint 2B: Clustering V1

### Key Files
- `services/event_tracking_service.py` (Sprint 1A)
- `services/vector_store_service.py` (Sprint 1B)
- `services/graph_builder_service.py` (Sprint 2A)
- `services/clustering_service.py` (Sprint 2B)

---

## 🎓 LESSONS FROM PREVIOUS SPRINTS

### What Worked Well
1. **Leverage existing infrastructure** - Reuse Sprint 1A-2B services
2. **Comprehensive testing** - 100% test coverage catches issues early
3. **Performance focus** - Set aggressive targets and measure
4. **Clear acceptance criteria** - Know when sprint is complete

### Apply to Sprint 3A
1. **Reuse existing services** - Don't rebuild what exists
2. **Test each explanation type** - Ensure quality
3. **Optimize for speed** - Cache aggressively
4. **Document thoroughly** - Make explanations understandable

---

## 🔮 FUTURE ENHANCEMENTS (Post-Sprint 3A)

1. **LLM-Generated Explanations** - Use GPT for natural language
2. **Personalized Explanations** - Adapt to user preferences
3. **Explanation Feedback** - Let users rate explanations
4. **Multi-Language Support** - Internationalization
5. **Explanation Visualization** - Visual representation of connections

---

**Status**: 🔄 READY TO START  
**Next Action**: Create PaperExplanation database model  
**Estimated Completion**: Day 3 (October 27, 2025)

