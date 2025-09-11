# Google Cloud Cost Optimization Guide

## 🎯 Immediate Cost Reduction Actions

Based on your deployment configuration, here are the **highest impact** actions to reduce GCP costs:

### 1. **Cloud Run Services** (Highest Cost Impact)
Your deployment files show multiple Cloud Run services that could be expensive:

**Current Services Likely Running:**
- `rd-agent-staging` (backend staging)
- `rd-backend-new` (stable backend) 
- Frontend services on Cloud Run

**💰 Cost Reduction:**
```bash
# Scale down staging services to zero when not in use
gcloud run services update rd-agent-staging --region=us-central1 --min-instances=0

# Reduce memory/CPU for development
gcloud run services update SERVICE_NAME --region=REGION --memory=512Mi --cpu=0.5
```

### 2. **Cloud SQL Instances** (Critical - Very Expensive)
Your workflows reference database configurations that suggest Cloud SQL usage:

**⚠️ WARNING:** Cloud SQL instances cost $7-50+ per month even when idle!

**Check for unused instances:**
```bash
gcloud sql instances list
```

**Delete unused instances:**
```bash
gcloud sql instances delete INSTANCE_NAME --quiet
```

### 3. **Artifact Registry Storage**
Your CI/CD pushes container images that accumulate storage costs:

**Current repositories:**
- Backend images: `rd-agent/backend-stable`, `rd-agent/backend-staging`
- Frontend images: `rd-agent/frontend`

**💰 Cost Reduction:**
```bash
# Set up lifecycle policy to delete old images
gcloud artifacts repositories set-cleanup-policy rd-agent \
  --location=us-central1 \
  --policy=policy.json
```

### 4. **Compute Engine Instances**
Check for any forgotten VM instances:

```bash
gcloud compute instances list
# Delete any stopped instances (still billing for disk)
gcloud compute instances delete INSTANCE_NAME --zone=ZONE
```

## 🔧 Quick Setup Instructions

### Step 1: Install gcloud CLI (if not installed)
```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate and set project
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Run the audit script
```bash
./gcp-cost-audit.sh
```

### Step 4: Clean up resources
```bash
./gcp-cleanup-commands.sh
```

## 📊 Cost Monitoring Setup

### Set up billing alerts:
1. Visit: https://console.cloud.google.com/billing/budgets
2. Create budget with $20-50 monthly limit
3. Set alerts at 50%, 90%, 100% spend

### Weekly cost review:
1. Visit: https://console.cloud.google.com/billing
2. Check "Reports" section
3. Filter by service to identify top costs

## 🎯 Expected Savings

| Resource Type | Potential Monthly Savings |
|---------------|---------------------------|
| Unused Cloud SQL | $7-50+ |
| Staging Cloud Run (scaled to 0) | $5-20 |
| Old container images | $1-5 |
| Unused static IPs | $3-10 |
| **Total Potential Savings** | **$16-85+/month** |

## 🚨 High-Priority Actions (Do First)

1. **Check for Cloud SQL instances** - Highest cost impact
2. **Scale staging services to min-instances=0**
3. **Delete old container images**
4. **Set up billing alerts**

## 📋 Deployment-Specific Optimizations

Based on your current setup:

### Current Architecture:
- **Backend**: Railway (primary) + GCP Cloud Run (staging/stable)
- **Frontend**: Vercel (primary) + GCP Cloud Run (backup)
- **Database**: Railway PostgreSQL + GCP Cloud SQL (backup?)

### Optimization Strategy:
1. **Keep Railway as primary** (cost-effective)
2. **Use GCP only for production/staging** 
3. **Scale GCP services to zero when not needed**
4. **Clean up duplicate databases**

Run the audit script to see exactly what resources you have and their costs!
