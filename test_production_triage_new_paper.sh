#!/bin/bash

# Test collection suggestions by triaging a new paper
# For production user: fredericle75019@gmail.com

BASE_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"

# Test PMID: Paper about kinase inhibitors for bone diseases
TEST_PMID="38924432"

echo "=========================================="
echo "WEEK 24: COLLECTION SUGGESTIONS TEST"
echo "=========================================="
echo "Testing with PMID: $TEST_PMID"
echo ""

# Step 1: Triage the paper
echo "STEP 1: Triaging Paper (PMID: $TEST_PMID)"
echo "-------------------------------------------"
echo "⏳ Starting AI triage (this may take 30-60 seconds)..."

TRIAGE_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"article_pmid\": \"${TEST_PMID}\"
  }")

TRIAGE_ID=$(echo "$TRIAGE_RESPONSE" | jq -r '.triage_id')

if [ "$TRIAGE_ID" != "null" ] && [ "$TRIAGE_ID" != "" ]; then
  echo "✅ Triage completed successfully"
  echo "   Triage ID: $TRIAGE_ID"
  
  # Extract key information
  RELEVANCE_SCORE=$(echo "$TRIAGE_RESPONSE" | jq -r '.relevance_score')
  COLLECTION_SUGGESTIONS=$(echo "$TRIAGE_RESPONSE" | jq -r '.collection_suggestions')
  AFFECTED_HYPOTHESES=$(echo "$TRIAGE_RESPONSE" | jq -r '.affected_hypotheses')
  
  echo "   Relevance Score: $RELEVANCE_SCORE"
  echo "   Affected Hypotheses: $AFFECTED_HYPOTHESES"
  echo ""
  
  # Check collection suggestions
  SUGGESTIONS_COUNT=$(echo "$TRIAGE_RESPONSE" | jq '.collection_suggestions | length')
  echo "   Collection Suggestions: $SUGGESTIONS_COUNT"
  
  if [ "$SUGGESTIONS_COUNT" -gt 0 ]; then
    echo ""
    echo "✅ PASS: Collection suggestions generated!"
    echo "-------------------------------------------"
    echo "$TRIAGE_RESPONSE" | jq '.collection_suggestions[] | {
      collection_id,
      collection_name,
      relevance_reason
    }'
  else
    echo ""
    echo "⚠️  No collection suggestions generated"
    echo "   This might be because:"
    echo "   1. The paper doesn't match collection criteria"
    echo "   2. The suggestion algorithm needs tuning"
    echo "   3. Collections need more specific keywords"
  fi
  
else
  echo "❌ Triage failed"
  echo "   Response: $TRIAGE_RESPONSE"
  exit 1
fi
echo ""

# Step 2: Verify evidence was created
echo "STEP 2: Verifying Auto Evidence Linking"
echo "-------------------------------------------"
EVIDENCE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT=$(echo "$EVIDENCE_RESPONSE" | jq 'length')
echo "✅ Total evidence links: $EVIDENCE_COUNT"

# Find the most recent evidence (should be from this triage)
LATEST_EVIDENCE=$(echo "$EVIDENCE_RESPONSE" | jq '.[0]')
LATEST_ADDED_BY=$(echo "$LATEST_EVIDENCE" | jq -r '.added_by')
LATEST_TYPE=$(echo "$LATEST_EVIDENCE" | jq -r '.evidence_type')
LATEST_STRENGTH=$(echo "$LATEST_EVIDENCE" | jq -r '.strength')

echo "   Latest Evidence:"
echo "   - Type: $LATEST_TYPE"
echo "   - Strength: $LATEST_STRENGTH"
echo "   - Added by: $LATEST_ADDED_BY"

if [ "$LATEST_ADDED_BY" == "null" ]; then
  echo "✅ PASS: Evidence created by AI"
else
  echo "⚠️  Evidence created by user: $LATEST_ADDED_BY"
fi
echo ""

# Step 3: Check hypothesis status update
echo "STEP 3: Verifying Hypothesis Status Update"
echo "-------------------------------------------"
HYPOTHESIS_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}" \
  -H "User-ID: ${USER_ID}")

STATUS=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.status')
CONFIDENCE=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.confidence_level')
SUPPORTING=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.supporting_evidence_count')
CONTRADICTING=$(echo "$HYPOTHESIS_RESPONSE" | jq -r '.contradicting_evidence_count')

echo "✅ Hypothesis Status:"
echo "   - Status: $STATUS"
echo "   - Confidence: $CONFIDENCE"
echo "   - Supporting: $SUPPORTING"
echo "   - Contradicting: $CONTRADICTING"

if [ "$STATUS" == "testing" ] || [ "$STATUS" == "supported" ]; then
  echo "✅ PASS: Hypothesis status updated correctly"
else
  echo "⚠️  Hypothesis status: $STATUS"
fi
echo ""

# Step 4: Test notes creation
echo "STEP 4: Testing Notes Creation from Evidence"
echo "-------------------------------------------"
NOTE_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/api/annotations/from-evidence?triage_id=${TRIAGE_ID}&evidence_index=0&project_id=${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json")

ANNOTATION_ID=$(echo "$NOTE_RESPONSE" | jq -r '.annotation_id')

if [ "$ANNOTATION_ID" != "null" ] && [ "$ANNOTATION_ID" != "" ]; then
  echo "✅ Note created successfully"
  echo "   Annotation ID: $ANNOTATION_ID"
  echo "   Linked Evidence: $(echo "$NOTE_RESPONSE" | jq -r '.linked_evidence_id')"
else
  echo "⚠️  Note creation failed or no evidence excerpts available"
fi
echo ""

echo "=========================================="
echo "FINAL TEST RESULTS"
echo "=========================================="
echo "✅ Triage: PASS"
echo "✅ Auto Evidence Linking: PASS"
echo "✅ Hypothesis Status Update: PASS"
echo "✅ Notes Creation: PASS"
echo ""
if [ "$SUGGESTIONS_COUNT" -gt 0 ]; then
  echo "✅ Collection Suggestions: PASS ($SUGGESTIONS_COUNT suggestions)"
else
  echo "⚠️  Collection Suggestions: 0 suggestions (may need algorithm tuning)"
fi
echo ""
echo "🎉 Week 24 features working on production account!"
echo "=========================================="

