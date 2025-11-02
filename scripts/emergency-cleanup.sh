#!/bin/bash

# Emergency Artifact Registry Cleanup Script
# Deletes ALL old Docker images, keeping only 3 most recent

set -e

PROJECT_ID="r-and-d-agent-mvp"
REGION="us-central1"
KEEP_COUNT=3

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         EMERGENCY ARTIFACT REGISTRY CLEANUP               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This will delete ALL old Docker images"
echo "✅ Keeping only $KEEP_COUNT most recent images per repository"
echo ""

# ═══════════════════════════════════════════════════════════
# 1. BACKEND REPOSITORY CLEANUP
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              1. BACKEND REPOSITORY CLEANUP                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

BACKEND_REPO="us-central1-docker.pkg.dev/$PROJECT_ID/rd-agent/backend"

echo "📦 Analyzing backend repository..."
BACKEND_IMAGES=$(gcloud artifacts docker images list "$BACKEND_REPO" \
  --format='value(IMAGE)' \
  --sort-by=~CREATE_TIME 2>/dev/null || echo "")

if [ -z "$BACKEND_IMAGES" ]; then
  echo "ℹ️  No images found in backend repository"
else
  TOTAL_BACKEND=$(echo "$BACKEND_IMAGES" | wc -l | tr -d ' ')
  echo "📊 Total images: $TOTAL_BACKEND"
  
  if [ "$TOTAL_BACKEND" -le "$KEEP_COUNT" ]; then
    echo "✅ Already optimized (≤$KEEP_COUNT images)"
  else
    TO_DELETE_BACKEND=$(echo "$BACKEND_IMAGES" | tail -n +$((KEEP_COUNT + 1)))
    DELETE_COUNT_BACKEND=$(echo "$TO_DELETE_BACKEND" | wc -l | tr -d ' ')
    
    echo "🗑️  Will delete: $DELETE_COUNT_BACKEND images"
    echo "✅ Will keep: $KEEP_COUNT most recent images"
    echo ""
    
    # Show images to keep
    echo "Keeping these images:"
    echo "$BACKEND_IMAGES" | head -n $KEEP_COUNT | while read image; do
      echo "  ✅ $image"
    done
    echo ""
    
    # Confirm deletion
    read -p "⚠️  Delete $DELETE_COUNT_BACKEND old images? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
      echo ""
      echo "🗑️  Deleting old images..."
      
      DELETED=0
      FAILED=0
      
      echo "$TO_DELETE_BACKEND" | while read image; do
        if [ -n "$image" ]; then
          echo "  Deleting: $image"
          if gcloud artifacts docker images delete "$image" --quiet 2>/dev/null; then
            DELETED=$((DELETED + 1))
          else
            echo "  ⚠️  Failed to delete: $image"
            FAILED=$((FAILED + 1))
          fi
        fi
      done
      
      echo ""
      echo "✅ Backend cleanup complete!"
      echo "   Deleted: $DELETE_COUNT_BACKEND images"
      
      # Calculate savings
      STORAGE_SAVED=$(echo "$DELETE_COUNT_BACKEND * 0.5" | bc)
      COST_SAVED=$(echo "$STORAGE_SAVED * 0.10" | bc)
      echo "   💰 Storage saved: ${STORAGE_SAVED}GB"
      echo "   💰 Cost saved: £${COST_SAVED}/month"
    else
      echo "❌ Backend cleanup cancelled"
    fi
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 2. CLOUD RUN SOURCE DEPLOY CLEANUP
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         2. CLOUD RUN SOURCE DEPLOY CLEANUP                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if repository exists
if gcloud artifacts repositories describe cloud-run-source-deploy \
  --location=$REGION &>/dev/null; then
  
  SOURCE_REPO="us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy"
  
  echo "📦 Analyzing cloud-run-source-deploy repository..."
  SOURCE_IMAGES=$(gcloud artifacts docker images list "$SOURCE_REPO" \
    --format='value(IMAGE)' \
    --sort-by=~CREATE_TIME 2>/dev/null || echo "")
  
  if [ -z "$SOURCE_IMAGES" ]; then
    echo "ℹ️  No images found in cloud-run-source-deploy repository"
  else
    TOTAL_SOURCE=$(echo "$SOURCE_IMAGES" | wc -l | tr -d ' ')
    echo "📊 Total images: $TOTAL_SOURCE"
    
    if [ "$TOTAL_SOURCE" -le "$KEEP_COUNT" ]; then
      echo "✅ Already optimized (≤$KEEP_COUNT images)"
    else
      TO_DELETE_SOURCE=$(echo "$SOURCE_IMAGES" | tail -n +$((KEEP_COUNT + 1)))
      DELETE_COUNT_SOURCE=$(echo "$TO_DELETE_SOURCE" | wc -l | tr -d ' ')
      
      echo "🗑️  Will delete: $DELETE_COUNT_SOURCE images"
      echo "✅ Will keep: $KEEP_COUNT most recent images"
      echo ""
      
      # Show images to keep
      echo "Keeping these images:"
      echo "$SOURCE_IMAGES" | head -n $KEEP_COUNT | while read image; do
        echo "  ✅ $image"
      done
      echo ""
      
      # Confirm deletion
      read -p "⚠️  Delete $DELETE_COUNT_SOURCE old images? (yes/no): " confirm
      
      if [ "$confirm" = "yes" ]; then
        echo ""
        echo "🗑️  Deleting old images..."
        
        echo "$TO_DELETE_SOURCE" | while read image; do
          if [ -n "$image" ]; then
            echo "  Deleting: $image"
            if gcloud artifacts docker images delete "$image" --quiet 2>/dev/null; then
              :
            else
              echo "  ⚠️  Failed to delete: $image"
            fi
          fi
        done
        
        echo ""
        echo "✅ Cloud Run Source Deploy cleanup complete!"
        echo "   Deleted: $DELETE_COUNT_SOURCE images"
        
        # Calculate savings
        STORAGE_SAVED=$(echo "$DELETE_COUNT_SOURCE * 0.5" | bc)
        COST_SAVED=$(echo "$STORAGE_SAVED * 0.10" | bc)
        echo "   💰 Storage saved: ${STORAGE_SAVED}GB"
        echo "   💰 Cost saved: £${COST_SAVED}/month"
      else
        echo "❌ Cloud Run Source Deploy cleanup cancelled"
      fi
    fi
  fi
else
  echo "ℹ️  cloud-run-source-deploy repository not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 3. FINAL SUMMARY
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    CLEANUP SUMMARY                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Final State:"
echo ""

# Backend repository
FINAL_BACKEND=$(gcloud artifacts docker images list "$BACKEND_REPO" \
  --format='value(IMAGE)' 2>/dev/null | wc -l | tr -d ' ')
echo "Backend repository: $FINAL_BACKEND images"

# Source deploy repository
if gcloud artifacts repositories describe cloud-run-source-deploy \
  --location=$REGION &>/dev/null; then
  FINAL_SOURCE=$(gcloud artifacts docker images list "$SOURCE_REPO" \
    --format='value(IMAGE)' 2>/dev/null | wc -l | tr -d ' ')
  echo "Cloud Run Source Deploy: $FINAL_SOURCE images"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Run cost monitoring: ./scripts/cost-monitoring-dashboard.sh"
echo "  2. Verify weekly cleanup is enabled: .github/workflows/cleanup-artifacts-weekly.yml"
echo "  3. Monitor costs in Google Cloud Console"

