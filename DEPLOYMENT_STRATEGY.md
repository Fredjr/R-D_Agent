# Deployment Strategy

## Overview
This project uses a **stable + staging** deployment strategy to ensure beta testers always have access to a working version while allowing continuous development.

## Deployment Environments

### 🟢 **Stable (Production)**
- **URL**: https://vercel.com/fredericle77-gmailcoms-projects/r-d-agent/deployments
- **Trigger**: Manual promotion via GitHub Actions
- **Purpose**: Stable version for beta testers
- **Workflow**: `.github/workflows/frontend-vercel.yml` (renamed to "Vercel Stable")

### 🟡 **Staging (Development)**
- **Trigger**: Automatic on every push to `main` branch
- **Purpose**: Testing new features before promotion to stable
- **Workflow**: `.github/workflows/frontend-vercel-staging.yml`

### 🔵 **GCP Cloud Run**
- **Trigger**: Automatic on every push to `main` branch
- **Purpose**: Backend services and alternative frontend hosting
- **Workflows**: `backend-gcp.yml`, `frontend-gcp.yml`

## Required Secrets

Add these to your GitHub repository secrets:

```
VERCEL_PROJECT_ID_STAGING  # New staging project ID (to be created)
```

Existing secrets (keep unchanged):
```
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID          # Your current stable project
BACKEND_PUBLIC_URL
```

## Workflow Process

1. **Development**: Push code to `main` branch
2. **Auto-staging**: Code automatically deploys to staging Vercel project
3. **Testing**: Test the staging deployment
4. **Promotion**: Manually run "Promote Staging to Stable" workflow when ready
5. **Stable**: Beta testers continue using the stable URL

## Manual Promotion Steps

1. Go to GitHub Actions
2. Run "Promote Staging to Stable" workflow
3. Type "promote" to confirm
4. Stable project gets updated with latest tested code
5. A git tag is created for tracking stable releases

## Benefits

- ✅ **Stable URL**: Beta testers always have a working version
- ✅ **Continuous Testing**: Every commit gets deployed to staging
- ✅ **Controlled Releases**: Manual promotion prevents broken deployments
- ✅ **Rollback Capability**: Can easily revert to previous stable versions
- ✅ **Release Tracking**: Git tags mark each stable promotion
