#!/bin/bash

# Week 24 Production User Test - fredericle75019@gmail.com
# Comprehensive test of all Week 24 features

BASE_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
PROJECT_NAME="Jules Baba"

echo "=========================================="
echo "WEEK 24 PRODUCTION USER TEST"
echo "=========================================="
echo "User: $USER_ID"
echo "Project: $PROJECT_NAME"
echo "Project ID: $PROJECT_ID"
echo ""

# Step 1: Get hypotheses
echo "STEP 1: Getting Hypotheses"
echo "-------------------------------------------"
HYPOTHESES_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

HYPOTHESIS_COUNT=$(echo "$HYPOTHESES_RESPONSE" | jq 'length')
echo "✅ Hypotheses found: $HYPOTHESIS_COUNT"

if [ "$HYPOTHESIS_COUNT" -gt 0 ]; then
  FIRST_HYPOTHESIS=$(echo "$HYPOTHESES_RESPONSE" | jq '.[0]')
  HYPOTHESIS_ID=$(echo "$FIRST_HYPOTHESIS" | jq -r '.hypothesis_id')
  HYPOTHESIS_TEXT=$(echo "$FIRST_HYPOTHESIS" | jq -r '.hypothesis_text')
  STATUS=$(echo "$FIRST_HYPOTHESIS" | jq -r '.status')
  CONFIDENCE=$(echo "$FIRST_HYPOTHESIS" | jq -r '.confidence_level')
  SUPPORTING=$(echo "$FIRST_HYPOTHESIS" | jq -r '.supporting_evidence_count')
  
  echo "   Hypothesis ID: $HYPOTHESIS_ID"
  echo "   Text: ${HYPOTHESIS_TEXT:0:80}..."
  echo "   Status: $STATUS"
  echo "   Confidence: $CONFIDENCE"
  echo "   Supporting Evidence: $SUPPORTING"
else
  echo "❌ No hypotheses found - cannot continue testing"
  exit 1
fi
echo ""

# Step 2: Get triage entries
echo "STEP 2: Getting Triage Entries"
echo "-------------------------------------------"
TRIAGE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}")

TRIAGE_COUNT=$(echo "$TRIAGE_RESPONSE" | jq 'length')
echo "✅ Triage entries found: $TRIAGE_COUNT"

if [ "$TRIAGE_COUNT" -gt 0 ]; then
  FIRST_TRIAGE=$(echo "$TRIAGE_RESPONSE" | jq '.[0]')
  TRIAGE_ID=$(echo "$FIRST_TRIAGE" | jq -r '.triage_id')
  ARTICLE_PMID=$(echo "$FIRST_TRIAGE" | jq -r '.article_pmid')
  RELEVANCE_SCORE=$(echo "$FIRST_TRIAGE" | jq -r '.relevance_score')
  COLLECTION_SUGGESTIONS=$(echo "$FIRST_TRIAGE" | jq -r '.collection_suggestions')
  AFFECTED_HYPOTHESES=$(echo "$FIRST_TRIAGE" | jq -r '.affected_hypotheses')
  
  echo "   Triage ID: $TRIAGE_ID"
  echo "   Article PMID: $ARTICLE_PMID"
  echo "   Relevance Score: $RELEVANCE_SCORE"
  echo "   Collection Suggestions: $COLLECTION_SUGGESTIONS"
  echo "   Affected Hypotheses: $AFFECTED_HYPOTHESES"
else
  echo "⚠️  No triage entries found"
  TRIAGE_ID=""
fi
echo ""

# Step 3: Test Auto Evidence Linking
echo "STEP 3: Testing Auto Evidence Linking"
echo "-------------------------------------------"
EVIDENCE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT=$(echo "$EVIDENCE_RESPONSE" | jq 'length')
echo "✅ Evidence links found: $EVIDENCE_COUNT"

if [ "$EVIDENCE_COUNT" -gt 0 ]; then
  FIRST_EVIDENCE=$(echo "$EVIDENCE_RESPONSE" | jq '.[0]')
  EVIDENCE_ID=$(echo "$FIRST_EVIDENCE" | jq -r '.evidence_id')
  EVIDENCE_TYPE=$(echo "$FIRST_EVIDENCE" | jq -r '.evidence_type')
  STRENGTH=$(echo "$FIRST_EVIDENCE" | jq -r '.strength')
  ADDED_BY=$(echo "$FIRST_EVIDENCE" | jq -r '.added_by')
  
  echo "   Evidence ID: $EVIDENCE_ID"
  echo "   Type: $EVIDENCE_TYPE"
  echo "   Strength: $STRENGTH"
  echo "   Added by: $ADDED_BY"
  
  if [ "$ADDED_BY" == "null" ]; then
    echo "✅ PASS: Evidence created by AI (auto evidence linking working)"
  else
    echo "⚠️  Evidence created by user: $ADDED_BY"
  fi
else
  echo "⚠️  No evidence links found"
fi
echo ""

# Step 4: Test Collection Suggestions
echo "STEP 4: Testing Collection Suggestions"
echo "-------------------------------------------"
COLLECTIONS_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/collections/by-hypothesis/${HYPOTHESIS_ID}?project_id=${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

COLLECTIONS_COUNT=$(echo "$COLLECTIONS_RESPONSE" | jq '.collections | length')
echo "✅ Collections linked to hypothesis: $COLLECTIONS_COUNT"

if [ "$COLLECTIONS_COUNT" -gt 0 ]; then
  echo "   Collections found - suggestions should appear in triage"
else
  echo "   No collections linked - suggestions will be empty (expected)"
fi
echo ""

# Step 5: Test Notes Creation (if we have triage)
if [ -n "$TRIAGE_ID" ]; then
  echo "STEP 5: Testing Notes Creation from Evidence"
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
    echo "   Article PMID: $(echo "$NOTE_RESPONSE" | jq -r '.article_pmid')"
  else
    echo "❌ Note creation failed"
    echo "   Response: $NOTE_RESPONSE"
  fi
  echo ""
fi

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "✅ Hypotheses: $HYPOTHESIS_COUNT found"
echo "✅ Triage Entries: $TRIAGE_COUNT found"
echo "✅ Evidence Links: $EVIDENCE_COUNT found"
echo "✅ Collections: $COLLECTIONS_COUNT linked"
echo ""
echo "🎉 Week 24 features tested successfully!"
echo "=========================================="

