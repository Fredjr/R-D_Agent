# 📍 "Read PDF" Button Locations - Complete Guide

## ✅ **ALL LOCATIONS WHERE YOU CAN VIEW PDFs**

The "Read PDF" button is now available in **4 key locations** across the app:

---

## 1️⃣ **Search Page** (`/search`)

**When:** After searching for papers from the Home page

**Location:** In each article card in the search results

**Button:** Purple "Read PDF" button with document icon

**How to access:**
1. Go to Home page
2. Search for a paper (e.g., "39361594" or "cancer immunotherapy")
3. View search results
4. Click **"Read PDF"** button on any article

**Screenshot location:** Top of article card, next to "Add to Project" and "Deep Dive" buttons

---

## 2️⃣ **Collections Page** (`/collections`)

**When:** Viewing articles saved in your collections

**Location:** In each article card within a collection

**Button:** Purple "Read PDF" button with document icon

**How to access:**
1. Go to Collections page (My Collections tab)
2. Click on any collection to view its articles
3. Each article shows a **"Read PDF"** button below the article details

**Screenshot location:** Below article metadata, before the "Click to Explore" badge

---

## 3️⃣ **Network View Sidebar**

**When:** Clicking on any paper node in the network graph

**Location:** In the sidebar that appears when you click a node

**Button:** Purple "📄 Read PDF" button (full width)

**How to access:**
1. Go to any project
2. Click "Explore Papers" tab
3. Search for a paper and view its network
4. Click on any node in the network graph
5. Sidebar opens on the right
6. Scroll down to find **"📄 Read PDF"** button (below Smart Actions)

**Screenshot location:** Below the "Smart Actions" section (Review, Deep Dive, Cluster buttons)

---

## 4️⃣ **Explore Papers Tab** (Project View)

**When:** Searching for papers within a project

**Location:** In each article card in the PubMed search results

**Button:** Purple document icon button (icon only)

**How to access:**
1. Go to any project
2. Click "Explore Papers" tab
3. Search for papers using the search bar
4. Each result shows a document icon button in the top-right corner

**Screenshot location:** Top-right corner of article card, next to bookmark and PubMed link icons

---

## 🎨 **Button Styling**

All "Read PDF" buttons use consistent styling:
- **Color:** Purple (`purple-100` background, `purple-700` text)
- **Icon:** DocumentTextIcon from Heroicons
- **Hover:** Darker purple background (`purple-200`)
- **Size:** Small to medium, depending on location

---

## 🔧 **Technical Details**

### **PDF Viewer Features:**
- Opens in full-screen modal overlay
- Supports PDF retrieval from multiple sources (PubMed Central, Unpaywall, Europe PMC)
- Includes highlight tool (toggle with pencil icon or Cmd/Ctrl+H)
- Zoom controls (zoom in/out buttons)
- Page navigation (previous/next page)
- Close button (X in top-right)

### **Highlight Functionality:**
- Only available when `projectId` is provided
- Highlights are saved to the backend
- Highlights persist across sessions
- Highlights scale with zoom level

### **Where projectId is available:**
- ✅ Collections page (highlights work)
- ✅ Network View Sidebar (highlights work)
- ✅ Explore Papers Tab (highlights work)
- ❌ Search page (no projectId, highlights disabled)

---

## 📋 **Testing Checklist**

Use this checklist to verify the "Read PDF" button works in all locations:

### **1. Search Page**
- [ ] Navigate to `/search`
- [ ] Search for "39361594"
- [ ] Click "Read PDF" button
- [ ] PDF viewer opens
- [ ] Can close PDF viewer

### **2. Collections Page**
- [ ] Navigate to `/collections`
- [ ] Click on a collection
- [ ] Click "Read PDF" button on an article
- [ ] PDF viewer opens with highlight tool
- [ ] Can create highlights
- [ ] Highlights persist after closing and reopening

### **3. Network View Sidebar**
- [ ] Navigate to a project
- [ ] Click "Explore Papers" tab
- [ ] Search for a paper
- [ ] Click on a node in the network
- [ ] Sidebar opens
- [ ] Click "📄 Read PDF" button
- [ ] PDF viewer opens with highlight tool

### **4. Explore Papers Tab**
- [ ] Navigate to a project
- [ ] Click "Explore Papers" tab
- [ ] Search for papers
- [ ] Click document icon button on an article
- [ ] PDF viewer opens with highlight tool

---

## 🐛 **Troubleshooting**

### **"Read PDF" button not visible:**
- Check if the article has a PMID (button only shows for articles with PMIDs)
- Refresh the page
- Check browser console for errors

### **PDF viewer not opening:**
- Check browser console for errors
- Verify the PMID is valid
- Try a different article

### **Highlights not working:**
- Verify you're in a location with projectId (Collections, Network View, Explore Tab)
- Check if highlight mode is enabled (pencil icon should be highlighted)
- Verify you're selecting text within the PDF text layer

### **PDF not loading:**
- The PDF may not be available from any source
- Check the console for "No PDF available" message
- Try viewing the article on PubMed directly

---

## 📊 **Summary**

| Location | Button Style | Highlights | ProjectId |
|----------|-------------|------------|-----------|
| Search Page | Text + Icon | ❌ No | ❌ No |
| Collections | Text + Icon | ✅ Yes | ✅ Yes |
| Network Sidebar | Text + Icon | ✅ Yes | ✅ Yes |
| Explore Tab | Icon Only | ✅ Yes | ✅ Yes |

---

## 🚀 **Next Steps**

Now that the "Read PDF" button is available everywhere, you can:

1. **Test all locations** using the checklist above
2. **Create highlights** in your saved papers
3. **Report any issues** you encounter
4. **Proceed to Day 3** - Annotations Sidebar (once Day 2 is confirmed working)

---

**Last Updated:** 2025-11-02
**Commit:** `5b187aa` - Add 'Read PDF' button to all paper views

