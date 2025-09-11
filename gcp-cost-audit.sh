#!/bin/bash

# Google Cloud Cost Audit Script
# This script helps identify and clean up unused GCP resources

set -e

echo "🔍 Google Cloud Cost Audit - R&D Agent Project"
echo "=============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project configured. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📊 Auditing project: $PROJECT_ID"
echo ""

# 1. Cloud Run Services
echo "🚀 CLOUD RUN SERVICES:"
echo "----------------------"
gcloud run services list --format="table(metadata.name,status.url,status.traffic[0].percent,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.memory)" || echo "No Cloud Run services found"
echo ""

# 2. Cloud SQL Instances
echo "🗄️  CLOUD SQL INSTANCES:"
echo "------------------------"
gcloud sql instances list --format="table(name,databaseVersion,region,tier,state)" || echo "No Cloud SQL instances found"
echo ""

# 3. Compute Engine Instances
echo "💻 COMPUTE ENGINE INSTANCES:"
echo "----------------------------"
gcloud compute instances list --format="table(name,zone,machineType,status,creationTimestamp)" || echo "No Compute Engine instances found"
echo ""

# 4. Artifact Registry Repositories
echo "📦 ARTIFACT REGISTRY:"
echo "--------------------"
gcloud artifacts repositories list --format="table(name,location,format,createTime)" || echo "No Artifact Registry repositories found"
echo ""

# 5. Storage Buckets
echo "🪣 CLOUD STORAGE BUCKETS:"
echo "------------------------"
gsutil ls -L -b gs://* 2>/dev/null | grep -E "(gs://|Creation time|Storage class|Location)" || echo "No storage buckets found or access denied"
echo ""

# 6. Load Balancers
echo "⚖️  LOAD BALANCERS:"
echo "------------------"
gcloud compute url-maps list --format="table(name,creationTimestamp)" || echo "No load balancers found"
gcloud compute target-https-proxies list --format="table(name,creationTimestamp)" || echo "No HTTPS proxies found"
echo ""

# 7. Networking Resources
echo "🌐 NETWORKING RESOURCES:"
echo "-----------------------"
gcloud compute addresses list --format="table(name,region,status,users[0])" || echo "No static IP addresses found"
echo ""

# 8. Recent billing data (if available)
echo "💰 COST ESTIMATION:"
echo "------------------"
echo "To see detailed billing information:"
echo "1. Visit: https://console.cloud.google.com/billing"
echo "2. Or run: gcloud billing accounts list"
echo ""

# 9. Identify potentially unused resources
echo "🧹 CLEANUP RECOMMENDATIONS:"
echo "---------------------------"

# Check for stopped instances
STOPPED_INSTANCES=$(gcloud compute instances list --filter="status:TERMINATED" --format="value(name)" 2>/dev/null || echo "")
if [ -n "$STOPPED_INSTANCES" ]; then
    echo "⚠️  Found stopped Compute Engine instances (still billing for disk):"
    echo "$STOPPED_INSTANCES"
    echo "   Consider deleting with: gcloud compute instances delete INSTANCE_NAME"
    echo ""
fi

# Check for unused static IPs
UNUSED_IPS=$(gcloud compute addresses list --filter="status:RESERVED" --format="value(name)" 2>/dev/null || echo "")
if [ -n "$UNUSED_IPS" ]; then
    echo "⚠️  Found unused static IP addresses:"
    echo "$UNUSED_IPS"
    echo "   Consider releasing with: gcloud compute addresses delete IP_NAME"
    echo ""
fi

# Check for old container images
echo "⚠️  Check Artifact Registry for old container images:"
echo "   Old images consume storage. Consider setting up lifecycle policies."
echo "   Visit: https://console.cloud.google.com/artifacts"
echo ""

echo "✅ Audit complete!"
echo ""
echo "💡 NEXT STEPS:"
echo "1. Review the resources listed above"
echo "2. Delete any unused services/instances"
echo "3. Set up billing alerts: https://console.cloud.google.com/billing/budgets"
echo "4. Consider using preemptible instances for development"
