# Home Page Restructuring Summary

**Date**: 2025-11-28  
**Status**: Assessment Complete - Awaiting Additional Mockups  
**Next**: Review other page mockups before implementation

---

## 🎯 **What We're Building: "Erythos"**

A simplified, workflow-centric research platform with **4 core workflows**:

```
┌─────────────────────────────────────────────────────────┐
│                        ERYTHOS                          │
│                    (Red Theme #DC2626)                  │
├─────────────────────────────────────────────────────────┤
│  Home  |  Discover  |  Collections  |  Projects  |  Lab │
└─────────────────────────────────────────────────────────┘

              Good evening, Jules
    Discover new research tailored to your interests

    ┌───────────────────────────────────────────────┐
    │  🔍 Search MeSH terms, topics, or PMIDs...   │
    └───────────────────────────────────────────────┘

    Try: [immune checkpoint] [CRISPR] [diabetes] [cancer]

    ┌──────────────┬──────────────┐
    │  🔍 Discover │  📁 Organize │
    │  Find papers │  Collections │
    ├──────────────┼──────────────┤
    │  🧪 Lab      │  ✍️ Write    │
    │  Protocols   │  Reports     │
    └──────────────┴──────────────┘
```

---

## 📊 **Current vs Target Comparison**

### **Visual Design**

| Aspect | Current (R&D Agent) | Target (Erythos) | Change Needed |
|--------|---------------------|------------------|---------------|
| **Brand** | R&D Agent | Erythos | Rebrand |
| **Primary Color** | Green #1DB954 | Red #DC2626 | Color system overhaul |
| **Theme** | Spotify dark | Apple dark | Minor adjustments |
| **Complexity** | High (6+ sections) | Low (4 elements) | Major simplification |

### **Navigation**

| Current | Target | Action |
|---------|--------|--------|
| 7+ nav items | 5 nav items | Consolidate |
| Home, Dashboard, Discover, Search, Collections, Shared, Settings | Home, Discover, Collections, Projects, Lab | Merge & reorganize |
| Green active indicator | Red active indicator | Color change |

### **Home Page Structure**

**Current** (Complex):
```
1. Hero + 3 Action Cards + Pro Tip
2. Interest Refinement Banner
3. Research Hub (Search + Options)
4. Semantic Recommendations
5. Recent Activity
6. Contextual Help
```

**Target** (Simple):
```
1. Hero (greeting + subtitle only)
2. Search Bar (centered, prominent)
3. Quick Tags (4 suggestions)
4. Workflow Cards (4 cards, 2x2)
```

**Change**: Reduce from 6 sections to 4 elements.

---

## 🔄 **4 Core Workflows**

### **1. Discover** 🔍 (Red Gradient)
**Purpose**: Find papers, protocols, and context for your research

**Current Equivalent**:
- `/search` page (dedicated search)
- `/discover` page (recommendations)
- `/explore/network` (network visualization)

**Target**: Merge into unified discovery experience

---

### **2. Organize** 📁 (Orange Gradient)
**Purpose**: Save and manage your research collections

**Current Equivalent**:
- `/collections` page ✅ (already exists)

**Target**: Keep as-is, ensure prominent in nav

---

### **3. Lab** 🧪 (Purple Gradient)
**Purpose**: Execute protocols and track your experiments

**Current Equivalent**:
- `/lab` page (exists but not in main nav)
- Protocol extraction features
- Experiment planning

**Target**: Elevate to main navigation, make more prominent

---

### **4. Write** ✍️ (Yellow Gradient)
**Purpose**: Generate reports and citations from your library

**Current Equivalent**:
- Report generation (in project workspace)
- Deep dive analysis
- Citation management

**Target**: Create dedicated workflow entry point

---

## 🎨 **Design System Changes**

### **Color Palette**

**Current** (Spotify Green):
```css
--spotify-green: #1DB954
--spotify-dark-gray: #121212
--spotify-medium-gray: #1C1C1E
--spotify-light-gray: #2C2C2E
```

**Target** (Erythos Red):
```css
--erythos-red: #DC2626
--erythos-dark-red: #991B1B
--erythos-black: #000
--erythos-dark-gray: #1C1C1E
--erythos-medium-gray: #2C2C2E
```

### **Workflow Card Gradients**

```css
/* Discover - Red */
background: linear-gradient(135deg, #DC2626, #991B1B);

/* Organize - Orange */
background: linear-gradient(135deg, #FB923C, #EA580C);

/* Lab - Purple */
background: linear-gradient(135deg, #8B5CF6, #6D28D9);

/* Write - Yellow */
background: linear-gradient(135deg, #FBBF24, #F59E0B);
```

---

## 🏗️ **Architecture Changes**

### **Route Consolidation**

**Before**:
```
/home          → Landing page
/search        → Search interface
/discover      → Recommendations
/collections   → Collections
/dashboard     → Projects overview
/lab           → Lab (hidden)
/explore/network → Network viz
```

**After**:
```
/home          → Landing (with search)
/discover      → Unified discovery (search + recommendations + network)
/collections   → Collections
/projects      → Projects overview (renamed from dashboard)
/lab           → Lab workflows (elevated)
/write         → Report generation (new)
```

### **Component Changes**

**New Components**:
- `WorkflowCard` - 4 workflow cards with gradients
- `CenteredSearchBar` - Prominent search
- `QuickSearchTags` - Tag suggestions
- `SimplifiedHero` - Clean hero section
- `ErythosHeader` - 5-item navigation

**Modified Components**:
- `SpotifyNavigation` → `ErythosNavigation`
- Color system throughout
- Remove embedded action cards from hero

**Deprecated Components**:
- Complex hero with action cards
- Multiple recommendation sections
- Scattered CTAs

---

## 📋 **Implementation Checklist**

### **Phase 1: Visual Rebrand** (1-2 days)
- [ ] Update color system (green → red)
- [ ] Create new logo "Erythos"
- [ ] Update workflow card gradients
- [ ] Update active nav indicators

### **Phase 2: Navigation Consolidation** (2-3 days)
- [ ] Reduce nav items from 7 to 5
- [ ] Merge Search + Discover pages
- [ ] Elevate Lab to main nav
- [ ] Create Write workflow entry
- [ ] Move Settings to user menu

### **Phase 3: Home Page Simplification** (2-3 days)
- [ ] Simplify hero (remove action cards)
- [ ] Center and emphasize search bar
- [ ] Add quick search tags
- [ ] Create 4 workflow cards (2x2 grid)
- [ ] Remove extra sections

### **Phase 4: Route Restructuring** (3-4 days)
- [ ] Consolidate `/search` and `/discover`
- [ ] Rename `/dashboard` to `/projects`
- [ ] Create `/write` workflow page
- [ ] Update all internal links
- [ ] Test navigation flows

### **Phase 5: Testing & Polish** (2-3 days)
- [ ] Test all workflows end-to-end
- [ ] Verify mobile responsiveness
- [ ] Update animations/transitions
- [ ] User acceptance testing
- [ ] Documentation updates

**Total Estimated Effort**: 10-15 days

---

## ⚠️ **Risks & Considerations**

### **High Risk**
1. **Breaking existing user workflows** - Users accustomed to current navigation
2. **Route changes** - Need redirects for bookmarked URLs
3. **Color system changes** - May affect accessibility (need contrast checks)

### **Medium Risk**
4. **Feature consolidation** - Risk of hiding useful features
5. **Mobile navigation** - Need to ensure 5 items fit well
6. **Search prominence** - May reduce discovery of other features

### **Low Risk**
7. **Branding change** - "Erythos" vs "R&D Agent"
8. **Gradient system** - Visual polish, low functional impact

---

## 🎯 **Success Criteria**

1. ✅ Home page loads with 4 clear workflow options
2. ✅ Search is prominent and easy to find
3. ✅ Navigation reduced to 5 items
4. ✅ All workflows accessible within 2 clicks
5. ✅ Mobile experience remains smooth
6. ✅ No broken links or routes
7. ✅ Color contrast meets WCAG AA standards
8. ✅ User testing shows improved clarity

---

## 📬 **Next Steps**

1. ✅ **Review this analysis** - Confirm direction
2. ⏳ **Receive additional mockups** - Discover, Collections, Projects, Lab pages
3. ⏳ **Create comprehensive plan** - After seeing all pages
4. ⏳ **Prioritize implementation** - Based on user impact
5. ⏳ **Begin Phase 1** - Visual rebrand

---

**Status**: ✅ **HOME PAGE ANALYSIS COMPLETE**  
**Awaiting**: Additional HTML/CSS mockups for other pages


