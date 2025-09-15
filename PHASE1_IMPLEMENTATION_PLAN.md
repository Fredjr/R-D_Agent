# 🚀 Phase 1: Similar Work Discovery - Implementation Plan

## 📋 Overview

This document outlines the detailed implementation plan for Phase 1 of the ResearchRabbit feature parity project, focusing on Similar Work Discovery functionality.

## 🎯 Phase 1 Objectives

### **Primary Goals**
- ✅ Implement article similarity engine with TF-IDF and citation overlap analysis
- ✅ Create database schema for citation relationships
- ✅ Add Similar Work API endpoints with caching
- ✅ Enhance NetworkView component with navigation modes
- ✅ Create NavigationControls component for mode switching

### **Success Criteria**
- Users can click "Similar Work" button in NetworkSidebar
- Similar articles are displayed in network visualization
- Navigation between different modes works smoothly
- All existing functionality remains intact
- Performance impact < 500ms for similarity calculations

## 🗂️ Task Breakdown

### **Task 1: Database Schema Updates**
**Estimated Time**: 4 hours
**Priority**: Critical (blocks other tasks)

#### **Subtasks**
1. Create `ArticleCitation` model in SQLAlchemy
2. Create `AuthorCollaboration` model in SQLAlchemy
3. Write Alembic migration scripts
4. Add database indexes for performance
5. Test migration up/down on local database

#### **Implementation Details**
```python
# models/article_citation.py
class ArticleCitation(Base):
    __tablename__ = "article_citations"
    
    id = Column(Integer, primary_key=True)
    citing_pmid = Column(String(50), ForeignKey("articles.pmid"), nullable=False)
    cited_pmid = Column(String(50), ForeignKey("articles.pmid"), nullable=False)
    citation_context = Column(Text)
    citation_type = Column(String(20), default="reference")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    citing_article = relationship("Article", foreign_keys=[citing_pmid])
    cited_article = relationship("Article", foreign_keys=[cited_pmid])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('citing_pmid', 'cited_pmid', name='unique_citation'),
        Index('idx_citing_pmid', 'citing_pmid'),
        Index('idx_cited_pmid', 'cited_pmid'),
    )
```

#### **Testing Requirements**
- [ ] Migration creates tables successfully
- [ ] Foreign key constraints work correctly
- [ ] Indexes improve query performance
- [ ] Rollback migration removes tables cleanly
- [ ] No impact on existing Article model

### **Task 2: Similarity Engine Implementation**
**Estimated Time**: 8 hours
**Priority**: Critical

#### **Subtasks**
1. Create `ArticleSimilarityEngine` class
2. Implement TF-IDF content similarity
3. Add citation overlap analysis
4. Add author overlap weighting
5. Create similarity caching mechanism
6. Write comprehensive unit tests

#### **Implementation Details**
```python
# services/similarity_engine.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Tuple
import redis
import json

class ArticleSimilarityEngine:
    def __init__(self, redis_client=None):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.8
        )
        self.redis_client = redis_client
        self.cache_ttl = 3600  # 1 hour cache
    
    def calculate_similarity(self, article1: Article, article2: Article) -> float:
        """Calculate similarity between two articles"""
        cache_key = f"similarity:{article1.pmid}:{article2.pmid}"
        
        # Check cache first
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return float(cached)
        
        # Calculate similarity components
        content_sim = self._content_similarity(article1, article2)
        citation_sim = self._citation_overlap(article1, article2)
        author_sim = self._author_overlap(article1, article2)
        
        # Weighted combination
        final_similarity = (
            0.6 * content_sim +
            0.3 * citation_sim +
            0.1 * author_sim
        )
        
        # Cache result
        if self.redis_client:
            self.redis_client.setex(cache_key, self.cache_ttl, str(final_similarity))
        
        return final_similarity
    
    def find_similar_articles(self, base_article: Article, candidates: List[Article], limit: int = 20) -> List[Tuple[Article, float]]:
        """Find most similar articles from candidates"""
        similarities = []
        
        for candidate in candidates:
            if candidate.pmid == base_article.pmid:
                continue
                
            similarity = self.calculate_similarity(base_article, candidate)
            if similarity > 0.1:  # Minimum threshold
                similarities.append((candidate, similarity))
        
        # Sort by similarity score
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:limit]
    
    def _content_similarity(self, article1: Article, article2: Article) -> float:
        """Calculate content similarity using TF-IDF"""
        content1 = f"{article1.title} {article1.abstract or ''}"
        content2 = f"{article2.title} {article2.abstract or ''}"
        
        if not content1.strip() or not content2.strip():
            return 0.0
        
        try:
            vectors = self.vectorizer.fit_transform([content1, content2])
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            return float(similarity)
        except Exception:
            return 0.0
    
    def _citation_overlap(self, article1: Article, article2: Article) -> float:
        """Calculate citation overlap similarity"""
        # This will be implemented once citation data is available
        # For now, return 0.0
        return 0.0
    
    def _author_overlap(self, article1: Article, article2: Article) -> float:
        """Calculate author overlap similarity"""
        authors1 = set(article1.authors or [])
        authors2 = set(article2.authors or [])
        
        if not authors1 or not authors2:
            return 0.0
        
        intersection = len(authors1.intersection(authors2))
        union = len(authors1.union(authors2))
        
        return intersection / union if union > 0 else 0.0
```

#### **Testing Requirements**
- [ ] Content similarity works with various text inputs
- [ ] Author overlap calculation is accurate
- [ ] Caching mechanism functions correctly
- [ ] Performance is acceptable (< 100ms per comparison)
- [ ] Edge cases handled (empty content, no authors)

### **Task 3: Similar Work API Endpoints**
**Estimated Time**: 6 hours
**Priority**: Critical

#### **Subtasks**
1. Create `/articles/{pmid}/similar` endpoint
2. Create `/articles/{pmid}/similar-network` endpoint
3. Add input validation and error handling
4. Implement response caching
5. Add API documentation
6. Write integration tests

#### **Implementation Details**
```python
# main.py - Add these endpoints
@app.get("/articles/{pmid}/similar")
async def get_similar_articles(
    pmid: str,
    limit: int = Query(20, ge=1, le=50),
    threshold: float = Query(0.1, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get articles similar to the specified PMID"""
    current_user = request.headers.get("User-ID", "default_user")
    
    # Get base article
    base_article = db.query(Article).filter(Article.pmid == pmid).first()
    if not base_article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Get candidate articles (same field/journal for now)
    candidates = db.query(Article).filter(
        Article.pmid != pmid,
        Article.journal.ilike(f"%{base_article.journal.split()[0]}%")
    ).limit(1000).all()
    
    # Calculate similarities
    similarity_engine = ArticleSimilarityEngine()
    similar_articles = similarity_engine.find_similar_articles(
        base_article, candidates, limit
    )
    
    # Format response
    result = []
    for article, similarity in similar_articles:
        if similarity >= threshold:
            result.append({
                "pmid": article.pmid,
                "title": article.title,
                "authors": article.authors,
                "journal": article.journal,
                "year": article.year,
                "similarity_score": round(similarity, 3),
                "url": article.url
            })
    
    return {
        "base_article": {
            "pmid": base_article.pmid,
            "title": base_article.title
        },
        "similar_articles": result,
        "total_found": len(result),
        "search_parameters": {
            "limit": limit,
            "threshold": threshold
        }
    }

@app.get("/articles/{pmid}/similar-network")
async def get_similar_articles_network(
    pmid: str,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get network visualization data for similar articles"""
    current_user = request.headers.get("User-ID", "default_user")
    
    # Get similar articles
    similar_data = await get_similar_articles(pmid, limit, 0.1, db, request)
    
    # Convert to network format
    nodes = []
    edges = []
    
    # Add base article as central node
    base_article = similar_data["base_article"]
    nodes.append({
        "id": base_article["pmid"],
        "label": base_article["title"][:50] + "...",
        "size": 80,
        "color": "#ff6b6b",  # Red for base article
        "metadata": base_article
    })
    
    # Add similar articles as connected nodes
    for article in similar_data["similar_articles"]:
        nodes.append({
            "id": article["pmid"],
            "label": article["title"][:50] + "...",
            "size": max(40, min(70, int(article["similarity_score"] * 100))),
            "color": "#4ecdc4",  # Teal for similar articles
            "metadata": article
        })
        
        # Add edge from base to similar article
        edges.append({
            "id": f"{base_article['pmid']}-{article['pmid']}",
            "source": base_article["pmid"],
            "target": article["pmid"],
            "label": f"Similarity: {article['similarity_score']:.2f}",
            "weight": article["similarity_score"]
        })
    
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "source_type": "similar_articles",
            "base_pmid": pmid,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "avg_similarity": sum(a["similarity_score"] for a in similar_data["similar_articles"]) / len(similar_data["similar_articles"]) if similar_data["similar_articles"] else 0
        },
        "cached": False
    }
```

#### **Testing Requirements**
- [ ] Endpoints return correct data format
- [ ] Input validation works properly
- [ ] Error handling for invalid PMIDs
- [ ] Response times < 2 seconds
- [ ] Network format compatible with React Flow

### **Task 4: Enhanced NetworkView Component**
**Estimated Time**: 6 hours
**Priority**: High

#### **Subtasks**
1. Add navigation mode support to NetworkView
2. Implement mode switching logic
3. Add breadcrumb trail system
4. Update component props and interfaces
5. Maintain backward compatibility
6. Write component tests

#### **Implementation Details**
```typescript
// components/NetworkView.tsx - Enhanced version
interface NetworkViewProps {
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  navigationMode?: 'default' | 'similar' | 'earlier' | 'later' | 'authors';
  onNodeSelect?: (node: NetworkNode | null) => void;
  onNavigationChange?: (mode: string, sourceId: string) => void;
  className?: string;
}

interface NavigationStep {
  mode: string;
  sourceId: string;
  sourceType: string;
  title: string;
  timestamp: Date;
}

export default function NetworkView({
  sourceType,
  sourceId,
  navigationMode = 'default',
  onNodeSelect,
  onNavigationChange,
  className = ''
}: NetworkViewProps) {
  const { user } = useAuth();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationTrail, setNavigationTrail] = useState<NavigationStep[]>([]);

  const fetchNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      
      // Determine endpoint based on navigation mode
      switch (navigationMode) {
        case 'similar':
          endpoint = `/api/proxy/articles/${sourceId}/similar-network`;
          break;
        case 'earlier':
          endpoint = `/api/proxy/articles/${sourceId}/references-network`;
          break;
        case 'later':
          endpoint = `/api/proxy/articles/${sourceId}/citations-network`;
          break;
        case 'authors':
          endpoint = `/api/proxy/articles/${sourceId}/author-network`;
          break;
        default:
          endpoint = `/api/proxy/${sourceType}s/${sourceId}/network`;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch network data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setNetworkData(data);
      
      // Update navigation trail
      if (navigationMode !== 'default') {
        const step: NavigationStep = {
          mode: navigationMode,
          sourceId,
          sourceType,
          title: data.metadata?.title || `${navigationMode} view`,
          timestamp: new Date()
        };
        
        setNavigationTrail(prev => [...prev, step]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId, navigationMode, user]);

  // Handle navigation mode changes
  const handleNavigationChange = useCallback((newMode: string, newSourceId?: string) => {
    const targetSourceId = newSourceId || sourceId;
    onNavigationChange?.(newMode, targetSourceId);
  }, [sourceId, onNavigationChange]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((step: NavigationStep) => {
    // Remove steps after the clicked step
    const stepIndex = navigationTrail.findIndex(s => s === step);
    setNavigationTrail(prev => prev.slice(0, stepIndex + 1));
    
    // Navigate to the clicked step
    handleNavigationChange(step.mode, step.sourceId);
  }, [navigationTrail, handleNavigationChange]);

  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading network data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading network</p>
          <p className="mt-2">{error}</p>
          <button
            onClick={fetchNetworkData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-600">No network data available</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      {/* Navigation Controls */}
      <NavigationControls
        currentMode={navigationMode}
        navigationTrail={navigationTrail}
        onModeChange={handleNavigationChange}
        onBreadcrumbClick={handleBreadcrumbClick}
      />
      
      {/* Existing React Flow Network Visualization */}
      <div className="h-full">
        {/* React Flow implementation remains the same */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          // ... rest of existing implementation
        />
      </div>
    </div>
  );
}
```

### **Task 5: NavigationControls Component**
**Estimated Time**: 4 hours
**Priority**: High

#### **Implementation Details**
```typescript
// components/NavigationControls.tsx
interface NavigationControlsProps {
  currentMode: string;
  navigationTrail: NavigationStep[];
  onModeChange: (mode: string) => void;
  onBreadcrumbClick: (step: NavigationStep) => void;
}

export default function NavigationControls({
  currentMode,
  navigationTrail,
  onModeChange,
  onBreadcrumbClick
}: NavigationControlsProps) {
  const navigationModes = [
    { key: 'default', label: 'Overview', icon: '🏠' },
    { key: 'similar', label: 'Similar Work', icon: '🔍' },
    { key: 'earlier', label: 'Earlier Work', icon: '⬅️' },
    { key: 'later', label: 'Later Work', icon: '➡️' },
    { key: 'authors', label: 'Authors', icon: '👥' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {navigationModes.map(mode => (
          <button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentMode === mode.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
      
      {/* Breadcrumb Trail */}
      {navigationTrail.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">Trail:</span>
          {navigationTrail.map((step, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => onBreadcrumbClick(step)}
                className="hover:text-blue-600 underline truncate max-w-32"
                title={step.title}
              >
                {step.title}
              </button>
              {index < navigationTrail.length - 1 && (
                <span className="text-gray-400">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🧪 Testing Strategy

### **Unit Tests**
- ArticleSimilarityEngine methods
- API endpoint logic
- Component rendering and interactions

### **Integration Tests**
- Database migrations
- API endpoint responses
- Component integration with backend

### **E2E Tests**
- Complete user workflow
- Navigation between modes
- Error handling scenarios

### **Performance Tests**
- Similarity calculation speed
- Network rendering performance
- API response times

## 📅 Implementation Timeline

### **Week 1**
- **Days 1-2**: Database schema and migrations
- **Days 3-4**: Similarity engine implementation
- **Day 5**: API endpoints

### **Week 2**
- **Days 1-2**: Frontend components
- **Days 3-4**: Testing and bug fixes
- **Day 5**: Documentation and deployment

## ✅ Definition of Done

- [ ] All code reviewed and approved
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance requirements met
- [ ] Documentation updated
- [ ] Deployed to staging and tested
- [ ] Ready for production deployment
