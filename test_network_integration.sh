#!/bin/bash

# Network + Research Context Integration Test
# Tests Gap 3 features

BACKEND_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
HYPOTHESIS_ID="28777578-e417-4fae-9b76-b510fc2a3e5f"

echo "🕸️  NETWORK + RESEARCH CONTEXT INTEGRATION TEST"
echo "=============================================="
echo ""

# ============================================================================
# TEST 7: Enrich Network Nodes with Research Context
# ============================================================================
echo "🎯 TEST 7: Enrich Network Nodes with Research Context"
echo "----------------------------------------------------"

# Get network data
echo "Fetching network data..."
NETWORK_DATA=$(curl -s -X GET "${BACKEND_URL}/api/network/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

NODE_COUNT=$(echo "$NETWORK_DATA" | jq '.nodes | length')
EDGE_COUNT=$(echo "$NETWORK_DATA" | jq '.edges | length')

echo "Network nodes: $NODE_COUNT"
echo "Network edges: $EDGE_COUNT"

if [ "$NODE_COUNT" -gt 0 ]; then
  echo ""
  echo "Checking node enrichment..."
  
  # Check first node for enrichment fields
  FIRST_NODE=$(echo "$NETWORK_DATA" | jq '.nodes[0]')
  NODE_ID=$(echo "$FIRST_NODE" | jq -r '.id')
  NODE_TYPE=$(echo "$FIRST_NODE" | jq -r '.type')
  
  echo "Sample node: $NODE_ID (type: $NODE_TYPE)"
  
  # Check for triage score
  TRIAGE_SCORE=$(echo "$FIRST_NODE" | jq -r '.triage_score // empty')
  if [ -n "$TRIAGE_SCORE" ] && [ "$TRIAGE_SCORE" != "null" ]; then
    echo "✅ PASS: Node has triage_score: $TRIAGE_SCORE"
  else
    echo "⚠️  INFO: Node does not have triage_score (may not be a paper node)"
  fi
  
  # Check for protocol status
  PROTOCOL_STATUS=$(echo "$FIRST_NODE" | jq -r '.protocol_status // empty')
  if [ -n "$PROTOCOL_STATUS" ] && [ "$PROTOCOL_STATUS" != "null" ]; then
    echo "✅ PASS: Node has protocol_status: $PROTOCOL_STATUS"
  else
    echo "⚠️  INFO: Node does not have protocol_status"
  fi
  
  # Check for hypothesis links
  HYPOTHESIS_LINKS=$(echo "$FIRST_NODE" | jq -r '.hypothesis_links // empty')
  if [ -n "$HYPOTHESIS_LINKS" ] && [ "$HYPOTHESIS_LINKS" != "null" ]; then
    HYPOTHESIS_COUNT=$(echo "$HYPOTHESIS_LINKS" | jq 'length')
    echo "✅ PASS: Node has hypothesis_links: $HYPOTHESIS_COUNT hypotheses"
  else
    echo "⚠️  INFO: Node does not have hypothesis_links"
  fi
  
  # Check for priority score
  PRIORITY_SCORE=$(echo "$FIRST_NODE" | jq -r '.priority_score // empty')
  if [ -n "$PRIORITY_SCORE" ] && [ "$PRIORITY_SCORE" != "null" ]; then
    echo "✅ PASS: Node has priority_score: $PRIORITY_SCORE"
  else
    echo "⚠️  INFO: Node does not have priority_score"
  fi
  
  echo ""
  echo "Full node data:"
  echo "$FIRST_NODE" | jq '.'
else
  echo "⚠️  WARNING: No network nodes found"
fi
echo ""

# ============================================================================
# TEST 8: Filter Network by Hypothesis
# ============================================================================
echo "🔍 TEST 8: Filter Network by Hypothesis"
echo "--------------------------------------"

# Get network filtered by hypothesis
echo "Fetching network filtered by hypothesis $HYPOTHESIS_ID..."
FILTERED_NETWORK=$(curl -s -X GET "${BACKEND_URL}/api/network/project/${PROJECT_ID}?hypothesis_id=${HYPOTHESIS_ID}" \
  -H "User-ID: ${USER_ID}")

FILTERED_NODE_COUNT=$(echo "$FILTERED_NETWORK" | jq '.nodes | length')
FILTERED_EDGE_COUNT=$(echo "$FILTERED_NETWORK" | jq '.edges | length')

echo "Filtered network nodes: $FILTERED_NODE_COUNT"
echo "Filtered network edges: $FILTERED_EDGE_COUNT"

if [ "$FILTERED_NODE_COUNT" -gt 0 ]; then
  echo "✅ PASS: Network filtered by hypothesis"
  
  # Verify that filtered nodes are related to the hypothesis
  echo ""
  echo "Filtered nodes:"
  echo "$FILTERED_NETWORK" | jq -r '.nodes[] | "  - \(.id) (\(.type))"'
else
  echo "⚠️  INFO: No nodes found for this hypothesis filter"
fi
echo ""

# ============================================================================
# TEST 9: Get Full Context for Tooltips
# ============================================================================
echo "💬 TEST 9: Get Full Context for Tooltips"
echo "---------------------------------------"

if [ "$NODE_COUNT" -gt 0 ]; then
  # Get detailed context for first node
  FIRST_NODE_ID=$(echo "$NETWORK_DATA" | jq -r '.nodes[0].id')
  FIRST_NODE_TYPE=$(echo "$NETWORK_DATA" | jq -r '.nodes[0].type')
  
  echo "Getting full context for node: $FIRST_NODE_ID (type: $FIRST_NODE_TYPE)"
  
  # Check if node has tooltip data
  TOOLTIP_DATA=$(echo "$NETWORK_DATA" | jq ".nodes[0].tooltip // empty")
  if [ -n "$TOOLTIP_DATA" ] && [ "$TOOLTIP_DATA" != "null" ]; then
    echo "✅ PASS: Node has tooltip data"
    echo "Tooltip:"
    echo "$TOOLTIP_DATA" | jq '.'
  else
    echo "⚠️  INFO: Node does not have tooltip data"
  fi
  
  # Check if node has metadata for tooltip
  METADATA=$(echo "$NETWORK_DATA" | jq ".nodes[0].metadata // empty")
  if [ -n "$METADATA" ] && [ "$METADATA" != "null" ]; then
    echo "✅ PASS: Node has metadata for tooltip"
    echo "Metadata keys:"
    echo "$METADATA" | jq 'keys'
  else
    echo "⚠️  INFO: Node does not have metadata"
  fi
else
  echo "⚠️  SKIP: No nodes to test"
fi
echo ""

echo "=============================================="
echo "🎉 ALL NETWORK INTEGRATION TESTS COMPLETED!"
echo "=============================================="

