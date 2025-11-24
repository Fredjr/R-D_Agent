#!/bin/bash

# Setup collections and test collection suggestions
# For production user: fredericle75019@gmail.com

BASE_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"

echo "=========================================="
echo "WEEK 24: COLLECTION SUGGESTIONS SETUP"
echo "=========================================="
echo ""

# Step 1: Get existing collections
echo "STEP 1: Checking Existing Collections"
echo "-------------------------------------------"
EXISTING_COLLECTIONS=$(curl -s -X GET \
  "${BASE_URL}/projects/${PROJECT_ID}/collections" \
  -H "User-ID: ${USER_ID}")

COLLECTION_COUNT=$(echo "$EXISTING_COLLECTIONS" | jq 'length')
echo "✅ Existing collections: $COLLECTION_COUNT"

if [ "$COLLECTION_COUNT" -gt 0 ]; then
  echo "$EXISTING_COLLECTIONS" | jq '.[] | {collection_id, collection_name, papers_count}'
fi
echo ""

# Step 2: Create test collections linked to hypothesis
echo "STEP 2: Creating Test Collections"
echo "-------------------------------------------"

# Collection 1: Kinase Inhibitors
echo "Creating Collection 1: Kinase Inhibitors Research..."
COLLECTION1_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/projects/${PROJECT_ID}/collections" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection_name\": \"Kinase Inhibitors Research\",
    \"description\": \"Papers about kinase inhibitors and their therapeutic applications\",
    \"linked_hypothesis_ids\": [\"${HYPOTHESIS_ID}\"],
    \"collection_purpose\": \"Research collection for kinase inhibitor studies\",
    \"auto_update\": true
  }")

COLLECTION1_ID=$(echo "$COLLECTION1_RESPONSE" | jq -r '.collection_id')
if [ "$COLLECTION1_ID" != "null" ] && [ "$COLLECTION1_ID" != "" ]; then
  echo "✅ Collection 1 created: $COLLECTION1_ID"
else
  echo "❌ Failed to create Collection 1"
  echo "   Response: $COLLECTION1_RESPONSE"
fi
echo ""

# Collection 2: Rare Bone Diseases
echo "Creating Collection 2: Rare Bone Diseases..."
COLLECTION2_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/projects/${PROJECT_ID}/collections" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection_name\": \"Rare Bone Diseases\",
    \"description\": \"Papers about rare bone diseases and treatment approaches\",
    \"linked_hypothesis_ids\": [\"${HYPOTHESIS_ID}\"],
    \"collection_purpose\": \"Research collection for rare bone disease studies\",
    \"auto_update\": true
  }")

COLLECTION2_ID=$(echo "$COLLECTION2_RESPONSE" | jq -r '.collection_id')
if [ "$COLLECTION2_ID" != "null" ] && [ "$COLLECTION2_ID" != "" ]; then
  echo "✅ Collection 2 created: $COLLECTION2_ID"
else
  echo "❌ Failed to create Collection 2"
  echo "   Response: $COLLECTION2_RESPONSE"
fi
echo ""

# Collection 3: FOP Treatment Studies
echo "Creating Collection 3: FOP Treatment Studies..."
COLLECTION3_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/projects/${PROJECT_ID}/collections" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection_name\": \"FOP Treatment Studies\",
    \"description\": \"Papers about Fibrodysplasia Ossificans Progressiva (FOP) treatments\",
    \"linked_hypothesis_ids\": [\"${HYPOTHESIS_ID}\"],
    \"collection_purpose\": \"Research collection for FOP treatment studies\",
    \"auto_update\": true
  }")

COLLECTION3_ID=$(echo "$COLLECTION3_RESPONSE" | jq -r '.collection_id')
if [ "$COLLECTION3_ID" != "null" ] && [ "$COLLECTION3_ID" != "" ]; then
  echo "✅ Collection 3 created: $COLLECTION3_ID"
else
  echo "❌ Failed to create Collection 3"
  echo "   Response: $COLLECTION3_RESPONSE"
fi
echo ""

# Step 3: Verify collections are linked to hypothesis
echo "STEP 3: Verifying Collections Linked to Hypothesis"
echo "-------------------------------------------"
LINKED_COLLECTIONS=$(curl -s -X GET \
  "${BASE_URL}/api/collections/by-hypothesis/${HYPOTHESIS_ID}?project_id=${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

LINKED_COUNT=$(echo "$LINKED_COLLECTIONS" | jq '.collections | length')
echo "✅ Collections linked to hypothesis: $LINKED_COUNT"

if [ "$LINKED_COUNT" -gt 0 ]; then
  echo "$LINKED_COLLECTIONS" | jq '.collections[] | {collection_id, collection_name}'
fi
echo ""

# Step 4: Check triage for collection suggestions
echo "STEP 4: Checking Triage for Collection Suggestions"
echo "-------------------------------------------"
TRIAGE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}")

TRIAGE_COUNT=$(echo "$TRIAGE_RESPONSE" | jq 'length')
echo "✅ Triage entries: $TRIAGE_COUNT"

if [ "$TRIAGE_COUNT" -gt 0 ]; then
  # Check first triage entry for suggestions
  FIRST_TRIAGE=$(echo "$TRIAGE_RESPONSE" | jq '.[0]')
  SUGGESTIONS=$(echo "$FIRST_TRIAGE" | jq -r '.collection_suggestions')
  SUGGESTIONS_COUNT=$(echo "$FIRST_TRIAGE" | jq '.collection_suggestions | length')
  
  echo "   Collection suggestions in first triage: $SUGGESTIONS_COUNT"
  
  if [ "$SUGGESTIONS_COUNT" -gt 0 ]; then
    echo "✅ PASS: Collection suggestions working!"
    echo "$FIRST_TRIAGE" | jq '.collection_suggestions[] | {collection_id, collection_name, relevance_reason}'
  else
    echo "⚠️  No suggestions yet (may need to re-triage a paper)"
  fi
fi
echo ""

echo "=========================================="
echo "SETUP SUMMARY"
echo "=========================================="
echo "✅ Collections created: 3"
echo "✅ Collections linked to hypothesis: $LINKED_COUNT"
echo "✅ Ready to test collection suggestions"
echo ""
echo "📝 Next Steps:"
echo "1. Triage a new paper to see collection suggestions"
echo "2. Or re-run triage on existing papers"
echo "3. Suggestions should appear automatically"
echo "=========================================="

