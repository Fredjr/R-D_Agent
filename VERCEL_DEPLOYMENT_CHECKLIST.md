# Vercel Deployment Checklist - Week 24 Hypothesis Badges Fix

## Changes Made
- ✅ Fixed import path in `frontend/src/app/collections/page.tsx` (DeletableCard instead of SpotifyCard)
- ✅ Added hypothesis fetching and mapping to `MyCollectionsTab.tsx`
- ✅ Implemented `DeletableCollectionCard` component with hypothesis badges
- ✅ Removed all debug code (red banners, console logs) for production
- ✅ Both standalone Collections page and My Collections Tab now show hypothesis badges

## Commit Information
- **Commit Hash**: d44f113
- **Commit Message**: "Fix collection hypothesis badges - clean production build"
- **Files Changed**: 3 files (80 insertions, 149 deletions)

## Required Vercel Environment Variables

### Production Environment
The following environment variables MUST be set in Vercel Project Settings:

1. **NEXT_PUBLIC_BACKEND_URL**
   - Value: `https://r-dagent-production.up.railway.app`
   - Description: Backend API URL for production
   - Required for: API proxy calls, hypothesis fetching

2. **PROXY_TIMEOUT_MS** (Optional)
   - Value: `30000` (30 seconds)
   - Description: Timeout for proxy requests
   - Default: 30000ms if not set

### How to Set Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project (R-D_Agent or similar)
3. Go to **Settings** → **Environment Variables**
4. Add/verify the variables above
5. Make sure they are set for **Production** environment

## Deployment Trigger

Push to main branch will automatically trigger Vercel deployment:
```bash
git push origin main
```

## Post-Deployment Verification

After deployment completes, verify:

1. **Build Success**
   - Check Vercel dashboard for successful build
   - No TypeScript errors
   - No import errors

2. **Hypothesis Badges Rendering**
   - Navigate to Collections page
   - Check that collections with linked hypotheses show purple badges
   - Verify badge text is truncated properly (40 chars max)
   - Check "+X more" badge appears when >2 hypotheses

3. **API Connectivity**
   - Open browser console
   - Check for successful API calls to `/api/proxy/hypotheses/project/{projectId}`
   - Verify no CORS errors
   - Verify no 404 or 500 errors

4. **Both Collection Views**
   - Test standalone Collections page (`/collections`)
   - Test My Collections Tab in project view (`/project/{id}`)
   - Both should show hypothesis badges

## Troubleshooting

### If badges don't appear:

1. **Check Environment Variables**
   - Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
   - Redeploy if variables were just added

2. **Check Build Logs**
   - Look for import errors
   - Look for TypeScript compilation errors

3. **Check Browser Console**
   - Look for API errors
   - Look for component rendering errors

4. **Force Clear Cache**
   - In Vercel dashboard, go to Deployments
   - Click on latest deployment
   - Click "Redeploy" → "Use existing Build Cache: OFF"

### If build fails:

1. **Check for missing dependencies**
   - All dependencies should be in `frontend/package.json`
   
2. **Check TypeScript errors**
   - Run `cd frontend && npm run build` locally
   - Fix any errors before pushing

3. **Check import paths**
   - All imports should use `@/` alias
   - No relative imports outside of component directory

## Expected Behavior After Deployment

### Collections with Linked Hypotheses
- Show purple badges with hypothesis text
- Maximum 2 badges visible
- "+X more" badge if >2 hypotheses
- Badges are clickable/hoverable with full text in tooltip

### Collections without Linked Hypotheses
- No badges shown
- Normal collection card display

## Rollback Plan

If deployment fails or causes issues:

```bash
# Revert to previous commit
git revert d44f113
git push origin main
```

Or in Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

