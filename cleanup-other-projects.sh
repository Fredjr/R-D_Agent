#!/bin/bash

# Google Cloud Cleanup Script for Other Projects
# This script helps identify and clean up unused Cloud Run services from non-R&D Agent projects

set -e

echo "🔍 Google Cloud Multi-Project Cleanup Analysis"
echo "=============================================="

# Function to analyze a project
analyze_project() {
    local project_id=$1
    local project_name=$2
    
    echo ""
    echo "📋 Analyzing Project: $project_name ($project_id)"
    echo "-------------------------------------------"
    
    # Set project context
    gcloud config set project "$project_id" --quiet
    
    # Get Cloud Run services
    echo "🚀 Cloud Run Services:"
    services=$(gcloud run services list --format="value(metadata.name,status.url,metadata.creationTimestamp)" 2>/dev/null || echo "")
    
    if [ -z "$services" ]; then
        echo "   No Cloud Run services found"
    else
        echo "$services" | while IFS=$'\t' read -r name url timestamp; do
            # Get service status
            status=$(gcloud run services describe "$name" --region=us-central1 --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")
            
            # Get traffic allocation
            traffic=$(gcloud run services describe "$name" --region=us-central1 --format="value(status.traffic[0].percent)" 2>/dev/null || echo "0")
            
            echo "   📦 $name"
            echo "      URL: $url"
            echo "      Created: $timestamp"
            echo "      Status: $status"
            echo "      Traffic: $traffic%"
            echo ""
        done
    fi
    
    # Get other billable resources
    echo "💾 Storage Buckets:"
    buckets=$(gsutil ls -p "$project_id" 2>/dev/null | wc -l || echo "0")
    echo "   Found $buckets storage buckets"
    
    echo "🗄️ Artifact Registry:"
    repos=$(gcloud artifacts repositories list --format="value(name)" 2>/dev/null | wc -l || echo "0")
    echo "   Found $repos repositories"
    
    echo "💽 Cloud SQL:"
    sql_instances=$(gcloud sql instances list --format="value(name)" 2>/dev/null | wc -l || echo "0")
    echo "   Found $sql_instances SQL instances"
    
    echo "🖥️ Compute Engine:"
    compute_instances=$(gcloud compute instances list --format="value(name)" 2>/dev/null | wc -l || echo "0")
    echo "   Found $compute_instances VM instances"
}

# Function to generate cleanup commands
generate_cleanup_commands() {
    local project_id=$1
    local project_name=$2
    
    echo ""
    echo "🧹 Cleanup Commands for $project_name ($project_id)"
    echo "=================================================="
    
    gcloud config set project "$project_id" --quiet
    
    echo "# Delete Cloud Run services (REVIEW EACH BEFORE RUNNING):"
    gcloud run services list --format="value(metadata.name)" 2>/dev/null | while read -r service; do
        if [ -n "$service" ]; then
            echo "gcloud run services delete $service --region=us-central1 --quiet"
        fi
    done
    
    echo ""
    echo "# Delete Artifact Registry repositories:"
    gcloud artifacts repositories list --format="value(name)" 2>/dev/null | while read -r repo; do
        if [ -n "$repo" ]; then
            echo "gcloud artifacts repositories delete $repo --quiet"
        fi
    done
    
    echo ""
    echo "# Delete Storage Buckets (CHECK CONTENTS FIRST):"
    gsutil ls -p "$project_id" 2>/dev/null | while read -r bucket; do
        if [ -n "$bucket" ]; then
            echo "gsutil rm -r $bucket"
        fi
    done
    
    echo ""
    echo "# Delete Cloud SQL instances:"
    gcloud sql instances list --format="value(name)" 2>/dev/null | while read -r instance; do
        if [ -n "$instance" ]; then
            echo "gcloud sql instances delete $instance --quiet"
        fi
    done
    
    echo ""
    echo "# Delete Compute Engine instances:"
    gcloud compute instances list --format="value(name,zone)" 2>/dev/null | while read -r instance zone; do
        if [ -n "$instance" ] && [ -n "$zone" ]; then
            echo "gcloud compute instances delete $instance --zone=$zone --quiet"
        fi
    done
}

# Main execution
echo "Getting list of all projects..."
projects=$(gcloud projects list --format="value(projectId,name)")

echo "$projects" | while IFS=$'\t' read -r project_id project_name; do
    # Skip the main R&D Agent project
    if [ "$project_id" = "r-and-d-agent-mvp" ]; then
        echo "⏭️  Skipping active R&D Agent project: $project_id"
        continue
    fi
    
    analyze_project "$project_id" "$project_name"
done

echo ""
echo "🎯 CLEANUP RECOMMENDATIONS"
echo "========================="
echo ""
echo "Based on the analysis above, here are the recommended cleanup actions:"
echo ""
echo "1. IMMEDIATE CLEANUP (likely unused):"
echo "   - Services with 0% traffic allocation"
echo "   - Services with 'False' or 'Unknown' status"
echo "   - Services created months ago and not recently updated"
echo ""
echo "2. REVIEW BEFORE CLEANUP:"
echo "   - Services with recent activity"
echo "   - Storage buckets (may contain important data)"
echo "   - Any production-named services"
echo ""
echo "3. ESTIMATED SAVINGS:"
echo "   - Each unused Cloud Run service: ~$10-30/month"
echo "   - Storage buckets: Variable based on size"
echo "   - Artifact Registry: ~$0.10/GB/month"
echo ""

# Generate cleanup commands for each project
echo "$projects" | while IFS=$'\t' read -r project_id project_name; do
    if [ "$project_id" != "r-and-d-agent-mvp" ]; then
        generate_cleanup_commands "$project_id" "$project_name"
    fi
done

echo ""
echo "⚠️  WARNING: Always review resources before deletion!"
echo "💡 TIP: Start with obviously unused services and work your way up"
echo "📊 Run this script regularly to monitor costs across all projects"

# Reset to R&D Agent project
gcloud config set project r-and-d-agent-mvp --quiet
echo ""
echo "✅ Analysis complete. Project context reset to r-and-d-agent-mvp"
