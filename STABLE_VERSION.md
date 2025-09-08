# Stable Version Registry

## Current Stable Baseline

**Version**: `v2.1-stable-pre-realtime`  
**Git Commit**: `02f114d`  
**Commit Message**: 🔧 Fix NameError: name 'Any' is not defined in ProjectCreate model  
**Date**: 2025-09-08  
**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

### Features Included
- ✅ Complete Project Workspace functionality
- ✅ Full Collaboration Tools (basic version)
- ✅ Database schema with Projects, Collaborators, Annotations
- ✅ All API endpoints for project management
- ✅ Frontend dashboard and project workspace pages
- ✅ User authentication and authorization
- ✅ Backend deployment fixes and optimizations

### Deployment Status
- **Stable Vercel**: `/r-d-agent` project (FROZEN) ✅
- **Staging Vercel**: New staging project (auto-deploys) 🚀
- **Backend GCP**: Cloud Run deployment ✅
- **Frontend GCP**: Cloud Run deployment ✅

### What's Protected
This version is now the **golden baseline** for:
- ✅ All backend functionality 
- ✅ All frontend features
- ✅ Navigation system
- ✅ Beta tester experience

## Quick Rollback Commands

### Emergency Rollback to Stable Baseline

```bash
# 1. Checkout stable version
git checkout stable-baseline-v1.0

# 2. Create emergency rollback branch
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M%S)

# 3. Force push to main (EMERGENCY ONLY)
git push origin HEAD:main --force
```

### Safe Rollback (Recommended)

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
