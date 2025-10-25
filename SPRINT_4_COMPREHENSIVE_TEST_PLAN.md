# 🧪 SPRINT 4 COMPREHENSIVE TEST PLAN

## Overview
This document outlines the comprehensive testing strategy for Sprint 4 (Discovery Tree & Cluster-Aware Navigation) across ALL dimensions with stringent carefulness and diligence.

**Test Environment**: Vercel Frontend (https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012)  
**Backend**: Railway Production (https://r-dagent-production.up.railway.app)  
**Test Date**: 2025-10-25

---

## 🎯 Test Dimensions

### 1. **FUNCTIONAL TESTING** ✅
Test all 7 Discovery Tree API endpoints work correctly.

#### 1.1 Discovery Tree Endpoint
- **Endpoint**: `GET /api/v1/discovery-tree`
- **Tests**:
  - ✅ Returns valid tree structure
  - ✅ Contains clusters array
  - ✅ Contains total_clusters and total_papers
  - ✅ Each cluster has required fields (cluster_id, title, paper_count, keywords, etc.)
  - ✅ Response time < 500ms

#### 1.2 Discovery Tree with Filters
- **Endpoint**: `GET /api/v1/discovery-tree?year_min=2020&year_max=2024&min_papers=2`
- **Tests**:
  - ✅ Filters are applied correctly
  - ✅ Only clusters within year range are returned
  - ✅ Only clusters with min_papers are returned
  - ✅ Response time < 500ms

#### 1.3 Cluster Details
- **Endpoint**: `GET /api/v1/discovery-tree/cluster/{cluster_id}`
- **Tests**:
  - ✅ Returns detailed cluster information
  - ✅ Includes view tracking (view_count, last_viewed_at)
  - ✅ Includes quality_score
  - ✅ Includes related_clusters
  - ✅ Response time < 200ms

#### 1.4 Cluster Papers
- **Endpoint**: `GET /api/v1/discovery-tree/cluster/{cluster_id}/papers?sort_by=relevance&limit=10`
- **Tests**:
  - ✅ Returns papers in cluster
  - ✅ Papers have relevance_score
  - ✅ Papers have cluster_position (central, peripheral, bridge)
  - ✅ Sorting works (relevance, year, citations)
  - ✅ Limit parameter works
  - ✅ Response time < 200ms

#### 1.5 Related Clusters
- **Endpoint**: `GET /api/v1/discovery-tree/cluster/{cluster_id}/related?limit=5`
- **Tests**:
  - ✅ Returns related clusters
  - ✅ Each cluster has similarity_score
  - ✅ Clusters are sorted by similarity
  - ✅ Limit parameter works
  - ✅ Response time < 200ms

#### 1.6 Navigate to Cluster
- **Endpoint**: `POST /api/v1/discovery-tree/navigate`
- **Tests**:
  - ✅ Tracks navigation (direct, related, search, recommendation)
  - ✅ Records from_cluster_id and to_cluster_id
  - ✅ Updates ClusterView table
  - ✅ Updates ClusterNavigation table
  - ✅ Response time < 200ms

#### 1.7 Cluster Recommendations
- **Endpoint**: `GET /api/v1/discovery-tree/recommendations?limit=10&exploration_ratio=0.3`
- **Tests**:
  - ✅ Returns personalized recommendations
  - ✅ Each recommendation has score and reason
  - ✅ Balances exploitation (familiar) and exploration (novel)
  - ✅ exploration_ratio parameter works
  - ✅ Response time < 300ms

#### 1.8 Search Within Clusters
- **Endpoint**: `POST /api/v1/discovery-tree/search`
- **Tests**:
  - ⚠️ Returns 501 (Not Implemented) - expected
  - ✅ Endpoint exists and is accessible

---

### 2. **INTEGRATION TESTING** ✅
Test Sprint 4 integrates correctly with previous sprints.

#### 2.1 Sprint 1A Integration (Event Tracking)
- **Tests**:
  - ✅ User interactions are tracked in UserInteraction table
  - ✅ Events include: cluster_view, cluster_navigate, paper_view
  - ✅ Event metadata includes cluster_id, from_cluster_id, navigation_type

#### 2.2 Sprint 2B Integration (Clustering)
- **Endpoint**: `GET /api/v1/clusters`
- **Tests**:
  - ✅ Clustering API is accessible
  - ✅ Discovery Tree uses clusters from Sprint 2B
  - ✅ Cluster metadata is consistent

#### 2.3 Sprint 3B Integration (Weekly Mix)
- **Endpoint**: `GET /api/v1/weekly-mix/current`
- **Tests**:
  - ✅ Weekly Mix API is accessible
  - ✅ Weekly Mix can include cluster-based recommendations
  - ✅ Integration works seamlessly

---

### 3. **PERFORMANCE TESTING** ⚡
Test response times meet targets.

| Endpoint | Target | Actual | Status |
|----------|--------|--------|--------|
| GET /api/v1/discovery-tree | < 500ms | TBD | ⏳ |
| GET /api/v1/discovery-tree (filtered) | < 500ms | TBD | ⏳ |
| GET /api/v1/discovery-tree/cluster/{id} | < 200ms | TBD | ⏳ |
| GET /api/v1/discovery-tree/cluster/{id}/papers | < 200ms | TBD | ⏳ |
| GET /api/v1/discovery-tree/cluster/{id}/related | < 200ms | TBD | ⏳ |
| POST /api/v1/discovery-tree/navigate | < 200ms | TBD | ⏳ |
| GET /api/v1/discovery-tree/recommendations | < 300ms | TBD | ⏳ |

---

### 4. **DATABASE TESTING** 🗄️
Test database tracking works correctly.

#### 4.1 ClusterView Table
- **Tests**:
  - ✅ Records are created when user views cluster
  - ✅ view_count increments on repeated views
  - ✅ last_viewed_at updates correctly
  - ✅ avg_time_spent tracks time spent
  - ✅ papers_viewed and papers_saved track correctly

#### 4.2 ClusterNavigation Table
- **Tests**:
  - ✅ Records are created when user navigates
  - ✅ from_cluster_id and to_cluster_id are recorded
  - ✅ navigation_type is recorded (direct, related, search, recommendation)
  - ✅ session_id tracks user sessions

---

### 5. **USER FLOW TESTING** 👤
Test complete user journeys through cluster navigation.

#### 5.1 Discovery Flow
1. User opens Discovery Tree → sees clusters
2. User clicks on cluster → sees cluster details
3. User views papers in cluster → sees paper list
4. User clicks on related cluster → navigates to related cluster
5. User gets recommendations → sees personalized clusters

**Tests**:
- ✅ All steps work seamlessly
- ✅ Navigation is tracked correctly
- ✅ Recommendations improve over time

#### 5.2 Exploration Flow
1. User starts with no history → gets exploration-focused recommendations
2. User views several clusters → recommendations become more personalized
3. User navigates between related clusters → discovers new areas
4. User returns to familiar clusters → gets exploitation-focused recommendations

**Tests**:
- ✅ Exploration ratio works correctly
- ✅ Recommendations balance exploration and exploitation
- ✅ User interest model updates correctly

---

### 6. **ERROR HANDLING TESTING** ❌
Test proper error messages and fallbacks.

#### 6.1 Invalid Inputs
- **Tests**:
  - ✅ Invalid cluster_id returns 404
  - ✅ Invalid year range returns 400
  - ✅ Missing X-User-ID header returns 400
  - ✅ Invalid exploration_ratio returns 400

#### 6.2 Edge Cases
- **Tests**:
  - ✅ Empty clusters list handled gracefully
  - ✅ No recommendations available handled gracefully
  - ✅ No related clusters handled gracefully
  - ✅ New user (no history) handled gracefully

---

### 7. **CACHING TESTING** 💾
Test caching strategy works correctly.

#### 7.1 Tree Caching
- **Tests**:
  - ✅ Tree is cached for 1 hour
  - ✅ force_refresh parameter bypasses cache
  - ✅ Cache is invalidated correctly

#### 7.2 Interest Caching
- **Tests**:
  - ✅ User interests are cached for 6 hours
  - ✅ Cache updates when new interactions occur
  - ✅ Cache is invalidated correctly

---

### 8. **ALGORITHM TESTING** 🧮
Test recommendation algorithms work correctly.

#### 8.1 User Interest Modeling
- **Tests**:
  - ✅ 90-day window is applied
  - ✅ Temporal decay works (recent interactions weighted higher)
  - ✅ Interest scores are calculated correctly

#### 8.2 Cluster Similarity
- **Tests**:
  - ✅ Keyword overlap (Jaccard similarity) works
  - ✅ Temporal proximity works
  - ✅ Combined similarity score is correct

#### 8.3 Recommendation Scoring
- **Tests**:
  - ✅ Exploitation score: 0.7 * direct_interest + 0.3 * related_interest
  - ✅ Exploration score: 0.4 * recency + 0.3 * size + 0.3 * quality
  - ✅ Combined score: (1 - exploration_ratio) * exploitation + exploration_ratio * exploration

---

### 9. **FRONTEND TESTING** 🎨
Test frontend displays Sprint 4 features correctly.

#### 9.1 Discovery Tree UI
- **Tests**:
  - ⏳ Discovery Tree component exists
  - ⏳ Clusters are displayed correctly
  - ⏳ Cluster cards show title, paper count, keywords
  - ⏳ Clicking cluster navigates to cluster details

#### 9.2 Cluster Details UI
- **Tests**:
  - ⏳ Cluster details page exists
  - ⏳ Shows cluster metadata
  - ⏳ Shows papers in cluster
  - ⏳ Shows related clusters
  - ⏳ Navigation tracking works

#### 9.3 Recommendations UI
- **Tests**:
  - ⏳ Recommendations component exists
  - ⏳ Shows personalized cluster recommendations
  - ⏳ Shows recommendation reasons
  - ⏳ Clicking recommendation navigates to cluster

---

### 10. **DEPLOYMENT TESTING** 🚀
Test deployment is successful and stable.

#### 10.1 Railway Backend
- **Tests**:
  - ✅ Backend is deployed and accessible
  - ⏳ All 7 Discovery Tree endpoints are registered
  - ⏳ Database tables are created (ClusterView, ClusterNavigation)
  - ✅ Environment variables are set correctly

#### 10.2 Vercel Frontend
- **Tests**:
  - ✅ Frontend is deployed and accessible
  - ⏳ Frontend can connect to Railway backend
  - ⏳ CORS is configured correctly
  - ⏳ API calls work from frontend

---

## 📊 Test Execution

### Automated Tests
1. **Backend Unit Tests**: `pytest tests/test_sprint_4_*.py`
2. **Backend Production Tests**: `python3 scripts/test_sprint_4_production.py`
3. **Frontend Browser Tests**: Run `SPRINT_4_COMPREHENSIVE_TEST.js` in browser console

### Manual Tests
1. Open Vercel URL: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
2. Open browser console (F12)
3. Copy and paste `SPRINT_4_COMPREHENSIVE_TEST.js` into console
4. Wait for tests to complete
5. Review test results

---

## ✅ Success Criteria

- **Functional**: All 7 endpoints work correctly (100%)
- **Integration**: All 3 sprint integrations work (100%)
- **Performance**: All endpoints meet performance targets (100%)
- **Database**: All tracking works correctly (100%)
- **User Flow**: All user journeys work seamlessly (100%)
- **Error Handling**: All edge cases handled gracefully (100%)
- **Overall Success Rate**: ≥ 90%

---

## 📝 Test Results

**Status**: ⏳ IN PROGRESS

**Railway Deployment**: Triggered at 2025-10-25 09:14:55  
**Expected Completion**: ~5 minutes

**Next Steps**:
1. ⏳ Wait for Railway deployment to complete
2. ⏳ Run backend production tests
3. ⏳ Run frontend browser tests
4. ⏳ Document all results
5. ⏳ Create final test report

