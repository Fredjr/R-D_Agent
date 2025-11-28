# Decision Points Summary - All Pages

**Date**: 2025-11-28  
**Status**: Assessment Phase - Ready for Decisions  
**Purpose**: Consolidate all decision points before creating comprehensive implementation plan

---

## 🎯 **Executive Summary**

I've identified **8 key decision points** across all 5 pages. Most have clear recommendations based on the target design and user workflow. Below is a consolidated list with recommendations.

---

## 📋 **Decision Points by Page**

### **1. DISCOVER PAGE** (3 decisions)

#### **Decision 1.1: Smart Inbox Scope**
**Question**: Should Smart Inbox be global (all collections) or project-specific?

**Options**:
- **A**: Project-specific (current) - Simpler, but less discoverable
- **B**: Global (all collections) - More discoverable, cross-project view
- **C**: Hybrid - Global with project filter

**Recommendation**: ✅ **Option B (Global)** - Target design shows global Smart Inbox
- Aligns with target mockup
- Matches collection-centric triage workflow
- Add project/collection filter for flexibility

---

#### **Decision 1.2: Advanced Search Filters**
**Question**: Should we keep advanced filters in All Papers tab?

**Options**:
- **A**: Keep advanced filters - More functionality
- **B**: Remove advanced filters - Simpler UI (matches mockup)
- **C**: Hide behind "Advanced" toggle

**Recommendation**: ✅ **Option C (Hide behind toggle)** - Best of both worlds
- Mockup shows simple search bar
- Power users still need filters
- Progressive disclosure principle

---

#### **Decision 1.3: Current Recommendations Page**
**Question**: What happens to current `/discover` recommendations page?

**Options**:
- **A**: Remove completely - Breaking change
- **B**: Move to sub-section in Discover page
- **C**: Keep as separate page

**Recommendation**: ✅ **Option B (Move to sub-section)** - Preserve functionality
- Add 4th tab "Recommendations" in Discover page
- Or add "For You" section in Smart Inbox tab
- Don't lose valuable AI recommendations feature

---

### **2. COLLECTIONS PAGE** (1 decision)

#### **Decision 2.1: Note Count Definition**
**Question**: What counts as a "note" in note count?

**Options**:
- **A**: User annotations only - Simplest
- **B**: Linked items (questions, hypotheses, decisions) - Most comprehensive
- **C**: Comments only - Too narrow

**Recommendation**: ✅ **Option A (User annotations)** - Clearest definition
- Count entries in `annotations` table where `collection_id` matches
- Simple to implement and understand
- Aligns with user mental model

---

### **3. PROJECT WORKSPACE** (1 decision)

#### **Decision 3.1: Notes Tab**
**Question**: What happens to Notes tab?

**Options**:
- **A**: Remove completely - Simplify
- **B**: Keep as 8th tab - Maintain functionality
- **C**: Integrate into other tabs (e.g., annotations in Collections)

**Recommendation**: ✅ **Option C (Integrate)** - Preserve functionality without clutter
- Move note-taking to context (e.g., paper detail view, collection view)
- Remove top-level Notes tab
- Aligns with target's 7-tab structure

---

### **4. LAB PAGE** (3 decisions)

#### **Decision 4.1: Lab Scope**
**Question**: Should Lab be global or project-scoped?

**Options**:
- **A**: Keep project-scoped (current) - Simpler, but less discoverable
- **B**: Make global (target) - More discoverable, but requires project association
- **C**: Hybrid - Global Lab page + Project-specific Lab tab

**Recommendation**: ✅ **Option C (Hybrid)** - Best of both worlds
- Create global `/lab` page (target design)
- Keep Lab tab in Project Workspace (shows project-specific protocols/experiments)
- Add "Go to Lab" link from project to global page
- Aligns with target mockup showing "Go to Lab" link

---

#### **Decision 4.2: Summaries Tab**
**Question**: What happens to Summaries tab?

**Options**:
- **A**: Remove Summaries (move to Project Workspace → Overview)
- **B**: Keep Summaries as 4th tab in Lab
- **C**: Move Summaries to Analysis tab in Project Workspace

**Recommendation**: ✅ **Option A (Move to Overview)** - Aligns with target
- Summaries are project-specific, not lab-specific
- Target shows Data Management instead of Summaries
- Move summary content to Project Workspace → Overview tab

---

#### **Decision 4.3: Data Management Scope**
**Question**: Should Data Management be global or project-scoped?

**Options**:
- **A**: Global (all files across all projects)
- **B**: Project-scoped (files for selected project only)
- **C**: Hybrid (global view with project/experiment filter)

**Recommendation**: ✅ **Option C (Hybrid)** - Most flexible
- Default: Show all files
- Filters: By project, experiment, file type
- Bulk actions: Apply to filtered files only

---

### **5. AI TRIAGE** (1 critical decision - ALREADY CLARIFIED)

#### **Decision 5.1: Triage Architecture**
**Question**: Should triage be project-centric or collection-centric?

**Options**:
- **A**: Project-centric (current) - `POST /project/{id}/triage`
- **B**: Collection-centric (target) - `POST /triage`
- **C**: Both (backward compatibility)

**Recommendation**: ✅ **Option C (Both)** - Smooth migration
- Create new `POST /triage` endpoint (collection-centric)
- Keep `POST /project/{id}/triage` for backward compatibility
- Add deprecation notice to old endpoint
- **ALREADY DOCUMENTED** in `AI_TRIAGE_WORKFLOW_CRITICAL_CLARIFICATION.md`

---

## 📊 **Decision Summary Table**

| # | Decision | Recommendation | Impact | Priority |
|---|----------|----------------|--------|----------|
| 1.1 | Smart Inbox Scope | Global (all collections) | High | Critical |
| 1.2 | Advanced Filters | Hide behind toggle | Low | Medium |
| 1.3 | Recommendations Page | Move to sub-section | Medium | Medium |
| 2.1 | Note Count Definition | User annotations only | Low | Low |
| 3.1 | Notes Tab | Integrate into other tabs | Medium | Medium |
| 4.1 | Lab Scope | Hybrid (global + project) | High | Critical |
| 4.2 | Summaries Tab | Move to Overview | Medium | Medium |
| 4.3 | Data Management Scope | Hybrid (global with filter) | Medium | Medium |
| 5.1 | Triage Architecture | Both (new + old) | High | Critical |

---

## ✅ **Recommended Decisions (Final)**

### **Critical Decisions** (Must decide before implementation)

1. ✅ **Smart Inbox**: Global (all collections) with project/collection filter
2. ✅ **Lab Scope**: Hybrid (global `/lab` page + project-specific Lab tab)
3. ✅ **Triage Architecture**: Both endpoints (new collection-centric + old project-centric)

### **Medium Priority Decisions** (Can decide during implementation)

4. ✅ **Advanced Filters**: Hide behind "Advanced" toggle
5. ✅ **Recommendations Page**: Move to 4th tab in Discover or sub-section
6. ✅ **Notes Tab**: Integrate into other tabs (remove top-level tab)
7. ✅ **Summaries Tab**: Move to Project Workspace → Overview tab
8. ✅ **Data Management Scope**: Hybrid (global with project/experiment filter)

### **Low Priority Decisions** (Implementation detail)

9. ✅ **Note Count**: User annotations only (simplest definition)

---

## 🚀 **Ready to Proceed?**

**All 9 decisions have recommendations.** If you approve these recommendations, I'm ready to create the comprehensive implementation plan covering:

1. ✅ Complete Technical Architecture
2. ✅ Database Schema Changes
3. ✅ All API Endpoint Changes
4. ✅ Component Hierarchy
5. ✅ Route Restructuring
6. ✅ Migration Strategy
7. ✅ Testing Plan
8. ✅ Timeline & Resource Allocation
9. ✅ Risk Assessment

---

## 🎯 **Your Input Needed**

**Do you approve these recommendations?**

- ✅ **YES** → I'll proceed with comprehensive implementation plan
- ❌ **NO** → Let me know which decisions you'd like to change

**Any specific concerns or preferences?**

---

**Status**: ✅ **ALL DECISIONS DOCUMENTED WITH RECOMMENDATIONS**  
**Next**: Awaiting your approval to proceed with comprehensive implementation plan


