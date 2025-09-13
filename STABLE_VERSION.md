# Stable Version Registry

## Current Stable Baseline

**Version**: `v1.0.0`  
**Git Commit**: `ffc6170`  
**Commit Message**: Fix: Handle username conflicts in registration completion  
**Date**: 2025-09-13  
**Status**: ✅ STABLE VERSION DEPLOYED

### Key Features
- ✅ User Authentication & Registration
- ✅ Project Management
- ✅ Report Generation
- ✅ Deep Dive Analysis
- ✅ Summary Reports
- ✅ Real-time Collaboration
- ✅ Email Notifications

### Deployment Status
- **Frontend (Vercel Staging)**: [frontend-psi-seven-85.vercel.app](https://frontend-psi-seven-85.vercel.app) ✅
- **Backend (Railway)**: [r-dagent-production.up.railway.app](https://r-dagent-production.up.railway.app) ✅
- **GitHub Tag**: `stable-v1.0.0-ffc6170`
- **Frontend Project**: `frontend` (Vercel)
- **Backend Service**: Railway

### What's Protected
This version is now the **golden baseline** for:
- ✅ All backend functionality 
- ✅ All frontend features
- ✅ Navigation system
- ✅ Beta tester experience

## Rollback Procedures

### Quick Rollback to Stable v1.0.0

#### Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select the `frontend` project
3. Navigate to "Deployments"
4. Find deployment with commit `ffc6170`
5. Click "..." → "Redeploy"

#### Backend (Railway)
1. Go to [Railway Dashboard](https://railway.app)
2. Select the R&D Agent service
3. Navigate to "Deployments"
4. Find deployment with commit `ffc6170`
5. Click "Redeploy"

### Git Rollback (Development)

```bash
# 1. Fetch latest tags
git fetch --all --tags

# 2. Checkout stable version
git checkout stable-v1.0.0-ffc6170

# 3. Create rollback branch
git checkout -b hotfix/rollback-to-stable-$(date +%Y%m%d)

# 4. Push rollback branch
git push -u origin hotfix/rollback-to-stable-$(date +%Y%m%d)
```

### Emergency Rollback (Force Push)
```bash
# 1. Create rollback branch from stable
git checkout stable-baseline-v1.0
git checkout -b rollback-to-stable

# 2. Push rollback branch
git push origin rollback-to-stable

# 3. Create PR to merge rollback into main
# Then merge via GitHub UI
```

## Quick Rollback Commands

### Emergency Rollback to Current Stable
```bash
# 1. Checkout stable version
git checkout v2.1-stable-pre-realtime

# 2. Create emergency rollback branch
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M%S)

# 3. Force push to main (EMERGENCY ONLY)
git push origin HEAD:main --force
```

### Safe Rollback (Recommended)
```bash
# 1. Create rollback branch from stable
git checkout v2.1-stable-pre-realtime
git checkout -b rollback-to-v2.1-stable

# 2. Push rollback branch
git push origin rollback-to-v2.1-stable

# 3. Create PR to merge rollback into main
# Then merge via GitHub UI
```

## Production Deployment Commands

### Deploy Current Stable to Production
```bash
# 1. Trigger production deployment workflow
gh workflow run promote-to-stable.yml

# OR manually promote specific version
git checkout v2.1-stable-pre-realtime
git tag v2.1-production-$(date +%Y%m%d)
git push origin v2.1-production-$(date +%Y%m%d)
```

## Version History

| Tag | Commit | Date | Description | Status |
|-----|--------|------|-------------|--------|
| `v2.1-stable-pre-realtime` | `02f114d` | 2025-09-08 | Complete project workspace + collaboration tools | ✅ CURRENT STABLE |
| `stable-baseline-v1.0` | `62ba8d9` | 2025-09-02 | Navigation functionality restored | ✅ LEGACY STABLE |

## Notes

- **Stable project**: Never deploy directly to `/r-d-agent` Vercel project
- **Development**: All changes go to staging first
- **Promotion**: Use "Promote Staging to Stable" workflow only
- **Emergency**: Use rollback commands above if staging breaks main
