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

## Current Status: ✅ SUCCESS - Railway Deployment Fully Operational

The R&D Agent backend has been successfully deployed to Railway platform after resolving multiple deployment and database connectivity issues.

### ✅ Successful Railway Deployment:
- **Backend URL**: https://r-dagent-production.up.railway.app
- **Database**: SQLite fallback (PostgreSQL connection fails due to network issues)
- **All Core Endpoints**: Fully functional (/, /test, /projects GET/POST, /debug/database)
- **Frontend Integration**: Updated to use Railway backend URL

### Key Issues Resolved:
1. **Environment Variable Configuration**: Fixed SUPABASE_DATABASE_URL format
2. **Database Fallback Mechanism**: Enhanced with immediate connection testing
3. **SQLAlchemy Compatibility**: Fixed text() function usage for queries
4. **Error Handling**: Comprehensive error handling throughout application
5. **Frontend Integration**: All API proxy routes updated to Railway URL

### Deployment Platforms Status:
- ❌ **Google Cloud Run**: Environment variable injection failure (abandoned)
- ✅ **Railway**: Production-ready deployment with SQLite fallback

## CRITICAL ISSUE: Cloud Run Infrastructure Failure

**Status**: The current Cloud Run staging deployment (`rd-agent-staging`) has a fundamental infrastructure issue that prevents ANY HTTP requests from reaching the application container, despite successful container startup.

### Evidence of Infrastructure Problem
- ✅ Application starts successfully (logs show "Application startup complete")
- ✅ Database connects and initializes properly (Supabase connection working)
- ✅ Container runs without errors
- ❌ ALL HTTP endpoints return 502 Bad Gateway
- ❌ Even minimal `/test` endpoint fails with "Invalid HTTP request received"

### Failed Resolution Attempts
1. Environment variable injection fixes (multiple approaches)
2. Database troubleshooting (SQLite → PostgreSQL → Supabase)
3. Application code fixes (Pydantic models, error handling)
4. Traffic routing and revision management
5. Service deletion/recreation (nuclear option)
6. Alternative service names (rd-agent-staging-v2)
7. Minimal endpoint testing

## Alternative Deployment Strategies

### Option 1: Different Cloud Run Region
Deploy to a different GCP region to rule out regional infrastructure issues:
```bash
gcloud run deploy rd-agent-staging-alt \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

### Option 2: Google Cloud Functions
Migrate to Cloud Functions for simpler HTTP handling:
```bash
gcloud functions deploy rd-agent-function \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated
```

### Option 3: Google App Engine
Deploy to App Engine as alternative platform:
```yaml
# app.yaml
runtime: python311
service: rd-agent-staging
```

### Option 4: Alternative Cloud Provider
Consider deploying to:
- **Railway**: Simple Python deployment
- **Render**: Docker-based deployment
- **Fly.io**: Global edge deployment
- **AWS Lambda**: Serverless alternative

### Option 5: Fresh GCP Project
Create entirely new GCP project to rule out project-level configuration issues.

## Current Working Configuration

### Backend (BROKEN - Cloud Run)
- **Staging**: `https://rd-agent-staging-537209831678.us-central1.run.app` (502 errors)
- **Database**: Supabase PostgreSQL (working with hardcoded connection)
- **Container**: Starts successfully, HTTP layer broken

### Frontend (Vercel - Working)
- **Staging**: `https://r-d-agent-staging.vercel.app`
- **Production**: `https://r-d-agent.vercel.app`

## Immediate Action Plan

1. **Try Alternative Platform**: Deploy to Railway/Render for immediate staging environment
2. **Google Cloud Support**: Open support ticket for Cloud Run infrastructure investigation
3. **Document Workaround**: Use alternative platform until Cloud Run issue resolved
4. **Monitor**: Set up health checks on alternative deployment

## Environment Variables (Working)

### Backend
- `SUPABASE_DATABASE_URL`: Working with hardcoded connection
- `PINECONE_API_KEY`: Vector database API key
- `PINECONE_INDEX`: Vector database index name
- `PINECONE_HOST`: Vector database host
- `GOOGLE_GENAI_API_KEY`: Google AI API key
- `ALLOW_ORIGIN_REGEX`: CORS configuration

### Frontend
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL (needs update for new platform)
- `VERCEL_TOKEN`: Deployment token
- `VERCEL_ORG_ID`: Organization ID
- `VERCEL_PROJECT_ID`: Project ID

## Database Schema (Working)

### Tables
1. **users**
   - `user_id` (Primary Key)
   - `username`
   - `email`
   - `created_at`
   - `updated_at`

2. **projects**
   - `project_id` (Primary Key)
   - `project_name`
   - `description`
   - `owner_user_id` (Foreign Key to users)
   - `created_at`
   - `updated_at`

## Next Steps

1. **URGENT**: Deploy to alternative platform (Railway recommended)
2. **Medium**: Investigate Cloud Run with Google Support
3. **Long-term**: Migrate back to Cloud Run once infrastructure issue resolved

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
