# 🎯 SPRINT 2A: GRAPH BUILDER - IMPLEMENTATION PLAN

**Sprint**: 2A - Citation Graph Construction & Network Analysis  
**Duration**: Week 2, Days 1-3  
**Start Date**: October 25, 2025  
**Target Completion**: October 27, 2025  
**Status**: 🔄 **IN PROGRESS**

---

## 📋 EXECUTIVE SUMMARY

Sprint 2A builds the **Citation Graph Builder** - the foundation for cluster-based paper discovery. This sprint leverages existing citation infrastructure (Article model, ArticleCitation table, NetworkGraph cache) and adds graph construction, network analysis algorithms, and graph API endpoints.

**Strategic Goal**: Enable cluster-based paper organization by building citation network foundation

---

## 🎯 OBJECTIVES

1. **Build citation graphs** from existing Article citation data
2. **Compute network metrics** (centrality, PageRank, communities)
3. **Prepare for clustering** (Sprint 2B will use these graphs)
4. **Create Graph API** for graph queries and visualization

---

## 📊 EXISTING INFRASTRUCTURE (LEVERAGE)

### ✅ **Already Built**:

1. **Article Model** (database.py:380-418)
   - `cited_by_pmids` - articles that cite this paper
   - `references_pmids` - articles this paper references
   - `citation_count` - total citations
   - `centrality_score` - network centrality (to be computed)
   - `cluster_id` - research cluster (Sprint 2B)

2. **ArticleCitation Model** (database.py:420-444)
   - Detailed citation relationships
   - Citation context and metadata
   - Co-citation tracking
   - Bibliographic coupling

3. **NetworkGraph Model** (database.py:493-509)
   - Cached network graphs
   - Nodes and edges storage
   - Cache management

4. **Citation Service** (services/citation_service.py)
   - Fetch citation data from OpenAlex
   - Cache citation data
   - Fetch references and citations

5. **Author Network Service** (services/author_network_service.py)
   - Author collaboration networks
   - Network metrics calculation

### 🆕 **What We Need to Build**:

1. **Graph Builder Service** - Construct citation graphs from Article data
2. **Network Analysis Service** - Compute centrality, PageRank, communities
3. **Graph API** - Query and visualize graphs
4. **Graph Population Script** - Build graphs for existing articles
5. **Tests** - Validate graph construction and metrics

---

## 🚀 DELIVERABLES

### 1. **Graph Builder Service** (`services/graph_builder_service.py`)

**Functionality**:
- Build citation graph from Article records
- Support multiple graph types:
  - Citation graph (directed)
  - Co-citation graph (undirected)
  - Bibliographic coupling graph (undirected)
- Cache graphs in NetworkGraph table
- Incremental graph updates

**Key Methods**:
```python
class GraphBuilderService:
    def build_citation_graph(pmids: List[str]) -> NetworkGraph
    def build_cocitation_graph(pmids: List[str]) -> NetworkGraph
    def build_coupling_graph(pmids: List[str]) -> NetworkGraph
    def update_graph_incremental(graph_id: str, new_pmids: List[str])
    def get_cached_graph(graph_id: str) -> Optional[NetworkGraph]
```

### 2. **Network Analysis Service** (`services/network_analysis_service.py`)

**Functionality**:
- Compute network centrality metrics:
  - Degree centrality
  - Betweenness centrality
  - Closeness centrality
  - PageRank
  - Eigenvector centrality
- Detect communities (preparation for clustering)
- Identify influential papers
- Calculate graph statistics

**Key Methods**:
```python
class NetworkAnalysisService:
    def compute_centrality_metrics(graph: NetworkGraph) -> Dict[str, Dict]
    def detect_communities(graph: NetworkGraph) -> Dict[str, List[str]]
    def identify_influential_papers(graph: NetworkGraph, top_n: int) -> List[Dict]
    def calculate_graph_statistics(graph: NetworkGraph) -> Dict[str, Any]
    def update_article_centrality_scores(db: Session, metrics: Dict)
```

### 3. **Graph API** (`api/graphs.py`)

**Endpoints**:
- `POST /api/v1/graphs/build` - Build citation graph
- `GET /api/v1/graphs/{graph_id}` - Get graph data
- `POST /api/v1/graphs/{graph_id}/analyze` - Compute network metrics
- `GET /api/v1/graphs/{graph_id}/communities` - Get community detection results
- `GET /api/v1/graphs/{graph_id}/influential` - Get influential papers
- `GET /api/v1/graphs/stats` - Graph statistics

### 4. **Graph Population Script** (`scripts/populate_graphs.py`)

**Functionality**:
- Build graphs for all articles in database
- Batch processing with progress tracking
- Compute and store centrality metrics
- Update Article.centrality_score field

### 5. **Tests**

**Test Suites**:
- `tests/test_sprint_2a_graph_builder.py` - Graph construction tests
- `tests/test_sprint_2a_network_analysis.py` - Network metrics tests
- `tests/test_sprint_2a_integration.py` - End-to-end tests

---

## 📋 ACCEPTANCE CRITERIA

| Criteria | Target | Validation |
|----------|--------|------------|
| **Graph construction** | Build citation graph from Article data | Test with 100+ papers |
| **Network metrics** | Compute centrality for all papers | Verify PageRank, betweenness |
| **API response time** | <500ms for graph queries | P95 measurement |
| **Community detection** | Identify 5-10 communities in test graph | Manual validation |
| **Batch processing** | Process 1000 papers in <10 minutes | Timed test |

---

## 🏗️ IMPLEMENTATION STEPS

### **Step 1: Graph Builder Service** (Day 1, Morning)

**Files to create**:
- `services/graph_builder_service.py`

**Implementation**:
1. Create GraphBuilderService class
2. Implement `build_citation_graph()` using networkx
3. Implement graph caching in NetworkGraph table
4. Add incremental update support
5. Test with sample articles

**Acceptance**:
- [ ] Citation graph built from Article data
- [ ] Graph cached in NetworkGraph table
- [ ] Nodes include paper metadata
- [ ] Edges include citation relationships

### **Step 2: Network Analysis Service** (Day 1, Afternoon)

**Files to create**:
- `services/network_analysis_service.py`

**Implementation**:
1. Create NetworkAnalysisService class
2. Implement centrality metrics (PageRank, betweenness, etc.)
3. Implement community detection (Louvain algorithm)
4. Add influential paper identification
5. Update Article.centrality_score in database

**Acceptance**:
- [ ] Centrality metrics computed
- [ ] Communities detected
- [ ] Influential papers identified
- [ ] Article.centrality_score updated

### **Step 3: Graph API** (Day 2, Morning)

**Files to create**:
- `api/graphs.py`

**Implementation**:
1. Create FastAPI router
2. Implement graph build endpoint
3. Implement graph query endpoints
4. Implement analysis endpoints
5. Add to main.py

**Acceptance**:
- [ ] All endpoints working
- [ ] Response time <500ms
- [ ] Proper error handling
- [ ] API documentation

### **Step 4: Graph Population Script** (Day 2, Afternoon)

**Files to create**:
- `scripts/populate_graphs.py`

**Implementation**:
1. Query all articles from database
2. Build citation graphs in batches
3. Compute network metrics
4. Update Article records
5. Progress tracking and logging

**Acceptance**:
- [ ] Processes all articles
- [ ] Batch processing efficient
- [ ] Metrics stored in database
- [ ] Error handling robust

### **Step 5: Testing & Validation** (Day 3)

**Files to create**:
- `tests/test_sprint_2a_graph_builder.py`
- `tests/test_sprint_2a_network_analysis.py`
- `tests/test_sprint_2a_integration.py`

**Implementation**:
1. Test graph construction
2. Test network metrics
3. Test API endpoints
4. Test batch processing
5. Validate acceptance criteria

**Acceptance**:
- [ ] All tests passing
- [ ] Acceptance criteria met
- [ ] Performance targets achieved
- [ ] Ready for deployment

---

## 🔧 TECHNICAL STACK

### **Libraries**:
- **networkx** - Graph construction and analysis
- **python-louvain** (community) - Community detection
- **numpy** - Numerical computations
- **FastAPI** - API endpoints
- **SQLAlchemy** - Database operations

### **Graph Algorithms**:
- **PageRank** - Paper importance
- **Betweenness Centrality** - Bridge papers
- **Louvain Algorithm** - Community detection
- **Degree Centrality** - Citation counts

---

## 📊 PERFORMANCE TARGETS

| Metric | Target | Notes |
|--------|--------|-------|
| **Graph build time** | <2 hours for full database | Batch processing |
| **API response time** | <500ms P95 | Graph queries |
| **Centrality computation** | <5 minutes for 1000 papers | NetworkX optimized |
| **Community detection** | <10 minutes for 1000 papers | Louvain algorithm |

---

## 🔗 INTEGRATION POINTS

### **Sprint 1B (Vector Store)**:
- Use embeddings for semantic similarity in clustering
- Combine citation + semantic signals

### **Sprint 2B (Clustering)**:
- Use community detection as clustering input
- Use centrality scores for cluster ranking

### **Event Tracking (Sprint 1A)**:
- Track graph queries
- Track influential paper views

---

## 📈 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Graph coverage** | 90%+ of articles | Articles with centrality scores |
| **Community quality** | Modularity >0.3 | Louvain modularity score |
| **API uptime** | 99%+ | Monitoring |
| **Response time** | <500ms P95 | Performance tests |

---

## 🎯 SPRINT 2A ROADMAP

```
Day 1 (Oct 25):
├── Morning: Graph Builder Service
│   ├── Citation graph construction
│   ├── Graph caching
│   └── Tests
└── Afternoon: Network Analysis Service
    ├── Centrality metrics
    ├── Community detection
    └── Tests

Day 2 (Oct 26):
├── Morning: Graph API
│   ├── Build endpoint
│   ├── Query endpoints
│   └── Analysis endpoints
└── Afternoon: Population Script
    ├── Batch processing
    ├── Metrics computation
    └── Database updates

Day 3 (Oct 27):
├── Morning: Integration Tests
│   ├── End-to-end tests
│   ├── Performance tests
│   └── Acceptance validation
└── Afternoon: Deployment
    ├── Deploy to production
    ├── Run population script
    └── Validate in production
```

---

## ✅ READY TO START

**Prerequisites**:
- ✅ Sprint 1A complete (Event Tracking)
- ✅ Sprint 1B complete (Vector Store)
- ✅ Article model with citation data
- ✅ NetworkGraph cache table
- ✅ Citation service available

**Next Action**: Implement Graph Builder Service

---

**Let's build the citation graph foundation! 🚀**

