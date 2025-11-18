# 🚀 Week 4 Test Suite - Quick Start Guide

## ⚡ 60-Second Setup

### Step 1: Wait for Vercel Deployment ✅
Your code is already pushed. Wait for Vercel to deploy.

### Step 2: Find Your User ID 🔍
**IMPORTANT**: The test needs a real User ID from your database.

**Option A: Use Helper Script**
1. Open browser console (F12)
2. Copy and paste `FIND_USER_ID.js`
3. Press Enter
4. Copy the User ID displayed

**Option B: Manual Check**
1. Open browser console (F12)
2. Type: `localStorage.getItem('user')` or `localStorage.getItem('userId')`
3. Copy the User ID value

**Option C: Check Profile**
1. Go to your profile page
2. Look for your User ID
3. Copy it

### Step 3: Open Your Project Page 🌐
Navigate to: `https://your-app.vercel.app/project/{projectId}`

### Step 4: Open Browser Console 🔧
Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)

### Step 5: Run the Test 🧪
1. Open `WEEK4_EVIDENCE_LINKING_TEST.js`
2. Copy **ALL** lines
3. Paste into console
4. Press `Enter`
5. **If prompted**, enter your User ID from Step 2

### Step 6: Watch the Magic ✨
The test suite will:
- Auto-detect your User ID (or prompt for it)
- Create a test question
- Link 3 evidence items (supports, contradicts, neutral)
- Test all UI components
- Test all user interactions
- Test error handling
- Test edge cases
- Clean up after itself

**Time to complete**: ~30-60 seconds

---

## 📊 What You'll See

### Beautiful Color-Coded Output

```
╔════════════════════════════════════════════════════════════════╗
║  WEEK 4: EVIDENCE LINKING UI - COMPREHENSIVE TEST SUITE       ║
╚════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════
SECTION 1: BACKEND API ENDPOINT TESTS
═══════════════════════════════════════════════════════════════════

🧪 TEST: 1.1: Create Test Question
  ✅ PASS: Question created with ID: abc-123
  ℹ️  INFO: Question text: "Test Question for Evidence Linking"

🧪 TEST: 1.2: Link Evidence to Question (Supports)
  ✅ PASS: Evidence linked successfully with ID: xyz-789
  ℹ️  INFO: PMID: 12345678, Type: supports, Score: 9

... (31 more tests)

═══════════════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════════════

✅ PASSED:  30
❌ FAILED:  1
⚠️  SKIPPED: 2
📊 TOTAL:   33

🎯 PASS RATE: 90.9%

🎉 EXCELLENT! Week 4 Evidence Linking is working great!
```

---

## 🎯 Success Criteria

| Pass Rate | Status | Action |
|-----------|--------|--------|
| **≥ 85%** | ✅ **Production Ready** | Move to Week 5 |
| **70-84%** | 👍 **Good** | Fix minor issues |
| **50-69%** | ⚠️ **Needs Work** | Fix several issues |
| **< 50%** | ❌ **Critical** | Major fixes needed |

---

## 🔍 Quick Troubleshooting

### "Not on a project page" Error
**Fix**: Navigate to `/project/{projectId}` first

### "User ID not found" Error
**Fix**: Run `FIND_USER_ID.js` helper script to find your User ID

### Foreign Key Violation Error
```
Key (created_by)=(test-user-123) is not present in table "users"
```
**Fix**: You're using an invalid User ID. Use a real User ID from your database (see Step 2 above)

### Backend API Errors (404, 500)
**Fix**:
- Check backend is running on Railway
- Verify you're using a valid User ID
- Check Railway logs for detailed errors

### Modal Not Opening
**Fix**: Check React errors in console

### Many Tests Skipped
**Fix**: Earlier tests failed - fix those first (usually the "Create Test Question" test)

---

## 📝 What Gets Tested (The Essentials)

✅ **Backend**: All 4 evidence API endpoints  
✅ **Frontend**: All UI components render  
✅ **Interactions**: All buttons and inputs work  
✅ **Errors**: All error scenarios handled  
✅ **Edge Cases**: XSS, Unicode, stress tests  

---

## 🎉 That's It!

**3 files created:**
1. `WEEK4_EVIDENCE_LINKING_TEST.js` - The test suite (run this)
2. `WEEK4_TEST_README.md` - Full documentation
3. `WEEK4_COMPREHENSIVE_TEST_SUMMARY.md` - Detailed overview

**Total test coverage:** 33 comprehensive tests  
**Time to run:** ~30-60 seconds  
**Confidence level:** 💯

---

## 🚀 Next Steps

### If Pass Rate ≥ 85%
✅ Week 4 is complete!  
🎯 Move to Week 5: Hypotheses Tab UI

### If Pass Rate < 85%
🔧 Fix failing tests  
🔄 Re-run test suite  
✅ Repeat until ≥ 85%

---

**Ready? Let's test this thing!** 🚀

