#!/bin/bash

# Week 24: Test Production Endpoints After Backward Compatibility Fix
# Tests that Smart Inbox and Protocols tabs are loading correctly

set -e

USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
BASE_URL="https://r-dagent-production.up.railway.app"

echo "=========================================="
echo "🧪 TESTING PRODUCTION ENDPOINTS"
echo "=========================================="
echo ""

# Test 1: Smart Inbox (Triage)
echo "📋 Test 1: Smart Inbox (Triage Endpoint)"
echo "----------------------------------------"
TRIAGE_RESPONSE=$(curl -s "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}")

TRIAGE_TYPE=$(echo "$TRIAGE_RESPONSE" | jq -r 'type')
if [ "$TRIAGE_TYPE" == "array" ]; then
    TRIAGE_COUNT=$(echo "$TRIAGE_RESPONSE" | jq 'length')
    echo "✅ Smart Inbox working: $TRIAGE_COUNT papers"
else
    echo "❌ Smart Inbox failed:"
    echo "$TRIAGE_RESPONSE" | jq '.detail'
    exit 1
fi
echo ""

# Test 2: Protocols
echo "📋 Test 2: Protocols Endpoint"
echo "----------------------------------------"
PROTOCOLS_RESPONSE=$(curl -s "${BASE_URL}/api/protocols/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

PROTOCOLS_TYPE=$(echo "$PROTOCOLS_RESPONSE" | jq -r 'type')
if [ "$PROTOCOLS_TYPE" == "array" ]; then
    PROTOCOLS_COUNT=$(echo "$PROTOCOLS_RESPONSE" | jq 'length')
    echo "✅ Protocols working: $PROTOCOLS_COUNT protocols"
else
    echo "❌ Protocols failed:"
    echo "$PROTOCOLS_RESPONSE" | jq '.detail'
    exit 1
fi
echo ""

# Test 3: Protocol Data Structure
echo "📋 Test 3: Protocol Data Structure"
echo "----------------------------------------"
FIRST_PROTOCOL=$(echo "$PROTOCOLS_RESPONSE" | jq '.[0]')

# Check key_parameters is array of strings
KEY_PARAMS_TYPE=$(echo "$FIRST_PROTOCOL" | jq -r '.key_parameters | type')
if [ "$KEY_PARAMS_TYPE" == "array" ]; then
    KEY_PARAMS_COUNT=$(echo "$FIRST_PROTOCOL" | jq '.key_parameters | length')
    FIRST_KEY_PARAM_TYPE=$(echo "$FIRST_PROTOCOL" | jq -r '.key_parameters[0] | type')
    if [ "$FIRST_KEY_PARAM_TYPE" == "string" ]; then
        echo "✅ key_parameters: array of $KEY_PARAMS_COUNT strings"
    else
        echo "❌ key_parameters[0] is not a string: $FIRST_KEY_PARAM_TYPE"
        exit 1
    fi
else
    echo "❌ key_parameters is not an array: $KEY_PARAMS_TYPE"
    exit 1
fi

# Check recommendations is array of dicts
RECOMMENDATIONS_TYPE=$(echo "$FIRST_PROTOCOL" | jq -r '.recommendations | type')
if [ "$RECOMMENDATIONS_TYPE" == "array" ]; then
    RECOMMENDATIONS_COUNT=$(echo "$FIRST_PROTOCOL" | jq '.recommendations | length')
    if [ "$RECOMMENDATIONS_COUNT" -gt 0 ]; then
        FIRST_REC_TYPE=$(echo "$FIRST_PROTOCOL" | jq -r '.recommendations[0] | type')
        if [ "$FIRST_REC_TYPE" == "object" ]; then
            echo "✅ recommendations: array of $RECOMMENDATIONS_COUNT dicts"
        else
            echo "❌ recommendations[0] is not a dict: $FIRST_REC_TYPE"
            exit 1
        fi
    else
        echo "✅ recommendations: empty array"
    fi
else
    echo "❌ recommendations is not an array: $RECOMMENDATIONS_TYPE"
    exit 1
fi
echo ""

# Test 4: AI Insights
echo "📋 Test 4: AI Insights Endpoint"
echo "----------------------------------------"
INSIGHTS_RESPONSE=$(curl -s "${BASE_URL}/api/insights/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

INSIGHTS_TYPE=$(echo "$INSIGHTS_RESPONSE" | jq -r 'type')
if [ "$INSIGHTS_TYPE" == "object" ]; then
    INSIGHTS_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.insights | length')
    echo "✅ AI Insights working: $INSIGHTS_COUNT insights"
else
    echo "❌ AI Insights failed:"
    echo "$INSIGHTS_RESPONSE" | jq '.detail'
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ ALL TESTS PASSED"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Smart Inbox: ✅ $TRIAGE_COUNT papers"
echo "- Protocols: ✅ $PROTOCOLS_COUNT protocols"
echo "- AI Insights: ✅ $INSIGHTS_COUNT insights"
echo "- Data structure: ✅ Correct format"
echo ""
echo "🎉 Smart Inbox and Protocols tabs are working!"

