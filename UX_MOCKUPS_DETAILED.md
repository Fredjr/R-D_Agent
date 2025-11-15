# 🎨 UX Simplification - Detailed Mockups

**Date:** November 12, 2025  
**Purpose:** Visual mockups for user testing and implementation

---

## 📐 DESIGN SPECIFICATIONS

### **Color Palette (Spotify Dark Theme)**
- **Background:** `#121212` (spotify-black)
- **Card Background:** `#181818` (spotify-dark-gray)
- **Hover State:** `#282828` (spotify-medium-gray)
- **Primary Text:** `#ffffff` (spotify-white)
- **Secondary Text:** `#b3b3b3` (spotify-light-text)
- **Accent (Primary CTA):** `#1db954` (spotify-green)
- **Secondary CTA:** `#282828` with border

### **Button Sizes**
- **Large (Primary CTA):** `h-14 px-8 text-lg`
- **Medium (Secondary):** `h-12 px-6 text-base`
- **Small (Icon buttons):** `h-10 w-10`

### **Spacing**
- **Between buttons:** `gap-4` (16px)
- **Section padding:** `p-6` (24px)
- **Card padding:** `p-8` (32px)

---

## 🎯 MOCKUP 1: STAGE 1 - NO RESEARCH QUESTION

### **Visual Layout**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Project: My Research Project                                    [×]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                    [Empty State Illustration]                    │ │
│  │                         📝 ✨ 🔬                                 │ │
│  │                                                                   │ │
│  │                    Let's Get Started!                            │ │
│  │                                                                   │ │
│  │         Define your research question to begin exploring         │ │
│  │         papers and building your knowledge base.                 │ │
│  │                                                                   │ │
│  │                                                                   │ │
│  │   ┌────────────────────────────────────┐  ┌──────────────────┐  │ │
│  │   │  ✨ Define Research Question       │  │  📚 My           │  │ │
│  │   │                                     │  │     Collections  │  │ │
│  │   │  (Primary - Green - Large)         │  │  (Secondary)     │  │ │
│  │   └────────────────────────────────────┘  └──────────────────┘  │ │
│  │                                                                   │ │
│  │                                                                   │ │
│  │   💡 Tip: A good research question is specific, measurable,     │ │
│  │       and answerable through literature review.                  │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### **Interaction Flow**

**Click "Define Research Question":**
```
1. Scroll to research question section (or expand inline editor)
2. Show text area with placeholder: "What is your research question?"
3. Show "Save" and "Cancel" buttons
4. Auto-focus on text area
```

**Click "My Collections":**
```
1. Navigate to Collections tab
2. Show existing collections (if any)
3. Highlight "New Collection" button
```

### **Component Code**

```typescript
// Stage 1: No Research Question
<div className="flex flex-col items-center justify-center min-h-[500px] p-8">
  {/* Empty State Illustration */}
  <div className="flex gap-4 text-6xl mb-6">
    <span>📝</span>
    <span>✨</span>
    <span>🔬</span>
  </div>
  
  {/* Heading */}
  <h2 className="text-3xl font-bold text-spotify-white mb-4">
    Let's Get Started!
  </h2>
  
  {/* Description */}
  <p className="text-lg text-spotify-light-text text-center max-w-2xl mb-8">
    Define your research question to begin exploring papers and building your knowledge base.
  </p>
  
  {/* Action Buttons */}
  <div className="flex items-center gap-4">
    <SpotifyTabButton
      variant="primary"
      size="large"
      onClick={() => handleAction('define-question')}
      icon={<SparklesIcon className="w-6 h-6" />}
    >
      Define Research Question
    </SpotifyTabButton>
    
    <SpotifyTabButton
      variant="secondary"
      size="medium"
      onClick={() => handleAction('view-collections')}
      icon={<BookmarkIcon className="w-5 h-5" />}
    >
      My Collections ({collectionCount})
    </SpotifyTabButton>
  </div>
  
  {/* Tip */}
  <div className="mt-8 flex items-start gap-3 max-w-2xl p-4 bg-spotify-dark-gray rounded-lg">
    <span className="text-2xl">💡</span>
    <p className="text-sm text-spotify-light-text">
      <strong>Tip:</strong> A good research question is specific, measurable, 
      and answerable through literature review.
    </p>
  </div>
</div>
```

---

## 🔍 MOCKUP 2: STAGE 2 - HAS QUESTION, NO PAPERS

### **Visual Layout**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Project: My Research Project                                    [×]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Research Question                                         [Edit] │ │
│  │                                                                   │ │
│  │  "What are the latest treatments for type 2 diabetes?"          │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │                    Great! Now let's find papers.                 │ │
│  │                                                                   │ │
│  │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │ │
│  │   │  🔍 Find Papers  │  │  ➕ New          │  │  📚 My       │ │ │
│  │   │       ▼          │  │     Collection   │  │     Collections│ │
│  │   │  (Primary)       │  │  (Secondary)     │  │  (Secondary) │ │ │
│  │   └──────────────────┘  └──────────────────┘  └──────────────┘ │ │
│  │                                                                   │ │
│  │   ┌─────────────────────────────────────────────────────────┐   │ │
│  │   │  Find Papers Dropdown:                                  │   │ │
│  │   │  ┌───────────────────────────────────────────────────┐ │   │ │
│  │   │  │  🔥 Browse Trending                               │ │   │ │
│  │   │  │  📰 Recent Papers                                 │ │   │ │
│  │   │  │  ✨ AI Suggestions                                │ │   │ │
│  │   │  │  🔍 Custom Search                                 │ │   │ │
│  │   │  └───────────────────────────────────────────────────┘ │   │ │
│  │   └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                   │ │
│  │   💡 Tip: Start with AI Suggestions for papers most relevant    │ │
│  │       to your research question.                                 │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### **Interaction Flow**

**Click "Find Papers" dropdown:**
```
1. Show 4 options:
   - 🔥 Browse Trending → Navigate to Explore tab, show trending papers
   - 📰 Recent Papers → Navigate to Explore tab, show recent papers
   - ✨ AI Suggestions → Navigate to Explore tab, show AI-recommended papers
   - 🔍 Custom Search → Navigate to Explore tab, focus on search bar
```

**Click "New Collection":**
```
1. Open "Create Collection" modal
2. Show form: Name, Description, Color
3. On save: Create collection, navigate to Collections tab
```

**Click "My Collections":**
```
1. Navigate to Collections tab
2. Show all collections
```

### **Component Code**

```typescript
// Stage 2: Has Question, No Papers
<div className="space-y-6">
  {/* Research Question Card */}
  <SpotifyTabCard>
    <SpotifyTabCardHeader
      title="Research Question"
      action={
        <SpotifyTabIconButton
          icon={<PencilIcon />}
          onClick={() => setIsEditing(true)}
          title="Edit research question"
        />
      }
    />
    <SpotifyTabCardContent>
      <p className="text-lg text-spotify-white">
        "{project.settings.research_question}"
      </p>
    </SpotifyTabCardContent>
  </SpotifyTabCard>
  
  {/* Call to Action */}
  <div className="text-center py-8">
    <h3 className="text-2xl font-bold text-spotify-white mb-6">
      Great! Now let's find papers.
    </h3>
    
    <div className="flex items-center justify-center gap-4">
      {/* Find Papers Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SpotifyTabButton variant="primary" size="large">
            <MagnifyingGlassIcon className="w-6 h-6" />
            Find Papers
            <ChevronDownIcon className="w-5 h-5" />
          </SpotifyTabButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuItem onClick={() => handleAction('browse-trending')}>
            <span className="text-xl mr-3">🔥</span>
            <div>
              <div className="font-medium">Browse Trending</div>
              <div className="text-xs text-spotify-light-text">
                Popular papers in your field
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('recent-papers')}>
            <span className="text-xl mr-3">📰</span>
            <div>
              <div className="font-medium">Recent Papers</div>
              <div className="text-xs text-spotify-light-text">
                Latest publications
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('ai-suggestions')}>
            <span className="text-xl mr-3">✨</span>
            <div>
              <div className="font-medium">AI Suggestions</div>
              <div className="text-xs text-spotify-light-text">
                Personalized recommendations
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('custom-search')}>
            <span className="text-xl mr-3">🔍</span>
            <div>
              <div className="font-medium">Custom Search</div>
              <div className="text-xs text-spotify-light-text">
                Search PubMed directly
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* New Collection */}
      <SpotifyTabButton
        variant="secondary"
        size="medium"
        onClick={() => handleAction('new-collection')}
        icon={<PlusIcon className="w-5 h-5" />}
      >
        New Collection
      </SpotifyTabButton>
      
      {/* My Collections */}
      <SpotifyTabButton
        variant="secondary"
        size="medium"
        onClick={() => handleAction('view-collections')}
        icon={<BookmarkIcon className="w-5 h-5" />}
      >
        My Collections ({collectionCount})
      </SpotifyTabButton>
    </div>
    
    {/* Tip */}
    <div className="mt-8 flex items-start gap-3 max-w-2xl mx-auto p-4 bg-spotify-dark-gray rounded-lg">
      <span className="text-2xl">💡</span>
      <p className="text-sm text-spotify-light-text text-left">
        <strong>Tip:</strong> Start with AI Suggestions for papers most relevant 
        to your research question.
      </p>
    </div>
  </div>
</div>
```

---

## 📊 MOCKUP 3: STAGE 3 - HAS PAPERS

### **Visual Layout**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Project: My Research Project                                    [×]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Research Question                                         [Edit] │ │
│  │  "What are the latest treatments for type 2 diabetes?"          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ 📊       │ │ 🔍 Find  │ │ ➕ Quick │ │ 📚       │                │
│  │ Analyze▼ │ │   More ▼ │ │ Actions▼ │ │Collections│               │
│  │(Primary) │ │(Secondary│ │(Secondary│ │(Secondary│                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Project Stats                                                    │ │
│  │                                                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │ │
│  │  │ 📄 45    │  │ 📁 3     │  │ 📝 12    │  │ 📊 2     │        │ │
│  │  │ Papers   │  │Collections│  │ Notes    │  │ Reports  │        │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Seed Paper                                                       │ │
│  │  "Metformin and cardiovascular outcomes in type 2 diabetes"      │ │
│  │                                                                   │ │
│  │  [Read PDF]  [View on PubMed]  [Explore Related]                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### **Dropdown Menus**

**"Analyze" Dropdown:**
```
┌─────────────────────────────────────┐
│  📊 Generate Report                 │
│     Comprehensive literature review │
│                                     │
│  🔬 Deep Dive Analysis              │
│     Detailed paper analysis         │
│                                     │
│  📋 Generate Summary                │
│     Quick overview of findings      │
└─────────────────────────────────────┘
```

**"Find More" Dropdown:**
```
┌─────────────────────────────────────┐
│  🔥 Browse Trending                 │
│     Popular papers in your field    │
│                                     │
│  📰 Recent Papers                   │
│     Latest publications             │
│                                     │
│  ✨ AI Suggestions                  │
│     Personalized recommendations    │
│                                     │
│  🔍 Custom Search                   │
│     Search PubMed directly          │
└─────────────────────────────────────┘
```

**"Quick Actions" Dropdown:**
```
┌─────────────────────────────────────┐
│  📝 Add Note                        │
│     Capture insights and ideas      │
│                                     │
│  ➕ New Collection                  │
│     Organize papers into groups     │
└─────────────────────────────────────┘
```

### **Component Code**

```typescript
// Stage 3: Has Papers
<div className="space-y-6">
  {/* Research Question Card */}
  <SpotifyTabCard>
    <SpotifyTabCardHeader
      title="Research Question"
      action={
        <SpotifyTabIconButton
          icon={<PencilIcon />}
          onClick={() => setIsEditing(true)}
        />
      }
    />
    <SpotifyTabCardContent>
      <p className="text-lg text-spotify-white">
        "{project.settings.research_question}"
      </p>
    </SpotifyTabCardContent>
  </SpotifyTabCard>
  
  {/* Action Buttons */}
  <div className="flex items-center gap-4">
    {/* Analyze (Primary) */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SpotifyTabButton variant="primary" size="large">
          <ChartBarIcon className="w-6 h-6" />
          Analyze
          <ChevronDownIcon className="w-5 h-5" />
        </SpotifyTabButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuItem onClick={() => handleAction('generate-report')}>
          <span className="text-xl mr-3">📊</span>
          <div>
            <div className="font-medium">Generate Report</div>
            <div className="text-xs text-spotify-light-text">
              Comprehensive literature review
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('deep-dive')}>
          <span className="text-xl mr-3">🔬</span>
          <div>
            <div className="font-medium">Deep Dive Analysis</div>
            <div className="text-xs text-spotify-light-text">
              Detailed paper analysis
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('generate-summary')}>
          <span className="text-xl mr-3">📋</span>
          <div>
            <div className="font-medium">Generate Summary</div>
            <div className="text-xs text-spotify-light-text">
              Quick overview of findings
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Find More (Secondary) */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SpotifyTabButton variant="secondary">
          <MagnifyingGlassIcon className="w-5 h-5" />
          Find More
          <ChevronDownIcon className="w-4 h-4" />
        </SpotifyTabButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {/* Same as Stage 2 */}
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Quick Actions (Secondary) */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SpotifyTabButton variant="secondary">
          <PlusIcon className="w-5 h-5" />
          Quick Actions
          <ChevronDownIcon className="w-4 h-4" />
        </SpotifyTabButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem onClick={() => handleAction('add-note')}>
          <span className="text-xl mr-3">📝</span>
          <div>
            <div className="font-medium">Add Note</div>
            <div className="text-xs text-spotify-light-text">
              Capture insights and ideas
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('new-collection')}>
          <span className="text-xl mr-3">➕</span>
          <div>
            <div className="font-medium">New Collection</div>
            <div className="text-xs text-spotify-light-text">
              Organize papers into groups
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Collections (Secondary) */}
    <SpotifyTabButton
      variant="secondary"
      onClick={() => handleAction('view-collections')}
      icon={<BookmarkIcon className="w-5 h-5" />}
    >
      Collections ({collectionCount})
    </SpotifyTabButton>
  </div>
  
  {/* Project Stats */}
  <SpotifyTabGrid columns={4}>
    <SpotifyTabStatCard
      icon={<DocumentTextIcon />}
      label="Papers"
      value={paperCount}
      color="blue"
      onClick={() => onNavigateToTab('explore')}
    />
    <SpotifyTabStatCard
      icon={<FolderIcon />}
      label="Collections"
      value={collectionCount}
      color="green"
      onClick={() => onNavigateToTab('collections')}
    />
    <SpotifyTabStatCard
      icon={<ChatBubbleLeftRightIcon />}
      label="Notes"
      value={notesCount}
      color="purple"
      onClick={() => onNavigateToTab('notes')}
    />
    <SpotifyTabStatCard
      icon={<ChartBarIcon />}
      label="Reports"
      value={reportsCount}
      color="orange"
      onClick={() => onNavigateToTab('analysis')}
    />
  </SpotifyTabGrid>
  
  {/* Seed Paper (if exists) */}
  {project.settings.seed_paper_pmid && (
    <SpotifyTabCard>
      <SpotifyTabCardHeader title="Seed Paper" />
      <SpotifyTabCardContent>
        <p className="text-spotify-white mb-4">
          {project.settings.seed_paper_title}
        </p>
        <div className="flex gap-2">
          <SpotifyTabButton
            onClick={handleViewPDF}
            icon={<BookOpenIcon />}
            variant="primary"
            size="sm"
          >
            Read PDF
          </SpotifyTabButton>
          <SpotifyTabButton
            onClick={handleViewPubMed}
            icon={<ArrowTopRightOnSquareIcon />}
            variant="secondary"
            size="sm"
          >
            View on PubMed
          </SpotifyTabButton>
          <SpotifyTabButton
            onClick={handleExploreRelated}
            icon={<MagnifyingGlassIcon />}
            variant="secondary"
            size="sm"
          >
            Explore Related
          </SpotifyTabButton>
        </div>
      </SpotifyTabCardContent>
    </SpotifyTabCard>
  )}
</div>
```

---

## 📱 MOBILE RESPONSIVE MOCKUPS

### **Stage 1 (Mobile)**
```
┌──────────────────────────┐
│  My Research Project [×] │
├──────────────────────────┤
│                          │
│      [Illustration]      │
│         📝 ✨ 🔬         │
│                          │
│   Let's Get Started!     │
│                          │
│  Define your research    │
│  question to begin.      │
│                          │
│  ┌────────────────────┐  │
│  │ ✨ Define Research │  │
│  │    Question        │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ 📚 My Collections  │  │
│  │      (3)           │  │
│  └────────────────────┘  │
│                          │
│  💡 Tip: A good...       │
│                          │
└──────────────────────────┘
```

**Key Changes for Mobile:**
- Buttons stack vertically
- Full-width buttons
- Larger touch targets (min 44px height)
- Simplified text

---

## 🎯 USER TESTING QUESTIONS

### **For Each Mockup:**

1. **First Impression (5 seconds)**
   - "What would you click first?"
   - "What do you think this page is for?"

2. **Clarity (1-5 scale)**
   - "How clear is the next step?" (1=very unclear, 5=very clear)
   - "Do you feel overwhelmed by options?" (1=not at all, 5=very much)

3. **Expectations**
   - "What do you expect to happen when you click [button]?"
   - "Is this what you expected?"

4. **Comparison (if existing user)**
   - "How does this compare to the current version?"
   - "Which do you prefer and why?"

5. **Open Feedback**
   - "What would you change?"
   - "What's confusing?"
   - "What do you like?"

---

## ✅ NEXT STEPS

1. **Review mockups** with team
2. **Adjust based on feedback**
3. **Create interactive prototype** (optional)
4. **Conduct user testing** (5-8 users)
5. **Refine mockups** based on testing
6. **Begin implementation**

**Ready to proceed with implementation?** 🚀

