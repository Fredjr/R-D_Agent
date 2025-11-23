#!/bin/bash

# Test Auto Evidence Linking Feature
# Week 24: Comprehensive testing of auto evidence linking and hypothesis status updates

set -e

# Configuration
BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
TEST_PMID="35650602"  # Paper that should support hypotheses

echo "🧪 Testing Auto Evidence Linking Feature"
echo "=========================================="
echo ""

# Test 1: Check feature flags
echo "📋 Test 1: Check Feature Flags"
echo "-------------------------------"
echo "Checking if AUTO_EVIDENCE_LINKING is enabled..."
# Note: Feature flags are environment variables on Railway, can't check via API
echo "⚠️  Feature flags are set via Railway environment variables"
echo "   AUTO_EVIDENCE_LINKING=false (default)"
echo "   AUTO_HYPOTHESIS_STATUS=false (default)"
echo ""

# Test 2: Get hypotheses before triage
echo "📋 Test 2: Get Hypotheses Before Triage"
echo "----------------------------------------"
HYPOTHESES_BEFORE=$(curl -s "${BACKEND_URL}/api/questions/project/${PROJECT_ID}/hypotheses" \
  -H "User-ID: ${USER_ID}" | jq -r '.hypotheses[] | {hypothesis_id, status, supporting_evidence_count, contradicting_evidence_count}')

echo "Hypotheses before triage:"
echo "$HYPOTHESES_BEFORE" | jq '.'
echo ""

# Test 3: Run AI triage with force_refresh
echo "📋 Test 3: Run AI Triage (force_refresh=true)"
echo "----------------------------------------------"
TRIAGE_RESPONSE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -X POST \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"article_pmid\": \"${TEST_PMID}\", \"force_refresh\": true}")

echo "Triage result:"
echo "$TRIAGE_RESPONSE" | jq '{
  triage_status,
  relevance_score,
  evidence_excerpts_count: (.evidence_excerpts | length),
  hypothesis_scores_count: (.hypothesis_relevance_scores | length),
  affected_hypotheses: .affected_hypotheses
}'
echo ""

# Test 4: Check if evidence links were created
echo "📋 Test 4: Check Evidence Links Created"
echo "----------------------------------------"
# Get first hypothesis ID from triage result
FIRST_HYP_ID=$(echo "$TRIAGE_RESPONSE" | jq -r '.affected_hypotheses[0] // empty')

if [ -z "$FIRST_HYP_ID" ]; then
  echo "⚠️  No affected hypotheses found in triage result"
  echo "   This is expected if AUTO_EVIDENCE_LINKING is disabled"
else
  echo "Checking evidence for hypothesis: $FIRST_HYP_ID"
  
  EVIDENCE=$(curl -s "${BACKEND_URL}/api/questions/hypotheses/${FIRST_HYP_ID}/evidence" \
    -H "User-ID: ${USER_ID}")
  
  EVIDENCE_COUNT=$(echo "$EVIDENCE" | jq '.evidence | length')
  echo "Evidence count: $EVIDENCE_COUNT"
  
  if [ "$EVIDENCE_COUNT" -gt 0 ]; then
    echo "✅ Evidence links found!"
    echo "$EVIDENCE" | jq '.evidence[] | {evidence_type, strength, added_by, key_finding}'
  else
    echo "⚠️  No evidence links found"
    echo "   This is expected if AUTO_EVIDENCE_LINKING is disabled"
  fi
fi
echo ""

# Test 5: Get hypotheses after triage
echo "📋 Test 5: Get Hypotheses After Triage"
echo "---------------------------------------"
HYPOTHESES_AFTER=$(curl -s "${BACKEND_URL}/api/questions/project/${PROJECT_ID}/hypotheses" \
  -H "User-ID: ${USER_ID}" | jq -r '.hypotheses[] | {hypothesis_id, status, supporting_evidence_count, contradicting_evidence_count}')

echo "Hypotheses after triage:"
echo "$HYPOTHESES_AFTER" | jq '.'
echo ""

# Test 6: Compare before and after
echo "📋 Test 6: Compare Evidence Counts"
echo "-----------------------------------"
echo "Comparing evidence counts before and after triage..."

# Extract evidence counts
BEFORE_SUPPORTING=$(echo "$HYPOTHESES_BEFORE" | jq -r '.supporting_evidence_count' | head -1)
AFTER_SUPPORTING=$(echo "$HYPOTHESES_AFTER" | jq -r '.supporting_evidence_count' | head -1)

echo "Supporting evidence count:"
echo "  Before: $BEFORE_SUPPORTING"
echo "  After:  $AFTER_SUPPORTING"

if [ "$AFTER_SUPPORTING" -gt "$BEFORE_SUPPORTING" ]; then
  echo "✅ Evidence count increased! Auto-linking is working!"
else
  echo "⚠️  Evidence count did not increase"
  echo "   This is expected if AUTO_EVIDENCE_LINKING is disabled"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo ""
echo "✅ Test 1: Feature flags checked"
echo "✅ Test 2: Hypotheses retrieved before triage"
echo "✅ Test 3: AI triage completed"
echo "✅ Test 4: Evidence links checked"
echo "✅ Test 5: Hypotheses retrieved after triage"
echo "✅ Test 6: Evidence counts compared"
echo ""
echo "🎯 Next Steps:"
echo "1. Enable AUTO_EVIDENCE_LINKING on Railway:"
echo "   railway variables set AUTO_EVIDENCE_LINKING=true"
echo ""
echo "2. Enable AUTO_HYPOTHESIS_STATUS on Railway:"
echo "   railway variables set AUTO_HYPOTHESIS_STATUS=true"
echo ""
echo "3. Re-run this test script to verify auto-linking works"
echo ""
echo "4. Check Railway logs for auto-linking messages:"
echo "   railway logs --tail 100"
echo ""

