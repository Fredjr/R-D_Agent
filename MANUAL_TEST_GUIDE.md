# 🧪 Manual Test Guide - Debug Question Creation

## 🎯 Objective
Manually test question creation to identify where the failure occurs.

---

## 📋 **Test 1: Create Question with Network Monitor**

### **Step 1: Install Network Monitor**
```javascript
// Copy/paste NETWORK_MONITOR_SCRIPT.js into console
// This will log all API calls
```

### **Step 2: Create a Question Manually**
1. Click "Add Question" button
2. Fill in: "Manual Test Question 1"
3. Click "Save"
4. **Watch the console output**

### **Step 3: Check Console Output**

#### **Expected Success Output:**
```
🌐 API CALL: POST /api/proxy/questions
   📋 Headers:
      Content-Type: application/json
      User-ID: fredericle75019@gmail.com
   📦 Request Body:
      {
        project_id: "804494b5-69e0-4b9a-9c7b-f7fb2bddef64",
        question_text: "Manual Test Question 1",
        question_type: "main",
        ...
      }
   📊 Response Status: 201 Created
   ✅ Response Data:
      {
        question_id: "abc-123-...",
        question_text: "Manual Test Question 1",
        ...
      }
```

#### **If You See This - SUCCESS!**
- ✅ API call succeeded
- ✅ Question was created in database
- ❌ BUT UI didn't refresh

**This means**: Frontend state management issue

---

#### **Possible Failure Scenarios:**

**Scenario A: 400 Bad Request**
```
❌ ERROR: 400 Bad Request
Response: { detail: "Validation error" }
```
**Cause**: Request body format is wrong
**Fix**: Check what fields are being sent

---

**Scenario B: 404 Not Found**
```
❌ ERROR: 404 Not Found
Response: { detail: "Project not found" }
```
**Cause**: Project ID is invalid or doesn't exist
**Fix**: Verify project ID in URL matches database

---

**Scenario C: 500 Internal Server Error**
```
❌ ERROR: 500 Internal Server Error
Response: { detail: "Database error: ..." }
```
**Cause**: Backend database issue
**Fix**: Check Railway logs for backend errors

---

**Scenario D: No API Call at All**
```
(No network activity logged)
```
**Cause**: Form submission not triggering API call
**Fix**: Check frontend form handler

---

## 📋 **Test 2: Check Network Tab**

### **Step 1: Open Network Tab**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter by "Fetch/XHR"

### **Step 2: Create Question**
1. Click "Add Question"
2. Fill form
3. Click "Save"
4. **Watch Network tab**

### **Step 3: Find the POST Request**
Look for: `POST /api/proxy/questions`

**Click on it and check:**
- **Status Code**: Should be `201 Created`
- **Request Headers**: Should include `User-ID: fredericle75019@gmail.com`
- **Request Payload**: Should have all question fields
- **Response**: Should return the created question with `question_id`

---

## 📋 **Test 3: Check Railway Logs**

### **Step 1: Open Railway Dashboard**
1. Go to Railway.app
2. Open your backend service
3. Go to "Deployments" → "Logs"

### **Step 2: Create Question**
1. In your app, create a question
2. **Immediately check Railway logs**

### **Expected Log Output:**
```
📝 Creating research question for project: 804494b5-69e0-4b9a-9c7b-f7fb2bddef64
✅ Created question: abc-123-...
```

**If you see this**: Backend is working correctly!

**If you see errors**: Backend has issues

---

## 📋 **Test 4: Verify with API Verification Script**

### **After Creating Question:**
```javascript
// Run API_VERIFICATION_SCRIPT.js
```

**Expected Output:**
```
📊 Questions in database: 1
✅ Questions exist in database!
📋 Question List:
   1. "Manual Test Question 1"
      ID: abc-123-...
```

**If question appears in database**: ✅ Backend is working
**If question doesn't appear**: ❌ Backend issue

---

## 🎯 **Decision Tree**

```
Did API call happen?
├─ NO → Frontend form handler issue
└─ YES
    ├─ Status 201? 
    │   ├─ YES → Question in database?
    │   │   ├─ YES → UI refresh issue (frontend)
    │   │   └─ NO → Backend not saving (check Railway logs)
    │   └─ NO → Check error response
    │       ├─ 400 → Validation error (check request body)
    │       ├─ 404 → Project not found
    │       └─ 500 → Backend error (check Railway logs)
```

---

## 💡 **Quick Diagnosis Commands**

### **Check if question was created:**
```javascript
// Run in console after creating question
fetch('/api/proxy/questions/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64', {
  headers: { 'User-ID': 'fredericle75019@gmail.com' }
})
.then(r => r.json())
.then(d => console.log('Questions:', d.length, d));
```

### **Check last API call:**
```javascript
// After installing network monitor
console.log('Last API call:', window.apiCallLog[window.apiCallLog.length - 1]);
```

---

## 📊 **Report Back**

After running these tests, please share:

1. **Network Monitor Output**: What did you see when creating a question?
2. **Network Tab Status**: What was the status code?
3. **Railway Logs**: Any errors in backend logs?
4. **API Verification**: How many questions in database?
5. **UI State**: Did question appear in UI?

This will tell us exactly where the issue is!

