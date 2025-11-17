# 🏗️ R&D Agent - Comprehensive Product Architecture

**Version**: 3.0  
**Last Updated**: November 17, 2025  
**Status**: Production  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Value Proposition](#product-vision--value-proposition)
3. [System Architecture](#system-architecture)
4. [Data Architecture](#data-architecture)
5. [Core Features & Functionalities](#core-features--functionalities)
6. [User Flows](#user-flows)
7. [API Architecture](#api-architecture)
8. [AI/ML Systems](#aiml-systems)
9. [Security & Authentication](#security--authentication)
10. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 1. Executive Summary

### What is R&D Agent?

**R&D Agent** is an AI-powered research intelligence platform that helps researchers, academics, and R&D teams discover, analyze, and synthesize scientific literature. It combines advanced network visualization, AI-powered analysis, and collaborative workspace features to accelerate research workflows.

### Key Differentiators

- 🧠 **AI-Powered Analysis**: Deep dive analysis, semantic recommendations, relationship explanations
- 🕸️ **Interactive Network Visualization**: ResearchRabbit-style citation networks with multi-column exploration
- 📚 **Comprehensive Literature Management**: Collections, annotations, PDF viewer with highlighting
- 🤝 **Team Collaboration**: Shared projects, real-time collaboration, activity feeds
- 🔬 **Research-Specific Features**: Generate review reports, deep dive analyses, timeline visualization

### Target Users

1. **Academic Researchers** - PhD students, postdocs, professors
2. **R&D Teams** - Pharmaceutical, biotech, materials science
3. **Research Institutions** - Universities, research labs
4. **Industry Scientists** - Corporate R&D departments

---

## 2. Product Vision & Value Proposition

### Vision Statement

*"Empower researchers to discover breakthrough insights faster by intelligently connecting scientific knowledge across domains, time, and research communities."*

### Core Value Propositions

#### For Individual Researchers
- ⚡ **10x Faster Literature Review**: AI-powered paper discovery and synthesis
- 🎯 **Precision Discovery**: Find exactly what you need with semantic search
- 📊 **Visual Understanding**: See research landscapes through interactive networks
- 💡 **Insight Generation**: AI identifies patterns, gaps, and opportunities

#### For Research Teams
- 🤝 **Seamless Collaboration**: Shared workspaces, annotations, and insights
- 📈 **Progress Tracking**: Monitor research evolution and team contributions
- 🔄 **Knowledge Continuity**: Preserve institutional knowledge across projects
- 🎓 **Onboarding Acceleration**: New team members get up to speed faster

#### For Research Institutions
- 💰 **Cost Efficiency**: Reduce time spent on literature review by 70%
- 🏆 **Research Quality**: Better-informed decisions lead to higher-impact publications
- 🌐 **Cross-Domain Discovery**: Break down silos between research groups
- 📊 **Research Analytics**: Understand research trends and productivity

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 Frontend (Vercel)                            │  │
│  │  - React 18 + TypeScript                                 │  │
│  │  - Tailwind CSS + Shadcn UI                              │  │
│  │  - Cytoscape.js (Network Visualization)                  │  │
│  │  - React Flow (Alternative Visualization)                │  │
│  │  - PDF.js (PDF Rendering)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (/api/proxy/*)                       │  │
│  │  - Request validation                                     │  │
│  │  - Authentication middleware                              │  │
│  │  - Rate limiting                                          │  │
│  │  - Response caching                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI Backend (Railway)                               │  │
│  │  - Python 3.11                                           │  │
│  │  - SQLAlchemy ORM                                        │  │
│  │  - Pydantic validation                                   │  │
│  │  - Async/await support                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (Railway)                           │  │
│  │  - User data, projects, collections                      │  │
│  │  - Annotations, reports, analyses                        │  │
│  │  - Activity logs, collaborations                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PubMed eUtils API - Paper metadata & relationships      │  │
│  │  OpenAI API - AI analysis & recommendations              │  │
│  │  Unpaywall API - Open access PDF discovery               │  │
│  │  Europe PMC API - Full-text article access               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.x
- **Component Library**: Shadcn UI
- **State Management**: React Context + Hooks
- **Network Visualization**: Cytoscape.js, React Flow
- **PDF Rendering**: PDF.js
- **HTTP Client**: Fetch API
- **Deployment**: Vercel (Edge Network)

#### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic 2.0
- **Database**: PostgreSQL 15
- **AI/ML**: OpenAI GPT-4, LangChain
- **Task Queue**: Background jobs (async)
- **Deployment**: Railway

#### Infrastructure
- **Frontend Hosting**: Vercel (Global CDN)
- **Backend Hosting**: Railway (US-Central)
- **Database**: Railway PostgreSQL
- **DNS**: Vercel DNS
- **SSL**: Automatic (Vercel + Railway)
- **Monitoring**: Built-in health checks

---

## 4. Data Architecture

### Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORE ENTITIES                              │
└─────────────────────────────────────────────────────────────────┘

users (Authentication & Profiles)
├── user_id (PK)
├── username, email, password_hash
├── first_name, last_name
├── category, role, institution, subject_area
├── preferences (JSON) - research interests, settings
└── created_at, updated_at

projects (Research Workspaces)
├── project_id (PK)
├── project_name, description
├── owner_user_id (FK → users)
├── tags (JSON), settings (JSON)
└── created_at, updated_at, is_active

collections (Paper Organization)
├── collection_id (PK)
├── project_id (FK → projects)
├── collection_name, description
├── created_by (FK → users)
├── color, icon, sort_order
└── created_at, updated_at, is_active

articles (Paper Metadata)
├── pmid (PK)
├── title, abstract, full_text
├── authors (JSON), journal, year, doi
├── citation_count, mesh_terms (JSON)
└── created_at, updated_at

article_collections (Many-to-Many)
├── article_pmid (FK → articles)
├── collection_id (FK → collections)
├── is_seed (boolean)
├── added_by (FK → users)
└── added_at

annotations (Notes & Comments)
├── annotation_id (PK)
├── project_id (FK → projects)
├── collection_id (FK → collections, nullable)
├── article_pmid (FK → articles, nullable)
├── content, note_type, priority, status
├── author_user_id (FK → users)
├── parent_annotation_id (FK → annotations)
├── tags (JSON), action_items (JSON)
└── created_at, updated_at

reports (Generated Reviews)
├── report_id (PK)
├── project_id (FK → projects)
├── title, objective, molecule
├── content (JSON), summary
├── clinical_mode, dag_mode, full_text_only
├── preference (precision/recall)
├── created_by (FK → users)
├── status, article_count, processing_time_seconds
└── created_at, updated_at

deep_dive_analyses (Article Deep Dives)
├── analysis_id (PK)
├── project_id (FK → projects)
├── report_id (FK → reports, nullable)
├── article_pmid, article_title, article_authors (JSON)
├── analysis_content (JSON)
├── key_findings (JSON), methodology_assessment (JSON)
├── created_by (FK → users)
├── status, processing_time_seconds
└── created_at, updated_at

project_collaborators (Team Access)
├── project_id (FK → projects)
├── user_id (FK → users)
├── role (owner/editor/viewer)
├── permissions (JSON)
└── added_at

activities (Activity Log)
├── activity_id (PK)
├── project_id (FK → projects)
├── user_id (FK → users)
├── activity_type, description
├── article_pmid, report_id, analysis_id, collection_id
└── created_at

citations (Citation Relationships)
├── citing_pmid (FK → articles)
├── cited_pmid (FK → articles)
├── citation_context, relationship_type
├── co_citation_count, bibliographic_coupling
└── created_at, updated_at
```

### Data Relationships

```
User (1) ──────────── (N) Projects
  │                        │
  │                        ├── (N) Collections
  │                        │     └── (N) Articles (via article_collections)
  │                        │
  │                        ├── (N) Annotations
  │                        │     ├── Project-level (no article_pmid)
  │                        │     ├── Collection-level (has collection_id)
  │                        │     └── Paper-level (has article_pmid)
  │                        │
  │                        ├── (N) Reports
  │                        │     └── (N) Deep Dive Analyses
  │                        │
  │                        └── (N) Collaborators
  │
  └── (N) Activities
```

### Data Flow Patterns

#### 1. Paper Discovery Flow
```
User Search Query
  → PubMed eUtils API
  → Parse XML Response
  → Store in articles table
  → Return to frontend
  → Display in UI
```

#### 2. Network Visualization Flow
```
User selects paper (PMID)
  → Fetch citations (PubMed eLink)
  → Fetch references (PubMed eLink)
  → Fetch similar papers (PubMed eLink)
  → Detect cross-references
  → Build graph (nodes + edges)
  → Calculate node colors (year-based gradient)
  → Return NetworkData { nodes, edges, metadata }
  → Render in Cytoscape.js
```

#### 3. Deep Dive Analysis Flow
```
User requests deep dive
  → Fetch full text (Europe PMC / Unpaywall)
  → Extract sections (methods, results, discussion)
  → Send to OpenAI GPT-4
  → Parse AI response
  → Store in deep_dive_analyses table
  → Return structured analysis
  → Display in UI
```

---

## 5. Core Features & Functionalities

### 5.1 User Management

#### Authentication
- ✅ Email/password registration
- ✅ Secure password hashing (bcrypt)
- ✅ JWT-based session management
- ✅ Profile completion wizard (3 steps)
- ✅ User preferences & research interests

#### User Profiles
- Personal information (name, institution, role)
- Professional category (Student, Academic, Industry)
- Subject area & research interests
- Onboarding preferences
- Mailing list opt-in

### 5.2 Project Management

#### Project Workspace
- **Create Projects**: Name, description, tags
- **Project Dashboard**: Overview of all research activities
- **Tabs**:
  - Research Question: Define objectives
  - Explore: Network visualization
  - My Collections: Organize papers
  - Analysis: Reports & deep dives
  - Notes: Annotations & insights
  - Progress: Activity timeline

#### Collaboration
- **Invite Collaborators**: Email invitations
- **Role-Based Access**: Owner, Editor, Viewer
- **Permissions**: Granular control over actions
- **Activity Feed**: Real-time updates on team actions

### 5.3 Literature Discovery

#### Search
- **Global Search**: Search across papers, collections, notes, reports
- **PubMed Search**: Advanced query builder with MeSH terms
- **Filters**: Year range, journal, author, full-text only
- **Semantic Search**: AI-powered relevance ranking

#### Recommendations
- **Papers for You**: Personalized based on research interests
- **Trending Papers**: Popular in your field
- **Cross-Domain Opportunities**: Papers from adjacent fields
- **Weekly Mix**: Curated weekly recommendations

### 5.4 Network Visualization

#### Interactive Citation Network
- **Cytoscape.js Rendering**: High-performance graph visualization
- **Node Types**:
  - Base article (green, larger)
  - Citing articles (blue gradient by year)
  - Referenced articles (blue gradient by year)
  - Similar articles (purple)
- **Edge Types**:
  - Citation edges (green): Paper A cites Paper B
  - Reference edges (blue): Paper A references Paper B
  - Similarity edges (purple, dotted): Papers are similar
- **Cross-Reference Detection**: Relationships between non-central nodes

#### Navigation Modes
- **Similar Work**: Find papers with similar content
- **Earlier Work**: Papers referenced by current paper
- **Later Work**: Papers that cite current paper
- **Authors**: Explore author collaboration networks
- **Timeline**: Chronological view of research evolution

#### Multi-Column View
- **ResearchRabbit-Style**: Multiple network columns side-by-side
- **Column Actions**:
  - Add Similar Work column
  - Add Earlier Work column
  - Add Later Work column
  - Remove column
- **Paper List Panel** (Left):
  - Search papers
  - Sort by (Relevance, Year, Citations, Title)
  - Quick filters (Seeds, Recent, Highly Cited)
  - Filter by relationship (Citations, References, Similar)
- **Network Graph** (Center):
  - Interactive graph with pan/zoom
  - Node selection
  - Edge hover tooltips
- **Paper Details** (Right):
  - Title, authors, journal, year
  - Abstract
  - Quick actions (Deep Dive, Generate Review, Add to Collection)
  - Exploration options (Similar, Earlier, Later, Authors)

### 5.5 Collections Management

#### Collection Features
- **Create Collections**: Name, description, color, icon
- **Add Papers**: From search, network, or manual PMID entry
- **Seed Papers**: Mark papers as starting points for exploration
- **Collection Network**: Visualize relationships within collection
- **Export**: Download collection metadata

#### Collection Organization
- **Hierarchical Structure**: Project → Collections → Papers
- **Drag & Drop**: Reorder collections
- **Color Coding**: Visual organization
- **Article Count**: Track collection size

### 5.6 PDF Viewer & Annotations

#### PDF Viewer
- **PDF.js Integration**: In-browser PDF rendering
- **Multi-Source PDF Discovery**:
  1. PubMed Central (PMC)
  2. Europe PMC
  3. Unpaywall
  4. DOI resolver
- **Navigation**: Page thumbnails, search, zoom
- **Responsive**: Works on desktop and mobile

#### Annotation System
- **Highlight Tool**: Select text and highlight
- **Sticky Notes**: Add notes to specific locations
- **Freeform Drawing**: Sketch on PDF
- **Annotation Types**:
  - Hypothesis
  - Observation
  - Question
  - Insight
  - Method
  - Result
  - Todo
- **Priority Levels**: High, Medium, Low
- **Status Tracking**: Active, Resolved, Archived

### 5.7 AI-Powered Analysis

#### Deep Dive Analysis
- **Comprehensive Article Analysis**:
  - Research objectives
  - Methodology assessment
  - Key findings
  - Experimental design
  - Statistical methods
  - Results interpretation
  - Limitations
  - Future directions
- **Full-Text Extraction**: Intelligent section parsing
- **AI Model**: OpenAI GPT-4
- **Processing Time**: 30-60 seconds
- **Storage**: Saved to database for future reference

#### Generate Review
- **Literature Review Generation**:
  - Executive summary
  - Research landscape overview
  - Key themes & trends
  - Methodology comparison
  - Evidence synthesis
  - Research gaps
  - Future opportunities
- **Modes**:
  - Precision mode (fewer, higher-quality papers)
  - Recall mode (more papers, broader coverage)
- **Options**:
  - Clinical mode (focus on clinical trials)
  - DAG mode (directed acyclic graph analysis)
  - Full-text only (exclude abstracts-only papers)
- **Processing Time**: 2-5 minutes
- **Export**: PDF, Word, Markdown

#### Semantic Analysis
- **Paper Categorization**: Automatic domain classification
- **Methodology Extraction**: Identify experimental methods
- **Statistical Methods**: Extract statistical approaches
- **Research Domain Mapping**: Multi-domain classification
- **Novelty Scoring**: Assess paper novelty
- **Impact Prediction**: Predict citation potential

#### Relationship Explanations
- **AI-Powered Explanations**: Why two papers are related
- **Citation Context**: Extract citation sentences
- **Shared Concepts**: Identify common themes
- **Methodological Connections**: Compare approaches
- **Temporal Context**: Understand research evolution

### 5.8 Notes & Annotations

#### Note Types
1. **Hypothesis**: Research hypotheses and predictions
2. **Observation**: Key observations from papers
3. **Question**: Research questions to explore
4. **Insight**: Breakthrough insights and connections
5. **Method**: Methodological notes
6. **Result**: Key results and findings
7. **Todo**: Action items and tasks

#### Note Hierarchy
- **Project-Level Notes**: General project notes
- **Collection-Level Notes**: Notes about a collection
- **Paper-Level Notes**: Notes on specific papers
- **Threaded Discussions**: Reply to notes

#### Note Features
- **Rich Text Editor**: Formatting, lists, links
- **Tags**: Organize notes with tags
- **Priority**: High, Medium, Low
- **Status**: Active, Resolved, Archived
- **Action Items**: Checkboxes for tasks
- **Related Papers**: Link to PMIDs
- **Search**: Full-text search across notes

### 5.9 Activity & Progress Tracking

#### Activity Feed
- **Real-Time Updates**: See team actions as they happen
- **Activity Types**:
  - Paper added to collection
  - Note created
  - Report generated
  - Deep dive completed
  - Collaborator invited
  - Collection created
- **Filtering**: By user, type, date range
- **Notifications**: In-app notifications

#### Timeline View
- **Chronological Visualization**: Research progress over time
- **Milestones**: Key project events
- **Contribution Tracking**: Who did what when
- **Export**: Download timeline data

### 5.10 Search & Discovery

#### Global Search
- **Unified Search**: Search across all content types
- **Content Types**:
  - Papers (title, abstract, authors, journal)
  - Collections (name, description)
  - Notes (content, tags, research questions)
  - Reports (title, objective, molecule)
  - Analyses (article title)
- **Real-Time Results**: Instant search as you type
- **Result Grouping**: Organized by content type
- **Quick Actions**: Jump to results directly

#### Advanced Search
- **Boolean Operators**: AND, OR, NOT
- **Field-Specific**: Search specific fields
- **Date Ranges**: Filter by publication date
- **MeSH Terms**: Medical Subject Headings
- **Author Search**: Find papers by author
- **Journal Search**: Filter by journal

---

## 6. User Flows

### 6.1 Onboarding Flow

```
1. Landing Page
   ↓
2. Sign Up (Email + Password)
   ↓
3. Complete Profile (3 Steps)
   ├── Step 1: Personal Info (Name, Category, Role, Institution)
   ├── Step 2: Research Interests (Topics, Keywords, Career Stage)
   └── Step 3: First Action (Create Project, Search Papers, Explore Network)
   ↓
4. Dashboard
   ├── Welcome Banner
   ├── Quick Actions
   └── Suggested Next Steps
```

### 6.2 Project Creation Flow

```
1. Dashboard
   ↓
2. Click "New Project"
   ↓
3. Modal: Enter Name + Description
   ↓
4. Submit
   ↓
5. Redirect to Project Page
   ├── Empty state with quick start guide
   ├── Suggested actions:
   │   ├── Search for papers
   │   ├── Create collection
   │   └── Invite collaborators
   └── Tabs: Research Question, Explore, Collections, Analysis, Notes, Progress
```

### 6.3 Paper Discovery & Collection Flow

```
1. Search Papers (Global Search or PubMed Search)
   ↓
2. Browse Results
   ├── View paper details
   ├── Read abstract
   └── Check PDF availability
   ↓
3. Add to Collection
   ├── Select existing collection
   └── Or create new collection
   ↓
4. Mark as Seed (Optional)
   ↓
5. Collection Updated
   └── Paper appears in collection list
```

### 6.4 Network Exploration Flow

```
1. Select Paper (from collection or search)
   ↓
2. Click "Explore Network"
   ↓
3. Network View Loads
   ├── Left Panel: Paper list with filters
   ├── Center: Interactive graph
   └── Right Panel: Paper details
   ↓
4. Explore Relationships
   ├── Click node to select
   ├── View paper details in right panel
   ├── Click "Similar Work" → Add similar papers
   ├── Click "Earlier Work" → Add references
   └── Click "Later Work" → Add citations
   ↓
5. Multi-Column Exploration (Optional)
   ├── Click "Add Column" on any paper
   ├── New network column appears
   └── Explore multiple papers side-by-side
   ↓
6. Save Papers to Collection
   └── Click "Add to Collection" on any paper
```

### 6.5 Deep Dive Analysis Flow

```
1. Select Paper (from network or collection)
   ↓
2. Click "Deep Dive"
   ↓
3. Modal: Confirm Analysis
   ├── Show estimated time (30-60s)
   └── Option: Full-text only
   ↓
4. Processing
   ├── Fetch full text
   ├── Extract sections
   ├── Send to AI
   └── Progress indicator
   ↓
5. Analysis Complete
   ├── Display structured analysis:
   │   ├── Research objectives
   │   ├── Methodology assessment
   │   ├── Key findings
   │   ├── Experimental design
   │   ├── Statistical methods
   │   ├── Results interpretation
   │   ├── Limitations
   │   └── Future directions
   └── Save to project
   ↓
6. View Saved Analyses
   └── Analysis tab in project
```

### 6.6 Generate Review Flow

```
1. Select Collection or Papers
   ↓
2. Click "Generate Review"
   ↓
3. Modal: Configure Review
   ├── Title
   ├── Objective
   ├── Molecule (optional)
   ├── Mode: Precision vs Recall
   ├── Options:
   │   ├── Clinical mode
   │   ├── DAG mode
   │   └── Full-text only
   └── Submit
   ↓
4. Background Processing (2-5 minutes)
   ├── Fetch papers
   ├── Extract content
   ├── AI synthesis
   └── Progress updates
   ↓
5. Review Complete
   ├── Display report:
   │   ├── Executive summary
   │   ├── Research landscape
   │   ├── Key themes
   │   ├── Methodology comparison
   │   ├── Evidence synthesis
   │   ├── Research gaps
   │   └── Future opportunities
   └── Save to project
   ↓
6. Export Options
   ├── PDF
   ├── Word
   └── Markdown
```

### 6.7 Collaboration Flow

```
1. Project Owner: Click "Invite Collaborators"
   ↓
2. Modal: Enter Email + Role
   ├── Role: Owner, Editor, Viewer
   └── Permissions: Customize access
   ↓
3. Send Invitation
   ↓
4. Collaborator: Receives Email
   ↓
5. Collaborator: Clicks Link
   ↓
6. Collaborator: Signs In/Up
   ↓
7. Collaborator: Access Granted
   ├── View project
   ├── See activity feed
   └── Contribute based on role
   ↓
8. Real-Time Collaboration
   ├── Activity feed updates
   ├── Shared annotations
   └── Team insights
```

---

## 7. API Architecture

### API Endpoint Structure

```
Frontend (Vercel)
  ↓
/api/proxy/* (Next.js API Routes)
  ↓
Backend (Railway)
  ↓
External APIs (PubMed, OpenAI, etc.)
```

### Key API Endpoints

#### Authentication
- `POST /api/proxy/auth/signup` - User registration
- `POST /api/proxy/auth/signin` - User login
- `POST /api/proxy/auth/complete-profile` - Complete registration

#### Projects
- `GET /api/proxy/projects` - List user's projects
- `POST /api/proxy/projects` - Create new project
- `GET /api/proxy/projects/{projectId}` - Get project details
- `PUT /api/proxy/projects/{projectId}` - Update project
- `DELETE /api/proxy/projects/{projectId}` - Delete project

#### Collections
- `GET /api/proxy/collections/{collectionId}` - Get collection
- `POST /api/proxy/collections` - Create collection
- `PUT /api/proxy/collections/{collectionId}` - Update collection
- `DELETE /api/proxy/collections/{collectionId}` - Delete collection
- `POST /api/proxy/collections/{collectionId}/articles` - Add article
- `DELETE /api/proxy/collections/{collectionId}/articles/{pmid}` - Remove article

#### PubMed Integration
- `GET /api/proxy/pubmed/search` - Search PubMed
- `GET /api/proxy/pubmed/details/{pmid}` - Get paper details
- `GET /api/proxy/pubmed/network` - Get citation network
- `GET /api/proxy/pubmed/citations` - Get citations
- `GET /api/proxy/pubmed/references` - Get references
- `GET /api/proxy/pubmed/elink` - Generic eLink query

#### Network Visualization
- `GET /api/proxy/pubmed/network?pmid={pmid}&type={type}&limit={limit}` - Get network data
  - Types: citations, references, similar, mixed
  - Returns: `{ nodes, edges, metadata }`

#### AI Analysis
- `POST /api/proxy/deep-dive` - Generate deep dive analysis
- `POST /api/proxy/generate-review` - Generate literature review
- `POST /api/proxy/relationships/explain` - Explain paper relationships
- `POST /api/proxy/semantic/analyze` - Semantic paper analysis

#### Annotations
- `GET /api/proxy/projects/{projectId}/annotations` - List annotations
- `POST /api/proxy/projects/{projectId}/annotations` - Create annotation
- `PUT /api/proxy/projects/{projectId}/annotations/{annotationId}` - Update annotation
- `DELETE /api/proxy/projects/{projectId}/annotations/{annotationId}` - Delete annotation

#### Reports
- `GET /api/proxy/reports/{reportId}` - Get report
- `POST /api/proxy/generate-review` - Generate review report
- `DELETE /api/proxy/reports/{reportId}` - Delete report

#### Deep Dive Analyses
- `GET /api/proxy/deep-dive-analyses` - List analyses
- `POST /api/proxy/deep-dive` - Create deep dive
- `GET /api/proxy/deep-dive-analyses/{analysisId}` - Get analysis
- `DELETE /api/proxy/deep-dive-analyses/{analysisId}` - Delete analysis

#### Search
- `GET /api/proxy/search/global` - Global search across all content

#### Recommendations
- `GET /api/proxy/recommendations/papers-for-you/{userId}` - Personalized recommendations
- `GET /api/proxy/recommendations/trending/{userId}` - Trending papers
- `GET /api/proxy/recommendations/cross-pollination/{userId}` - Cross-domain opportunities
- `GET /api/proxy/recommendations/weekly/{userId}` - Weekly mix

---

## 8. AI/ML Systems

### 8.1 Deep Dive Analysis System

**Purpose**: Comprehensive analysis of individual research papers

**Architecture**:
```
User Request
  ↓
Fetch Full Text (Europe PMC / Unpaywall)
  ↓
Extract Sections (Methods, Results, Discussion)
  ↓
OpenAI GPT-4 Analysis
  ├── Research Objectives Agent
  ├── Methodology Assessment Agent
  ├── Key Findings Agent
  ├── Experimental Design Agent
  ├── Statistical Methods Agent
  ├── Results Interpretation Agent
  ├── Limitations Agent
  └── Future Directions Agent
  ↓
Structured JSON Response
  ↓
Store in Database
  ↓
Display in UI
```

**AI Model**: OpenAI GPT-4  
**Processing Time**: 30-60 seconds  
**Token Limit**: 30,000 characters (focused on methods/results sections)

### 8.2 Generate Review System

**Purpose**: Synthesize multiple papers into comprehensive literature review

**Architecture**:
```
User Request (Collection or Query)
  ↓
Fetch Papers (PubMed)
  ↓
Extract Content (Abstracts + Full Text)
  ↓
OpenAI GPT-4 Synthesis
  ├── Executive Summary Agent
  ├── Research Landscape Agent
  ├── Key Themes Agent
  ├── Methodology Comparison Agent
  ├── Evidence Synthesis Agent
  ├── Research Gaps Agent
  └── Future Opportunities Agent
  ↓
Structured Report
  ↓
Store in Database
  ↓
Display + Export Options
```

**AI Model**: OpenAI GPT-4  
**Processing Time**: 2-5 minutes  
**Modes**: Precision (fewer papers, higher quality) vs Recall (more papers, broader coverage)

### 8.3 Semantic Analysis System

**Purpose**: Automatic paper categorization and metadata extraction

**Features**:
- **Domain Classification**: Multi-label classification into research domains
- **Methodology Extraction**: Identify experimental methods
- **Statistical Methods**: Extract statistical approaches
- **Novelty Scoring**: Assess paper novelty
- **Impact Prediction**: Predict citation potential

**Architecture**:
```
Paper (Title + Abstract + Full Text)
  ↓
Text Preprocessing
  ↓
Feature Extraction
  ├── Domain Keywords
  ├── Methodology Patterns
  ├── Statistical Terms
  └── Citation Context
  ↓
Classification Models
  ├── Domain Classifier
  ├── Methodology Extractor
  ├── Novelty Scorer
  └── Impact Predictor
  ↓
Structured Metadata
```

### 8.4 Recommendation System

**Purpose**: Personalized paper recommendations

**Types**:
1. **Papers for You**: Based on research interests and reading history
2. **Trending Papers**: Popular in user's field
3. **Cross-Domain Opportunities**: Papers from adjacent fields
4. **Weekly Mix**: Curated weekly recommendations

**Architecture**:
```
User Profile
  ├── Research Interests
  ├── Reading History
  ├── Collections
  └── Annotations
  ↓
Recommendation Engine
  ├── Content-Based Filtering
  ├── Collaborative Filtering
  ├── Citation Network Analysis
  └── Temporal Trends
  ↓
Ranked Recommendations
  ↓
Display in UI
```

### 8.5 Relationship Explanation System

**Purpose**: Explain why two papers are related

**Architecture**:
```
Paper A + Paper B
  ↓
Fetch Metadata + Abstracts
  ↓
Extract Citation Context (if available)
  ↓
OpenAI GPT-4 Analysis
  ├── Shared Concepts
  ├── Methodological Connections
  ├── Temporal Context
  └── Research Evolution
  ↓
Natural Language Explanation
  ↓
Display in UI
```

**AI Model**: OpenAI GPT-4  
**Processing Time**: 5-10 seconds

---

## 9. Security & Authentication

### Authentication System
- **Method**: JWT-based authentication
- **Password Hashing**: bcrypt with salt
- **Session Management**: HTTP-only cookies
- **Token Expiration**: 7 days
- **Refresh Tokens**: Automatic renewal

### Authorization
- **Role-Based Access Control (RBAC)**:
  - Owner: Full access
  - Editor: Read + Write (no delete project)
  - Viewer: Read-only
- **Resource-Level Permissions**: Granular control per project
- **API Key Authentication**: For external integrations

### Data Security
- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: HTTPS/TLS 1.3
- **Input Validation**: Pydantic models
- **SQL Injection Prevention**: SQLAlchemy ORM
- **XSS Prevention**: React auto-escaping
- **CSRF Protection**: Token-based

### Privacy
- **Data Ownership**: Users own their data
- **Data Deletion**: Cascade delete on account deletion
- **GDPR Compliance**: Data export and deletion
- **No Third-Party Tracking**: No analytics cookies

---

## 10. Deployment & Infrastructure

### Production Environment

#### Frontend (Vercel)
- **URL**: https://r-d-agent-xcode.vercel.app
- **Deployment**: Automatic on push to `main`
- **CDN**: Global edge network
- **Build Time**: ~2 minutes
- **Environment Variables**: Managed in Vercel dashboard

#### Backend (Railway)
- **URL**: https://r-dagent-production.up.railway.app
- **Deployment**: Automatic on push to `main`
- **Region**: US-Central
- **Build Time**: ~3 minutes
- **Environment Variables**: Managed in Railway dashboard

#### Database (Railway PostgreSQL)
- **Version**: PostgreSQL 15
- **Storage**: 10 GB (expandable)
- **Backups**: Daily automatic backups
- **Connection Pooling**: PgBouncer

### CI/CD Pipeline

```
Developer Push to GitHub
  ↓
GitHub Actions (Optional)
  ├── Run tests
  ├── Lint code
  └── Build check
  ↓
Vercel Auto-Deploy (Frontend)
  ├── Build Next.js app
  ├── Deploy to edge network
  └── Update DNS
  ↓
Railway Auto-Deploy (Backend)
  ├── Build Docker image
  ├── Run database migrations
  ├── Deploy to production
  └── Health check
  ↓
Production Live
```

### Monitoring & Logging
- **Frontend**: Vercel Analytics
- **Backend**: Railway logs
- **Database**: PostgreSQL logs
- **Error Tracking**: Console logs
- **Health Checks**: `/health` endpoint

### Scaling Strategy
- **Frontend**: Auto-scaling via Vercel edge network
- **Backend**: Vertical scaling on Railway
- **Database**: Connection pooling + read replicas (future)
- **Caching**: In-memory caching for API responses

---

## Appendix: Key Metrics

### Performance Targets
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms (p95)
- **Network Visualization**: < 3 seconds to render
- **Deep Dive Analysis**: 30-60 seconds
- **Generate Review**: 2-5 minutes

### Capacity
- **Concurrent Users**: 1,000+
- **Database Size**: 10 GB (current), 100 GB (target)
- **API Rate Limits**: 100 requests/minute per user
- **File Storage**: 50 GB (PDFs, exports)

### Reliability
- **Uptime Target**: 99.9%
- **Backup Frequency**: Daily
- **Disaster Recovery**: 24-hour RPO, 4-hour RTO

---

## 11. Frontend Component Architecture

### Component Hierarchy

```
App (Root Layout)
├── AuthProvider (Authentication Context)
├── Header
│   ├── Logo
│   ├── Navigation
│   │   ├── Dashboard Link
│   │   ├── Projects Link
│   │   ├── Explore Link
│   │   └── Search Link
│   └── UserMenu
│       ├── Profile
│       ├── Settings
│       └── Logout
├── Main Content Area
│   ├── Dashboard Page
│   │   ├── WelcomeBanner
│   │   ├── QuickActions
│   │   ├── ProjectsList
│   │   ├── RecentActivity
│   │   └── Recommendations
│   │
│   ├── Project Page
│   │   ├── ProjectHeader
│   │   ├── TabNavigation
│   │   └── TabContent
│   │       ├── ResearchQuestionTab
│   │       ├── ExploreTab (Network View)
│   │       ├── CollectionsTab
│   │       ├── AnalysisTab
│   │       ├── NotesTab
│   │       └── ProgressTab
│   │
│   ├── Network View (Explore)
│   │   ├── PaperListPanel (Left)
│   │   │   ├── SearchBar
│   │   │   ├── SortDropdown
│   │   │   ├── QuickFilters
│   │   │   ├── RelationshipFilter
│   │   │   └── PaperList
│   │   │       └── PaperCard[]
│   │   ├── CytoscapeGraph (Center)
│   │   │   ├── GraphCanvas
│   │   │   ├── ZoomControls
│   │   │   ├── LayoutSelector
│   │   │   └── EdgeLegend
│   │   └── PaperDetailsPanel (Right)
│   │       ├── PaperHeader
│   │       ├── AbstractSection
│   │       ├── MetadataSection
│   │       ├── QuickActions
│   │       │   ├── DeepDiveButton
│   │       │   ├── GenerateReviewButton
│   │       │   └── AddToCollectionButton
│   │       └── ExplorationOptions
│   │           ├── SimilarWorkButton
│   │           ├── EarlierWorkButton
│   │           ├── LaterWorkButton
│   │           └── AuthorsButton
│   │
│   ├── Multi-Column Network View
│   │   ├── NetworkColumn[]
│   │   │   ├── ColumnHeader
│   │   │   ├── PaperListPanel
│   │   │   ├── CytoscapeGraph
│   │   │   └── PaperDetailsPanel
│   │   └── AddColumnButton
│   │
│   ├── Collections Page
│   │   ├── CollectionsList
│   │   │   └── CollectionCard[]
│   │   ├── CreateCollectionButton
│   │   └── CollectionView
│   │       ├── CollectionHeader
│   │       ├── PapersList
│   │       ├── CollectionNetwork
│   │       └── CollectionActions
│   │
│   ├── PDF Viewer Page
│   │   ├── PDFCanvas (Left)
│   │   │   ├── PageNavigation
│   │   │   ├── ZoomControls
│   │   │   └── PDFRenderer
│   │   └── AnnotationPanel (Right)
│   │       ├── AnnotationToolbar
│   │       ├── AnnotationsList
│   │       └── AnnotationEditor
│   │
│   ├── Analysis Page
│   │   ├── ReportsList
│   │   │   └── ReportCard[]
│   │   ├── DeepDivesList
│   │   │   └── DeepDiveCard[]
│   │   └── AnalysisViewer
│   │       ├── AnalysisHeader
│   │       ├── AnalysisContent
│   │       └── ExportOptions
│   │
│   └── Search Page
│       ├── SearchBar
│       ├── AdvancedFilters
│       ├── ResultsTabs
│       │   ├── PapersTab
│       │   ├── CollectionsTab
│       │   ├── NotesTab
│       │   └── ReportsTab
│       └── ResultsList
│
└── Footer
    ├── Links
    ├── Social
    └── Copyright
```

### Key React Components

#### NetworkView.tsx (2,320 lines)
**Purpose**: Main network visualization container

**Key Features**:
- Fetches network data from API
- Manages Cytoscape instance
- Handles node selection and navigation
- Detects cross-references between papers
- Exposes instance to window for testing

**State Management**:
```typescript
const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], edges: [], metadata: {} });
const [selectedNode, setSelectedNode] = useState<string | null>(null);
const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Functions**:
- `fetchNetworkData()` - Fetches network from API
- `detectCrossReferences()` - Finds edges between non-central nodes
- `getNodeColor()` - Calculates gradient color based on year
- `handleNodeClick()` - Handles node selection
- `handleAddSimilarPapers()` - Adds similar papers to network

#### PaperListPanel.tsx (436 lines)
**Purpose**: Left panel with paper list, search, and filters

**Key Features**:
- Search papers by title, authors, journal
- Sort by relevance, year, citations, title
- Quick filters (Seeds, Recent, Highly Cited)
- Filter by relationship (Citations, References, Similar)
- Relationship badge display

**Props**:
```typescript
interface PaperListPanelProps {
  papers: NetworkNode[];
  selectedPaperId: string | null;
  onSelectPaper: (paperId: string) => void;
  seedPapers?: string[];
  sourceNodeId?: string;
  edges?: Array<{ id, from, to, relationship }>;
  collectionsMap?: Map<string, boolean>;
}
```

**Key Functions**:
- `getRelationship()` - Determines relationship between paper and source
- `getRelationshipBadge()` - Returns badge configuration
- `filteredAndSortedPapers` - useMemo that applies all filters
- `relationshipCounts` - Counts papers by relationship type

#### CytoscapeGraph.tsx (438 lines)
**Purpose**: Cytoscape.js wrapper component

**Key Features**:
- Initializes Cytoscape with custom styles
- Handles node clicks and edge hovers
- Provides layout options (cose, circle, grid, breadthfirst)
- Zoom and pan controls
- Edge legend

**Cytoscape Styles**:
```typescript
{
  selector: 'node',
  style: {
    'background-color': 'data(color)',
    'label': 'data(label)',
    'width': 'data(size)',
    'height': 'data(size)',
    'font-size': '12px',
    'text-wrap': 'wrap',
    'text-max-width': '100px'
  }
},
{
  selector: 'edge',
  style: {
    'width': 2,
    'line-color': (ele) => {
      const rel = ele.data('relationship');
      if (rel === 'citation') return '#10b981'; // green
      if (rel === 'reference') return '#3b82f6'; // blue
      if (rel === 'similarity') return '#8b5cf6'; // purple
      return '#94a3b8'; // gray
    },
    'target-arrow-color': (ele) => ele.style('line-color'),
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'line-style': (ele) => ele.data('relationship') === 'similarity' ? 'dotted' : 'solid'
  }
}
```

#### CollectionView.tsx
**Purpose**: Display and manage collection contents

**Key Features**:
- List papers in collection
- Mark seed papers
- Remove papers from collection
- View collection network
- Export collection

#### PDFViewer.tsx
**Purpose**: In-browser PDF viewing with annotations

**Key Features**:
- PDF.js integration
- Page navigation
- Zoom controls
- Text selection
- Annotation tools (highlight, note, draw)
- Annotation persistence

#### DeepDiveViewer.tsx
**Purpose**: Display deep dive analysis results

**Key Features**:
- Structured analysis display
- Collapsible sections
- Export options
- Related papers links
- Save to project

---

## 12. Backend Service Architecture

### Service Layer Structure

```
FastAPI Application
├── main.py (Application entry point)
├── database.py (Database models & session)
├── config.py (Configuration management)
│
├── routers/ (API endpoints)
│   ├── auth_router.py
│   ├── projects_router.py
│   ├── collections_router.py
│   ├── annotations_router.py
│   ├── reports_router.py
│   ├── deep_dive_router.py
│   ├── search_router.py
│   └── recommendations_router.py
│
├── services/ (Business logic)
│   ├── pubmed_service.py
│   ├── citation_service.py
│   ├── similarity_engine.py
│   ├── author_network_service.py
│   ├── timeline_service.py
│   ├── deep_dive_service.py
│   ├── review_generation_service.py
│   ├── semantic_analysis_service.py
│   └── recommendation_service.py
│
├── agents/ (AI agents)
│   ├── deep_dive_agents.py
│   ├── review_agents.py
│   ├── project_summary_agents.py
│   └── relationship_explanation_agents.py
│
├── utils/ (Utility functions)
│   ├── xml_parser.py
│   ├── pdf_extractor.py
│   ├── text_processor.py
│   └── cache_manager.py
│
└── models/ (Pydantic models)
    ├── user_models.py
    ├── project_models.py
    ├── collection_models.py
    ├── annotation_models.py
    └── analysis_models.py
```

### Key Backend Services

#### PubMed Service (`pubmed_service.py`)
**Purpose**: Interface with PubMed eUtils API

**Key Functions**:
- `search_pubmed(query, max_results)` - Search PubMed
- `fetch_article_details(pmid)` - Get article metadata
- `fetch_citations(pmid)` - Get citing articles
- `fetch_references(pmid)` - Get referenced articles
- `fetch_similar_articles(pmid)` - Get similar articles
- `parse_article_xml(xml)` - Parse PubMed XML response

**API Endpoints Used**:
- eSearch: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
- eFetch: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi
- eLink: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi

#### Citation Service (`citation_service.py`)
**Purpose**: Build and analyze citation networks

**Key Functions**:
- `build_citation_network(pmid, depth)` - Build multi-level citation network
- `detect_cross_references(nodes, edges)` - Find edges between non-central nodes
- `calculate_citation_metrics(pmid)` - Calculate h-index, impact factor, etc.
- `find_citation_context(citing_pmid, cited_pmid)` - Extract citation sentences

#### Similarity Engine (`similarity_engine.py`)
**Purpose**: Find similar papers using multiple methods

**Methods**:
1. **PubMed Similar Articles**: Uses PubMed's built-in similarity
2. **MeSH Term Overlap**: Compares Medical Subject Headings
3. **Abstract Similarity**: TF-IDF + cosine similarity
4. **Citation Coupling**: Shared references
5. **Co-Citation**: Cited together by other papers

**Key Functions**:
- `find_similar_papers(pmid, method, limit)` - Find similar papers
- `calculate_similarity_score(pmid1, pmid2)` - Calculate similarity
- `rank_by_relevance(papers, query)` - Rank papers by relevance

#### Deep Dive Service (`deep_dive_service.py`)
**Purpose**: Orchestrate deep dive analysis

**Pipeline**:
```python
async def generate_deep_dive(pmid: str, project_id: str, user_id: str):
    # 1. Fetch article metadata
    article = await pubmed_service.fetch_article_details(pmid)

    # 2. Fetch full text
    full_text = await fetch_full_text(pmid)

    # 3. Extract sections
    sections = extract_sections(full_text)

    # 4. Run AI agents
    analysis = await run_deep_dive_agents(sections)

    # 5. Store in database
    analysis_id = await store_analysis(analysis, project_id, user_id)

    # 6. Return structured result
    return analysis
```

**AI Agents**:
- Research Objectives Agent
- Methodology Assessment Agent
- Key Findings Agent
- Experimental Design Agent
- Statistical Methods Agent
- Results Interpretation Agent
- Limitations Agent
- Future Directions Agent

#### Review Generation Service (`review_generation_service.py`)
**Purpose**: Generate literature review from multiple papers

**Pipeline**:
```python
async def generate_review(
    papers: List[str],
    objective: str,
    mode: str,
    options: Dict
):
    # 1. Fetch papers
    articles = await fetch_articles(papers)

    # 2. Extract content
    content = await extract_content(articles, options)

    # 3. Run AI synthesis
    review = await run_review_agents(content, objective)

    # 4. Format report
    report = format_review(review)

    # 5. Store in database
    report_id = await store_report(report)

    # 6. Return report
    return report
```

**AI Agents**:
- Executive Summary Agent
- Research Landscape Agent
- Key Themes Agent
- Methodology Comparison Agent
- Evidence Synthesis Agent
- Research Gaps Agent
- Future Opportunities Agent

#### Recommendation Service (`recommendation_service.py`)
**Purpose**: Generate personalized paper recommendations

**Recommendation Types**:

1. **Papers for You**:
   - Based on research interests
   - Reading history
   - Collection contents
   - Annotation topics

2. **Trending Papers**:
   - Popular in user's field
   - Recent high-citation papers
   - Shared by similar users

3. **Cross-Domain Opportunities**:
   - Papers from adjacent fields
   - Methodological innovations
   - Interdisciplinary connections

4. **Weekly Mix**:
   - Curated weekly selection
   - Mix of trending, relevant, and surprising papers

**Algorithm**:
```python
def generate_recommendations(user_id: str, type: str):
    # 1. Get user profile
    user = get_user_profile(user_id)

    # 2. Get user activity
    activity = get_user_activity(user_id)

    # 3. Build user vector
    user_vector = build_user_vector(user, activity)

    # 4. Find candidate papers
    candidates = find_candidate_papers(user_vector, type)

    # 5. Rank by relevance
    ranked = rank_papers(candidates, user_vector)

    # 6. Diversify results
    diverse = diversify_results(ranked)

    # 7. Return top N
    return diverse[:20]
```

---

## 13. Data Flow Diagrams

### 13.1 User Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /api/proxy/auth/signup
       │    { email, password, username }
       ↓
┌─────────────────────┐
│  Next.js API Route  │
│  /api/proxy/auth/   │
│     signup          │
└──────┬──────────────┘
       │ 2. Forward to backend
       │    POST /auth/signup
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  auth_router.py     │
└──────┬──────────────┘
       │ 3. Validate input
       │ 4. Hash password (bcrypt)
       │ 5. Create user in DB
       ↓
┌─────────────────────┐
│  PostgreSQL         │
│  users table        │
└──────┬──────────────┘
       │ 6. User created
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 7. Generate JWT token
       │ 8. Return { user, token }
       ↓
┌─────────────────────┐
│  Next.js API Route  │
└──────┬──────────────┘
       │ 9. Set HTTP-only cookie
       │ 10. Return user data
       ↓
┌─────────────┐
│   Browser   │
│  Redirect   │
│  Dashboard  │
└─────────────┘
```

### 13.2 Network Visualization Data Flow

```
┌─────────────┐
│   Browser   │
│  User clicks│
│  "Explore"  │
└──────┬──────┘
       │ 1. GET /api/proxy/pubmed/network
       │    ?pmid=12345&type=mixed&limit=50
       ↓
┌─────────────────────┐
│  Next.js API Route  │
│  /api/proxy/pubmed/ │
│     network         │
└──────┬──────────────┘
       │ 2. Validate params
       │ 3. Check cache
       │ 4. Forward to backend (if not cached)
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  pubmed_service.py  │
└──────┬──────────────┘
       │ 5. Fetch article details (eFetch)
       ↓
┌─────────────────────┐
│  PubMed eUtils API  │
│  eFetch             │
└──────┬──────────────┘
       │ 6. Return XML
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 7. Parse XML
       │ 8. Fetch citations (eLink)
       ↓
┌─────────────────────┐
│  PubMed eUtils API  │
│  eLink (cites)      │
└──────┬──────────────┘
       │ 9. Return citing PMIDs
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 10. Fetch references (eLink)
       ↓
┌─────────────────────┐
│  PubMed eUtils API  │
│  eLink (refs)       │
└──────┬──────────────┘
       │ 11. Return referenced PMIDs
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 12. Fetch similar (eLink)
       ↓
┌─────────────────────┐
│  PubMed eUtils API  │
│  eLink (similar)    │
└──────┬──────────────┘
       │ 13. Return similar PMIDs
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 14. Fetch details for all PMIDs (eFetch)
       │ 15. Build nodes array
       │ 16. Build edges array
       │ 17. Detect cross-references
       │ 18. Calculate node colors
       │ 19. Return { nodes, edges, metadata }
       ↓
┌─────────────────────┐
│  Next.js API Route  │
└──────┬──────────────┘
       │ 20. Cache response
       │ 21. Return to browser
       ↓
┌─────────────┐
│   Browser   │
│ NetworkView │
└──────┬──────┘
       │ 22. Store in state
       │ 23. Pass to CytoscapeGraph
       ↓
┌─────────────────────┐
│  CytoscapeGraph     │
│  Component          │
└──────┬──────────────┘
       │ 24. Initialize Cytoscape
       │ 25. Add nodes
       │ 26. Add edges
       │ 27. Apply layout
       │ 28. Render graph
       ↓
┌─────────────┐
│   Browser   │
│  Interactive│
│   Graph     │
└─────────────┘
```

### 13.3 Deep Dive Analysis Flow

```
┌─────────────┐
│   Browser   │
│  User clicks│
│ "Deep Dive" │
└──────┬──────┘
       │ 1. POST /api/proxy/deep-dive
       │    { pmid, project_id, full_text_only }
       ↓
┌─────────────────────┐
│  Next.js API Route  │
│  /api/proxy/        │
│     deep-dive       │
└──────┬──────────────┘
       │ 2. Validate input
       │ 3. Forward to backend
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  deep_dive_service  │
└──────┬──────────────┘
       │ 4. Fetch article metadata
       ↓
┌─────────────────────┐
│  PubMed eFetch API  │
└──────┬──────────────┘
       │ 5. Return metadata
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 6. Fetch full text
       ↓
┌─────────────────────┐
│  Europe PMC API     │
│  or Unpaywall       │
└──────┬──────────────┘
       │ 7. Return full text (if available)
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 8. Extract sections
       │    (Methods, Results, Discussion)
       │ 9. Prepare prompts for AI agents
       │ 10. Call OpenAI API (8 agents in parallel)
       ↓
┌─────────────────────┐
│  OpenAI GPT-4 API   │
└──────┬──────────────┘
       │ 11. Return AI analysis (JSON)
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 12. Parse AI responses
       │ 13. Combine into structured analysis
       │ 14. Store in database
       ↓
┌─────────────────────┐
│  PostgreSQL         │
│  deep_dive_analyses │
└──────┬──────────────┘
       │ 15. Analysis saved
       ↓
┌─────────────────────┐
│  FastAPI Backend    │
└──────┬──────────────┘
       │ 16. Return analysis_id + content
       ↓
┌─────────────────────┐
│  Next.js API Route  │
└──────┬──────────────┘
       │ 17. Return to browser
       ↓
┌─────────────┐
│   Browser   │
│ Display     │
│ Analysis    │
└─────────────┘
```

---

## 14. Performance Optimization Strategies

### Frontend Optimization

#### 1. Code Splitting
- **Route-based splitting**: Each page is a separate bundle
- **Component lazy loading**: Heavy components loaded on demand
- **Dynamic imports**: `React.lazy()` for non-critical components

#### 2. Caching Strategy
- **API response caching**: Cache network data for 5 minutes
- **Browser caching**: Static assets cached for 1 year
- **Service worker**: Offline support (future)

#### 3. Image Optimization
- **Next.js Image component**: Automatic optimization
- **WebP format**: Modern image format
- **Lazy loading**: Images loaded as they enter viewport

#### 4. Bundle Optimization
- **Tree shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Gzip compression**: Reduce transfer size

### Backend Optimization

#### 1. Database Optimization
- **Indexes**: On frequently queried columns
  - `idx_collection_project_id` on `collections.project_id`
  - `idx_collection_created_by` on `collections.created_by`
  - `idx_article_pmid` on `articles.pmid`
- **Connection pooling**: Reuse database connections
- **Query optimization**: Use joins instead of N+1 queries

#### 2. API Optimization
- **Response caching**: Cache PubMed API responses
- **Batch requests**: Fetch multiple articles in one request
- **Pagination**: Limit result set size
- **Async/await**: Non-blocking I/O operations

#### 3. External API Optimization
- **Rate limiting**: Respect PubMed API limits (3 requests/second)
- **Request batching**: Combine multiple PMIDs in one eFetch call
- **Retry logic**: Exponential backoff on failures
- **Timeout handling**: Fail fast on slow responses

### Network Optimization

#### 1. CDN Usage
- **Vercel Edge Network**: Global CDN for frontend
- **Static asset CDN**: Images, fonts, icons

#### 2. HTTP/2
- **Multiplexing**: Multiple requests over single connection
- **Server push**: Proactively send resources

#### 3. Compression
- **Gzip**: Text compression
- **Brotli**: Better compression for modern browsers

---

## 15. Error Handling & Resilience

### Frontend Error Handling

#### 1. Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);

    // Show fallback UI
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### 2. API Error Handling
```typescript
async function fetchNetworkData(pmid: string) {
  try {
    const response = await fetch(`/api/proxy/pubmed/network?pmid=${pmid}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch network data:', error);

    // Show user-friendly error message
    toast.error('Failed to load network. Please try again.');

    // Return empty state
    return { nodes: [], edges: [], metadata: {} };
  }
}
```

#### 3. Graceful Degradation
- **No PDF available**: Show abstract only
- **Network visualization fails**: Show paper list
- **AI analysis fails**: Show basic metadata

### Backend Error Handling

#### 1. Exception Handling
```python
@router.get("/network")
async def get_network(pmid: str, type: str = "mixed", limit: int = 50):
    try:
        # Validate input
        if not pmid or not pmid.isdigit():
            raise HTTPException(status_code=400, detail="Invalid PMID")

        # Fetch network data
        network_data = await pubmed_service.build_network(pmid, type, limit)

        return network_data

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in get_network: {e}", exc_info=True)

        # Return generic error
        raise HTTPException(status_code=500, detail="Internal server error")
```

#### 2. Retry Logic
```python
async def fetch_with_retry(url: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            response = await httpx.get(url, timeout=10.0)
            response.raise_for_status()
            return response

        except httpx.TimeoutException:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff

        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                # Retry on server errors
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
            else:
                # Don't retry on client errors
                raise
```

#### 3. Circuit Breaker
```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)

            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0

            return result

        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"

            raise
```

### Database Error Handling

#### 1. Transaction Management
```python
async def create_project_with_collection(project_data, collection_data, db: Session):
    try:
        # Start transaction
        project = Project(**project_data)
        db.add(project)
        db.flush()  # Get project_id without committing

        collection = Collection(**collection_data, project_id=project.project_id)
        db.add(collection)

        # Commit transaction
        db.commit()

        return project, collection

    except Exception as e:
        # Rollback on error
        db.rollback()
        logger.error(f"Failed to create project with collection: {e}")
        raise
```

#### 2. Connection Pool Management
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections when pool is full
    pool_timeout=30,  # Timeout waiting for connection
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True  # Verify connections before using
)
```

---

## 16. Future Roadmap & Enhancements

### Phase 4: Advanced Intelligence (Q1 2026)

#### 1. Collection Intelligence
- **Gap Analysis**: Identify missing research areas in collections
- **Cluster Visualization**: Automatic paper clustering
- **Trend Detection**: Identify emerging trends in collection
- **Recommendation Engine**: Suggest papers to fill gaps

#### 2. Advanced Network Features
- **Author Collaboration Networks**: Visualize co-authorship
- **Institution Networks**: Map research institutions
- **Temporal Networks**: Animate research evolution over time
- **Multi-Layer Networks**: Combine citation, author, and topic layers

#### 3. Enhanced AI Capabilities
- **Custom AI Models**: Fine-tuned models for specific domains
- **Hypothesis Generation**: AI suggests research hypotheses
- **Experimental Design Suggestions**: AI recommends methodologies
- **Literature Gap Detection**: Automated gap analysis

### Phase 5: Collaboration & Sharing (Q2 2026)

#### 1. Real-Time Collaboration
- **Live Editing**: Multiple users editing simultaneously
- **Presence Indicators**: See who's online
- **Cursor Tracking**: See where collaborators are working
- **Chat Integration**: In-app messaging

#### 2. Public Sharing
- **Public Collections**: Share collections publicly
- **Embeddable Networks**: Embed networks in websites
- **DOI for Collections**: Citable collections
- **Social Features**: Follow researchers, like collections

#### 3. Team Features
- **Team Workspaces**: Shared team accounts
- **Role Management**: Advanced permission system
- **Team Analytics**: Track team productivity
- **Onboarding Workflows**: Structured team onboarding

### Phase 6: Enterprise Features (Q3 2026)

#### 1. Advanced Analytics
- **Research Metrics Dashboard**: Track research productivity
- **Citation Impact Analysis**: Measure research impact
- **Collaboration Patterns**: Analyze team dynamics
- **ROI Tracking**: Measure research investment returns

#### 2. Integration Ecosystem
- **Zotero Integration**: Import/export to Zotero
- **Mendeley Integration**: Sync with Mendeley
- **ORCID Integration**: Link to ORCID profiles
- **Slack Integration**: Notifications in Slack
- **API Access**: Public API for integrations

#### 3. Enterprise Security
- **SSO Integration**: Single sign-on (SAML, OAuth)
- **Audit Logs**: Comprehensive activity logging
- **Data Residency**: Choose data storage location
- **Compliance**: HIPAA, SOC 2, ISO 27001

### Phase 7: Mobile & Offline (Q4 2026)

#### 1. Mobile Apps
- **iOS App**: Native iPhone/iPad app
- **Android App**: Native Android app
- **Mobile-Optimized Web**: Responsive design improvements
- **Push Notifications**: Mobile notifications

#### 2. Offline Support
- **Offline Reading**: Download papers for offline access
- **Offline Annotations**: Annotate without internet
- **Sync on Reconnect**: Automatic sync when online
- **Conflict Resolution**: Handle offline conflicts

### Phase 8: Advanced Visualization (Q1 2027)

#### 1. 3D Visualization
- **3D Citation Networks**: Immersive 3D graphs
- **VR Support**: Virtual reality exploration
- **AR Support**: Augmented reality overlays
- **Interactive Timelines**: 3D temporal visualization

#### 2. Custom Visualizations
- **Sankey Diagrams**: Flow of research ideas
- **Heatmaps**: Research activity heatmaps
- **Chord Diagrams**: Relationship matrices
- **Custom Layouts**: User-defined graph layouts

---

## 17. Success Metrics & KPIs

### User Engagement Metrics

#### Acquisition
- **Sign-ups per month**: Target 1,000+
- **Activation rate**: % completing profile (Target: 80%)
- **Time to first value**: < 5 minutes
- **Referral rate**: % of users referring others (Target: 20%)

#### Retention
- **Daily Active Users (DAU)**: Target 500+
- **Weekly Active Users (WAU)**: Target 2,000+
- **Monthly Active Users (MAU)**: Target 5,000+
- **Retention rate (30-day)**: Target 60%
- **Churn rate**: Target < 5% monthly

#### Engagement
- **Papers explored per session**: Target 10+
- **Collections created per user**: Target 3+
- **Deep dives per month**: Target 5+
- **Reviews generated per month**: Target 2+
- **Annotations per user**: Target 20+
- **Session duration**: Target 15+ minutes

### Product Performance Metrics

#### Speed
- **Page load time**: < 2 seconds (p95)
- **API response time**: < 500ms (p95)
- **Network render time**: < 3 seconds
- **Deep dive completion**: 30-60 seconds
- **Review generation**: 2-5 minutes

#### Reliability
- **Uptime**: 99.9% (< 43 minutes downtime/month)
- **Error rate**: < 0.1%
- **API success rate**: > 99.5%
- **Database query success**: > 99.9%

#### Quality
- **AI accuracy**: > 90% (user satisfaction)
- **Search relevance**: > 85% (user satisfaction)
- **PDF availability**: > 70% of papers
- **Network completeness**: > 95% of edges detected

### Business Metrics

#### Revenue (Future)
- **Monthly Recurring Revenue (MRR)**: Target $50K by end of 2026
- **Annual Recurring Revenue (ARR)**: Target $600K by end of 2026
- **Average Revenue Per User (ARPU)**: Target $10/month
- **Customer Lifetime Value (LTV)**: Target $500
- **Customer Acquisition Cost (CAC)**: Target $50
- **LTV:CAC Ratio**: Target 10:1

#### Growth
- **Month-over-month growth**: Target 20%
- **Year-over-year growth**: Target 300%
- **Market penetration**: Target 5% of academic researchers
- **Enterprise customers**: Target 50 institutions

---

## 18. Competitive Analysis

### Direct Competitors

#### 1. ResearchRabbit
**Strengths**:
- Excellent network visualization
- Multi-column exploration
- Clean, intuitive UI

**Weaknesses**:
- No AI-powered analysis
- Limited collaboration features
- No project management

**Our Advantage**:
- AI deep dive analysis
- Comprehensive project workspaces
- Team collaboration features

#### 2. Connected Papers
**Strengths**:
- Beautiful circular graph visualization
- Prior/derivative works
- Simple, focused interface

**Weaknesses**:
- Single-paper focus
- No collections or projects
- No AI analysis

**Our Advantage**:
- Multi-paper collections
- Project management
- AI-powered insights

#### 3. Semantic Scholar
**Strengths**:
- Massive paper database
- AI-powered recommendations
- Citation context

**Weaknesses**:
- Complex interface
- No project management
- Limited visualization

**Our Advantage**:
- Better visualization
- Project workspaces
- Team collaboration

#### 4. Zotero
**Strengths**:
- Mature reference manager
- Large user base
- Extensive integrations

**Weaknesses**:
- No network visualization
- No AI analysis
- Outdated UI

**Our Advantage**:
- Modern UI/UX
- Network visualization
- AI-powered analysis

### Unique Value Proposition

**R&D Agent is the only platform that combines:**
1. 🧠 AI-powered deep analysis
2. 🕸️ Interactive network visualization
3. 📚 Comprehensive project management
4. 🤝 Real-time team collaboration
5. 🔬 Research-specific workflows

---

## 19. Technical Debt & Known Issues

### Current Technical Debt

#### 1. Frontend
- **State Management**: Need to migrate to Zustand or Redux for better state management
- **Component Library**: Inconsistent use of Shadcn UI components
- **Type Safety**: Some components have `any` types
- **Test Coverage**: Need comprehensive unit and integration tests

#### 2. Backend
- **Caching Layer**: Need Redis for better caching
- **Background Jobs**: Need Celery or similar for long-running tasks
- **API Documentation**: Need OpenAPI/Swagger documentation
- **Test Coverage**: Need comprehensive test suite

#### 3. Database
- **Migrations**: Need proper migration system (Alembic)
- **Indexes**: Need more indexes for performance
- **Partitioning**: Large tables need partitioning
- **Backup Strategy**: Need automated backup and restore

#### 4. Infrastructure
- **Monitoring**: Need comprehensive monitoring (Datadog, New Relic)
- **Logging**: Need centralized logging (ELK stack)
- **CI/CD**: Need automated testing in pipeline
- **Staging Environment**: Need proper staging environment

### Known Issues

#### 1. Cytoscape Instance Detection (IN PROGRESS)
- **Issue**: Test suite cannot reliably find Cytoscape instance
- **Status**: Fixed by exposing to `window.__cytoscapeInstance`
- **Next Steps**: Verify fix after deployment

#### 2. PDF Availability
- **Issue**: Only ~70% of papers have accessible PDFs
- **Status**: Ongoing - exploring more PDF sources
- **Next Steps**: Add more PDF providers (SciHub alternative, institutional access)

#### 3. Cross-Reference Detection
- **Issue**: Only checks first 10 non-central nodes
- **Status**: Performance optimization
- **Next Steps**: Implement background processing for full detection

#### 4. AI Analysis Speed
- **Issue**: Deep dive takes 30-60 seconds
- **Status**: Limited by OpenAI API speed
- **Next Steps**: Implement streaming responses, show progress

#### 5. Mobile Responsiveness
- **Issue**: Network visualization not optimized for mobile
- **Status**: Desktop-first design
- **Next Steps**: Implement mobile-specific layouts

---

## 20. Glossary

### Research Terms

- **PMID**: PubMed Identifier - unique ID for papers in PubMed
- **DOI**: Digital Object Identifier - persistent identifier for papers
- **MeSH**: Medical Subject Headings - controlled vocabulary for indexing
- **Citation**: Paper A cites Paper B (A → B)
- **Reference**: Paper A references Paper B (A → B)
- **Co-citation**: Papers A and B are both cited by Paper C
- **Bibliographic Coupling**: Papers A and B share common references
- **h-index**: Metric of researcher productivity and impact
- **Impact Factor**: Metric of journal importance

### Technical Terms

- **Network Graph**: Visual representation of papers and relationships
- **Node**: Individual paper in the network
- **Edge**: Relationship between two papers
- **Cytoscape**: JavaScript library for graph visualization
- **JWT**: JSON Web Token - authentication token format
- **ORM**: Object-Relational Mapping - database abstraction layer
- **API**: Application Programming Interface
- **REST**: Representational State Transfer - API architecture
- **CDN**: Content Delivery Network - distributed server network
- **SSR**: Server-Side Rendering - render pages on server
- **CSR**: Client-Side Rendering - render pages in browser

### Product Terms

- **Seed Paper**: Starting point for network exploration
- **Collection**: User-curated set of papers
- **Deep Dive**: Comprehensive AI analysis of a paper
- **Generate Review**: AI-synthesized literature review
- **Project**: Research workspace containing collections, notes, reports
- **Annotation**: User note or comment on a paper
- **Activity Feed**: Timeline of project activities
- **Cross-Reference**: Relationship between non-central nodes in network
- **Multi-Column View**: Side-by-side network exploration

---

## 21. Contact & Support

### Development Team

- **Lead Developer**: Frederic Le
- **Email**: frederic@rdagent.com
- **GitHub**: https://github.com/fredericle/R-D_Agent_XCode

### Support Channels

- **Email Support**: support@rdagent.com
- **Documentation**: https://docs.rdagent.com (future)
- **Community Forum**: https://community.rdagent.com (future)
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions

### Deployment URLs

- **Production Frontend**: https://r-d-agent-xcode.vercel.app
- **Production Backend**: https://r-dagent-production.up.railway.app
- **Staging**: (To be set up)

### Repository

- **GitHub**: https://github.com/fredericle/R-D_Agent_XCode
- **Branch**: `main`
- **License**: Proprietary

---

## 22. Changelog

### Version 3.0 (November 2025)
- ✅ Multi-column network view (ResearchRabbit-style)
- ✅ Cross-reference detection
- ✅ Node gradient colors based on publication year
- ✅ Comprehensive test suite (45+ tests)
- ✅ Improved error handling
- ✅ Performance optimizations

### Version 2.0 (October 2025)
- ✅ Deep dive analysis
- ✅ Generate review reports
- ✅ Collections management
- ✅ PDF viewer with annotations
- ✅ Project collaboration
- ✅ Activity tracking

### Version 1.0 (September 2025)
- ✅ User authentication
- ✅ Project management
- ✅ PubMed search
- ✅ Network visualization
- ✅ Basic annotations
- ✅ Paper details view

---

**Document Version**: 3.0
**Last Updated**: November 17, 2025
**Maintained By**: R&D Agent Team
**Contact**: support@rdagent.com

---

## Appendix A: API Response Examples

### Network API Response
```json
{
  "nodes": [
    {
      "id": "12345678",
      "label": "Sample Paper Title",
      "size": 60,
      "color": "#3b82f6",
      "metadata": {
        "pmid": "12345678",
        "title": "Sample Paper Title",
        "authors": ["Smith J", "Doe A"],
        "journal": "Nature",
        "year": 2023,
        "citation_count": 150,
        "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
        "abstract": "This is the abstract...",
        "node_type": "base"
      }
    }
  ],
  "edges": [
    {
      "id": "12345678-cites-87654321",
      "from": "12345678",
      "to": "87654321",
      "relationship": "citation",
      "weight": 1
    }
  ],
  "metadata": {
    "source_pmid": "12345678",
    "network_type": "mixed",
    "total_nodes": 50,
    "total_edges": 120,
    "cross_reference_edges": 15
  }
}
```

### Deep Dive Response
```json
{
  "analysis_id": "uuid-here",
  "article_pmid": "12345678",
  "article_title": "Sample Paper Title",
  "analysis_content": {
    "research_objectives": {
      "primary_objective": "To investigate...",
      "secondary_objectives": ["Objective 1", "Objective 2"],
      "hypothesis": "We hypothesize that..."
    },
    "methodology_assessment": {
      "study_design": "Randomized controlled trial",
      "sample_size": 100,
      "methods": ["Method 1", "Method 2"],
      "strengths": ["Strength 1", "Strength 2"],
      "limitations": ["Limitation 1", "Limitation 2"]
    },
    "key_findings": [
      {
        "finding": "Finding 1",
        "significance": "High",
        "evidence_strength": "Strong"
      }
    ],
    "statistical_methods": ["t-test", "ANOVA", "regression"],
    "future_directions": ["Direction 1", "Direction 2"]
  },
  "created_at": "2025-11-17T10:00:00Z",
  "processing_time_seconds": 45
}
```

---

## Appendix B: Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────┘

users ──────────────────┐
  │                     │
  │ owns                │ creates
  ↓                     ↓
projects ────────────> collections ────────> article_collections
  │                     │                           │
  │ contains            │ contains                  │ links to
  ↓                     ↓                           ↓
annotations           articles <───────────────────┘
  │
  │ belongs to
  ↓
reports ──────────────> deep_dive_analyses
  │
  │ references
  ↓
articles

project_collaborators ──> projects
  │
  │ links
  ↓
users

activities ──> projects
  │
  │ tracks
  ↓
users

citations ──> articles (citing_pmid)
  │
  │ links to
  ↓
articles (cited_pmid)
```

---

**END OF DOCUMENT**

