#!/bin/bash

# Google Cloud Cleanup Commands
# Run these commands CAREFULLY after reviewing your resources

set -e

echo "🧹 Google Cloud Cleanup Commands"
echo "================================"
echo "⚠️  WARNING: These commands will DELETE resources and stop billing"
echo "⚠️  Review each command before running!"
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project configured. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Project: $PROJECT_ID"
echo ""

# Function to ask for confirmation
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

echo "1. 🚀 CLOUD RUN SERVICES CLEANUP:"
echo "--------------------------------"
echo "# List all Cloud Run services:"
echo "gcloud run services list"
echo ""
echo "# Delete specific services (replace SERVICE_NAME):"
echo "# gcloud run services delete SERVICE_NAME --region=REGION --quiet"
echo ""

# Check for staging services that might be unused
if confirm "Do you want to list Cloud Run services to review?"; then
    gcloud run services list --format="table(metadata.name,status.url,spec.template.metadata.annotations.run\.googleapis\.com/cpu-throttling,spec.template.spec.containers[0].resources.limits.memory)"
    echo ""
fi

echo "2. 🗄️  CLOUD SQL CLEANUP:"
echo "------------------------"
echo "# List all Cloud SQL instances:"
echo "gcloud sql instances list"
echo ""
echo "# Delete unused instances (replace INSTANCE_NAME):"
echo "# gcloud sql instances delete INSTANCE_NAME --quiet"
echo ""

if confirm "Do you want to list Cloud SQL instances?"; then
    gcloud sql instances list --format="table(name,databaseVersion,region,tier,state,createTime)" || echo "No Cloud SQL instances found"
    echo ""
fi

echo "3. 💻 COMPUTE ENGINE CLEANUP:"
echo "----------------------------"
echo "# List all instances:"
echo "gcloud compute instances list"
echo ""
echo "# Delete stopped instances:"
echo "# gcloud compute instances delete INSTANCE_NAME --zone=ZONE --quiet"
echo ""

if confirm "Do you want to check for Compute Engine instances?"; then
    gcloud compute instances list --format="table(name,zone,machineType,status,creationTimestamp)" || echo "No Compute Engine instances found"
    echo ""
fi

echo "4. 📦 ARTIFACT REGISTRY CLEANUP:"
echo "-------------------------------"
echo "# List repositories:"
echo "gcloud artifacts repositories list"
echo ""
echo "# Delete old container images (saves storage costs):"
echo "# gcloud artifacts docker images delete IMAGE_URL --quiet"
echo ""

if confirm "Do you want to check Artifact Registry usage?"; then
    gcloud artifacts repositories list --format="table(name,location,format,createTime,sizeBytes)" || echo "No repositories found"
    echo ""
    
    # Check for images in repositories
    REPOS=$(gcloud artifacts repositories list --format="value(name,location)" 2>/dev/null || echo "")
    if [ -n "$REPOS" ]; then
        echo "Container images in repositories:"
        while IFS=$'\t' read -r repo location; do
            if [ -n "$repo" ] && [ -n "$location" ]; then
                echo "Repository: $repo (Location: $location)"
                gcloud artifacts docker images list "$location-docker.pkg.dev/$PROJECT_ID/$repo" --format="table(IMAGE,TAGS,CREATE_TIME,UPDATE_TIME)" 2>/dev/null || echo "  No images found"
                echo ""
            fi
        done <<< "$REPOS"
    fi
fi

echo "5. 🌐 NETWORKING CLEANUP:"
echo "------------------------"
echo "# List unused static IP addresses:"
echo "gcloud compute addresses list --filter='status:RESERVED'"
echo ""
echo "# Delete unused static IPs:"
echo "# gcloud compute addresses delete IP_NAME --region=REGION --quiet"
echo ""

if confirm "Do you want to check for unused static IP addresses?"; then
    UNUSED_IPS=$(gcloud compute addresses list --filter="status:RESERVED" --format="table(name,region,status,users[0])" 2>/dev/null || echo "")
    if [ -n "$UNUSED_IPS" ]; then
        echo "Unused static IP addresses (costing money):"
        echo "$UNUSED_IPS"
    else
        echo "✅ No unused static IP addresses found"
    fi
    echo ""
fi

echo "6. 🪣 STORAGE CLEANUP:"
echo "--------------------"
echo "# List storage buckets:"
echo "gsutil ls -L -b gs://*"
echo ""
echo "# Delete empty buckets:"
echo "# gsutil rb gs://BUCKET_NAME"
echo ""

if confirm "Do you want to check storage buckets?"; then
    gsutil ls 2>/dev/null || echo "No storage buckets found or access denied"
    echo ""
fi

echo "7. 💰 COST OPTIMIZATION COMMANDS:"
echo "--------------------------------"
echo ""
echo "# Set up billing budget alerts:"
echo "gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID --display-name='Monthly Budget' --budget-amount=50USD --threshold-rule=percent=0.9,basis=current-spend"
echo ""
echo "# Scale down Cloud Run to zero when not in use:"
echo "gcloud run services update SERVICE_NAME --region=REGION --min-instances=0"
echo ""
echo "# Use preemptible instances for development:"
echo "gcloud compute instances create INSTANCE_NAME --preemptible --machine-type=e2-micro"
echo ""

echo "✅ IMMEDIATE ACTIONS TO REDUCE COSTS:"
echo "======================================"
echo ""
echo "1. 🎯 HIGH IMPACT (Do these first):"
echo "   • Delete unused Cloud SQL instances (expensive!)"
echo "   • Delete stopped Compute Engine instances"
echo "   • Release unused static IP addresses"
echo "   • Scale Cloud Run min-instances to 0 for dev services"
echo ""
echo "2. 📊 MONITORING:"
echo "   • Set up billing alerts at console.cloud.google.com/billing/budgets"
echo "   • Review costs weekly at console.cloud.google.com/billing"
echo ""
echo "3. 🔄 AUTOMATION:"
echo "   • Set up lifecycle policies for Artifact Registry"
echo "   • Use Cloud Scheduler to stop dev instances at night"
echo ""

echo "Run './gcp-cost-audit.sh' first to see what resources you have!"
