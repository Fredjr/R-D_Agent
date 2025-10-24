# SPRINT 3B: Weekly Mix Enhancement

**Sprint**: 3B  
**Duration**: Week 3, Days 4-7 (4 days)  
**Start Date**: October 25, 2025  
**Status**: 🔄 IN PROGRESS

---

## 📋 OBJECTIVES

Enhance the Weekly Mix feature to leverage the Discovery Engine infrastructure (Sprints 1A-3A) for personalized, explainable paper recommendations.

**Key Goals**:
1. Integrate explanation system with Weekly Mix
2. Add diversity scoring for balanced recommendations
3. Implement recency weighting for fresh content
4. Create Weekly Mix generation service
5. Build Weekly Mix API endpoints

---

## 🎯 DELIVERABLES

### 1. Weekly Mix Service
**File**: `services/weekly_mix_service.py`

**Features**:
- Generate personalized weekly paper recommendations
- Integrate with explanation service (Sprint 3A)
- Apply diversity scoring (cluster, author, journal diversity)
- Apply recency weighting (favor recent papers)
- Filter out already-viewed papers
- Configurable mix size (default: 10 papers)

**Key Methods**:
```python
generate_weekly_mix(db, user_id, size=10) -> List[WeeklyMixPaper]
_score_diversity(papers, user_history) -> Dict[str, float]
_apply_recency_weight(papers) -> Dict[str, float]
_combine_scores(semantic, diversity, recency, explanations) -> Dict[str, float]
```

### 2. Weekly Mix API
**File**: `api/weekly_mix.py`

**Endpoints**:
1. `POST /api/v1/weekly-mix/generate` - Generate weekly mix
2. `GET /api/v1/weekly-mix/current` - Get current weekly mix
3. `POST /api/v1/weekly-mix/refresh` - Refresh weekly mix
4. `GET /api/v1/weekly-mix/history` - Get past weekly mixes
5. `POST /api/v1/weekly-mix/feedback` - Submit feedback on mix quality
6. `GET /api/v1/weekly-mix/stats` - Get weekly mix statistics

### 3. Database Model
**File**: `database.py` (update)

**New Table**: `WeeklyMix`
```python
class WeeklyMix(Base):
    id: int (primary key)
    user_id: str
    paper_pmid: str (foreign key)
    mix_date: date
    position: int  # Position in mix (1-10)
    score: float  # Combined score
    diversity_score: float
    recency_score: float
    explanation_id: int (foreign key to PaperExplanation)
    viewed: bool
    feedback: str (optional: 'helpful', 'not_helpful', 'irrelevant')
    created_at: datetime
```

### 4. Test Suite
**Files**:
- `tests/test_sprint_3b_weekly_mix.py` - Service tests
- `tests/test_sprint_3b_integration.py` - Integration tests

**Test Coverage**:
- Weekly mix generation
- Diversity scoring
- Recency weighting
- Score combination
- API endpoints
- Database persistence
- Integration with Sprint 3A explanations

---

## 🏗️ ARCHITECTURE

### Integration Points

**Sprint 1A (Event Tracking)**:
- Use user interaction history
- Track viewed papers
- Identify user preferences

**Sprint 1B (Vector Store)**:
- Use semantic similarity for candidate selection
- Leverage embedding cache

**Sprint 2A (Graph Builder)**:
- Use citation network for influence scoring
- Identify foundational papers

**Sprint 2B (Clustering)**:
- Use cluster membership for diversity
- Ensure mix covers multiple research areas

**Sprint 3A (Explainability)**:
- Generate explanations for each recommended paper
- Include explanation confidence in scoring

### Scoring Formula

```
final_score = (
    0.40 * semantic_similarity +
    0.25 * diversity_score +
    0.20 * recency_score +
    0.15 * explanation_confidence
)
```

**Diversity Score Components**:
- Cluster diversity (0-1): Penalize papers from over-represented clusters
- Author diversity (0-1): Penalize papers from over-represented authors
- Journal diversity (0-1): Penalize papers from over-represented journals

**Recency Score**:
- Papers from last 6 months: 1.0
- Papers from last year: 0.8
- Papers from last 2 years: 0.6
- Papers from last 5 years: 0.4
- Older papers: 0.2

---

## 📊 ACCEPTANCE CRITERIA

### Functional Requirements
- ✅ Generate personalized weekly mix of 10 papers
- ✅ Include explanations for each paper
- ✅ Ensure diversity across clusters, authors, journals
- ✅ Favor recent papers (last 6-12 months)
- ✅ Filter out already-viewed papers
- ✅ Support feedback collection

### Performance Requirements
- ✅ Mix generation < 2 seconds
- ✅ API response time < 500ms (cached)
- ✅ Database queries optimized with indexes

### Quality Requirements
- ✅ Test coverage > 90%
- ✅ All tests passing
- ✅ Comprehensive error handling
- ✅ Detailed logging

### User Experience Requirements
- ✅ Clear explanations for each paper
- ✅ Diverse mix (no more than 3 papers from same cluster)
- ✅ Fresh content (at least 5 papers from last year)
- ✅ Relevant to user's research interests

---

## 🗓️ IMPLEMENTATION ROADMAP

### Day 1 (October 25): Core Service
**Morning**:
- Create WeeklyMix database model
- Implement diversity scoring logic
- Implement recency weighting logic

**Afternoon**:
- Create WeeklyMixService
- Implement mix generation algorithm
- Write service tests

**Deliverable**: Working weekly mix service with tests

### Day 2 (October 26): API & Integration
**Morning**:
- Create Weekly Mix API endpoints
- Integrate with Sprint 3A explanations
- Implement caching

**Afternoon**:
- Write API tests
- Test integration with previous sprints
- Performance optimization

**Deliverable**: Complete API with integration tests

### Day 3 (October 27): Testing & Refinement
**Morning**:
- Comprehensive integration testing
- Edge case testing
- Performance testing

**Afternoon**:
- Bug fixes
- Documentation updates
- Code review

**Deliverable**: Production-ready code

### Day 4 (October 28): Deployment & Documentation
**Morning**:
- Deploy to production (Railway)
- Update documentation
- Update JS test script

**Afternoon**:
- Create completion report
- Final testing
- Sprint retrospective

**Deliverable**: Sprint 3B complete and deployed

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Diversity scoring algorithm
- Recency weighting algorithm
- Score combination logic
- Mix generation logic

### Integration Tests
- End-to-end mix generation
- Integration with Sprint 3A explanations
- Database persistence
- API endpoints

### Performance Tests
- Mix generation time < 2 seconds
- API response time < 500ms
- Database query performance

### User Acceptance Tests
- Mix diversity (cluster, author, journal)
- Mix recency (publication dates)
- Explanation quality
- Feedback collection

---

## 📈 SUCCESS METRICS

### Technical Metrics
- Mix generation time: < 2 seconds
- API response time: < 500ms
- Test coverage: > 90%
- Zero critical bugs

### Quality Metrics
- Cluster diversity: Max 3 papers per cluster
- Recency: ≥ 5 papers from last year
- Explanation coverage: 100%
- User feedback: Track helpful/not helpful ratio

### Business Metrics
- Weekly mix engagement rate
- Papers viewed from mix
- Papers saved from mix
- User retention

---

## 🔗 DEPENDENCIES

### Required (Sprints 1A-3A)
- ✅ Sprint 1A: Event Tracking (user history)
- ✅ Sprint 1B: Vector Store (semantic similarity)
- ✅ Sprint 2A: Graph Builder (citation network)
- ✅ Sprint 2B: Clustering (cluster membership)
- ✅ Sprint 3A: Explainability (explanations)

### Optional
- User preferences (future sprint)
- Collaborative filtering (future sprint)
- A/B testing framework (future sprint)

---

## 🚀 DEPLOYMENT PLAN

### Pre-Deployment
1. All tests passing
2. Code review complete
3. Documentation updated
4. Performance validated

### Deployment Steps
1. Push to GitHub
2. Railway auto-deploy
3. Run database migration
4. Verify API endpoints
5. Test with production data

### Post-Deployment
1. Monitor mix generation performance
2. Track user engagement
3. Collect feedback
4. Iterate based on data

---

## 📝 NOTES

### Design Decisions
- **Mix Size**: Default 10 papers (configurable)
- **Refresh Frequency**: Weekly (can be manual)
- **Diversity Threshold**: Max 3 papers per cluster
- **Recency Preference**: Favor last 6-12 months

### Future Enhancements
- Personalized scoring weights
- Topic-based filtering
- Collaborative filtering
- A/B testing different algorithms
- Email notifications for new mixes

---

## 🎯 SPRINT GOAL

**Build a personalized, explainable, diverse weekly paper recommendation system that leverages all Discovery Engine infrastructure (Sprints 1A-3A) to deliver high-quality, relevant research papers to users.**

---

**Prepared by**: AI Agent  
**Date**: October 24, 2025  
**Sprint**: 3B - Weekly Mix Enhancement  
**Status**: 🔄 IN PROGRESS

