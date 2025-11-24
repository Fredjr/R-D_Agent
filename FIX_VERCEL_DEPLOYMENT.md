# Fix Vercel Deployment - Root Directory Issue

## 🔴 Problem
All Vercel deployments are failing with errors because Vercel is trying to build from the **root directory** instead of the **frontend directory**.

**Current Setup:**
- Repository: `Fredjr/R-D_Agent`
- Next.js app location: `frontend/` subdirectory
- Vercel project: `fredericle77-gmailcoms-projects/frontend`
- **Issue:** Vercel is building from root, not from `frontend/`

---

## ✅ Solution

You need to configure Vercel to use the `frontend` directory as the **Root Directory**.

### **Option 1: Fix via Vercel Dashboard (RECOMMENDED)**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/fredjrs-projects/frontend/settings

2. **Navigate to Settings → General**

3. **Find "Root Directory" setting**
   - Current value: `.` (root)
   - **Change to:** `frontend`

4. **Click "Save"**

5. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

---

### **Option 2: Fix via Vercel CLI**

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd /Users/fredericle/RD_Agent_XCode/R-D_Agent
vercel link

# Deploy from frontend directory
cd frontend
vercel --prod
```

---

### **Option 3: Update vercel.json in Root**

Update the root `vercel.json` to specify the correct directory:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "rootDirectory": "frontend"
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "FIX: Set Vercel root directory to frontend"
git push origin main
```

---

## 🔍 How to Verify

After applying the fix:

1. **Check Vercel Deployment:**
   - Go to https://vercel.com/fredjrs-projects/frontend/deployments
   - Latest deployment should show "Building..." then "Ready"
   - Status should be green ✅

2. **Check Build Logs:**
   - Click on the deployment
   - Check "Building" logs
   - Should see: "Detected Next.js"
   - Should NOT see errors about missing package.json

3. **Test the Site:**
   - Go to https://r-d-agent-frontend.vercel.app/collections
   - Should load without errors
   - Should see hypothesis badges on collection cards

---

## 📊 Expected Results

**Before Fix:**
- ❌ All deployments failing with errors
- ❌ Build can't find Next.js app
- ❌ Missing package.json errors

**After Fix:**
- ✅ Deployments succeed
- ✅ Build finds Next.js app in frontend/
- ✅ Site loads correctly
- ✅ Hypothesis badges appear on collection cards

---

## 🚀 Quick Fix Steps

**FASTEST METHOD - Use Vercel Dashboard:**

1. Go to: https://vercel.com/fredjrs-projects/frontend/settings/general
2. Scroll to "Root Directory"
3. Change from `.` to `frontend`
4. Click "Save"
5. Go to Deployments tab
6. Click "Redeploy" on latest deployment
7. Wait 2-3 minutes
8. Check https://r-d-agent-frontend.vercel.app/collections

---

## 🆘 If Still Failing

If deployments still fail after setting root directory:

1. **Check Build Logs** for specific errors
2. **Verify Node.js version** (should be 18.x or 20.x)
3. **Check Environment Variables** are set correctly
4. **Try manual deployment:**
   ```bash
   cd frontend
   vercel --prod
   ```

---

**Let me know which option you want to try, or I can help you deploy manually!**

