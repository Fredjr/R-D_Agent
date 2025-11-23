#!/bin/bash

# Validation test for all 3 multi-agent systems
# Week 24: Multi-Agent Systems Validation

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"

echo "========================================="
echo "MULTI-AGENT SYSTEMS VALIDATION"
echo "Week 24: All 3 Phases"
echo "========================================="
echo ""

PASS_COUNT=0
TOTAL_TESTS=3

# Test 1: Phase 3 - AI Insights (most reliable)
echo "🧪 TEST 1: AI Insights Multi-Agent"
echo "========================================="
echo ""

INSIGHTS=$(curl -s "$BASE_URL/insights/projects/$PROJECT_ID/insights" \
  -H "User-ID: $USER_ID")

PROGRESS_COUNT=$(echo "$INSIGHTS" | jq '.progress_insights | length')
CONNECTION_COUNT=$(echo "$INSIGHTS" | jq '.connection_insights | length')
GAP_COUNT=$(echo "$INSIGHTS" | jq '.gap_insights | length')
TREND_COUNT=$(echo "$INSIGHTS" | jq '.trend_insights | length')
REC_COUNT=$(echo "$INSIGHTS" | jq '.recommendations | length')
TOTAL_INSIGHTS=$((PROGRESS_COUNT + CONNECTION_COUNT + GAP_COUNT + TREND_COUNT + REC_COUNT))

echo "Results:"
echo "  Progress insights: $PROGRESS_COUNT"
echo "  Connection insights: $CONNECTION_COUNT"
echo "  Gap insights: $GAP_COUNT"
echo "  Trend insights: $TREND_COUNT"
echo "  Recommendations: $REC_COUNT"
echo "  Total: $TOTAL_INSIGHTS"
echo ""

if [ "$PROGRESS_COUNT" -ge 2 ] && [ "$GAP_COUNT" -ge 2 ] && [ "$REC_COUNT" -ge 3 ] && [ "$TOTAL_INSIGHTS" -ge 10 ]; then
    echo "✅ PASS: AI Insights Multi-Agent working correctly"
    ((PASS_COUNT++))
else
    echo "❌ FAIL: AI Insights Multi-Agent not meeting criteria"
fi
echo ""

# Test 2: Phase 2 - Protocol Extraction
echo "🧪 TEST 2: Protocol Extractor Multi-Agent"
echo "========================================="
echo ""

# Get a protocol
PROTOCOLS=$(curl -s "$BASE_URL/api/protocols/project/$PROJECT_ID" -H "User-ID: $USER_ID")
PROTOCOL_COUNT=$(echo "$PROTOCOLS" | jq '. | length')

if [ "$PROTOCOL_COUNT" -gt 0 ]; then
    # Get first protocol details
    PROTOCOL_ID=$(echo "$PROTOCOLS" | jq -r '.[0].protocol_id')
    PROTOCOL=$(curl -s "$BASE_URL/api/protocols/$PROTOCOL_ID" -H "User-ID: $USER_ID")
    
    KEY_PARAMS=$(echo "$PROTOCOL" | jq '.key_parameters | length')
    EXPECTED_OUTCOMES=$(echo "$PROTOCOL" | jq '.expected_outcomes | length')
    TROUBLESHOOTING=$(echo "$PROTOCOL" | jq '.troubleshooting_tips | length')
    EXTRACTION_CONF=$(echo "$PROTOCOL" | jq -r '.extraction_confidence')
    
    echo "Results:"
    echo "  Key parameters: $KEY_PARAMS"
    echo "  Expected outcomes: $EXPECTED_OUTCOMES"
    echo "  Troubleshooting tips: $TROUBLESHOOTING"
    echo "  Extraction confidence: $EXTRACTION_CONF/100"
    echo ""
    
    if [ "$KEY_PARAMS" -ge 2 ] && [ "$EXPECTED_OUTCOMES" -ge 2 ] && [ "$TROUBLESHOOTING" -ge 2 ]; then
        echo "✅ PASS: Protocol Extractor Multi-Agent working correctly"
        ((PASS_COUNT++))
    else
        echo "❌ FAIL: Protocol Extractor Multi-Agent not meeting criteria"
    fi
else
    echo "⚠️  SKIP: No protocols found to test"
fi
echo ""

# Test 3: Phase 1 - AI Triage
echo "🧪 TEST 3: AI Triage Multi-Agent"
echo "========================================="
echo ""

# Get a triaged paper
PAPERS=$(curl -s "$BASE_URL/api/triage/project/$PROJECT_ID/inbox" -H "User-ID: $USER_ID")
PAPER_COUNT=$(echo "$PAPERS" | jq '. | length')

if [ "$PAPER_COUNT" -gt 0 ]; then
    # Get first must_read paper
    TRIAGE=$(echo "$PAPERS" | jq '[.[] | select(.triage_status == "must_read")][0]')
    
    if [ "$TRIAGE" != "null" ]; then
        EVIDENCE_COUNT=$(echo "$TRIAGE" | jq '.evidence_excerpts | length')
        Q_SCORES=$(echo "$TRIAGE" | jq '.question_relevance_scores | length')
        H_SCORES=$(echo "$TRIAGE" | jq '.hypothesis_relevance_scores | length')
        
        echo "Results:"
        echo "  Evidence excerpts: $EVIDENCE_COUNT"
        echo "  Question relevance scores: $Q_SCORES"
        echo "  Hypothesis relevance scores: $H_SCORES"
        echo ""
        
        if [ "$EVIDENCE_COUNT" -ge 2 ]; then
            echo "✅ PASS: AI Triage Multi-Agent working correctly"
            ((PASS_COUNT++))
        else
            echo "❌ FAIL: AI Triage Multi-Agent not meeting criteria"
        fi
    else
        echo "⚠️  SKIP: No must_read papers found to test"
    fi
else
    echo "⚠️  SKIP: No papers found to test"
fi
echo ""

# Final Summary
echo "========================================="
echo "📊 VALIDATION SUMMARY"
echo "========================================="
echo ""
echo "Tests Passed: $PASS_COUNT/$TOTAL_TESTS"
echo ""

if [ "$PASS_COUNT" -eq "$TOTAL_TESTS" ]; then
    echo "🎉 SUCCESS! All multi-agent systems validated!"
    exit 0
elif [ "$PASS_COUNT" -ge 2 ]; then
    echo "✅ GOOD! Most multi-agent systems working correctly"
    exit 0
elif [ "$PASS_COUNT" -ge 1 ]; then
    echo "⚠️  PARTIAL: Some multi-agent systems working"
    exit 1
else
    echo "❌ FAILURE: Multi-agent systems not working"
    exit 1
fi

