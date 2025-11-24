#!/bin/bash

# Comprehensive Integration Features Test
# Tests all Gap 1, 2, 3 features

BACKEND_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"
PAPER_PMID="38924432"

echo "🧪 COMPREHENSIVE INTEGRATION FEATURES TEST"
echo "=========================================="
echo ""

# ============================================================================
# TEST 1: Smart Collection Suggestions After Triage
# ============================================================================
echo "📚 TEST 1: Smart Collection Suggestions After Triage"
echo "---------------------------------------------------"

# Trigger triage with force_refresh to get fresh suggestions
echo "Triggering AI triage for paper $PAPER_PMID..."
TRIAGE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -H "Content-Type: application/json" \
  -H "User-ID: ${USER_ID}" \
  -d "{\"article_pmid\": \"${PAPER_PMID}\", \"force_refresh\": true}")

echo "Triage response:"
echo "$TRIAGE_RESPONSE" | jq '.'

# Check if collection_suggestions exists
COLLECTION_SUGGESTIONS=$(echo "$TRIAGE_RESPONSE" | jq -r '.collection_suggestions // empty')
if [ -n "$COLLECTION_SUGGESTIONS" ]; then
  SUGGESTION_COUNT=$(echo "$COLLECTION_SUGGESTIONS" | jq 'length')
  echo "✅ PASS: Collection suggestions generated ($SUGGESTION_COUNT suggestions)"
  echo "Suggestions:"
  echo "$COLLECTION_SUGGESTIONS" | jq -r '.[] | "  - \(.name): \(.reason)"'
else
  echo "⚠️  WARNING: No collection suggestions in triage response"
fi
echo ""

# ============================================================================
# TEST 2: Filter Collections by Hypothesis
# ============================================================================
echo "🔍 TEST 2: Filter Collections by Hypothesis"
echo "------------------------------------------"

# Get all collections
COLLECTIONS=$(curl -s -X GET "${BACKEND_URL}/api/collections/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

COLLECTION_COUNT=$(echo "$COLLECTIONS" | jq 'length')
echo "Total collections: $COLLECTION_COUNT"

if [ "$COLLECTION_COUNT" -gt 0 ]; then
  # Get first collection ID
  COLLECTION_ID=$(echo "$COLLECTIONS" | jq -r '.[0].collection_id')
  COLLECTION_NAME=$(echo "$COLLECTIONS" | jq -r '.[0].name')
  
  echo "Testing with collection: $COLLECTION_NAME (ID: $COLLECTION_ID)"
  
  # Check if collection has hypothesis_id field
  HYP_ID=$(echo "$COLLECTIONS" | jq -r ".[0].hypothesis_id // empty")
  if [ -n "$HYP_ID" ] && [ "$HYP_ID" != "null" ]; then
    echo "✅ PASS: Collection has hypothesis_id field: $HYP_ID"
  else
    echo "⚠️  INFO: Collection does not have hypothesis_id (may be a general collection)"
  fi
else
  echo "⚠️  WARNING: No collections found in project"
fi
echo ""

# ============================================================================
# TEST 3: Auto Update Collections with New Papers
# ============================================================================
echo "📥 TEST 3: Auto Update Collections with New Papers"
echo "-------------------------------------------------"

if [ "$COLLECTION_COUNT" -gt 0 ]; then
  # Get collection papers before triage
  COLLECTION_PAPERS_BEFORE=$(curl -s -X GET "${BACKEND_URL}/api/collections/${COLLECTION_ID}/papers" \
    -H "User-ID: ${USER_ID}")
  
  PAPERS_COUNT_BEFORE=$(echo "$COLLECTION_PAPERS_BEFORE" | jq 'length')
  echo "Papers in collection before: $PAPERS_COUNT_BEFORE"
  
  # Note: Auto-update happens during triage (already triggered above)
  # Get collection papers after triage
  sleep 2
  COLLECTION_PAPERS_AFTER=$(curl -s -X GET "${BACKEND_URL}/api/collections/${COLLECTION_ID}/papers" \
    -H "User-ID: ${USER_ID}")
  
  PAPERS_COUNT_AFTER=$(echo "$COLLECTION_PAPERS_AFTER" | jq 'length')
  echo "Papers in collection after: $PAPERS_COUNT_AFTER"
  
  if [ "$PAPERS_COUNT_AFTER" -ge "$PAPERS_COUNT_BEFORE" ]; then
    echo "✅ PASS: Collection papers count maintained or increased"
  else
    echo "⚠️  WARNING: Collection papers count decreased"
  fi
else
  echo "⚠️  SKIP: No collections to test"
fi
echo ""

# ============================================================================
# TEST 4: Validation to Prevent Invalid Links
# ============================================================================
echo "🛡️  TEST 4: Validation to Prevent Invalid Links"
echo "----------------------------------------------"

# Try to create duplicate evidence link
echo "Testing duplicate evidence link prevention..."
DUPLICATE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "Content-Type: application/json" \
  -H "User-ID: ${USER_ID}" \
  -d "{
    \"article_pmid\": \"${PAPER_PMID}\",
    \"evidence_type\": \"supports\",
    \"strength\": \"moderate\",
    \"key_finding\": \"Test duplicate\"
  }")

echo "Response: $DUPLICATE_RESPONSE"

# Check if it's an error response
if echo "$DUPLICATE_RESPONSE" | jq -e '.detail' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$DUPLICATE_RESPONSE" | jq -r '.detail')
  if [[ "$ERROR_MSG" == *"already exists"* ]] || [[ "$ERROR_MSG" == *"duplicate"* ]]; then
    echo "✅ PASS: Duplicate evidence link prevented"
  else
    echo "⚠️  WARNING: Got error but not duplicate prevention: $ERROR_MSG"
  fi
else
  echo "⚠️  WARNING: Duplicate evidence link was created (should have been prevented)"
fi
echo ""

# ============================================================================
# TEST 5: Notes + Evidence Integration
# ============================================================================
echo "📝 TEST 5: Notes + Evidence Integration"
echo "--------------------------------------"

# Get evidence links for hypothesis
EVIDENCE_LINKS=$(curl -s -X GET "${BACKEND_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT=$(echo "$EVIDENCE_LINKS" | jq 'length')
echo "Evidence links found: $EVIDENCE_COUNT"

if [ "$EVIDENCE_COUNT" -gt 0 ]; then
  EVIDENCE_ID=$(echo "$EVIDENCE_LINKS" | jq -r '.[0].id')
  KEY_FINDING=$(echo "$EVIDENCE_LINKS" | jq -r '.[0].key_finding // "No key finding"')

  echo "Testing with evidence ID: $EVIDENCE_ID"
  echo "Key finding: $KEY_FINDING"

  # Test: Create note from evidence (one-click note creation)
  echo ""
  echo "Creating note from evidence..."
  NOTE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/notes" \
    -H "Content-Type: application/json" \
    -H "User-ID: ${USER_ID}" \
    -d "{
      \"project_id\": \"${PROJECT_ID}\",
      \"title\": \"Note from Evidence ${EVIDENCE_ID}\",
      \"content\": \"Evidence quote: ${KEY_FINDING}\",
      \"note_type\": \"observation\",
      \"evidence_id\": ${EVIDENCE_ID}
    }")

  NOTE_ID=$(echo "$NOTE_RESPONSE" | jq -r '.note_id // empty')
  if [ -n "$NOTE_ID" ] && [ "$NOTE_ID" != "null" ]; then
    echo "✅ PASS: Note created from evidence (ID: $NOTE_ID)"

    # Verify note has evidence_id link
    NOTE_EVIDENCE_ID=$(echo "$NOTE_RESPONSE" | jq -r '.evidence_id // empty')
    if [ "$NOTE_EVIDENCE_ID" == "$EVIDENCE_ID" ]; then
      echo "✅ PASS: Note correctly linked to evidence"
    else
      echo "⚠️  WARNING: Note not linked to evidence"
    fi

    # Verify note has pre-filled content
    NOTE_CONTENT=$(echo "$NOTE_RESPONSE" | jq -r '.content')
    if [[ "$NOTE_CONTENT" == *"Evidence quote"* ]]; then
      echo "✅ PASS: Note has pre-filled content with evidence quote"
    else
      echo "⚠️  WARNING: Note content not pre-filled"
    fi
  else
    echo "❌ FAIL: Failed to create note from evidence"
    echo "Response: $NOTE_RESPONSE"
  fi
else
  echo "⚠️  SKIP: No evidence links to test"
fi
echo ""

# ============================================================================
# TEST 6: Get Notes for Triage View
# ============================================================================
echo "📋 TEST 6: Get Notes for Triage View"
echo "-----------------------------------"

# Get notes for the paper
PAPER_NOTES=$(curl -s -X GET "${BACKEND_URL}/api/notes/article/${PAPER_PMID}" \
  -H "User-ID: ${USER_ID}")

NOTES_COUNT=$(echo "$PAPER_NOTES" | jq 'length')
echo "Notes for paper $PAPER_PMID: $NOTES_COUNT"

if [ "$NOTES_COUNT" -gt 0 ]; then
  echo "✅ PASS: Notes retrieved for triage view"
  echo "Notes:"
  echo "$PAPER_NOTES" | jq -r '.[] | "  - \(.title): \(.content[:50])..."'
else
  echo "⚠️  INFO: No notes found for this paper"
fi
echo ""

echo "=========================================="
echo "🎉 PART 1 TESTS COMPLETED!"
echo "=========================================="

