# Vercel Manual Setup and Configuration Guide

## Step 1: Access Your Vercel Project

1. Go to https://vercel.com/dashboard
2. Sign in with your GitHub account (Fredjr)
3. Find your R-D_Agent project in the dashboard

## Step 2: Verify Environment Variables

### Navigate to Environment Variables
1. Click on your project
2. Go to **Settings** tab
3. Click on **Environment Variables** in the left sidebar

### Required Variables for Production

Add/verify these environment variables:

#### NEXT_PUBLIC_BACKEND_URL
- **Name**: `NEXT_PUBLIC_BACKEND_URL`
- **Value**: `https://r-dagent-production.up.railway.app`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Why**: This is the backend API URL that the frontend uses for all API calls

#### PROXY_TIMEOUT_MS (Optional)
- **Name**: `PROXY_TIMEOUT_MS`
- **Value**: `30000`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Why**: Sets timeout for API proxy requests (30 seconds)

### How to Add/Edit Variables

1. Click **Add New** button
2. Enter the variable name
3. Enter the value
4. Select which environments (Production, Preview, Development)
5. Click **Save**

**IMPORTANT**: After adding/changing environment variables, you MUST redeploy!

## Step 3: Trigger a Fresh Deployment

### Option A: Automatic (if GitHub integration is set up)
The push we just made should automatically trigger a deployment.

### Option B: Manual Redeploy
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **...** (three dots menu)
4. Click **Redeploy**
5. **IMPORTANT**: Uncheck "Use existing Build Cache"
6. Click **Redeploy** button

### Option C: Using Vercel CLI (if linked)
```bash
cd frontend
vercel --prod
```

## Step 4: Monitor the Deployment

### Watch Build Progress
1. Go to **Deployments** tab
2. Click on the deployment that's in progress
3. Watch the build logs in real-time

### Look for These Success Indicators
- ✅ "Installing dependencies..."
- ✅ "Building..."
- ✅ "Compiled successfully"
- ✅ "Deployment Ready"

### Look for These Error Indicators
- ❌ TypeScript errors
- ❌ Import errors (especially `DeletableCollectionCard`)
- ❌ Build failures
- ❌ Missing environment variables warnings

## Step 5: Verify the Deployment

### Once Deployment is Complete

1. **Get the Production URL**
   - It should be something like: `https://your-project.vercel.app`
   - Or your custom domain if configured

2. **Test the Collections Page**
   - Navigate to: `https://your-project.vercel.app/collections`
   - Check if the page loads without errors

3. **Open Browser Console** (F12)
   - Look for any errors
   - Check network tab for API calls

4. **Test Hypothesis Badges**
   - Look for collections with linked hypotheses
   - Verify purple badges appear
   - Hover over badges to see full text

## Step 6: Troubleshooting

### If Build Fails

#### Error: "Export DeletableCollectionCard doesn't exist"
- **Cause**: Old build cache
- **Fix**: Redeploy with "Use existing Build Cache" UNCHECKED

#### Error: "Module not found"
- **Cause**: Missing dependencies or wrong import paths
- **Fix**: Check that all imports use `@/` alias correctly

#### Error: "Environment variable not defined"
- **Cause**: Missing `NEXT_PUBLIC_BACKEND_URL`
- **Fix**: Add the environment variable and redeploy

### If Build Succeeds But Badges Don't Appear

#### Check 1: Environment Variables
```javascript
// In browser console, run:
console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
// Should output: "https://r-dagent-production.up.railway.app"
```

#### Check 2: API Calls
```javascript
// In browser console, check Network tab
// Look for calls to: /api/proxy/hypotheses/project/{projectId}
// Should return 200 OK with hypothesis data
```

#### Check 3: Component Rendering
```javascript
// In browser console, run:
document.querySelectorAll('[title*="hypothesis"]').length
// Should be > 0 if there are linked hypotheses
```

### If Everything Fails

#### Nuclear Option: Clear Everything and Redeploy
1. Go to **Settings** → **General**
2. Scroll to **Danger Zone**
3. Click **Clear Build Cache**
4. Go back to **Deployments**
5. Redeploy the latest commit

## Step 7: Link Local Project to Vercel (Optional)

If you want to deploy from your local machine:

```bash
cd /Users/fredericle/RD_Agent_XCode/R-D_Agent/frontend
vercel link
# Follow the prompts to link to your existing project
```

Then you can deploy with:
```bash
vercel --prod
```

## Quick Reference: Vercel CLI Commands

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local

# List environment variables
vercel env ls
```

## Expected Timeline

- **Build Time**: 2-5 minutes
- **Deployment Time**: 30-60 seconds
- **Total**: ~3-6 minutes from push to live

## Success Criteria

✅ Build completes without errors
✅ Deployment shows "Ready" status
✅ Production URL loads successfully
✅ Collections page displays correctly
✅ Hypothesis badges appear on collections with linked hypotheses
✅ No console errors in browser
✅ API calls to backend succeed (200 OK)

## Need Help?

If you encounter issues:
1. Share the Vercel build logs
2. Share the browser console errors
3. Share the production URL
4. I can help debug further!

