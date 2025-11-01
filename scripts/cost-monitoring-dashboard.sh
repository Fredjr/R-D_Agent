#!/bin/bash

# Cost Monitoring Dashboard for R&D Agent Platform
# Provides real-time cost analysis and optimization recommendations

set -e

PROJECT_ID="r-and-d-agent-mvp"
REGION="us-central1"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         R&D AGENT - COST MONITORING DASHBOARD             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Report Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🌍 Project: $PROJECT_ID"
echo ""

# ═══════════════════════════════════════════════════════════
# 1. ARTIFACT REGISTRY ANALYSIS
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           1. ARTIFACT REGISTRY (PRIMARY COST)             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Backend repository
echo "📦 Backend Repository:"
BACKEND_IMAGES=$(gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/$PROJECT_ID/rd-agent/backend \
  --format='value(IMAGE)' 2>/dev/null | wc -l || echo "0")

echo "  Total images: $BACKEND_IMAGES"

if [ "$BACKEND_IMAGES" -gt 3 ]; then
  EXCESS_IMAGES=$((BACKEND_IMAGES - 3))
  ESTIMATED_WASTE=$(echo "$EXCESS_IMAGES * 0.5 * 0.10" | bc)
  echo "  ⚠️  Excess images: $EXCESS_IMAGES"
  echo "  💰 Estimated waste: £${ESTIMATED_WASTE}/month"
  echo "  🔧 Action: Run ./cleanup-artifacts.sh"
else
  echo "  ✅ Optimized (≤3 images)"
fi

echo ""

# Cloud Run Source Deploy repository
echo "📦 Cloud Run Source Deploy Repository:"
if gcloud artifacts repositories describe cloud-run-source-deploy \
  --location=$REGION &>/dev/null; then
  
  SOURCE_IMAGES=$(gcloud artifacts docker images list \
    us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy \
    --format='value(IMAGE)' 2>/dev/null | wc -l || echo "0")
  
  echo "  Total images: $SOURCE_IMAGES"
  
  if [ "$SOURCE_IMAGES" -gt 3 ]; then
    EXCESS_IMAGES=$((SOURCE_IMAGES - 3))
    ESTIMATED_WASTE=$(echo "$EXCESS_IMAGES * 0.5 * 0.10" | bc)
    echo "  ⚠️  Excess images: $EXCESS_IMAGES"
    echo "  💰 Estimated waste: £${ESTIMATED_WASTE}/month"
    echo "  🔧 Action: Run ./cleanup-artifacts.sh"
  else
    echo "  ✅ Optimized (≤3 images)"
  fi
else
  echo "  ℹ️  Repository not found (may have been deleted)"
fi

echo ""

# Total Artifact Registry cost estimate
TOTAL_IMAGES=$((BACKEND_IMAGES + SOURCE_IMAGES))
ESTIMATED_STORAGE=$(echo "$TOTAL_IMAGES * 0.5" | bc)  # 500MB per image
ESTIMATED_COST=$(echo "$ESTIMATED_STORAGE * 0.10" | bc)  # £0.10/GB/month

echo "📊 Artifact Registry Summary:"
echo "  Total images: $TOTAL_IMAGES"
echo "  Estimated storage: ${ESTIMATED_STORAGE}GB"
echo "  💰 Estimated cost: £${ESTIMATED_COST}/month"
echo ""

# ═══════════════════════════════════════════════════════════
# 2. CLOUD RUN SERVICES (IF ANY)
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              2. CLOUD RUN SERVICES (LEGACY)               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

SERVICES=$(gcloud run services list --region=$REGION --format='value(SERVICE)' 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
  echo "✅ No Cloud Run services found (using Railway instead)"
  echo "💰 Cost: £0/month"
else
  echo "⚠️  Found Cloud Run services (should be deleted):"
  echo "$SERVICES" | while read service; do
    echo "  - $service"
  done
  echo ""
  echo "🔧 Action: Delete unused Cloud Run services"
  echo "   gcloud run services delete SERVICE_NAME --region=$REGION"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 3. COMPUTE ENGINE INSTANCES (IF ANY)
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           3. COMPUTE ENGINE INSTANCES (LEGACY)            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

INSTANCES=$(gcloud compute instances list --format='value(NAME)' 2>/dev/null || echo "")

if [ -z "$INSTANCES" ]; then
  echo "✅ No Compute Engine instances found"
  echo "💰 Cost: £0/month"
else
  echo "⚠️  Found Compute Engine instances:"
  gcloud compute instances list --format='table(NAME,ZONE,MACHINE_TYPE,STATUS)' 2>/dev/null || echo "Unable to list instances"
  echo ""
  echo "🔧 Action: Delete unused instances or scale down"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 4. STORAGE BUCKETS
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    4. STORAGE BUCKETS                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

BUCKETS=$(gsutil ls 2>/dev/null || echo "")

if [ -z "$BUCKETS" ]; then
  echo "✅ No storage buckets found"
  echo "💰 Cost: £0/month"
else
  echo "📦 Storage Buckets:"
  echo "$BUCKETS" | while read bucket; do
    SIZE=$(gsutil du -s "$bucket" 2>/dev/null | awk '{print $1}' || echo "0")
    SIZE_GB=$(echo "scale=2; $SIZE / 1024 / 1024 / 1024" | bc)
    COST=$(echo "scale=2; $SIZE_GB * 0.02" | bc)  # £0.02/GB/month
    echo "  $bucket"
    echo "    Size: ${SIZE_GB}GB"
    echo "    💰 Cost: £${COST}/month"
  done
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 5. COST SUMMARY & RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              COST SUMMARY & RECOMMENDATIONS               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "💰 Estimated Monthly Costs:"
echo "  Artifact Registry: £${ESTIMATED_COST}"
echo "  Cloud Run: £0 (using Railway)"
echo "  Compute Engine: £0"
echo "  Storage Buckets: £0"
echo "  ─────────────────────────"
echo "  Total GCP: £${ESTIMATED_COST}"
echo ""

echo "📊 External Services (Estimated):"
echo "  Railway (Backend): £5-10/month"
echo "  Vercel (Frontend): £0/month (free tier)"
echo "  Supabase (Database): £0/month (free tier)"
echo "  AI APIs (Cerebras, OpenAI): £5-10/month"
echo "  ─────────────────────────"
echo "  Total External: £10-20/month"
echo ""

TOTAL_LOW=$(echo "$ESTIMATED_COST + 10" | bc)
TOTAL_HIGH=$(echo "$ESTIMATED_COST + 20" | bc)
echo "💰 TOTAL ESTIMATED COST: £${TOTAL_LOW}-${TOTAL_HIGH}/month"
echo ""

# ═══════════════════════════════════════════════════════════
# 6. OPTIMIZATION RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              OPTIMIZATION RECOMMENDATIONS                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

RECOMMENDATIONS=0

if [ "$BACKEND_IMAGES" -gt 3 ]; then
  echo "🔴 HIGH PRIORITY: Clean up Artifact Registry"
  echo "   Current: $BACKEND_IMAGES images"
  echo "   Target: 3 images"
  echo "   Savings: £$ESTIMATED_WASTE/month"
  echo "   Action: ./cleanup-artifacts.sh"
  echo ""
  RECOMMENDATIONS=$((RECOMMENDATIONS + 1))
fi

if [ -n "$SERVICES" ]; then
  echo "🟡 MEDIUM PRIORITY: Delete unused Cloud Run services"
  echo "   Found: $(echo "$SERVICES" | wc -l) services"
  echo "   Savings: £5-20/month"
  echo "   Action: gcloud run services delete SERVICE_NAME"
  echo ""
  RECOMMENDATIONS=$((RECOMMENDATIONS + 1))
fi

if [ -n "$INSTANCES" ]; then
  echo "🟡 MEDIUM PRIORITY: Delete unused Compute Engine instances"
  echo "   Found: $(echo "$INSTANCES" | wc -l) instances"
  echo "   Savings: £20-100/month"
  echo "   Action: gcloud compute instances delete INSTANCE_NAME"
  echo ""
  RECOMMENDATIONS=$((RECOMMENDATIONS + 1))
fi

echo "🟢 ONGOING: Implement caching strategies"
echo "   - PubMed API caching (prevent rate limiting)"
echo "   - Database query caching (reduce load)"
echo "   - AI response caching (reduce API costs)"
echo "   See: COST-OPTIMIZATION-STRATEGY.md"
echo ""

if [ "$RECOMMENDATIONS" -eq 0 ]; then
  echo "✅ No immediate optimizations needed!"
  echo "   Your infrastructure is well-optimized."
else
  echo "⚠️  Found $RECOMMENDATIONS optimization opportunities"
  echo "   Review recommendations above"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    REPORT COMPLETE                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📖 For detailed optimization strategies, see:"
echo "   COST-OPTIMIZATION-STRATEGY.md"
echo ""
echo "🔄 Run this script monthly to monitor costs"
echo "   ./scripts/cost-monitoring-dashboard.sh"

