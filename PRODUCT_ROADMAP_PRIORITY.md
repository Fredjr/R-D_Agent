# Product Roadmap: Most Urgent & Impactful Next Steps

## 🎯 Executive Summary

Based on the current state of R-D Agent and production issues, here are the **most urgent and impactful** improvements prioritized by:
1. **User Impact** - How much it improves user experience
2. **Business Value** - How much it drives adoption/retention
3. **Technical Debt** - How much it prevents future issues
4. **Effort** - Implementation complexity (lower is better)

---

## 🔥 **CRITICAL PRIORITY** (Do This Week)

### 1. Fix Tables & Figures Display 🖼️
**Impact**: ⭐⭐⭐⭐⭐ | **Effort**: ⭐⭐ | **Timeline**: 2-3 days

**Problem**:
- Users can't see extracted tables and figures from PDFs
- Rich content extraction exists but isn't visible
- Critical for protocol understanding and experiment planning

**Solution**:
1. **Verify migration 011 ran** on Railway database
2. **Check PDF extraction** - Ensure it's running for new papers
3. **Fix frontend rendering** - Ensure PDFViewer displays base64 images
4. **Add re-extraction endpoint** - Allow users to re-extract PDFs

**User Value**:
- See data tables from papers
- View experimental figures
- Better protocol extraction quality
- Enhanced experiment planning

**Implementation**:
```bash
# 1. Check migration status
curl -X POST "https://r-dagent-production.up.railway.app/admin/migrate/011-add-tables-and-figures" \
  -H "X-Admin-Key: {admin_key}"

# 2. Add re-extraction endpoint
POST /api/articles/{pmid}/extract-pdf
{
  "force_refresh": true
}

# 3. Fix frontend PDFViewer component
- Check base64 data URI rendering
- Add tables display component
- Add figures gallery component
```

---

### 2. Auto Evidence Linking 🔗
**Impact**: ⭐⭐⭐⭐⭐ | **Effort**: ⭐⭐⭐ | **Timeline**: 3-5 days

**Problem**:
- AI triage identifies evidence but doesn't persist it
- Users must manually link evidence to hypotheses
- Disconnect between AI insights and evidence tracking

**Current State**:
- ✅ AI extracts evidence excerpts (in `evidence_excerpts` field)
- ✅ AI links to hypotheses (in `hypothesis_relevance_scores` field)
- ❌ NOT persisted in `hypothesis_evidence` table
- ❌ NOT visible in hypothesis evidence list

**Solution**:
1. **Auto-create evidence links** when AI triage identifies evidence
2. **Populate hypothesis_evidence table** with AI-identified evidence
3. **Update evidence counts** automatically
4. **Allow user review/edit** of AI-generated links

**User Value**:
- Automatic evidence tracking
- No manual linking needed
- Hypothesis status updates automatically
- See evidence accumulate over time

**Implementation**:
```python
# In ai_triage_service.py after triage
for hyp_id, evidence in evidence_quotes.items():
    # Create hypothesis_evidence record
    evidence_link = HypothesisEvidence(
        hypothesis_id=hyp_id,
        article_pmid=article_pmid,
        evidence_type=evidence['support_type'],  # supports/contradicts/neutral
        strength='moderate',  # Default, can be AI-assessed later
        key_finding=evidence['quote'],
        linked_by='ai_triage',
        confidence_score=evidence.get('confidence', 0.8)
    )
    db.add(evidence_link)
    
    # Update hypothesis evidence counts
    update_hypothesis_evidence_counts(hyp_id, db)
```

---

### 3. Auto Hypothesis Status Updates 📊
**Impact**: ⭐⭐⭐⭐ | **Effort**: ⭐⭐ | **Timeline**: 2 days

**Problem**:
- Users must manually update hypothesis status
- No automatic "mark as supported/rejected" based on evidence
- Hypothesis status doesn't reflect evidence accumulation

**Solution**:
1. **Define evidence thresholds**:
   - 3+ supporting papers (strong evidence) → `supported`
   - 3+ contradicting papers (strong evidence) → `rejected`
   - Mixed evidence → `inconclusive`
   - 1-2 papers → `testing`

2. **Auto-update status** when evidence is added
3. **Show confidence level** based on evidence strength
4. **Allow user override** with explanation

**User Value**:
- See hypothesis status evolve automatically
- Know when hypothesis is well-supported
- Identify contradictory evidence quickly
- Focus on hypotheses needing more evidence

**Implementation**:
```python
def update_hypothesis_status(hypothesis_id: str, db: Session):
    """Auto-update hypothesis status based on evidence"""
    hypothesis = db.query(Hypothesis).filter_by(hypothesis_id=hypothesis_id).first()
    
    supporting = hypothesis.supporting_evidence_count
    contradicting = hypothesis.contradicting_evidence_count
    
    # Auto-update status
    if supporting >= 3 and contradicting == 0:
        hypothesis.status = 'supported'
        hypothesis.confidence_level = min(90, 60 + (supporting * 10))
    elif contradicting >= 3 and supporting == 0:
        hypothesis.status = 'rejected'
        hypothesis.confidence_level = min(90, 60 + (contradicting * 10))
    elif supporting >= 2 and contradicting >= 2:
        hypothesis.status = 'inconclusive'
        hypothesis.confidence_level = 50
    elif supporting >= 1 or contradicting >= 1:
        hypothesis.status = 'testing'
        hypothesis.confidence_level = 40 + (supporting + contradicting) * 5
    
    db.commit()
```

---

## 🚀 **HIGH PRIORITY** (Do This Month)

### 4. Smart Recommendations Engine 🤖
**Impact**: ⭐⭐⭐⭐⭐ | **Effort**: ⭐⭐⭐⭐ | **Timeline**: 1 week

**Problem**:
- Users don't know what to do next
- No guidance on which papers to read
- No suggestions for experiments to run
- No alerts for important findings

**Solution**:
1. **Paper recommendations**:
   - "Papers you should read next" based on hypotheses
   - "Papers similar to your favorites"
   - "Trending papers in your field"

2. **Experiment recommendations**:
   - "Experiments to test hypothesis X"
   - "Protocols similar to your successful ones"
   - "Next steps based on your results"

3. **Research recommendations**:
   - "Questions to explore based on findings"
   - "Hypotheses to test based on evidence"
   - "Gaps in your research"

**User Value**:
- Guided research workflow
- Never stuck on "what's next"
- Discover relevant papers automatically
- Accelerate research progress

---

### 5. Collaborative Features 👥
**Impact**: ⭐⭐⭐⭐ | **Effort**: ⭐⭐⭐⭐ | **Timeline**: 1-2 weeks

**Problem**:
- Single-user system
- No team collaboration
- Can't share projects or insights
- No commenting or discussions

**Solution**:
1. **Project sharing**:
   - Invite team members to projects
   - Role-based permissions (owner, editor, viewer)
   - Shared Smart Inbox and protocols

2. **Commenting system**:
   - Comment on papers, protocols, experiments
   - @mention team members
   - Threaded discussions

3. **Activity feed**:
   - See what team members are doing
   - Get notified of important updates
   - Track project progress

**User Value**:
- Collaborate with research team
- Share knowledge and insights
- Faster decision-making
- Better research outcomes

---

### 6. Enhanced Protocol Extraction 🔬
**Impact**: ⭐⭐⭐⭐ | **Effort**: ⭐⭐⭐ | **Timeline**: 3-5 days

**Problem**:
- Protocol extraction quality varies
- Missing key details (reagents, equipment, timing)
- No validation of extracted protocols
- Can't compare protocols easily

**Solution**:
1. **Structured protocol schema**:
   - Standardized fields (materials, steps, timing, cost)
   - Validation rules (required fields, formats)
   - Quality score (completeness, clarity)

2. **Protocol comparison**:
   - Side-by-side comparison of protocols
   - Highlight differences
   - Identify best practices

3. **Protocol templates**:
   - Common protocol types (PCR, Western blot, etc.)
   - Pre-filled fields
   - Customizable templates

**User Value**:
- Higher quality protocol extraction
- Easier protocol comparison
- Faster experiment planning
- Reduced errors

---

## 📈 **MEDIUM PRIORITY** (Do Next Quarter)

### 7. Results Tracking & Analysis 📊
**Impact**: ⭐⭐⭐⭐ | **Effort**: ⭐⭐⭐⭐ | **Timeline**: 2 weeks

**Problem**:
- Experiment results not well-integrated
- No automatic analysis of results
- Can't track success/failure patterns
- No learning from past experiments

**Solution**:
1. **Results dashboard**:
   - Success rate by protocol
   - Common failure modes
   - Cost and time tracking
   - ROI analysis

2. **Results analysis**:
   - AI-powered insights from results
   - Pattern detection
   - Anomaly detection
   - Recommendations for improvement

3. **Results linking**:
   - Link results to hypotheses
   - Update hypothesis status based on results
   - Generate new questions from results

---

### 8. Advanced Search & Filters 🔍
**Impact**: ⭐⭐⭐ | **Effort**: ⭐⭐⭐ | **Timeline**: 1 week

**Problem**:
- Hard to find specific papers/protocols
- No advanced filtering
- No saved searches
- No semantic search

**Solution**:
1. **Advanced filters**:
   - Filter by date, journal, author, citation count
   - Filter by evidence type, hypothesis status
   - Filter by protocol type, difficulty, cost

2. **Semantic search**:
   - Search by concept, not just keywords
   - "Papers about X that support Y"
   - "Protocols similar to Z"

3. **Saved searches**:
   - Save common searches
   - Get alerts for new matches
   - Share searches with team

---

### 9. Mobile App 📱
**Impact**: ⭐⭐⭐ | **Effort**: ⭐⭐⭐⭐⭐ | **Timeline**: 1-2 months

**Problem**:
- Desktop-only access
- Can't review papers on the go
- No offline access
- No mobile notifications

**Solution**:
1. **Mobile-responsive web app** (Phase 1)
2. **Native mobile app** (Phase 2)
3. **Offline mode**
4. **Push notifications**

---

## 🎯 **RECOMMENDED SPRINT PLAN**

### **Week 1-2: Critical Fixes**
- [ ] Fix tables & figures display
- [ ] Implement auto evidence linking
- [ ] Implement auto hypothesis status updates

### **Week 3-4: High-Value Features**
- [ ] Build smart recommendations engine
- [ ] Enhance protocol extraction quality
- [ ] Add protocol comparison feature

### **Month 2: Collaboration & Scale**
- [ ] Add collaborative features
- [ ] Implement results tracking
- [ ] Add advanced search & filters

### **Month 3: Polish & Growth**
- [ ] Mobile-responsive design
- [ ] Performance optimization
- [ ] User onboarding improvements

---

## 📊 **Impact vs Effort Matrix**

```
High Impact, Low Effort (DO FIRST):
- Auto hypothesis status updates ⭐⭐⭐⭐ | ⭐⭐
- Tables & figures display ⭐⭐⭐⭐⭐ | ⭐⭐

High Impact, Medium Effort (DO NEXT):
- Auto evidence linking ⭐⭐⭐⭐⭐ | ⭐⭐⭐
- Enhanced protocol extraction ⭐⭐⭐⭐ | ⭐⭐⭐
- Advanced search & filters ⭐⭐⭐ | ⭐⭐⭐

High Impact, High Effort (PLAN CAREFULLY):
- Smart recommendations engine ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐
- Collaborative features ⭐⭐⭐⭐ | ⭐⭐⭐⭐
- Results tracking & analysis ⭐⭐⭐⭐ | ⭐⭐⭐⭐
- Mobile app ⭐⭐⭐ | ⭐⭐⭐⭐⭐
```

---

## 🎉 **Quick Wins** (Can Do Today)

1. **Add "Re-extract PDF" button** in UI (1 hour)
2. **Show evidence count badges** on hypotheses (30 min)
3. **Add "Last updated" timestamps** everywhere (1 hour)
4. **Improve error messages** with actionable guidance (2 hours)
5. **Add loading states** for all async operations (2 hours)

---

## 💡 **Key Metrics to Track**

1. **User Engagement**:
   - Papers triaged per week
   - Protocols extracted per week
   - Experiments planned per week

2. **Feature Adoption**:
   - % users using Smart Inbox
   - % users linking evidence
   - % users creating experiment plans

3. **Quality Metrics**:
   - AI triage accuracy
   - Protocol extraction completeness
   - Evidence linking relevance

4. **Business Metrics**:
   - User retention (weekly, monthly)
   - Time to value (first insight)
   - User satisfaction (NPS)

