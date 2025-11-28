# AI Triage Workflow - Critical Clarification

**Date**: 2025-11-28  
**Status**: Assessment Phase - NO CODING YET  
**Priority**: 🔴 **CRITICAL** - Major architectural change

---

## 🎯 **Executive Summary**

The AI triage workflow has a **critical architectural change** from project-centric to collection-centric triage. This document clarifies the user journey, technical implementation, and database schema changes needed.

---

## 🔑 **Key Clarifications**

### **1. Triage is NOT Automatic**

❌ **WRONG**: Papers are automatically triaged when they appear in search results  
✅ **CORRECT**: User must **explicitly click "AI Triage" button** on specific papers

### **2. Triage is Collection-Centric, Not Project-Centric**

❌ **WRONG**: Triage scans against one project's questions/hypotheses  
✅ **CORRECT**: Triage scans across **ALL collections**, then identifies linked projects

### **3. Triage Scans Both Project-Level and Collection-Level Q&H**

✅ **Project-Level**: Research questions and hypotheses assigned to projects  
✅ **Collection-Level**: Research questions and hypotheses assigned to collections (Phase 0 feature)

---

## 👤 **User Journey**

### **Step 1: Search for Papers** (All Papers Tab)

```
User Action: Enter search query on Home page or Discover → All Papers tab
System: PubMed search returns results (e.g., 127 papers)
Display: Papers shown in standard paper cards
```

### **Step 2: Trigger AI Triage** (All Papers Tab)

```
User Action: Click "AI Triage" button on specific paper(s)
System: Triggers POST /triage endpoint
Display: Loading indicator while AI processes
```

### **Step 3: AI Triage Process** (Backend)

```
System Process:
1. Scan across ALL collections in the system
2. For each collection:
   a. Get linked projects via ProjectCollection junction table
   b. Retrieve project-level research questions and hypotheses
   c. Retrieve collection-level research questions and hypotheses
3. Analyze paper against all questions/hypotheses
4. Generate triage output:
   - Relevance score (0-100)
   - Triage status (must_read, nice_to_know, ignore)
   - Impact assessment
   - Affected questions (IDs)
   - Affected hypotheses (IDs)
   - AI reasoning
   - Evidence excerpts (quotes from paper)
   - Question relevance scores (per question)
   - Hypothesis relevance scores (per hypothesis)
5. Store triage result in PaperTriage table
6. Return triage response with affected collections/projects
```

### **Step 4: View Triaged Papers** (Smart Inbox Tab)

```
User Action: Navigate to Discover → Smart Inbox tab
System: Display all triaged papers across all collections
Display: 
- Triage stats (Total, Must Read, Nice to Know, Ignored)
- Paper cards with triage badges, relevance scores, evidence links
- Batch mode controls
- Keyboard shortcuts (A/R/M/D)
```

---

## 🏗️ **Database Schema**

### **Collections** (Existing - Week 24)

```python
class Collection(Base):
    __tablename__ = "collections"
    
    collection_id = Column(String, primary_key=True)
    collection_name = Column(String, nullable=False)
    
    # Week 24: Integration Gaps - Collections + Hypotheses
    linked_hypothesis_ids = Column(JSON, default=list)  # List of hypothesis IDs
    linked_question_ids = Column(JSON, default=list)    # List of question IDs
    collection_purpose = Column(String, default='general')
    auto_update = Column(Boolean, default=False)
```

### **ProjectCollection** (Junction Table - Phase 0)

```python
class ProjectCollection(Base):
    __tablename__ = "project_collections"
    
    project_id = Column(String, ForeignKey("projects.project_id"))
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    
    # Mapping between collection-level and project-level entities
    # Format: {collection_question_id: project_question_id}
    linked_project_question_ids = Column(JSON, default=dict)
    linked_project_hypothesis_ids = Column(JSON, default=dict)
```

### **ResearchQuestion** (Project-Level)

```python
class ResearchQuestion(Base):
    __tablename__ = "research_questions"
    
    question_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='sub')
    status = Column(String, default='exploring')
```

### **CollectionResearchQuestion** (Collection-Level - Phase 0)

```python
class CollectionResearchQuestion(Base):
    __tablename__ = "collection_research_questions"
    
    question_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='exploratory')
    status = Column(String, default='open')
```

### **Hypothesis** (Project-Level)

```python
class Hypothesis(Base):
    __tablename__ = "hypotheses"
    
    hypothesis_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    question_id = Column(String, ForeignKey("research_questions.question_id"))
    hypothesis_text = Column(Text, nullable=False)
    status = Column(String, default='proposed')
```

### **CollectionHypothesis** (Collection-Level - Phase 0)

```python
class CollectionHypothesis(Base):
    __tablename__ = "collection_hypotheses"
    
    hypothesis_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    question_id = Column(String, ForeignKey("collection_research_questions.question_id"))
    hypothesis_text = Column(Text, nullable=False)
    status = Column(String, default='untested')
```

### **PaperTriage** (Triage Output)

```python
class PaperTriage(Base):
    __tablename__ = "paper_triage"
    
    triage_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))  # ⚠️ May need to change
    article_pmid = Column(String, ForeignKey("articles.pmid"))
    
    # Triage status
    triage_status = Column(String, default='must_read')  # must_read, nice_to_know, ignore
    relevance_score = Column(Integer, default=50)  # 0-100
    
    # AI analysis
    impact_assessment = Column(Text, nullable=True)
    affected_questions = Column(JSON, default=list)  # Question IDs
    affected_hypotheses = Column(JSON, default=list)  # Hypothesis IDs
    ai_reasoning = Column(Text, nullable=True)
    
    # Enhanced fields (Week 9+)
    confidence_score = Column(Float, default=0.5)
    metadata_score = Column(Integer, default=0)
    evidence_excerpts = Column(JSON, default=list)  # Quotes from paper
    question_relevance_scores = Column(JSON, default=dict)  # {question_id: score}
    hypothesis_relevance_scores = Column(JSON, default=dict)  # {hypothesis_id: score}
```

**⚠️ SCHEMA CHANGE NEEDED**:
- Current: `PaperTriage` has `project_id` (project-centric)
- Target: `PaperTriage` should have `collection_id` or both (collection-centric)
- Decision: Add `collection_id` field, keep `project_id` for backward compatibility

---

## 🔌 **API Endpoints**

### **🔑 CRITICAL: New Global Triage Endpoint**

**`POST /triage`** - Global AI Triage (Collection-Centric)

**Input**:
```json
{
  "article_pmid": "12345678",
  "force_refresh": false
}
```

**Process**:
1. Scan across ALL collections
2. Get linked projects via ProjectCollection
3. Retrieve project-level + collection-level Q&H
4. Analyze paper against all Q&H
5. Return triage results for all affected collections/projects

**Output**:
```json
{
  "triage_id": "uuid",
  "article_pmid": "12345678",
  "triage_status": "must_read",
  "relevance_score": 95,
  "affected_collections": [
    {
      "collection_id": "col1",
      "collection_name": "GLP-1 Agonists",
      "relevance_score": 95,
      "affected_questions": ["q1", "q2"],
      "affected_hypotheses": ["h1", "h2"]
    }
  ],
  "affected_projects": [
    {
      "project_id": "proj1",
      "project_name": "Type 2 Diabetes Research",
      "relevance_score": 92,
      "affected_questions": ["pq1"],
      "affected_hypotheses": ["ph1"]
    }
  ],
  "impact_assessment": "...",
  "ai_reasoning": "...",
  "evidence_excerpts": [...],
  "question_relevance_scores": {...},
  "hypothesis_relevance_scores": {...}
}
```

---

## 📊 **Comparison: Current vs Target**

| Aspect | Current | Target | Change |
|--------|---------|--------|--------|
| **Triage Trigger** | Automatic (?) | Manual "AI Triage" button | User-initiated |
| **Triage Scope** | Project-centric | Collection-centric | Scan all collections |
| **API Endpoint** | `POST /project/{id}/triage` | `POST /triage` | Global endpoint |
| **Q&H Scope** | Project-level only | Project + Collection level | Both levels |
| **Smart Inbox** | Project-specific | Global (all collections) | Cross-collection |
| **Triage Output** | One project | All affected collections/projects | Multi-collection |

---

## 🚨 **Critical Decisions**

### **Decision 1: PaperTriage Schema**

**Question**: Should `PaperTriage` table have `project_id` or `collection_id`?

**Options**:
- **A**: Keep `project_id` only (current) - Breaks collection-centric model
- **B**: Change to `collection_id` only - Breaks backward compatibility
- **C**: Add both `project_id` and `collection_id` - Best of both worlds

**Recommendation**: **Option C** - Add `collection_id` field, keep `project_id` for backward compatibility

### **Decision 2: Triage Endpoint**

**Question**: Should we keep project-specific triage endpoint?

**Options**:
- **A**: Remove `POST /project/{id}/triage` - Breaking change
- **B**: Keep both endpoints - Maintain backward compatibility
- **C**: Deprecate `POST /project/{id}/triage`, migrate to `POST /triage`

**Recommendation**: **Option B** - Keep both endpoints for now, deprecate old one later

---

**Status**: ✅ **WORKFLOW CLARIFIED - READY FOR IMPLEMENTATION PLANNING**


