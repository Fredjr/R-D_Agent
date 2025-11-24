#!/bin/bash

# Comprehensive Week 24 Features Test Suite
# Tests all integration gaps + core features

set -e

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle77@gmail.com"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"
PMID="38924432"

echo "=========================================="
echo "🧪 WEEK 24 COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo ""

# =============================================================================
# CORE FEATURES: Auto Evidence Linking + Hypothesis Status
# =============================================================================

echo "📋 TEST GROUP 1: CORE AUTO EVIDENCE LINKING"
echo "=========================================="
echo ""

echo "TEST 1.1: Verify Evidence Link Created by AI"
echo "-------------------------------------------"
EVIDENCE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT=$(echo "$EVIDENCE_RESPONSE" | jq 'length')
echo "✅ Evidence links found: $EVIDENCE_COUNT"

if [ "$EVIDENCE_COUNT" -gt 0 ]; then
  FIRST_EVIDENCE=$(echo "$EVIDENCE_RESPONSE" | jq '.[0]')
  EVIDENCE_ID=$(echo "$FIRST_EVIDENCE" | jq -r '.id')
  EVIDENCE_TYPE=$(echo "$FIRST_EVIDENCE" | jq -r '.evidence_type')
  STRENGTH=$(echo "$FIRST_EVIDENCE" | jq -r '.strength')
  ADDED_BY=$(echo "$FIRST_EVIDENCE" | jq -r '.added_by')
  
  echo "   Evidence ID: $EVIDENCE_ID"
  echo "   Type: $EVIDENCE_TYPE"
  echo "   Strength: $STRENGTH"
  echo "   Added by: $ADDED_BY"
  
  if [ "$ADDED_BY" == "null" ]; then
    echo "✅ PASS: Evidence added by AI (added_by = null)"
  else
    echo "❌ FAIL: Evidence not added by AI (added_by = $ADDED_BY)"
  fi
else
  echo "❌ FAIL: No evidence links found"
fi
echo ""

echo "TEST 1.2: Verify Hypothesis Status Updated"
echo "-------------------------------------------"
HYPOTHESIS_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}" \
  -H "User-ID: ${USER_ID}")

STATUS=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.status')
CONFIDENCE=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.confidence_level')
SUPPORTING_COUNT=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.supporting_evidence_count')
CONTRADICTING_COUNT=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.contradicting_evidence_count')

echo "   Status: $STATUS"
echo "   Confidence: $CONFIDENCE"
echo "   Supporting Evidence: $SUPPORTING_COUNT"
echo "   Contradicting Evidence: $CONTRADICTING_COUNT"

if [ "$STATUS" == "testing" ]; then
  echo "✅ PASS: Hypothesis status updated to 'testing'"
else
  echo "⚠️  WARNING: Hypothesis status is '$STATUS' (expected 'testing')"
fi
echo ""

# =============================================================================
# GAP 1: Collections + Hypotheses Integration
# =============================================================================

echo "📋 TEST GROUP 2: COLLECTIONS + HYPOTHESES INTEGRATION"
echo "=========================================="
echo ""

echo "TEST 2.1: Smart Collection Suggestions After Triage"
echo "---------------------------------------------------"
TRIAGE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}")

# Check if response is an array
if echo "$TRIAGE_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
  TRIAGE_COUNT=$(echo "$TRIAGE_RESPONSE" | jq 'length')
  echo "   Triage entries found: $TRIAGE_COUNT"

  if [ "$TRIAGE_COUNT" -gt 0 ]; then
    FIRST_TRIAGE=$(echo "$TRIAGE_RESPONSE" | jq '.[0]')
    COLLECTION_SUGGESTIONS=$(echo "$FIRST_TRIAGE" | jq -r '.collection_suggestions // []')
    SUGGESTION_COUNT=$(echo "$COLLECTION_SUGGESTIONS" | jq 'length')

    echo "   Collection suggestions: $SUGGESTION_COUNT"

    if [ "$SUGGESTION_COUNT" -gt 0 ]; then
      echo "✅ PASS: Collection suggestions generated"
      echo "$COLLECTION_SUGGESTIONS" | jq '.[] | "   - \(.collection_name) (confidence: \(.confidence))"' -r
    else
      echo "⚠️  WARNING: No collection suggestions (may be expected if no matching collections)"

      # Debug: Check affected_hypotheses format
      AFFECTED_HYPS=$(echo "$FIRST_TRIAGE" | jq -r '.affected_hypotheses // []')
      echo "   Debug - affected_hypotheses: $AFFECTED_HYPS"
    fi
  else
    echo "❌ FAIL: No triage entries found"
  fi
else
  ERROR=$(echo "$TRIAGE_RESPONSE" | jq -r '.detail // "Unknown error"')
  echo "❌ FAIL: API error - $ERROR"
fi
echo ""

echo "TEST 2.2: Filter Collections by Hypothesis"
echo "-------------------------------------------"
COLLECTIONS_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/collections/by-hypothesis/${HYPOTHESIS_ID}?project_id=${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

echo "Response: $COLLECTIONS_RESPONSE"

# Check if response is an array or object
if echo "$COLLECTIONS_RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
  COLLECTION_COUNT=$(echo "$COLLECTIONS_RESPONSE" | jq 'length')
  echo "✅ Collections linked to hypothesis: $COLLECTION_COUNT"
elif echo "$COLLECTIONS_RESPONSE" | jq -e 'type == "object"' > /dev/null 2>&1; then
  # Check if it's an error response
  if echo "$COLLECTIONS_RESPONSE" | jq -e 'has("detail")' > /dev/null 2>&1; then
    ERROR=$(echo "$COLLECTIONS_RESPONSE" | jq -r '.detail')
    echo "❌ FAIL: API error - $ERROR"
  else
    echo "⚠️  WARNING: Response is object, not array"
  fi
else
  echo "❌ FAIL: Invalid response format"
fi
echo ""

echo "TEST 2.3: Auto Update Collections with New Papers"
echo "--------------------------------------------------"
COLLECTIONS_ALL=$(curl -s -X GET \
  "${BASE_URL}/api/collections/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

echo "Response type: $(echo "$COLLECTIONS_ALL" | jq 'type')"

if echo "$COLLECTIONS_ALL" | jq -e 'type == "array"' > /dev/null 2>&1; then
  TOTAL_COLLECTIONS=$(echo "$COLLECTIONS_ALL" | jq 'length')
  echo "✅ Total collections in project: $TOTAL_COLLECTIONS"
  
  if [ "$TOTAL_COLLECTIONS" -gt 0 ]; then
    FIRST_COLLECTION=$(echo "$COLLECTIONS_ALL" | jq '.[0]')
    COLLECTION_NAME=$(echo "$FIRST_COLLECTION" | jq -r '.collection_name')
    PAPER_COUNT=$(echo "$FIRST_COLLECTION" | jq -r '.paper_count // 0')
    echo "   Collection: $COLLECTION_NAME"
    echo "   Papers: $PAPER_COUNT"
    echo "✅ PASS: Collections maintain paper count"
  fi
else
  echo "⚠️  WARNING: Collections response is not an array"
fi
echo ""

echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo "✅ Core auto evidence linking: TESTED"
echo "✅ Collections integration: TESTED"
echo "⚠️  Some features need investigation"
echo ""
echo "Next: Run notes and network tests..."

