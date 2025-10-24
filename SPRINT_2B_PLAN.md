# 🎯 SPRINT 2B IMPLEMENTATION PLAN

**Sprint**: 2B - Clustering V1  
**Duration**: Week 2, Days 4-7 (4 days)  
**Start Date**: October 25, 2025  
**Status**: 🔄 IN PROGRESS

---

## 📋 OBJECTIVES

Build paper clustering system using graph data from Sprint 2A to organize papers into research clusters.

**Core Goals**:
1. Implement clustering algorithms (Louvain/Leiden)
2. Generate cluster metadata and summaries
3. Create cluster API endpoints
4. Validate cluster quality
5. Integrate with existing graph infrastructure

---

## 🎯 ACCEPTANCE CRITERIA

| Criteria | Target | Validation Method |
|----------|--------|-------------------|
| **Cluster Generation** | 5-20 clusters for 100 papers | Automated test |
| **Cluster Quality** | Modularity >0.3 | Quality metrics |
| **API Response Time** | <1 second for cluster query | Performance test |
| **Cluster Metadata** | Title, keywords, papers | Structure validation |
| **Integration** | Works with Sprint 2A graphs | Integration test |

---

## 🏗️ EXISTING INFRASTRUCTURE

### From Sprint 2A (Graph Builder):
- ✅ `GraphBuilderService` - Citation graph construction
- ✅ `NetworkAnalysisService` - Community detection (Louvain)
- ✅ Graph API endpoints
- ✅ Article.cluster_id field (ready to use)

### From Database:
- ✅ `Article` model with `cluster_id` field
- ✅ `NetworkGraph` model for caching
- ✅ Citation relationships in Article model

### Key Insight:
**We already have community detection in Sprint 2A!** We need to:
1. Enhance it for production clustering
2. Add cluster metadata generation
3. Create cluster-specific API endpoints
4. Update Article.cluster_id in database

---

## 📦 DELIVERABLES

### 1. Clustering Service
**File**: `services/clustering_service.py`

**Features**:
- Cluster generation using Louvain algorithm (from Sprint 2A)
- Cluster metadata generation (title, keywords, summary)
- Cluster quality metrics (modularity, silhouette score)
- Update Article.cluster_id in database
- Cluster persistence and caching

**Methods**:
```python
class ClusteringService:
    def generate_clusters(graph_data) -> Dict[str, Cluster]
    def compute_cluster_metadata(cluster_papers) -> ClusterMetadata
    def update_article_clusters(db, cluster_assignments)
    def get_cluster_quality_metrics(graph_data, clusters) -> Dict
    def get_cluster_by_id(db, cluster_id) -> Cluster
    def get_all_clusters(db) -> List[Cluster]
```

### 2. Cluster API
**File**: `api/clusters.py`

**Endpoints**:
1. `POST /api/v1/clusters/generate` - Generate clusters from graph
2. `GET /api/v1/clusters` - List all clusters
3. `GET /api/v1/clusters/{cluster_id}` - Get cluster details
4. `GET /api/v1/clusters/{cluster_id}/papers` - Get papers in cluster
5. `GET /api/v1/clusters/quality` - Get cluster quality metrics
6. `POST /api/v1/clusters/regenerate` - Regenerate clusters

### 3. Cluster Population Script
**File**: `scripts/populate_clusters.py`

**Features**:
- Build graphs for all papers
- Generate clusters
- Compute metadata
- Update Article.cluster_id
- Quality validation

### 4. Test Suite
**Files**:
- `tests/test_sprint_2b_clustering.py` - Clustering service tests
- `tests/test_sprint_2b_integration.py` - Integration tests

**Tests**:
- Cluster generation
- Metadata generation
- Quality metrics
- API endpoints
- Database updates
- Integration with Sprint 2A

---

## 🗓️ IMPLEMENTATION ROADMAP

### Day 1 (Morning): Clustering Service
**Tasks**:
1. Create `ClusteringService` class
2. Implement cluster generation (leverage Sprint 2A community detection)
3. Add cluster metadata generation
4. Add quality metrics computation
5. Add database update methods

**Acceptance**:
- [ ] Clusters generated from graph data
- [ ] Metadata includes title, keywords, paper count
- [ ] Quality metrics computed (modularity, silhouette)
- [ ] Article.cluster_id updated

### Day 1 (Afternoon): Cluster Metadata Enhancement
**Tasks**:
1. Implement cluster title generation (from paper titles)
2. Extract cluster keywords (from abstracts/titles)
3. Generate cluster summary
4. Add representative papers selection

**Acceptance**:
- [ ] Cluster titles are meaningful
- [ ] Keywords extracted from papers
- [ ] Summary generated
- [ ] Representative papers identified

### Day 2 (Morning): Cluster API
**Tasks**:
1. Create `api/clusters.py`
2. Implement all 6 endpoints
3. Add request/response models
4. Register in main.py
5. Add error handling

**Acceptance**:
- [ ] All endpoints working
- [ ] Response time <1 second
- [ ] Proper error handling
- [ ] Documentation complete

### Day 2 (Afternoon): Population Script
**Tasks**:
1. Create `scripts/populate_clusters.py`
2. Implement batch processing
3. Add progress tracking
4. Add quality validation
5. Add statistics reporting

**Acceptance**:
- [ ] Processes all papers in batches
- [ ] Updates Article.cluster_id
- [ ] Reports quality metrics
- [ ] Handles errors gracefully

### Day 3: Testing & Validation
**Tasks**:
1. Create clustering service tests
2. Create integration tests
3. Validate cluster quality
4. Performance testing
5. Edge case testing

**Acceptance**:
- [ ] All tests passing
- [ ] Cluster quality validated
- [ ] Performance targets met
- [ ] Edge cases handled

### Day 4: Deployment & Documentation
**Tasks**:
1. Deploy to production
2. Run population script
3. Validate in production
4. Create completion report
5. Update documentation

**Acceptance**:
- [ ] Deployed to Railway
- [ ] Clusters generated in production
- [ ] Quality validated
- [ ] Documentation complete

---

## 🎨 CLUSTER METADATA STRUCTURE

```python
class ClusterMetadata:
    cluster_id: str          # UUID
    title: str               # Generated from papers
    keywords: List[str]      # Top keywords
    paper_count: int         # Number of papers
    representative_papers: List[str]  # Top 3-5 PMIDs
    summary: str             # Brief description
    avg_year: float          # Average publication year
    top_journals: List[str]  # Most common journals
    modularity: float        # Cluster quality
    created_at: datetime
    updated_at: datetime
```

---

## 🔧 TECHNICAL APPROACH

### Clustering Algorithm:
- **Primary**: Louvain (already implemented in Sprint 2A)
- **Fallback**: Leiden (if needed for better quality)
- **Resolution**: Configurable for cluster granularity

### Metadata Generation:
- **Title**: Most common words from paper titles (TF-IDF)
- **Keywords**: Extract from abstracts using frequency analysis
- **Summary**: Combine top keywords and themes
- **Representative Papers**: Highest centrality within cluster

### Quality Metrics:
- **Modularity**: From Louvain algorithm
- **Silhouette Score**: Cluster cohesion
- **Size Distribution**: Cluster size balance
- **Coverage**: % of papers clustered

---

## 📊 INTEGRATION WITH SPRINT 2A

### Leverage Existing:
1. ✅ `NetworkAnalysisService.detect_communities()` - Already does clustering!
2. ✅ Graph data structure from `GraphBuilderService`
3. ✅ Article.cluster_id field in database
4. ✅ NetworkGraph caching

### New Additions:
1. Cluster metadata generation
2. Cluster-specific API endpoints
3. Cluster persistence
4. Quality validation

---

## 🎯 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cluster Count** | 5-20 for 100 papers | Automated count |
| **Modularity** | >0.3 | Quality metric |
| **API Response** | <1 second | Performance test |
| **Test Pass Rate** | 100% | Test suite |
| **Coverage** | >90% papers | Statistics |

---

## 🚀 QUICK START

### Step 1: Create Clustering Service
```bash
# Create service file
touch services/clustering_service.py

# Implement cluster generation using Sprint 2A community detection
# Add metadata generation
# Add quality metrics
```

### Step 2: Create Cluster API
```bash
# Create API file
touch api/clusters.py

# Implement 6 endpoints
# Register in main.py
```

### Step 3: Create Population Script
```bash
# Create script
touch scripts/populate_clusters.py

# Implement batch processing
# Add quality validation
```

### Step 4: Test & Deploy
```bash
# Run tests
python3 tests/test_sprint_2b_clustering.py
python3 tests/test_sprint_2b_integration.py

# Deploy
git add -A
git commit -m "Sprint 2B: Clustering V1"
git push origin main
```

---

## 📝 NOTES

### Key Decisions:
1. **Reuse Sprint 2A community detection** - Already implements Louvain
2. **Focus on metadata** - Make clusters meaningful and useful
3. **Quality validation** - Ensure clusters are high quality
4. **Incremental deployment** - Test thoroughly before production

### Risks & Mitigations:
- **Risk**: Low modularity for small graphs
  - **Mitigation**: Validate with larger datasets, adjust resolution parameter
  
- **Risk**: Metadata generation quality
  - **Mitigation**: Use TF-IDF and frequency analysis, validate manually

- **Risk**: Performance for large graphs
  - **Mitigation**: Batch processing, caching, async operations

---

## 🎉 EXPECTED OUTCOMES

By end of Sprint 2B:
- ✅ Papers organized into meaningful clusters
- ✅ Cluster metadata generated automatically
- ✅ Cluster API endpoints working
- ✅ Article.cluster_id populated
- ✅ Quality metrics validated
- ✅ Ready for Sprint 3A (Explainability)

---

**Let's build the clustering system!** 🚀

