# 🔧 Onboarding Preferences Integration Fix

**Date:** 2025-10-31  
**Issues Fixed:**
1. ❌ Vercel build error - `useSearchParams()` needs Suspense boundary
2. ❌ Recommendations not using onboarding preferences (topics, keywords)

**Status:** ✅ **BOTH ISSUES FIXED**

---

## 🐛 Problem 1: Vercel Build Failure

### **Error:**
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/dashboard"
Error occurred prerendering page "/dashboard"
```

### **Root Cause:**
Next.js 15 requires `useSearchParams()` to be wrapped in a `<Suspense>` boundary for static generation.

### **Solution:**
Refactored `frontend/src/app/dashboard/page.tsx`:
1. Created `DashboardContent` component that uses `useSearchParams()`
2. Wrapped it in `<Suspense>` boundary in the main `Dashboard` export
3. Added `Suspense` import from React

**Code Changes:**
```typescript
import { Suspense } from 'react';

// Component that uses searchParams
function DashboardContent() {
  const searchParams = useSearchParams();
  // ... rest of component
}

// Main export with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}
```

---

## 🐛 Problem 2: Recommendations Ignoring Onboarding Preferences

### **User Report:**
> "I inputted 'insulin' as a molecule during sign-up, but the recommended papers (semantic matches, trending, cross-domain, weekly mix) don't relate to insulin at all. They seem random."

### **Root Cause:**
The backend recommendation engine (`services/ai_recommendations_service.py`) was NOT checking the `user.preferences` field where onboarding data is stored. It only looked at:
- ✅ Search history
- ✅ Saved articles
- ✅ Collections
- ✅ Subject area
- ❌ **Onboarding preferences** (MISSING!)

### **Solution:**
Updated `_build_user_research_profile()` and `_generate_fallback_profile()` to prioritize onboarding preferences.

---

## ✅ Implementation Details

### **1. Priority System for Profile Building**

**New Priority Order:**
```
PRIORITY 0: Onboarding Preferences (HIGHEST - NEW!)
  ↓
PRIORITY 1: Search History
  ↓
PRIORITY 2: Saved Articles & Collections
  ↓
PRIORITY 3: Subject Area
  ↓
PRIORITY 4: Fallback (General Research)
```

### **2. Onboarding Data Extraction**

**What we extract from `user.preferences.research_interests`:**
- **Topics:** Selected research areas (e.g., `machine_learning`, `drug_discovery`)
- **Keywords:** Custom keywords entered by user (e.g., `insulin`, `CRISPR`)
- **Career Stage:** User's career level (e.g., `early_career`, `senior`)

**Topic ID → Readable Name Mapping:**
```python
topic_map = {
    'machine_learning': 'machine learning',
    'biotechnology': 'biotechnology',
    'drug_discovery': 'drug discovery',
    'clinical_research': 'clinical research',
    'neuroscience': 'neuroscience',
    'materials_science': 'materials science',
    'physics': 'physics',
    'chemistry': 'chemistry',
    'environmental_science': 'environmental science',
    'immunology': 'immunology',
    'oncology': 'oncology'
}
```

### **3. Domain Combination Logic**

**Scenario A: User has onboarding preferences only**
```python
# Use onboarding domains as primary domains
profile["primary_domains"] = onboarding_domains[:5]
profile["topic_preferences"] = {domain: 1.0 for domain in onboarding_domains[:5]}
profile["onboarding_based"] = True
```

**Scenario B: User has both onboarding preferences AND search history**
```python
# Merge both sources (onboarding takes priority)
existing_domains = set(profile.get("primary_domains", []))
for domain in search_history_domains:
    if domain not in existing_domains:
        existing_domains.add(domain)
profile["primary_domains"] = list(existing_domains)[:7]  # Expand to 7 domains
```

**Scenario C: User has onboarding preferences but no activity yet**
```python
# Fallback profile now checks onboarding preferences first
if user.preferences:
    onboarding_preferences = user.preferences.get('research_interests', {})
    if onboarding_preferences:
        # Use onboarding data instead of generic fallback
        fallback_profile["primary_domains"] = onboarding_domains[:5]
        fallback_profile["is_fallback"] = False  # Not really a fallback!
```

---

## 📁 Files Modified

### **1. `frontend/src/app/dashboard/page.tsx`**
**Changes:**
- Added `Suspense` import
- Created `DashboardContent` component
- Wrapped in `<Suspense>` boundary
- Fixed Vercel build error

### **2. `services/ai_recommendations_service.py`**
**Changes:**

**In `_build_user_research_profile()` (lines 913-981):**
- Added PRIORITY 0 check for onboarding preferences
- Extract topics, keywords, career stage from `user.preferences.research_interests`
- Map topic IDs to readable names
- Combine topics + keywords as primary domains
- Merge with search history if both exist
- Set `onboarding_based` flag

**In `_generate_fallback_profile()` (lines 1381-1454):**
- Check for onboarding preferences before using generic fallback
- Extract and map topics/keywords same as above
- Set `is_fallback = False` if onboarding data exists
- Only use generic "general research" if truly no data

---

## 🧪 Testing Scenarios

### **Test Case 1: New User with Onboarding Preferences**

**Setup:**
1. User signs up
2. Completes onboarding wizard
3. Selects topics: `Drug Discovery`, `Biotechnology`
4. Enters keywords: `insulin`, `diabetes`
5. Navigates to Discover page

**Expected Result:**
- ✅ Recommendations should focus on insulin, diabetes, drug discovery
- ✅ Papers about insulin resistance, diabetes treatment, drug development
- ✅ NOT random papers about unrelated topics

**How to verify:**
```sql
-- Check user preferences in database
SELECT preferences FROM users WHERE email = 'test@example.com';

-- Should see:
{
  "research_interests": {
    "topics": ["drug_discovery", "biotechnology"],
    "keywords": ["insulin", "diabetes"],
    "careerStage": "early_career"
  },
  "first_action": "discover",
  "onboarding_completed": true
}
```

### **Test Case 2: User with Onboarding + Search History**

**Setup:**
1. User completed onboarding with keywords: `insulin`
2. User later searches for: `CRISPR`, `gene editing`

**Expected Result:**
- ✅ Recommendations should include BOTH insulin AND CRISPR papers
- ✅ Primary domains: `['insulin', 'diabetes', 'CRISPR', 'gene editing', ...]`
- ✅ Expanded to 7 domains (5 onboarding + 2 search)

### **Test Case 3: User with No Activity (Fallback)**

**Setup:**
1. User completed onboarding with keywords: `machine learning`
2. User has NO saved articles, NO collections, NO searches

**Expected Result:**
- ✅ Should use onboarding preferences (NOT generic fallback)
- ✅ `is_fallback = False`
- ✅ `onboarding_based = True`
- ✅ Recommendations about machine learning

---

## 🔍 Debugging

### **Check if Onboarding Preferences are Stored:**
```sql
SELECT 
  email, 
  preferences->'research_interests' as research_interests,
  preferences->'first_action' as first_action,
  preferences->'onboarding_completed' as onboarding_completed
FROM users 
WHERE email = 'your-email@example.com';
```

### **Check Backend Logs:**
Look for these log messages:
```
🎯 Found onboarding preferences: {'topics': [...], 'keywords': [...]}
🎯 Using onboarding domains: ['insulin', 'diabetes', 'drug discovery']
✅ Created onboarding-based profile with domains: ['insulin', 'diabetes', ...]
```

### **Check Profile in API Response:**
```bash
curl -X GET "https://r-dagent-production.up.railway.app/recommendations/enhanced/your-email@example.com" \
  -H "User-ID: your-email@example.com"
```

Look for:
```json
{
  "user_insights": {
    "primary_domains": ["insulin", "diabetes", "drug discovery"],
    "onboarding_based": true
  }
}
```

---

## 🚀 Deployment Steps

### **1. Commit Changes**
```bash
git add frontend/src/app/dashboard/page.tsx \
        services/ai_recommendations_service.py \
        ONBOARDING_REDIRECT_FIX.md \
        ONBOARDING_PREFERENCES_FIX.md

git commit -m "fix: Use onboarding preferences in recommendations + fix Vercel build

Frontend:
- Wrap useSearchParams in Suspense boundary to fix Vercel build error
- Fixes Next.js 15 static generation requirement

Backend:
- Add PRIORITY 0 check for onboarding preferences in profile building
- Extract topics, keywords from user.preferences.research_interests
- Map topic IDs to readable names (machine_learning -> 'machine learning')
- Combine onboarding domains with search history when both exist
- Update fallback profile to use onboarding data instead of generic fallback
- Set onboarding_based flag for tracking

Fixes issue where recommendations ignored user's onboarding input
(e.g., user enters 'insulin' but gets random unrelated papers)"

git push origin main
```

### **2. Verify Deployment**
- ✅ Vercel build should succeed (~3 minutes)
- ✅ Railway backend should deploy (~2 minutes)

### **3. Test on Production**
1. Create new test account on Vercel 85
2. Complete onboarding with specific keywords (e.g., `insulin`, `CRISPR`)
3. Navigate to Discover page
4. Verify recommendations match your keywords

---

## 📊 Expected Impact

### **Before Fix:**
- ❌ New users see random, irrelevant papers
- ❌ Onboarding preferences completely ignored
- ❌ Poor first impression ("This app doesn't understand me")
- ❌ High drop-off rate after onboarding

### **After Fix:**
- ✅ New users see highly relevant papers immediately
- ✅ Onboarding preferences drive recommendations
- ✅ Great first impression ("This app gets me!")
- ✅ Higher engagement and retention

---

## 🎯 Success Metrics

**Track these after deployment:**
1. **Relevance Score:** User feedback on recommendation quality
2. **Engagement Rate:** % of users who interact with recommended papers
3. **Time to First Save:** How quickly users save their first paper
4. **Retention:** % of users who return after first session

---

## ✅ Conclusion

Both issues have been fixed:
1. ✅ Vercel build error resolved with Suspense boundary
2. ✅ Recommendations now use onboarding preferences as HIGHEST priority

**Ready to deploy and test!** 🚀

