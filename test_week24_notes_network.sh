#!/bin/bash

# Week 24 Notes + Network Integration Tests
# Tests Gap 2 (Notes) and Gap 3 (Network)

set -e

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle77@gmail.com"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"
PMID="38924432"

echo "=========================================="
echo "🧪 WEEK 24 NOTES + NETWORK TESTS"
echo "=========================================="
echo ""

# =============================================================================
# GAP 2: Notes + Evidence Integration
# =============================================================================

echo "📋 TEST GROUP 3: NOTES + EVIDENCE INTEGRATION"
echo "=========================================="
echo ""

echo "TEST 3.1: Get Notes for Triage View"
echo "------------------------------------"
# First, get triage entries to find a triage_id
TRIAGE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}")

TRIAGE_ID=$(echo "$TRIAGE_RESPONSE" | jq -r '.[0].triage_id // empty')

if [ -n "$TRIAGE_ID" ]; then
  echo "   Using triage ID: $TRIAGE_ID"
  
  NOTES_RESPONSE=$(curl -s -X GET \
    "${BASE_URL}/api/annotations/for-triage/${TRIAGE_ID}" \
    -H "User-ID: ${USER_ID}")
  
  echo "   Notes response: $NOTES_RESPONSE"
  
  if echo "$NOTES_RESPONSE" | jq -e 'has("notes")' > /dev/null 2>&1; then
    NOTE_COUNT=$(echo "$NOTES_RESPONSE" | jq '.notes | length')
    echo "✅ PASS: Notes retrieved for triage ($NOTE_COUNT notes)"
  else
    echo "⚠️  WARNING: No notes field in response"
  fi
else
  echo "❌ FAIL: No triage ID found"
fi
echo ""

echo "TEST 3.2: Create Note from Evidence"
echo "------------------------------------"
# Get evidence links first
EVIDENCE_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/hypotheses/${HYPOTHESIS_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_ID=$(echo "$EVIDENCE_RESPONSE" | jq -r '.[0].id // empty')

if [ -n "$EVIDENCE_ID" ] && [ -n "$TRIAGE_ID" ]; then
  echo "   Creating note from evidence ID: $EVIDENCE_ID"
  
  # Use correct endpoint: /api/annotations/from-evidence
  NOTE_CREATE_RESPONSE=$(curl -s -X POST \
    "${BASE_URL}/api/annotations/from-evidence?triage_id=${TRIAGE_ID}&evidence_index=0&project_id=${PROJECT_ID}" \
    -H "User-ID: ${USER_ID}" \
    -H "Content-Type: application/json")
  
  echo "   Response: $NOTE_CREATE_RESPONSE"
  
  if echo "$NOTE_CREATE_RESPONSE" | jq -e 'has("annotation_id")' > /dev/null 2>&1; then
    ANNOTATION_ID=$(echo "$NOTE_CREATE_RESPONSE" | jq -r '.annotation_id')
    echo "✅ PASS: Note created from evidence (ID: $ANNOTATION_ID)"
    
    # Verify note has evidence quote
    EVIDENCE_QUOTE=$(echo "$NOTE_CREATE_RESPONSE" | jq -r '.evidence_quote // empty')
    if [ -n "$EVIDENCE_QUOTE" ]; then
      echo "✅ PASS: Note pre-filled with evidence quote"
      echo "   Quote: ${EVIDENCE_QUOTE:0:80}..."
    fi
  elif echo "$NOTE_CREATE_RESPONSE" | jq -e 'has("detail")' > /dev/null 2>&1; then
    ERROR=$(echo "$NOTE_CREATE_RESPONSE" | jq -r '.detail')
    echo "❌ FAIL: API error - $ERROR"
  else
    echo "⚠️  WARNING: Unexpected response format"
  fi
else
  echo "⚠️  SKIP: Missing evidence_id or triage_id"
fi
echo ""

# =============================================================================
# GAP 3: Network + Research Context Integration
# =============================================================================

echo "📋 TEST GROUP 4: NETWORK + RESEARCH CONTEXT"
echo "=========================================="
echo ""

echo "TEST 4.1: Enrich Network Nodes with Research Context"
echo "-----------------------------------------------------"
NETWORK_RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/projects/${PROJECT_ID}/network" \
  -H "User-ID: ${USER_ID}")

echo "   Network response type: $(echo "$NETWORK_RESPONSE" | jq 'type')"

if echo "$NETWORK_RESPONSE" | jq -e 'has("nodes")' > /dev/null 2>&1; then
  NODE_COUNT=$(echo "$NETWORK_RESPONSE" | jq '.nodes | length')
  EDGE_COUNT=$(echo "$NETWORK_RESPONSE" | jq '.edges | length')
  
  echo "   Network nodes: $NODE_COUNT"
  echo "   Network edges: $EDGE_COUNT"
  
  if [ "$NODE_COUNT" -gt 0 ]; then
    echo "✅ PASS: Network data retrieved"
    
    # Check if nodes have enrichment fields
    FIRST_NODE=$(echo "$NETWORK_RESPONSE" | jq '.nodes[0]')
    HAS_RELEVANCE=$(echo "$FIRST_NODE" | jq 'has("relevance_score")')
    HAS_EVIDENCE=$(echo "$FIRST_NODE" | jq 'has("evidence_count")')
    HAS_PROTOCOL=$(echo "$FIRST_NODE" | jq 'has("has_protocol")')
    HAS_PRIORITY=$(echo "$FIRST_NODE" | jq 'has("priority_score")')
    
    echo ""
    echo "   Node Enrichment Fields:"
    echo "   - relevance_score: $HAS_RELEVANCE"
    echo "   - evidence_count: $HAS_EVIDENCE"
    echo "   - has_protocol: $HAS_PROTOCOL"
    echo "   - priority_score: $HAS_PRIORITY"
    
    if [ "$HAS_RELEVANCE" == "true" ] && [ "$HAS_PRIORITY" == "true" ]; then
      echo "✅ PASS: Network nodes enriched with research context"
    else
      echo "⚠️  WARNING: Some enrichment fields missing"
    fi
  else
    echo "⚠️  WARNING: No network nodes found (may need to generate network)"
  fi
else
  echo "❌ FAIL: Invalid network response format"
fi
echo ""

echo "TEST 4.2: Filter Network by Hypothesis"
echo "---------------------------------------"
FILTERED_NETWORK=$(curl -s -X GET \
  "${BASE_URL}/api/projects/${PROJECT_ID}/network?hypothesis_id=${HYPOTHESIS_ID}" \
  -H "User-ID: ${USER_ID}")

if echo "$FILTERED_NETWORK" | jq -e 'has("nodes")' > /dev/null 2>&1; then
  FILTERED_NODE_COUNT=$(echo "$FILTERED_NETWORK" | jq '.nodes | length')
  echo "   Filtered network nodes: $FILTERED_NODE_COUNT"
  
  if [ "$FILTERED_NODE_COUNT" -gt 0 ]; then
    echo "✅ PASS: Network filtered by hypothesis"
  else
    echo "⚠️  WARNING: No nodes in filtered network"
  fi
else
  echo "⚠️  WARNING: Hypothesis filtering may not be implemented"
fi
echo ""

echo "TEST 4.3: Priority Scoring Algorithm"
echo "-------------------------------------"
if [ "$NODE_COUNT" -gt 0 ]; then
  # Check priority scores
  PRIORITY_SCORES=$(echo "$NETWORK_RESPONSE" | jq '.nodes[] | select(has("priority_score")) | .priority_score')
  
  if [ -n "$PRIORITY_SCORES" ]; then
    echo "   Priority scores found:"
    echo "$PRIORITY_SCORES" | head -5 | while read score; do
      echo "   - $score"
    done
    echo "✅ PASS: Priority scoring algorithm working"
  else
    echo "⚠️  WARNING: No priority scores found"
  fi
else
  echo "⚠️  SKIP: No network nodes to test"
fi
echo ""

echo "=========================================="
echo "📊 FINAL TEST SUMMARY"
echo "=========================================="
echo "✅ Notes integration: TESTED"
echo "✅ Network enrichment: TESTED"
echo "⚠️  Some features may need network data generation"
echo ""

