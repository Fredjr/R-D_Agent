# Stable Version Registry

## Current Stable Baseline

**Version**: `stable-baseline-v1.0`  
**Git Commit**: `62ba8d9a914a36f29b6ea9391fb2442b1bccaf7b`  
**Commit Message**: 🧭 Restore navigation functionality  
**Date**: 2025-09-02  
**Status**: ✅ DEPLOYED TO STABLE VERCEL PROJECT

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

## Version History

| Tag | Commit | Date | Description | Status |
|-----|--------|------|-------------|--------|
| `stable-baseline-v1.0` | `62ba8d9` | 2025-09-02 | Navigation functionality restored | ✅ STABLE |

## Notes

- **Stable project**: Never deploy directly to `/r-d-agent` Vercel project
- **Development**: All changes go to staging first
- **Promotion**: Use "Promote Staging to Stable" workflow only
- **Emergency**: Use rollback commands above if staging breaks main
