# Comprehensive Network Features Testing Plan

## Test Paper Selection

Using real PubMed papers with known citation networks:

### Test Paper 1: High-Impact Diabetes Paper
- **PMID**: 38350768
- **Title**: "Benefits and harms of drug treatment for type 2 diabetes..."
- **Authors**: Tsapas A, et al.
- **Journal**: BMJ
- **Year**: 2024
- **Why**: Recent, high-impact, well-cited paper with clear citation network

### Test Paper 2: Kidney Disease Research
- **PMID**: 33099609
- **Title**: Kidney disease research paper
- **Authors**: Srinivasan Beddhu, Alfred K Cheung, et al.
- **Why**: Used in "These Authors" testing, has known co-author network

### Test Paper 3: Older Foundational Paper
- **PMID**: 15976305
- **Title**: Classic paper with extensive citation history
- **Why**: Tests Earlier/Later Work features with temporal dimension

---

## Feature Testing Matrix

| Feature | Purpose | Expected Logic | Test Criteria |
|---------|---------|----------------|---------------|
| **Citations Network** | Papers citing this article | PubMed eLink `pubmed_pubmed_citedin` | 10-50 citing papers, newer than source |
| **References Network** | Papers cited by this article | PubMed eLink `pubmed_pubmed_refs` | 10-50 referenced papers, older than source |
| **Similar Work** | Topically related papers | PubMed eLink `pubmed_pubmed` | 10-20 papers, similar keywords/MeSH |
| **Earlier Work** | Foundational/prior research | References + older similar papers | Papers published BEFORE source, related topic |
| **Later Work** | Follow-up research | Citations + newer similar papers | Papers published AFTER source, related topic |
| **Linked Content** | Related resources | Reviews, meta-analyses, guidelines | Broader context papers, different types |
| **Suggested Authors** | Key researchers in field | Author co-occurrence analysis | Authors with high collaboration/citation overlap |

---

## Priority 0: Critical Features Testing

### 1. Citations Network ✅ (Already Working)
**Current Status**: Implemented and tested
**API**: `/api/proxy/pubmed/citations`
**Logic**: Uses PubMed eLink `pubmed_pubmed_citedin`

**Test Results Needed**:
- [ ] Returns 10+ citing papers for PMID 38350768
- [ ] All citing papers are newer than source (2024+)
- [ ] Papers actually cite the source (verify with PubMed)
- [ ] No duplicate PMIDs
- [ ] Proper error handling for papers with 0 citations

---

### 2. References Network ✅ (Already Working)
**Current Status**: Implemented and tested
**API**: `/api/proxy/pubmed/references`
**Logic**: Uses PubMed eLink `pubmed_pubmed_refs`

**Test Results Needed**:
- [ ] Returns 10+ referenced papers for PMID 38350768
- [ ] All referenced papers are older than source (pre-2024)
- [ ] Papers are actually in the reference list
- [ ] No duplicate PMIDs
- [ ] Fallback for papers with no indexed references

---

### 3. Linked Content ❌ (NOT IMPLEMENTED)
**Current Status**: Returns mock data or 404
**API**: `/api/proxy/articles/[pmid]/linked`
**Expected Logic**: 
- Find related reviews, meta-analyses, clinical guidelines
- Use PubMed filters: `Review[PT]`, `Meta-Analysis[PT]`, `Guideline[PT]`
- Search for papers with overlapping MeSH terms
- Different from "Similar Work" - broader context

**Implementation Needed**:
```typescript
// Pseudo-code for Linked Content
1. Get source paper's MeSH terms
2. Search PubMed for:
   - Reviews with same MeSH terms
   - Meta-analyses citing source or similar topic
   - Clinical guidelines in same domain
3. Filter for high-impact (citation count, journal)
4. Return 10-20 contextual papers
```

---

### 4. Suggested Authors ❌ (PARTIALLY IMPLEMENTED)
**Current Status**: Backend endpoint exists but may not be connected
**API**: `/api/proxy/articles/[pmid]/authors` or `/api/proxy/authors/suggested`
**Expected Logic**:
- Extract authors from source paper
- Find their frequent collaborators
- Find authors who cite this paper frequently
- Find authors with similar research topics

**Implementation Needed**:
```typescript
// Pseudo-code for Suggested Authors
1. Get source paper authors
2. For each author, find their other papers (last 5 years)
3. Extract co-authors from those papers
4. Rank by:
   - Co-authorship frequency
   - Citation overlap with source paper
   - H-index/impact (if available)
5. Return top 10-15 authors with profiles
```

---

## Priority 1: Temporal Features

### 5. Similar Work ⚠️ (NEEDS ENHANCEMENT)
**Current Status**: Uses PubMed eLink `pubmed_pubmed`
**API**: `/api/proxy/pubmed/recommendations` (type: 'similar')
**Current Issues**:
- May return too few papers
- May include unrelated papers
- No quality filtering

**Enhancement Needed**:
```typescript
// Enhanced Similar Work Logic
1. Use PubMed eLink `pubmed_pubmed` (baseline)
2. Extract MeSH terms from source paper
3. Search for papers with overlapping MeSH (2+ terms)
4. Filter by:
   - Minimum citation count (5+)
   - Recent papers (last 10 years)
   - Same research domain
5. Rank by relevance score
6. Return 15-20 high-quality papers
```

---

### 6. Earlier Work ❌ (NOT IMPLEMENTED)
**Current Status**: Returns 404 or empty
**API**: `/api/proxy/articles/[pmid]/earlier`
**Expected Logic**:
- Find papers published BEFORE source paper
- Focus on foundational/seminal work
- Include highly-cited references
- Include similar papers from earlier time period

**Implementation Needed**:
```typescript
// Earlier Work Logic
1. Get source paper year (e.g., 2024)
2. Get all references (already have this)
3. Find similar papers published before source year:
   - Use MeSH terms + date filter: `[Date - Publication] : source_year-1`
   - Sort by citation count (descending)
4. Combine references + older similar papers
5. Deduplicate and rank by:
   - Citation count
   - How many times cited by later papers
   - Relevance to source topic
6. Return 15-20 foundational papers
```

---

### 7. Later Work ❌ (NOT IMPLEMENTED)
**Current Status**: Returns 404 or empty
**API**: `/api/proxy/articles/[pmid]/later`
**Expected Logic**:
- Find papers published AFTER source paper
- Focus on follow-up research
- Include papers citing the source
- Include similar papers from later time period

**Implementation Needed**:
```typescript
// Later Work Logic
1. Get source paper year (e.g., 2024)
2. Get all citations (already have this)
3. Find similar papers published after source year:
   - Use MeSH terms + date filter: `source_year+1 : [Date - Publication]`
   - Sort by recency and citation count
4. Combine citations + newer similar papers
5. Deduplicate and rank by:
   - Recency (newer = higher)
   - Citation count
   - Relevance to source topic
6. Return 15-20 follow-up papers
```

---

## Testing Workflow

### Phase 1: Test Existing Features (Citations, References)
```bash
# Test Citations Network
curl "https://frontend-dufgjnp8s-fredericle77-gmailcoms-projects.vercel.app/api/proxy/pubmed/citations?pmid=38350768&limit=20"

# Test References Network
curl "https://frontend-dufgjnp8s-fredericle77-gmailcoms-projects.vercel.app/api/proxy/pubmed/references?pmid=38350768&limit=20"
```

### Phase 2: Implement Missing Features
1. **Linked Content** - Implement PubMed search for reviews/meta-analyses
2. **Suggested Authors** - Implement co-author analysis
3. **Earlier Work** - Implement temporal + reference analysis
4. **Later Work** - Implement temporal + citation analysis

### Phase 3: Enhance Similar Work
1. Add MeSH term extraction
2. Add quality filtering (citation count, journal impact)
3. Add relevance scoring

### Phase 4: Comprehensive Testing
Test each feature with all 3 test papers and verify:
- Correct number of results (10-20 papers)
- Logical relevance to source paper
- No duplicates
- Proper temporal ordering (where applicable)
- Error handling

---

## Success Criteria

### Citations Network
- ✅ Returns 10-50 papers citing the source
- ✅ All papers published after source
- ✅ Papers verifiably cite the source
- ✅ Sorted by recency or relevance

### References Network
- ✅ Returns 10-50 papers cited by source
- ✅ All papers published before source
- ✅ Papers verifiably in reference list
- ✅ Sorted by citation count or relevance

### Similar Work
- ✅ Returns 15-20 topically related papers
- ✅ Papers share 2+ MeSH terms with source
- ✅ Minimum citation count (5+)
- ✅ Diverse time range (not all from same year)

### Earlier Work
- ✅ Returns 15-20 foundational papers
- ✅ All papers published before source
- ✅ Includes highly-cited references
- ✅ Includes seminal work in the field

### Later Work
- ✅ Returns 15-20 follow-up papers
- ✅ All papers published after source
- ✅ Includes papers citing the source
- ✅ Includes recent related research

### Linked Content
- ✅ Returns 10-15 contextual papers
- ✅ Includes reviews, meta-analyses, guidelines
- ✅ Broader scope than "Similar Work"
- ✅ High-impact papers for context

### Suggested Authors
- ✅ Returns 10-15 key researchers
- ✅ Authors with collaboration overlap
- ✅ Authors with citation overlap
- ✅ Includes author profiles/affiliations

---

## Next Steps

1. **Run comprehensive tests** on Citations and References (verify they work correctly)
2. **Implement Linked Content** API with PubMed review/meta-analysis search
3. **Implement Suggested Authors** API with co-author analysis
4. **Implement Earlier Work** API with temporal + reference logic
5. **Implement Later Work** API with temporal + citation logic
6. **Enhance Similar Work** with MeSH terms and quality filtering
7. **Deploy and test** all features with real papers
8. **Document** each feature's logic and expected behavior

