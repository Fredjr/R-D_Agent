#!/bin/bash

# Week 24 Phase 2: Test Protocol Extractor Multi-Agent System

set -e

echo "========================================="
echo "TEST PROTOCOL EXTRACTOR MULTI-AGENT"
echo "========================================="
echo ""

# Configuration
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
BASE_URL="https://r-dagent-production.up.railway.app"
PMID="33099609"  # Mineralocorticoid receptor antagonists paper (has good methods section)

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  User ID: $USER_ID"
echo "  Base URL: $BASE_URL"
echo "  PMID: $PMID"
echo ""

echo "🔄 Extracting protocol with force_refresh=true..."
echo ""

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/protocols/extract" \
    -H "User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d "{
        \"article_pmid\": \"${PMID}\",
        \"project_id\": \"${PROJECT_ID}\",
        \"force_refresh\": true
    }")

echo "📥 Response received"
echo ""

# Check if successful
PROTOCOL_ID=$(echo "$RESPONSE" | jq -r '.protocol_id')
if [ "$PROTOCOL_ID" != "null" ] && [ -n "$PROTOCOL_ID" ]; then
    echo "✅ Protocol extraction successful!"
    echo "  Protocol ID: $PROTOCOL_ID"
    
    # Extract key fields
    PROTOCOL_NAME=$(echo "$RESPONSE" | jq -r '.protocol_name')
    PROTOCOL_TYPE=$(echo "$RESPONSE" | jq -r '.protocol_type')
    MATERIALS_COUNT=$(echo "$RESPONSE" | jq '.materials | length')
    STEPS_COUNT=$(echo "$RESPONSE" | jq '.steps | length')
    EQUIPMENT_COUNT=$(echo "$RESPONSE" | jq '.equipment | length')
    KEY_PARAMS_COUNT=$(echo "$RESPONSE" | jq '.key_parameters | length')
    EXPECTED_OUTCOMES_COUNT=$(echo "$RESPONSE" | jq '.expected_outcomes | length')
    TROUBLESHOOTING_COUNT=$(echo "$RESPONSE" | jq '.troubleshooting_tips | length')
    RELEVANCE_SCORE=$(echo "$RESPONSE" | jq -r '.relevance_score')
    EXTRACTION_CONFIDENCE=$(echo "$RESPONSE" | jq -r '.extraction_confidence')
    EXTRACTION_METHOD=$(echo "$RESPONSE" | jq -r '.extraction_method')
    
    echo ""
    echo "📊 PROTOCOL RESULTS:"
    echo "  Name: $PROTOCOL_NAME"
    echo "  Type: $PROTOCOL_TYPE"
    echo "  Extraction Method: $EXTRACTION_METHOD"
    echo "  Materials: $MATERIALS_COUNT"
    echo "  Steps: $STEPS_COUNT"
    echo "  Equipment: $EQUIPMENT_COUNT"
    echo "  Key Parameters: $KEY_PARAMS_COUNT"
    echo "  Expected Outcomes: $EXPECTED_OUTCOMES_COUNT"
    echo "  Troubleshooting Tips: $TROUBLESHOOTING_COUNT"
    echo "  Relevance Score: $RELEVANCE_SCORE/100"
    echo "  Extraction Confidence: $EXTRACTION_CONFIDENCE/100"
    echo ""
    
    # Show sample data
    if [ "$KEY_PARAMS_COUNT" -gt 0 ]; then
        echo "🔑 KEY PARAMETERS (sample):"
        echo "$RESPONSE" | jq -r '.key_parameters[:2][] | "  Parameter: \(.parameter)\n  Value: \(.value)\n  Importance: \(.importance)\n"'
        echo ""
    else
        echo "⚠️  NO KEY PARAMETERS FOUND!"
        echo ""
    fi
    
    if [ "$EXPECTED_OUTCOMES_COUNT" -gt 0 ]; then
        echo "🎯 EXPECTED OUTCOMES (sample):"
        echo "$RESPONSE" | jq -r '.expected_outcomes[:2][] | "  - \(.)"'
        echo ""
    else
        echo "⚠️  NO EXPECTED OUTCOMES FOUND!"
        echo ""
    fi
    
    if [ "$TROUBLESHOOTING_COUNT" -gt 0 ]; then
        echo "🔧 TROUBLESHOOTING TIPS (sample):"
        echo "$RESPONSE" | jq -r '.troubleshooting_tips[:2][] | "  Issue: \(.issue)\n  Solution: \(.solution)\n"'
        echo ""
    else
        echo "⚠️  NO TROUBLESHOOTING TIPS FOUND!"
        echo ""
    fi
    
    # Success criteria check
    echo "========================================="
    echo "✅ SUCCESS CRITERIA CHECK:"
    echo "========================================="
    PASS_COUNT=0
    TOTAL_COUNT=10
    
    [ "$MATERIALS_COUNT" -gt 0 ] && echo "  ✅ Materials populated ($MATERIALS_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Materials EMPTY"
    [ "$STEPS_COUNT" -gt 0 ] && echo "  ✅ Steps populated ($STEPS_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Steps EMPTY"
    [ "$EQUIPMENT_COUNT" -gt 0 ] && echo "  ✅ Equipment populated ($EQUIPMENT_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Equipment EMPTY"
    [ "$KEY_PARAMS_COUNT" -ge 2 ] && echo "  ✅ Key parameters populated ($KEY_PARAMS_COUNT ≥ 2)" && ((PASS_COUNT++)) || echo "  ❌ Key parameters insufficient ($KEY_PARAMS_COUNT < 2)"
    [ "$EXPECTED_OUTCOMES_COUNT" -ge 2 ] && echo "  ✅ Expected outcomes populated ($EXPECTED_OUTCOMES_COUNT ≥ 2)" && ((PASS_COUNT++)) || echo "  ❌ Expected outcomes insufficient ($EXPECTED_OUTCOMES_COUNT < 2)"
    [ "$TROUBLESHOOTING_COUNT" -ge 2 ] && echo "  ✅ Troubleshooting tips populated ($TROUBLESHOOTING_COUNT ≥ 2)" && ((PASS_COUNT++)) || echo "  ❌ Troubleshooting tips insufficient ($TROUBLESHOOTING_COUNT < 2)"
    [ "$RELEVANCE_SCORE" != "null" ] && [ "$RELEVANCE_SCORE" -ge 0 ] && echo "  ✅ Relevance score calculated ($RELEVANCE_SCORE/100)" && ((PASS_COUNT++)) || echo "  ❌ Relevance score missing"
    [ "$EXTRACTION_CONFIDENCE" != "null" ] && [ "$EXTRACTION_CONFIDENCE" -ge 0 ] && echo "  ✅ Extraction confidence calculated ($EXTRACTION_CONFIDENCE/100)" && ((PASS_COUNT++)) || echo "  ❌ Extraction confidence missing"
    [ "$EXTRACTION_METHOD" == "intelligent_multi_agent_v1" ] && echo "  ✅ Multi-agent system used" && ((PASS_COUNT++)) || echo "  ⚠️  Legacy system used ($EXTRACTION_METHOD)"
    
    # Check material sources
    MATERIAL_SOURCES_COUNT=$(echo "$RESPONSE" | jq '.material_sources | length')
    [ "$MATERIAL_SOURCES_COUNT" -gt 0 ] && echo "  ✅ Material sources cited ($MATERIAL_SOURCES_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Material sources EMPTY"
    
    echo ""
    echo "📈 FINAL SCORE: $PASS_COUNT/$TOTAL_COUNT criteria passed"
    echo ""
    
    if [ "$PASS_COUNT" -ge 8 ]; then
        echo "🎉 SUCCESS! Multi-agent protocol extraction is working well!"
    else
        echo "⚠️  WARNING: Some criteria not met. Check logs."
    fi
else
    echo "❌ Protocol extraction failed!"
    echo "Response: $RESPONSE"
    exit 1
fi

