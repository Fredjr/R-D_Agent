# 🚀 Pivot Action Plan: From Literature Tool to Research Project OS

**Date**: November 17, 2025  
**Status**: READY TO EXECUTE  
**Timeline**: 6 months to full pivot  

---

## 🎯 The Pivot in One Sentence

**FROM**: "AI-powered literature discovery tool" (competing with ResearchRabbit)  
**TO**: "Research project OS that turns papers into a living plan" (blue ocean)

---

## 📊 Current State Assessment

### What We Built (Good, but Wrong Market Position)
✅ Excellent citation network visualization  
✅ AI-powered paper analysis  
✅ Collections & annotations  
✅ Team collaboration  
✅ PDF viewer  

### The Problem
🔴 **We're competing head-on with ResearchRabbit, Litmaps, Connected Papers**  
🔴 **They have 3-5 year head start and strong product-market fit**  
🔴 **"Better AI summaries" is not a sustainable moat**  

### The Opportunity
🟢 **No one owns the "research project" layer above literature tools**  
🟢 **PhD students struggle to turn papers into structured research plans**  
🟢 **Labs lose knowledge when people leave - no "why we did this" capture**  
🟢 **Biotech needs literature → experiment connection**  

---

## 🎨 New Positioning

### Tagline
**"The research project OS that turns papers into a living plan"**

### Elevator Pitch
> "ResearchRabbit shows you what papers exist. We show you what to DO with them.
> 
> R&D Agent is the project OS for PhD students and R&D teams. We turn your messy literature into a structured research plan: questions, hypotheses, decisions, and experiments - all linked to the papers that matter.
> 
> Stop drowning in PDFs. Start building your research project."

### Value Props (New Order)
1. 🎯 **Project-First**: Your research questions, not just papers
2. 🧠 **Smart Triage**: AI tells you which new papers actually matter to YOUR project
3. 🔬 **Literature → Lab**: Turn papers into protocols and experiments
4. 🤝 **Team Memory**: Preserve the "why" behind every decision
5. 📊 **Living Summary**: Your literature review updates itself

---

## 🗺️ 6-Month Roadmap

### Month 1: Foundation - "Project-First Pivot"
**Goal**: Shift from paper-centered to project-centered

**Build**:
- ✅ Research question hierarchy (tree structure)
- ✅ Question → paper evidence linking
- ✅ AI question generation from papers
- ✅ Decision log feature
- ✅ New landing page positioning

**Database**:
```sql
CREATE TABLE research_questions (...)
CREATE TABLE question_evidence (...)
CREATE TABLE project_decisions (...)
```

**Success Metrics**:
- 80% of new projects define ≥3 questions
- 50% of papers linked to questions

---

### Month 2: Structure - "Hypothesis & Decisions"
**Goal**: Add hypothesis tracking and decision timeline

**Build**:
- ✅ Hypothesis modeling (linked to questions)
- ✅ Hypothesis → evidence linking
- ✅ Decision timeline visualization
- ✅ "Why we pivoted" capture

**Database**:
```sql
CREATE TABLE hypotheses (...)
CREATE TABLE hypothesis_evidence (...)
```

**Success Metrics**:
- 60% of projects have ≥1 hypothesis
- 40% of projects log ≥1 decision

---

### Month 3: Intelligence - "Smart Project Assistant"
**Goal**: Project-specific paper triage and alerts

**Build**:
- ✅ Project-centered paper triage (must read / nice to know / ignore)
- ✅ Impact assessment: "This paper affects Question 2.3"
- ✅ Inbox/digest UI
- ✅ Alert system for new relevant papers

**Database**:
```sql
CREATE TABLE paper_triage (...)
CREATE TABLE project_alerts (...)
```

**Success Metrics**:
- 70% of users triage ≥5 papers/week
- 50% of triaged papers linked to questions

---

### Month 4: Living Summary - "Auto-Updating Field State"
**Goal**: AI-generated summaries that evolve with your project

**Build**:
- ✅ Living summary generation (organized by questions)
- ✅ Version history & diff view
- ✅ Export to Word/LaTeX for thesis
- ✅ Track how field evolves over time

**Database**:
```sql
CREATE TABLE field_summaries (...)
```

**Success Metrics**:
- 40% of projects generate living summary
- 30% export to Word/LaTeX

---

### Month 5: Lab Bridge (Phase 1) - "Protocols"
**Goal**: Extract actionable protocols from papers

**Build**:
- ✅ AI protocol extraction from methods sections
- ✅ Protocol library (materials, steps, parameters)
- ✅ Protocol comparison across papers
- ✅ Export to ELN format (Benchling)

**Database**:
```sql
CREATE TABLE protocols (...)
```

**Success Metrics**:
- 20% of projects extract ≥1 protocol
- 10% export to ELN

---

### Month 6: Lab Bridge (Phase 2) - "Experiments"
**Goal**: Plan experiments linked to hypotheses and literature

**Build**:
- ✅ Experiment planning UI (Kanban board)
- ✅ Hypothesis → protocol → experiment linking
- ✅ Experiment status tracking
- ✅ "Why we're doing this" documentation
- ✅ Benchling integration (basic)

**Database**:
```sql
CREATE TABLE experiments (...)
```

**Success Metrics**:
- 15% of projects plan ≥1 experiment
- 5% sync with ELN

---

## 🎯 Immediate Actions (Next 7 Days)

### Day 1-2: Team Alignment
- [ ] Review strategic analysis with full team
- [ ] Decide: Commit to pivot or stay course
- [ ] If pivot: Assign roles and responsibilities
- [ ] Set up weekly pivot progress meetings

### Day 3-4: Design Partner Recruitment
- [ ] Identify 10 PhD students (years 1-3) for beta testing
  - Target: Molecular biology, neuroscience, bioinformatics
  - Criteria: Struggling with literature organization
- [ ] Identify 2 biotech labs for co-design
  - Target: 5-20 person labs with active R&D
  - Pain point: Onboarding new scientists
- [ ] Create design partner agreement & incentives

### Day 5-7: Landing Page Pivot
- [ ] Rewrite homepage copy with new positioning
- [ ] Create comparison table: "How we're different from ResearchRabbit"
- [ ] Update screenshots to show project structure (not just networks)
- [ ] Add testimonials focused on "structured my thesis" (get from beta users)
- [ ] Deploy new landing page

---

## 🏗️ Technical Implementation Priorities

### Week 1-2: Database Schema
**Priority**: CRITICAL - Foundation for everything

**Tasks**:
1. Design new tables:
   - `research_questions` (hierarchy, status, evidence)
   - `question_evidence` (link papers to questions)
   - `project_decisions` (decision log)
   - `hypotheses` (hypothesis tracking)
   - `hypothesis_evidence` (link papers to hypotheses)

2. Create migration scripts
3. Update SQLAlchemy models
4. Create Pydantic schemas

**Owner**: Backend lead  
**Timeline**: 2 weeks

---

### Week 3-4: Research Question UI
**Priority**: CRITICAL - Core differentiator

**Tasks**:
1. Replace "Research Question" text field with tree structure
2. Build question hierarchy component (drag-drop, nest, reorder)
3. Add "Link paper as evidence" button on papers
4. Create question detail view (evidence, status, notes)
5. AI integration: "Generate sub-questions from my papers"

**Owner**: Frontend lead  
**Timeline**: 2 weeks

---

### Week 5-6: Decision Log
**Priority**: HIGH - Key for PhD use case

**Tasks**:
1. "Log a decision" modal (title, rationale, influenced by papers)
2. Decision timeline visualization
3. Link decisions to questions/hypotheses
4. Auto-suggest: "This paper contradicts your hypothesis - log a decision?"

**Owner**: Frontend lead  
**Timeline**: 2 weeks

---

### Week 7-8: Hypothesis Modeling
**Priority**: HIGH - Scientific workflow

**Tasks**:
1. Hypothesis creation UI (statement, variables, status)
2. Link hypotheses to questions
3. Link papers as supporting/contrasting evidence
4. Hypothesis status tracking (Proposed → Testing → Supported/Rejected)

**Owner**: Full-stack  
**Timeline**: 2 weeks

---

## 👥 Target User Personas (Updated)

### Primary: PhD Student (Sarah, Year 2, Molecular Biology)

**Pain Points**:
- "I have 150 papers but no clear research plan"
- "My supervisor keeps asking 'what's your question?' and I don't have a good answer"
- "I pivoted 3 times and lost track of why"
- "I need to write my thesis but my notes are scattered across Notion, Zotero, and Google Docs"

**Jobs to Be Done**:
- Turn messy literature into structured research plan
- Define clear questions and hypotheses
- Track decisions and pivots over 3-5 years
- Generate thesis chapters from organized evidence

**Why She'll Use R&D Agent**:
- Supervisor demands structured thinking
- Thesis defense requires clear question → hypothesis → evidence flow
- Free for students
- Recommended by supervisor

**Success Looks Like**:
- Complete question hierarchy within 2 weeks
- All papers linked to questions
- Decision log shows research evolution
- Export living summary as thesis chapter draft

---

### Secondary: R&D Scientist (David, Biotech Startup)

**Pain Points**:
- "New scientist joined - takes 6 months to understand why we chose this approach"
- "Found a paper that contradicts our protocol - should we pivot?"
- "Regulatory audit asked 'why this parameter?' - answer is buried in old papers"
- "When Sarah left, we lost all the context for her experiments"

**Jobs to Be Done**:
- Onboard new scientists faster
- Preserve institutional knowledge
- Link experiments to motivating literature
- Justify decisions with citations

**Why He'll Pay**:
- Faster onboarding = $50K+ savings per scientist
- Better reproducibility = fewer failed experiments
- Regulatory compliance = risk mitigation
- Team knowledge preservation = competitive advantage

**Success Looks Like**:
- New scientist onboards in 2 weeks (vs 6 months)
- Every experiment linked to literature rationale
- Regulatory audit passes with full documentation
- Lab knowledge preserved when people leave

---

## 📈 Success Metrics (6 Months)

### Product Adoption
- ✅ 80% of new projects use question hierarchy
- ✅ 60% of projects have ≥1 hypothesis
- ✅ 50% of papers linked to questions (not just floating in collections)
- ✅ 40% of projects generate living summary
- ✅ 20% of projects extract protocols

### User Engagement
- ✅ 2x increase in 6-month retention
- ✅ 3x increase in weekly active projects
- ✅ 70% of users triage ≥5 papers/week
- ✅ 40% of projects log ≥1 decision

### Business
- ✅ 50% of new signups from "project OS" positioning
- ✅ 10 design partner labs (biotech expansion)
- ✅ 5 university partnerships (PhD focus)
- ✅ 20% conversion to paid (biotech labs)

### Qualitative
- ✅ 10 testimonials: "This structured my thesis"
- ✅ 5 supervisor endorsements
- ✅ 3 lab testimonials: "Onboarding time cut in half"
- ✅ Featured in "Best Tools for PhD Students" lists

---

## 🚨 Risks & Mitigations

### Risk 1: Users Want Simple Literature Tool
**Mitigation**: 
- Keep "Simple Mode" (current UI)
- Add "Project Mode" (new UI)
- Gradual onboarding: Suggest structure over time

### Risk 2: Too Complex for Students
**Mitigation**:
- Templates: "PhD thesis", "Grant proposal", "Lab project"
- Guided wizard: Builds structure step-by-step
- Optional features: Can ignore advanced features

### Risk 3: Existing Users Resist Change
**Mitigation**:
- Grandfather into "Classic Mode"
- Communicate: "We're adding, not removing"
- Beta test with design partners first

---

## 💰 Investment Required

### Development (6 Months)
- **Backend**: 2 engineers × 6 months = 12 engineer-months
- **Frontend**: 2 engineers × 6 months = 12 engineer-months
- **AI/ML**: 1 engineer × 6 months = 6 engineer-months
- **Design**: 1 designer × 6 months = 6 engineer-months
- **Total**: 36 engineer-months

### Design Partners
- **Incentives**: $500/student × 10 = $5,000
- **Lab partnerships**: $5,000/lab × 2 = $10,000
- **Total**: $15,000

### Marketing
- **Landing page redesign**: $5,000
- **Content creation**: $10,000
- **University outreach**: $5,000
- **Total**: $20,000

### Grand Total: ~$200K-300K (depending on team costs)

---

## ✅ Decision Point

### Option A: PIVOT (Recommended)
**Commit to becoming Research Project OS**
- Build features in roadmap
- Reposition all marketing
- Target PhD students + biotech labs
- Integrate with (not compete with) ResearchRabbit

**Pros**:
- Blue ocean opportunity
- Clear differentiation
- Sustainable moat (workflow lock-in)
- Expansion path to biotech

**Cons**:
- 6 months to full pivot
- Risk of alienating existing users
- More complex product

---

### Option B: STAY COURSE
**Remain AI-powered literature tool**
- Keep improving current features
- Compete with ResearchRabbit/Litmaps
- Focus on "better AI"

**Pros**:
- No disruption to existing users
- Simpler product
- Faster iteration

**Cons**:
- Crowded market
- Hard to differentiate
- Commoditized features (AI)
- Unlikely to win against incumbents

---

## 🎯 Recommendation

### PIVOT TO RESEARCH PROJECT OS

**Why**:
1. We have a **well-built foundation** (network viz, AI, collaboration)
2. We're in a **crowded market** (literature tools)
3. There's a **clear gap** (project management layer)
4. We have **6 months runway** to prove it
5. The **upside is massive** (own the research workflow)

**Next Step**: 
- [ ] Team meeting to decide
- [ ] If yes: Start Month 1 implementation immediately
- [ ] If no: Acknowledge we're competing head-on with ResearchRabbit

---

**Let's build the research project OS that every PhD student and R&D team needs.** 🚀

