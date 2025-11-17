# 🔄 Strategic Comparison: Current vs. Pivoted Product

**Date**: November 17, 2025  
**Purpose**: Side-by-side comparison for decision-making

---

## 🎯 Core Positioning

| Aspect | BEFORE (Current) | AFTER (Pivoted) |
|--------|------------------|-----------------|
| **Product Category** | AI-powered literature discovery tool | Research project OS |
| **Tagline** | "AI-powered research intelligence platform" | "The research project OS that turns papers into a living plan" |
| **Primary Value** | Find and analyze papers faster | Structure your entire research project |
| **Core Workflow** | Search → Explore → Collect → Analyze | Question → Hypothesis → Evidence → Experiment |
| **Competitive Set** | ResearchRabbit, Litmaps, Connected Papers | Notion (generic), Benchling (lab-only), Blue Ocean |
| **Differentiation** | "Better AI summaries" (weak) | "Own the research project, not just papers" (strong) |
| **Market Position** | Crowded, mature market | Blue ocean, underserved |

---

## 👥 Target Users

| Aspect | BEFORE (Current) | AFTER (Pivoted) |
|--------|------------------|-----------------|
| **Primary ICP** | Researchers who need better literature discovery | PhD students (years 1-3) struggling to structure thesis |
| **Pain Point** | "PubMed is hard to use" | "I have 200 papers but no clear research plan" |
| **Secondary ICP** | R&D teams in general | Biotech R&D scientists onboarding new team members |
| **Pain Point** | "Need to stay on top of literature" | "New scientist takes 6 months to understand our project" |
| **Wedge** | Better discovery than PubMed | Free for students + supervisor endorsement |
| **Expansion** | More features, more users | PhD → Biotech → Pharma (vertical expansion) |

---

## 🏗️ Product Architecture

| Component | BEFORE (Current) | AFTER (Pivoted) |
|-----------|------------------|-----------------|
| **Data Model** | Paper-centered | Project-centered |
| **Primary Entity** | Article (PMID) | Research Question |
| **Organization** | Collections of papers | Questions with linked evidence |
| **Hierarchy** | Project → Collections → Papers | Project → Questions → Hypotheses → Evidence → Experiments |
| **AI Focus** | Summarize papers | Update project structure based on papers |
| **Timeline** | Activity log (who did what) | Decision timeline (why we pivoted) |

---

## 📊 New Database Tables Required

| Table | Purpose | Priority |
|-------|---------|----------|
| `research_questions` | Question hierarchy with status, type, evidence | 🔴 CRITICAL |
| `question_evidence` | Link papers to questions | 🔴 CRITICAL |
| `hypotheses` | Track hypotheses linked to questions | 🔴 CRITICAL |
| `hypothesis_evidence` | Link papers to hypotheses | 🔴 CRITICAL |
| `project_decisions` | Decision log with rationale | 🟡 HIGH |
| `paper_triage` | Must read / nice to know / ignore | 🟡 HIGH |
| `project_alerts` | New papers affecting project | 🟡 HIGH |
| `field_summaries` | Living summaries with versions | 🟢 MEDIUM |
| `protocols` | Extracted from papers | 🟢 MEDIUM |
| `experiments` | Linked to hypotheses & protocols | 🟢 MEDIUM |

---

## 🎨 UI Changes Required

| Screen | Change Type | Effort |
|--------|-------------|--------|
| **Landing Page** | Rewrite copy + positioning | 1 week |
| **Onboarding** | Add question definition step | 1 week |
| **Research Question Tab** | Replace text field with tree structure | 2 weeks |
| **Explore Tab** | Add "Link to Question" button | 1 week |
| **Collections Tab** | Show question linkages | 1 week |
| **Analysis Tab** | Add Living Summary section | 2 weeks |
| **NEW: Inbox Tab** | Build triage interface | 2 weeks |
| **NEW: Decisions Tab** | Build timeline visualization | 2 weeks |
| **NEW: Experiments Tab** | Build Kanban board | 2 weeks |

**Total Effort**: ~14 weeks (3.5 months) for core UI

---

## 🤖 AI Features Comparison

| Feature | BEFORE | AFTER | Change |
|---------|--------|-------|--------|
| Deep Dive | ✅ Exists | ✅ Keep + Extract protocols | Enhance |
| Generate Review | ✅ Exists | ✅ Keep + Organize by questions | Enhance |
| Recommendations | ✅ Generic | ✅ Project-specific triage | Rebuild |
| Semantic Analysis | ✅ Exists | ✅ Keep + Link to questions | Enhance |
| Question Generation | ❌ None | ✅ AI suggests sub-questions | NEW |
| Hypothesis Suggestions | ❌ None | ✅ AI suggests hypotheses | NEW |
| Impact Assessment | ❌ None | ✅ "This affects Hypothesis 2" | NEW |
| Living Summary | ❌ None | ✅ Auto-updating field summary | NEW |
| Protocol Extraction | ❌ None | ✅ Extract methods to protocols | NEW |

---

## 🔗 Integration Strategy

| Integration | BEFORE | AFTER | Rationale |
|-------------|--------|-------|-----------|
| ResearchRabbit | ❌ Competing | ✅ Import collections | Partner, don't compete |
| Litmaps | ❌ Competing | ✅ Import maps | Partner, don't compete |
| Zotero | ❌ None | ✅ Bi-directional sync | Essential for adoption |
| Mendeley | ❌ None | ✅ Import libraries | Essential for adoption |
| Benchling | ❌ None | ✅ Export protocols | Lab expansion path |
| Notion | ❌ None | ✅ Export structure | Workflow integration |
| Overleaf | ❌ None | ✅ Export chapters | Thesis writing |

---

## 📈 Success Metrics Comparison

| Metric Type | BEFORE (Current) | AFTER (Pivoted) |
|-------------|------------------|-----------------|
| **Activation** | Papers searched | Questions defined |
| **Engagement** | Networks visualized | Papers linked to questions |
| **Value** | Deep dives generated | Hypotheses formulated |
| **Retention** | Weekly active users | Weekly active projects |
| **Outcome** | Collections created | Thesis chapters exported |
| **Team** | Collaborators invited | Decisions logged |
| **Expansion** | - | Protocols extracted |

---

## 💰 Business Model Comparison

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Free Tier** | Basic features | Full features for PhD students (.edu) |
| **Paid Tier** | Advanced AI | Team/lab features |
| **Pricing** | $10-20/user/month | $500-1000/lab/month |
| **Target ARPU** | $15/month | $750/month |
| **Sales Motion** | Self-serve | Design partners → Direct sales |
| **Expansion** | Add users | PhD (free) → Lab (paid) |

---

## 🏆 Competitive Positioning

### BEFORE: Crowded Market
```
Literature Discovery Tools
- ResearchRabbit ⭐⭐⭐⭐⭐ (5-year head start)
- Litmaps ⭐⭐⭐⭐ (Strong product-market fit)
- Connected Papers ⭐⭐⭐⭐ (Established user base)
- Inciteful ⭐⭐⭐
- [US] ⭐⭐ ← Fighting uphill battle
```

### AFTER: Blue Ocean
```
Research Project Management
- Notion ⭐⭐ (Generic, not research-specific)
- Benchling ⭐⭐⭐ (Lab-only, no literature layer)
- [US] ⭐⭐⭐⭐⭐ ← Clear differentiation
```

---

## ⚖️ Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users want simple tool | Medium | High | Keep "Simple Mode" + "Project Mode" |
| Too complex for students | Medium | High | Templates + guided wizard |
| Lab integration hard | High | Medium | Start with export, not bi-directional |
| Existing users resist | Low | Medium | Grandfather into "Classic Mode" |
| 6 months not enough | Medium | High | Focus on MVP, iterate |

---

## 📅 Implementation Timeline

| Month | Focus | Deliverables |
|-------|-------|--------------|
| **1** | Foundation | Questions, Evidence linking, Decisions |
| **2** | Structure | Hypotheses, Decision timeline |
| **3** | Intelligence | Triage, Impact assessment, Alerts |
| **4** | Summary | Living summary, Version history |
| **5** | Lab Bridge 1 | Protocol extraction, Library |
| **6** | Lab Bridge 2 | Experiment planning, ELN integration |

---

## 💡 Key Decision Factors

### Why PIVOT is Recommended

✅ **Market Opportunity**: Blue ocean vs. crowded market  
✅ **Differentiation**: Clear vs. unclear  
✅ **Moat**: Workflow lock-in vs. commoditized AI  
✅ **Expansion**: Vertical (PhD → biotech) vs. horizontal  
✅ **Competition**: Partner with vs. compete against incumbents  
✅ **Value Prop**: Structural (hard to copy) vs. feature-based (easy to copy)  

### Why STAY COURSE Might Make Sense

⚠️ **Simpler**: No major changes required  
⚠️ **Faster**: Can iterate on current features  
⚠️ **Less Risk**: No disruption to existing users  

**BUT**: Unlikely to win in crowded market with commoditized features

---

## ✅ What Stays the Same (Important!)

We're **NOT** throwing away what we built:

✅ Network visualization → Reframe as "see your project structure"  
✅ Collections → Reframe as "evidence for questions"  
✅ Deep Dive → Enhance with protocol extraction  
✅ Collaboration → Enhance with decision tracking  
✅ PDF viewer → Link annotations to questions  
✅ Activity feed → Enhance with decision timeline  

**Key Point**: We're adding a project structure layer on top of existing features.

---

## 🎯 The Bottom Line

| Question | BEFORE (Current) | AFTER (Pivoted) |
|----------|------------------|-----------------|
| **What are we?** | Another literature tool | The research project OS |
| **Who do we serve?** | Generic researchers | PhD students + biotech R&D |
| **What problem?** | Literature discovery is hard | Turning papers into structured research is hard |
| **Who do we compete with?** | ResearchRabbit, Litmaps (strong) | Notion (generic), Blue Ocean |
| **What's our moat?** | AI features (weak) | Workflow lock-in (strong) |
| **Can we win?** | Unlikely | Yes |

---

## 🚀 Recommendation

### PIVOT to Research Project OS

**Investment**: ~$200-300K over 6 months  
**Risk**: Medium (mitigated with design partners)  
**Upside**: High (blue ocean, clear differentiation)  
**Downside**: Low (keep existing features)  

**Next Step**: Team meeting → Commit → Execute Month 1

---

**Related Documents**:
- `STRATEGIC_REALIGNMENT_ANALYSIS.md` - Full 900+ line analysis
- `PIVOT_ACTION_PLAN.md` - Detailed 6-month roadmap
- `QUICK_REFERENCE_PIVOT.md` - Quick reference guide

