# 📋 COMPREHENSIVE END-USER TEST GUIDE: WEEKS 5-12

**Date:** November 5, 2025  
**Coverage:** All features developed from Week 5 to Week 12  
**Target Audience:** End users, QA testers, Product managers  
**Estimated Time:** 60-90 minutes for complete testing

---

## 📚 TABLE OF CONTENTS

1. [Week 5: Global Search (Cmd+K)](#week-5-global-search)
2. [Week 6: Advanced Filters](#week-6-advanced-filters)
3. [Week 7-8: Collaboration Features](#week-7-8-collaboration-features)
4. [Week 9: Activity Feed](#week-9-activity-feed)
5. [Week 10: PDF Viewer](#week-10-pdf-viewer)
6. [Week 11: PDF Annotations & Onboarding](#week-11-pdf-annotations)
7. [Week 12: Information Architecture Enhancements](#week-12-information-architecture)

---

## 🎯 PREREQUISITES

### **Before You Start:**
1. ✅ **Logged in** to https://frontend-psi-seven-85.vercel.app/
2. ✅ **Have a project** with some data (papers, collections, notes)
3. ✅ **Browser:** Chrome, Firefox, Safari, or Edge (latest version)
4. ✅ **Screen size:** Desktop (1280px+) recommended for full experience

### **Test Data Setup:**
If you don't have test data, create:
- At least 1 project
- At least 3 papers in your project
- At least 1 collection
- At least 2 notes/annotations
- At least 1 collaborator (optional)

---

## 🔍 WEEK 5: GLOBAL SEARCH (Cmd+K)

**Feature:** Universal search across all content types  
**Location:** Available from any page in the application  
**Keyboard Shortcut:** `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

### **Test 1: Open Global Search**

**Steps:**
1. Navigate to any page in the application
2. Press `Cmd+K` (or `Ctrl+K`)

**Expected Output:**
- ✅ Search modal opens instantly (< 100ms)
- ✅ Modal has dark background overlay
- ✅ Search input is automatically focused
- ✅ Placeholder text: "Search papers, collections, notes, reports..."
- ✅ Modal is centered on screen

**Where to Look:**
- Modal appears in center of screen
- Background is dimmed
- Cursor is blinking in search input

---

### **Test 2: Search Across Content Types**

**Steps:**
1. Open global search (`Cmd+K`)
2. Type a search term (e.g., "cancer", "treatment", "analysis")
3. Wait 300ms for debounced search

**Expected Output:**
- ✅ Results appear in < 1 second
- ✅ Results are categorized:
  - 📄 **Papers** (with title, authors, journal)
  - 📚 **Collections** (with name, description, paper count)
  - 📝 **Notes** (with content snippet, note type)
  - 📊 **Reports** (with title, generated date)
  - 🔬 **Analyses** (with title, status)
- ✅ Each category shows count (e.g., "Papers (5)")
- ✅ Search term is highlighted in results
- ✅ Maximum 50 results per category

**Where to Look:**
- Results appear below search input
- Each category has an icon and count
- Matching text is highlighted in yellow/green

---

### **Test 3: Navigate Search Results**

**Steps:**
1. Open global search and type a query
2. Use arrow keys (↑↓) to navigate results
3. Press `Enter` to select a result
4. Press `Esc` to close modal

**Expected Output:**
- ✅ Arrow keys highlight results (blue background)
- ✅ Enter key navigates to selected item
- ✅ Modal closes after selection
- ✅ User is taken to correct tab/page
- ✅ Esc key closes modal without navigation

**Where to Look:**
- Highlighted result has blue background
- After Enter, you're on the correct page
- Modal disappears smoothly

---

### **Test 4: Click Search Result**

**Steps:**
1. Open global search and type a query
2. Click on a paper result
3. Verify navigation

**Expected Output:**
- ✅ Modal closes
- ✅ Navigate to Collections tab
- ✅ Paper is visible in context
- ✅ URL updates to include `?tab=collections`

**Where to Look:**
- Collections tab is active (green underline)
- Paper card is visible
- URL bar shows `?tab=collections`

---

### **Test 5: Empty Search Results**

**Steps:**
1. Open global search
2. Type a nonsense query (e.g., "xyzabc123")

**Expected Output:**
- ✅ "No results found" message
- ✅ Suggestion to try different keywords
- ✅ No error messages in console

**Where to Look:**
- Empty state message in modal
- No results displayed

---

## 🎛️ WEEK 6: ADVANCED FILTERS

**Feature:** Filter and sort content in Collections, Explore, and Notes tabs  
**Location:** Each tab has its own filter panel

---

### **Test 6: Collections Tab Filters**

**Steps:**
1. Navigate to your project page
2. Click on **"My Collections"** tab (📚)
3. Look for filter controls at the top

**Expected Output:**
- ✅ Search bar (magnifying glass icon)
- ✅ Sort dropdown (Date Created, Name, Size)
- ✅ Size filter (All, Small <5, Medium 5-20, Large >20)
- ✅ Date filter (All Time, Last 7 Days, Last 30 Days, Last 90 Days)
- ✅ View toggle (Grid/List view)

**Where to Look:**
- Top of Collections tab
- Filter controls in a horizontal row
- Active filters show as chips below controls

---

### **Test 7: Filter Collections by Size**

**Steps:**
1. Go to Collections tab
2. Click "Size" dropdown
3. Select "Large (>20 papers)"

**Expected Output:**
- ✅ Only collections with >20 papers are shown
- ✅ Filter chip appears: "Size: Large (>20)"
- ✅ Results count updates (e.g., "Showing 2 of 5 collections")
- ✅ Filtering happens instantly (< 50ms)

**Where to Look:**
- Collection cards update immediately
- Blue filter chip below controls
- Count text above collections

---

### **Test 8: Search Collections**

**Steps:**
1. Go to Collections tab
2. Type in search bar (e.g., "cancer")
3. Observe results

**Expected Output:**
- ✅ Collections filter as you type
- ✅ Matches collection name or description
- ✅ Search is case-insensitive
- ✅ Results update in real-time

**Where to Look:**
- Collection cards update as you type
- Matching text is visible in cards

---

### **Test 9: Sort Collections**

**Steps:**
1. Go to Collections tab
2. Click "Sort by" dropdown
3. Select "Name (A-Z)"

**Expected Output:**
- ✅ Collections reorder alphabetically
- ✅ Sort happens instantly
- ✅ Sort persists when switching tabs

**Where to Look:**
- Collection cards reorder
- First collection starts with A/B/C

---

### **Test 10: Clear All Filters**

**Steps:**
1. Apply multiple filters (size, date, search)
2. Click "Clear All" button

**Expected Output:**
- ✅ All filter chips disappear
- ✅ All collections are shown again
- ✅ Search bar is cleared
- ✅ Dropdowns reset to default

**Where to Look:**
- Filter chips disappear
- All collections visible
- "Clear All" button disappears

---

### **Test 11: Explore Tab Filters**

**Steps:**
1. Navigate to **"Explore Papers"** tab (🔍)
2. Look for filter panel

**Expected Output:**
- ✅ Search bar
- ✅ Year range slider (e.g., 2015-2025)
- ✅ Citation count filter (All, Low <10, Medium 10-50, High >50)
- ✅ Has Abstract toggle
- ✅ Sort dropdown (Relevance, Year, Citations)
- ✅ View toggle (Network/Search view)

**Where to Look:**
- Top of Explore tab
- Filter panel with multiple controls

---

### **Test 12: Filter Papers by Year**

**Steps:**
1. Go to Explore tab
2. Adjust year range slider (e.g., 2020-2025)

**Expected Output:**
- ✅ Only papers from 2020-2025 are shown
- ✅ Filter chip: "Year: 2020-2025"
- ✅ Results count updates
- ✅ Slider handles move smoothly

**Where to Look:**
- Paper cards update
- Year range chip appears
- Slider shows selected range

---

### **Test 13: Filter Papers by Citations**

**Steps:**
1. Go to Explore tab
2. Select "High (>50 citations)"

**Expected Output:**
- ✅ Only highly-cited papers shown
- ✅ Filter chip appears
- ✅ Citation counts visible on cards

**Where to Look:**
- Paper cards show citation counts
- Only papers with >50 citations visible

---

### **Test 14: Toggle "Has Abstract" Filter**

**Steps:**
1. Go to Explore tab
2. Click "Has Abstract" toggle

**Expected Output:**
- ✅ Toggle turns green/blue
- ✅ Only papers with abstracts shown
- ✅ Filter chip: "Has Abstract"

**Where to Look:**
- Toggle button changes color
- Papers without abstracts disappear

---

### **Test 15: Notes Tab Filters**

**Steps:**
1. Navigate to **"Notes & Ideas"** tab (📝)
2. Look for filter controls

**Expected Output:**
- ✅ Search bar
- ✅ Note Type filter (All, General, Finding, Hypothesis, Question, TODO, Comparison, Critique)
- ✅ Priority filter (All, High, Medium, Low)
- ✅ Status filter (All, Active, Archived, Completed)
- ✅ Tags filter (if tags exist)
- ✅ Has Action Items toggle
- ✅ Author filter (if collaborators exist)

**Where to Look:**
- Top of Notes tab
- Multiple filter dropdowns

---

### **Test 16: Filter Notes by Type**

**Steps:**
1. Go to Notes tab
2. Select "Finding" from Note Type dropdown

**Expected Output:**
- ✅ Only "Finding" notes shown
- ✅ Filter chip: "Type: Finding"
- ✅ Note cards show "Finding" badge

**Where to Look:**
- Note cards update
- Badge on each note shows "Finding"

---

### **Test 17: Filter Notes by Priority**

**Steps:**
1. Go to Notes tab
2. Select "High" from Priority dropdown

**Expected Output:**
- ✅ Only high-priority notes shown
- ✅ Filter chip: "Priority: High"
- ✅ Notes show red/high priority indicator

**Where to Look:**
- Note cards with high priority
- Priority badge/color visible

---

### **Test 18: Combine Multiple Filters**

**Steps:**
1. Go to any tab (Collections, Explore, or Notes)
2. Apply 3+ filters simultaneously
3. Observe results

**Expected Output:**
- ✅ All filters work together (AND logic)
- ✅ Multiple filter chips appear
- ✅ Results match ALL criteria
- ✅ Can remove individual chips

**Where to Look:**
- Multiple blue chips below controls
- Results match all filters
- Click X on chip to remove

---

## 👥 WEEK 7-8: COLLABORATION FEATURES

**Feature:** Invite collaborators, manage permissions, view collaborators list  
**Location:** Research Question tab, Collaborators section

---

### **Test 19: View Collaborators List**

**Steps:**
1. Navigate to your project page
2. Go to **"Research Question"** tab (🎯)
3. Scroll down to "Collaborators" section

**Expected Output:**
- ✅ Section titled "Collaborators"
- ✅ List of current collaborators (if any)
- ✅ Each collaborator shows:
  - Avatar/initials
  - Name
  - Email
  - Role badge (Owner/Editor/Viewer)
- ✅ "Invite Collaborator" button (green)

**Where to Look:**
- Below seed paper section
- Collaborators section with cards
- Green invite button at top

---

### **Test 20: Invite a Collaborator**

**Steps:**
1. Go to Research Question tab
2. Click "Invite Collaborator" button
3. Fill in the modal:
   - Email: `test-collaborator@example.com`
   - Role: `Editor`
4. Click "Send Invitation"

**Expected Output:**
- ✅ Modal opens with form
- ✅ Email input field
- ✅ Role dropdown (Viewer, Editor, Owner)
- ✅ Role descriptions visible
- ✅ Success message after submission
- ✅ Modal closes
- ✅ New collaborator appears in list (pending status)

**Where to Look:**
- Modal in center of screen
- Success toast/message
- New collaborator card with "Pending" badge

---

### **Test 21: View Collaborator Roles**

**Steps:**
1. Go to Research Question tab
2. Look at collaborator cards
3. Identify role badges

**Expected Output:**
- ✅ **Owner** badge: Purple background
- ✅ **Editor** badge: Blue background
- ✅ **Viewer** badge: Gray background
- ✅ Role descriptions:
  - Owner: Full control
  - Editor: Can edit and add content
  - Viewer: Can only view

**Where to Look:**
- Colored badges on collaborator cards
- Hover over badge for description

---

### **Test 22: Remove a Collaborator (Owner Only)**

**Steps:**
1. Go to Research Question tab (must be project owner)
2. Find a collaborator card
3. Click "Remove" button (trash icon)
4. Confirm removal

**Expected Output:**
- ✅ Remove button visible (owner only)
- ✅ Confirmation dialog appears
- ✅ After confirmation, collaborator is removed
- ✅ Card disappears from list
- ✅ Success message shown

**Where to Look:**
- Trash icon on collaborator card
- Confirmation modal
- Collaborator card disappears

**Note:** If you're not the owner, you won't see the Remove button.

---

### **Test 23: Change Collaborator Role (Owner Only)**

**Steps:**
1. Go to Research Question tab (must be project owner)
2. Find a collaborator card
3. Click role dropdown
4. Select new role (e.g., Editor → Viewer)

**Expected Output:**
- ✅ Role dropdown visible (owner only)
- ✅ Dropdown shows all roles
- ✅ After selection, role updates
- ✅ Badge color changes
- ✅ Success message shown

**Where to Look:**
- Dropdown on collaborator card
- Badge color changes
- Success toast message

**Note:** This feature may show "Not implemented" if backend endpoint is not ready.

---

## 📊 WEEK 9: ACTIVITY FEED

**Feature:** View project activity timeline with filtering
**Location:** Progress tab

---

### **Test 24: View Activity Feed**

**Steps:**
1. Navigate to your project page
2. Click on **"Progress"** tab (📈)
3. Scroll to "Activity Feed" section

**Expected Output:**
- ✅ Section titled "Activity Feed" or "Recent Activity"
- ✅ Activity cards with:
  - Activity type icon (👥 📝 📚 📄 📊)
  - User who performed action
  - Activity description
  - Relative timestamp (e.g., "5m ago", "2h ago", "3d ago")
- ✅ Activities grouped by date:
  - Today
  - Yesterday
  - Last 7 days
  - Older
- ✅ Filter dropdown at top

**Where to Look:**
- Progress tab content
- Activity cards in chronological order
- Date group headers

---

### **Test 25: Filter Activity by Type**

**Steps:**
1. Go to Progress tab
2. Click "Filter" dropdown in Activity Feed
3. Select "Collaborators"

**Expected Output:**
- ✅ Dropdown shows options:
  - All Activities
  - Collaborators
  - Notes
  - Collections
  - Papers
  - Reports
- ✅ Only collaborator activities shown (👥 icons)
- ✅ Activities like "added collaborator", "removed collaborator"
- ✅ Filter updates instantly

**Where to Look:**
- Filter dropdown at top of feed
- Only collaborator-related activities visible
- Icons match filter type

---

### **Test 26: View Different Activity Types**

**Steps:**
1. Go to Progress tab
2. Look at activity feed
3. Identify different activity types

**Expected Output:**
- ✅ **Collaborator activities** (👥): collaborator_added, collaborator_removed
- ✅ **Note activities** (📝): annotation_created, note_created
- ✅ **Collection activities** (📚): collection_created
- ✅ **Paper activities** (📄): paper_added, article_added
- ✅ **Report activities** (📊): report_generated, analysis_created
- ✅ Each type has unique icon and color

**Where to Look:**
- Different colored icons
- Activity descriptions
- Icon matches activity type

---

### **Test 27: View Relative Timestamps**

**Steps:**
1. Go to Progress tab
2. Look at activity timestamps

**Expected Output:**
- ✅ Recent activities: "Just now", "5m ago", "2h ago"
- ✅ Today's activities: "Today at 2:30 PM"
- ✅ Yesterday's activities: "Yesterday at 10:15 AM"
- ✅ Older activities: "Nov 3, 2025"
- ✅ Timestamps update in real-time

**Where to Look:**
- Bottom right of each activity card
- Gray text with clock icon

---

### **Test 28: Empty Activity Feed**

**Steps:**
1. Go to Progress tab on a new project
2. View activity feed

**Expected Output:**
- ✅ Empty state message
- ✅ Icon (📊 or 📈)
- ✅ Text: "No activity yet"
- ✅ Suggestion to start working on project

**Where to Look:**
- Center of activity feed section
- Empty state illustration

---

## 📄 WEEK 10: PDF VIEWER

**Feature:** View PDFs directly in the application
**Location:** Paper cards, "Read PDF" button

---

### **Test 29: Open PDF Viewer**

**Steps:**
1. Navigate to Collections or Explore tab
2. Find a paper card with PDF available
3. Click "Read PDF" button (or PDF icon)

**Expected Output:**
- ✅ PDF viewer modal opens
- ✅ Modal is full-screen or large
- ✅ PDF loads and displays
- ✅ Navigation controls visible:
  - Previous page button
  - Page number (e.g., "1 / 10")
  - Next page button
  - Zoom controls (+/-)
  - Close button (X)
- ✅ Loading spinner while PDF loads

**Where to Look:**
- Full-screen modal
- PDF content in center
- Controls at top/bottom
- Close button in top-right

---

### **Test 30: Navigate PDF Pages**

**Steps:**
1. Open PDF viewer
2. Click "Next Page" button (→)
3. Click "Previous Page" button (←)
4. Type page number and press Enter

**Expected Output:**
- ✅ Next button advances to next page
- ✅ Previous button goes to previous page
- ✅ Page number updates
- ✅ Can jump to specific page
- ✅ First page: Previous button disabled
- ✅ Last page: Next button disabled

**Where to Look:**
- Page number updates
- PDF content changes
- Button states (enabled/disabled)

---

### **Test 31: Zoom PDF**

**Steps:**
1. Open PDF viewer
2. Click "Zoom In" button (+)
3. Click "Zoom Out" button (-)
4. Use mouse wheel to zoom (if supported)

**Expected Output:**
- ✅ Zoom in: PDF gets larger
- ✅ Zoom out: PDF gets smaller
- ✅ Zoom level indicator (e.g., "100%", "150%")
- ✅ Scroll bars appear when zoomed
- ✅ Can pan around zoomed PDF

**Where to Look:**
- PDF size changes
- Zoom percentage displayed
- Scroll bars appear/disappear

---

### **Test 32: Close PDF Viewer**

**Steps:**
1. Open PDF viewer
2. Click X button in top-right
3. Or press Esc key

**Expected Output:**
- ✅ Modal closes smoothly
- ✅ Return to previous page
- ✅ No errors in console

**Where to Look:**
- Modal disappears
- Back to Collections/Explore tab

---

### **Test 33: PDF Not Available**

**Steps:**
1. Find a paper without PDF
2. Try to open PDF

**Expected Output:**
- ✅ "Read PDF" button is disabled or grayed out
- ✅ Or shows "PDF Not Available"
- ✅ Tooltip explains why (e.g., "No open access PDF found")

**Where to Look:**
- Disabled button on paper card
- Tooltip on hover

---

## ✏️ WEEK 11: PDF ANNOTATIONS & ONBOARDING

**Feature:** Highlight text in PDFs, create annotations, enhanced onboarding
**Location:** PDF viewer, Onboarding flow

---

### **Test 34: Highlight Text in PDF**

**Steps:**
1. Open PDF viewer
2. Select text with mouse (click and drag)
3. Look for highlight tool popup

**Expected Output:**
- ✅ Text selection works
- ✅ Highlight tool popup appears above selection
- ✅ Color picker with options:
  - Yellow
  - Green
  - Blue
  - Pink
  - Orange
- ✅ "Add Note" button
- ✅ "Cancel" button

**Where to Look:**
- Popup above selected text
- Color swatches
- Buttons in popup

---

### **Test 35: Create Highlight with Note**

**Steps:**
1. Select text in PDF
2. Choose a color (e.g., Yellow)
3. Click "Add Note"
4. Fill in note form:
   - Content: "Important finding"
   - Type: "Finding"
   - Priority: "High"
5. Click "Save"

**Expected Output:**
- ✅ Text is highlighted in chosen color
- ✅ Note form appears
- ✅ Form has fields:
  - Content (textarea)
  - Note Type (dropdown)
  - Priority (dropdown)
  - Status (dropdown)
- ✅ After save:
  - Highlight persists
  - Note is saved
  - Annotation appears in sidebar

**Where to Look:**
- Highlighted text in PDF
- Note form modal
- Annotations sidebar (right side)

---

### **Test 36: View Annotations Sidebar**

**Steps:**
1. Open PDF viewer with annotations
2. Look for annotations sidebar (right side)

**Expected Output:**
- ✅ Sidebar shows all annotations for this PDF
- ✅ Each annotation shows:
  - Highlighted text snippet
  - Note content
  - Note type badge
  - Priority indicator
  - Page number
  - Created date
- ✅ Click annotation to jump to page
- ✅ Edit/Delete buttons on each annotation

**Where to Look:**
- Right sidebar in PDF viewer
- List of annotation cards
- Click to navigate

---

### **Test 37: Edit PDF Annotation**

**Steps:**
1. Open PDF viewer
2. Find annotation in sidebar
3. Click "Edit" button
4. Modify content
5. Click "Save"

**Expected Output:**
- ✅ Edit form opens
- ✅ Current values pre-filled
- ✅ Can change content, type, priority, status
- ✅ After save:
  - Annotation updates
  - Sidebar refreshes
  - Success message shown

**Where to Look:**
- Edit modal
- Updated annotation in sidebar
- Success toast

---

### **Test 38: Delete PDF Annotation**

**Steps:**
1. Open PDF viewer
2. Find annotation in sidebar
3. Click "Delete" button
4. Confirm deletion

**Expected Output:**
- ✅ Confirmation dialog appears
- ✅ After confirmation:
  - Annotation removed from sidebar
  - Highlight removed from PDF
  - Success message shown

**Where to Look:**
- Confirmation modal
- Annotation disappears
- Highlight removed from PDF

**Note:** Delete may return 405 error if endpoint not implemented.

---

### **Test 39: Enhanced Onboarding Flow (New Users)**

**Steps:**
1. Create a new account (or use test account)
2. Complete onboarding steps

**Expected Output:**
- ✅ **Step 1: Welcome** - Introduction
- ✅ **Step 2: Profile** - Name, institution, subject area
- ✅ **Step 3: Research Question** - Enter research question
- ✅ **Step 4: Seed Paper** - Search and select seed paper
- ✅ **Step 5: Collection** - Create first collection
- ✅ **Step 6: Note** - Create first note
- ✅ **Step 7: Complete** - Success message
- ✅ Progress indicator (1/7, 2/7, etc.)
- ✅ Next/Back buttons
- ✅ Can skip optional steps
- ✅ After completion: Redirect to project page

**Where to Look:**
- Onboarding modal/page
- Progress bar at top
- Step content in center
- Navigation buttons at bottom

---

## 🎨 WEEK 12: INFORMATION ARCHITECTURE ENHANCEMENTS

**Feature:** Enhanced UI/UX across all tabs
**Location:** All project tabs

---

### **Test 40: Research Question Tab - Quick Actions**

**Steps:**
1. Navigate to project page
2. Go to **"Research Question"** tab (🎯)
3. Look for "Quick Actions" section

**Expected Output:**
- ✅ Section titled "Quick Actions"
- ✅ 4 action buttons:
  - 🔍 **Search Papers** - Opens Explore tab
  - 📚 **New Collection** - Opens collection modal
  - 📝 **Add Note** - Opens note modal
  - 📊 **Generate Report** - Opens report modal
- ✅ Spotify-style design (dark cards, hover effects)
- ✅ Each button has icon and description
- ✅ Buttons are clickable and functional

**Where to Look:**
- Top of Research Question tab
- Grid of 4 cards
- Hover for effects

---

### **Test 41: Research Question Tab - Enhanced Seed Paper**

**Steps:**
1. Go to Research Question tab
2. Look for "Seed Paper" section

**Expected Output:**
- ✅ Gradient background (green theme)
- ✅ "Starting Point" badge
- ✅ Paper title, authors, journal
- ✅ 3 action buttons:
  - 📄 **Read PDF** - Opens PDF viewer
  - 🔗 **View on PubMed** - Opens PubMed in new tab
  - 🔍 **Explore Related Papers** - Goes to Explore tab
- ✅ Modern card design with hover effects

**Where to Look:**
- Below Quick Actions
- Green gradient card
- 3 buttons at bottom

---

### **Test 42: Collections Tab - View Modes**

**Steps:**
1. Go to **"My Collections"** tab (📚)
2. Look for view toggle buttons (top-right)
3. Click "Grid View" button
4. Click "List View" button

**Expected Output:**
- ✅ Toggle buttons visible (Grid icon / List icon)
- ✅ **Grid View:**
  - 3-column layout
  - Large cards with images
  - Paper count, description visible
- ✅ **List View:**
  - Horizontal compact layout
  - Smaller cards
  - More collections visible
- ✅ View preference persists

**Where to Look:**
- Top-right of Collections tab
- Layout changes when toggling
- Grid: 3 columns, List: horizontal

---

### **Test 43: Collections Tab - Collection Cards**

**Steps:**
1. Go to Collections tab
2. Look at collection cards

**Expected Output:**
- ✅ Each card shows:
  - Collection name
  - Description
  - Paper count (e.g., "15 papers")
  - Created date
  - Last updated date
  - Preview of first 3 papers (thumbnails)
- ✅ Hover effects (shadow, scale)
- ✅ Click card to view collection details
- ✅ Action buttons:
  - View Collection
  - Edit
  - Delete

**Where to Look:**
- Collection cards in grid/list
- Hover for effects
- Click to open

---

### **Test 44: Explore Tab - View Toggle**

**Steps:**
1. Go to **"Explore Papers"** tab (🔍)
2. Look for view toggle (top-right)
3. Click "Network View" button
4. Click "Search View" button

**Expected Output:**
- ✅ Toggle buttons: Network / Search
- ✅ **Network View:**
  - Visual graph of paper connections
  - Nodes represent papers
  - Lines show citations/references
  - Interactive (drag, zoom)
- ✅ **Search View:**
  - List of papers
  - Search bar and filters
  - Paper cards in grid

**Where to Look:**
- Top-right of Explore tab
- View changes when toggling
- Network: graph, Search: list

---

### **Test 45: Analysis Tab - Search and Export**

**Steps:**
1. Go to **"Analysis"** tab (📊)
2. Look for search bar
3. Look for export/share buttons

**Expected Output:**
- ✅ Search bar at top
- ✅ Search filters reports and analyses
- ✅ Export button (if analyses exist)
- ✅ Share button (if analyses exist)
- ✅ Filter by type: All / Reports / Deep Dives
- ✅ Sort by: Date / Title

**Where to Look:**
- Top of Analysis tab
- Search bar with icon
- Export/Share buttons (may be disabled if no analyses)

---

### **Test 46: Progress Tab - Reading Progress**

**Steps:**
1. Go to **"Progress"** tab (📈)
2. Look for "Reading Progress" section

**Expected Output:**
- ✅ Section titled "Reading Progress"
- ✅ Progress bar showing % of papers read
- ✅ Statistics:
  - Papers read (e.g., "5 / 20")
  - Pages read
  - Time spent reading
- ✅ List of recently read papers
- ✅ Visual progress indicator

**Where to Look:**
- Top of Progress tab
- Progress bar (green/blue)
- Statistics cards

---

### **Test 47: Progress Tab - Collaboration Stats**

**Steps:**
1. Go to Progress tab
2. Look for "Collaboration Stats" section

**Expected Output:**
- ✅ Section titled "Collaboration Stats"
- ✅ Statistics:
  - Number of collaborators
  - Notes by collaborators
  - Recent collaborator activity
- ✅ If no collaborators: Empty state message

**Where to Look:**
- Middle of Progress tab
- Stats cards
- Collaborator avatars

---

## ✅ FINAL CHECKLIST

### **Overall Functionality**
- [ ] All tabs are accessible
- [ ] Navigation between tabs works
- [ ] Data loads correctly in each tab
- [ ] No console errors
- [ ] Responsive design works on mobile

### **Week 5: Global Search**
- [ ] Cmd+K opens search
- [ ] Search returns results
- [ ] Can navigate with keyboard
- [ ] Can click results
- [ ] Modal closes properly

### **Week 6: Advanced Filters**
- [ ] Collections filters work
- [ ] Explore filters work
- [ ] Notes filters work
- [ ] Can combine filters
- [ ] Can clear filters

### **Week 7-8: Collaboration**
- [ ] Can view collaborators
- [ ] Can invite collaborators
- [ ] Can remove collaborators (owner)
- [ ] Role badges display correctly

### **Week 9: Activity Feed**
- [ ] Activity feed displays
- [ ] Can filter by type
- [ ] Timestamps are correct
- [ ] Date grouping works

### **Week 10: PDF Viewer**
- [ ] PDF viewer opens
- [ ] Can navigate pages
- [ ] Can zoom in/out
- [ ] Can close viewer

### **Week 11: PDF Annotations**
- [ ] Can highlight text
- [ ] Can create annotations
- [ ] Annotations sidebar works
- [ ] Can edit/delete annotations

### **Week 12: UI Enhancements**
- [ ] Quick Actions work
- [ ] Seed paper displays correctly
- [ ] View modes work (Grid/List)
- [ ] Search and filters enhanced
- [ ] Progress tracking visible

---

## 🐛 KNOWN ISSUES

1. **Delete Annotation:** May return 405 error (endpoint not implemented)
2. **Change Collaborator Role:** May show "Not implemented"
3. **PDF Not Available:** Some papers don't have open access PDFs
4. **Email Notifications:** Not configured (SendGrid required)
5. **Real-time Updates:** Activity feed doesn't update in real-time (requires WebSocket)

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify you're logged in
3. Refresh the page
4. Clear browser cache
5. Try a different browser
6. Contact support with:
   - Browser version
   - Steps to reproduce
   - Screenshot of error
   - Console error messages

---

## 🎉 CONCLUSION

This guide covers **8 weeks of development** (Weeks 5-12) with **47 detailed test cases**. Each test includes:
- Clear steps to follow
- Expected outputs
- Where to look for results

**Estimated Testing Time:**
- Quick test (key features): 20-30 minutes
- Comprehensive test (all features): 60-90 minutes
- Deep dive (edge cases): 2-3 hours

**Success Criteria:**
- ✅ 90%+ of tests pass
- ✅ No critical errors
- ✅ All major features functional
- ✅ Good user experience

---

**Happy Testing! 🚀**


