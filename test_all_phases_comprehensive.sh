#!/bin/bash

# Comprehensive test for all 3 phases
# Week 24: Multi-Agent Systems

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"

echo "========================================="
echo "COMPREHENSIVE MULTI-AGENT TEST"
echo "Testing All 3 Phases"
echo "========================================="
echo ""

# Test Phase 1: AI Triage
echo "📋 PHASE 1: AI TRIAGE MULTI-AGENT"
echo "========================================="
echo ""

# Get a paper to re-triage
PAPER_PMID=$(curl -s "$BASE_URL/triage/project/$PROJECT_ID" \
  -H "User-ID: $USER_ID" | jq -r '.[0].article_pmid')

echo "Testing with PMID: $PAPER_PMID"
echo ""

# Re-triage the paper
TRIAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/triage/retriage" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID" \
  -d "{
    \"article_pmid\": \"$PAPER_PMID\",
    \"project_id\": \"$PROJECT_ID\"
  }")

# Check triage results
EVIDENCE_COUNT=$(echo "$TRIAGE_RESPONSE" | jq '.evidence_excerpts | length')
Q_SCORES=$(echo "$TRIAGE_RESPONSE" | jq '.question_relevance_scores | length')
H_SCORES=$(echo "$TRIAGE_RESPONSE" | jq '.hypothesis_relevance_scores | length')

echo "✅ Phase 1 Results:"
echo "  Evidence excerpts: $EVIDENCE_COUNT"
echo "  Question relevance scores: $Q_SCORES"
echo "  Hypothesis relevance scores: $H_SCORES"
echo ""

# Test Phase 2: Protocol Extraction
echo "📋 PHASE 2: PROTOCOL EXTRACTOR MULTI-AGENT"
echo "========================================="
echo ""

# Extract protocol from a paper
PROTOCOL_RESPONSE=$(curl -s -X POST "$BASE_URL/protocols/extract" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID" \
  -d "{
    \"article_pmid\": \"38278529\",
    \"project_id\": \"$PROJECT_ID\",
    \"force_refresh\": true,
    \"use_intelligent_extraction\": true
  }")

# Check protocol results
KEY_PARAMS=$(echo "$PROTOCOL_RESPONSE" | jq '.key_parameters | length')
EXPECTED_OUTCOMES=$(echo "$PROTOCOL_RESPONSE" | jq '.expected_outcomes | length')
TROUBLESHOOTING=$(echo "$PROTOCOL_RESPONSE" | jq '.troubleshooting_tips | length')
EXTRACTION_CONFIDENCE=$(echo "$PROTOCOL_RESPONSE" | jq -r '.extraction_confidence')

echo "✅ Phase 2 Results:"
echo "  Key parameters: $KEY_PARAMS"
echo "  Expected outcomes: $EXPECTED_OUTCOMES"
echo "  Troubleshooting tips: $TROUBLESHOOTING"
echo "  Extraction confidence: $EXTRACTION_CONFIDENCE/100"
echo ""

# Test Phase 3: AI Insights
echo "📋 PHASE 3: AI INSIGHTS MULTI-AGENT"
echo "========================================="
echo ""

# Regenerate insights
INSIGHTS_RESPONSE=$(curl -s -X POST "$BASE_URL/insights/projects/$PROJECT_ID/insights/regenerate" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID")

# Check insights results
PROGRESS_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.progress_insights | length')
CONNECTION_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.connection_insights | length')
GAP_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.gap_insights | length')
TREND_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.trend_insights | length')
RECOMMENDATION_COUNT=$(echo "$INSIGHTS_RESPONSE" | jq '.recommendations | length')

echo "✅ Phase 3 Results:"
echo "  Progress insights: $PROGRESS_COUNT"
echo "  Connection insights: $CONNECTION_COUNT"
echo "  Gap insights: $GAP_COUNT"
echo "  Trend insights: $TREND_COUNT"
echo "  Recommendations: $RECOMMENDATION_COUNT"
echo ""

# Final Summary
echo "========================================="
echo "📊 FINAL SUMMARY"
echo "========================================="
echo ""

TOTAL_PASS=0
TOTAL_TESTS=10

# Phase 1 checks
[ "$EVIDENCE_COUNT" -ge 2 ] && echo "  ✅ Phase 1: Evidence excerpts ($EVIDENCE_COUNT ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 1: Evidence excerpts insufficient"
[ "$Q_SCORES" -ge 1 ] && echo "  ✅ Phase 1: Question scores ($Q_SCORES ≥ 1)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 1: Question scores insufficient"
[ "$H_SCORES" -ge 1 ] && echo "  ✅ Phase 1: Hypothesis scores ($H_SCORES ≥ 1)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 1: Hypothesis scores insufficient"

# Phase 2 checks
[ "$KEY_PARAMS" -ge 2 ] && echo "  ✅ Phase 2: Key parameters ($KEY_PARAMS ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 2: Key parameters insufficient"
[ "$EXPECTED_OUTCOMES" -ge 2 ] && echo "  ✅ Phase 2: Expected outcomes ($EXPECTED_OUTCOMES ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 2: Expected outcomes insufficient"
[ "$TROUBLESHOOTING" -ge 2 ] && echo "  ✅ Phase 2: Troubleshooting tips ($TROUBLESHOOTING ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 2: Troubleshooting tips insufficient"

# Phase 3 checks
[ "$PROGRESS_COUNT" -ge 2 ] && echo "  ✅ Phase 3: Progress insights ($PROGRESS_COUNT ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 3: Progress insights insufficient"
[ "$GAP_COUNT" -ge 2 ] && echo "  ✅ Phase 3: Gap insights ($GAP_COUNT ≥ 2)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 3: Gap insights insufficient"
[ "$RECOMMENDATION_COUNT" -ge 3 ] && echo "  ✅ Phase 3: Recommendations ($RECOMMENDATION_COUNT ≥ 3)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 3: Recommendations insufficient"

TOTAL_INSIGHTS=$((PROGRESS_COUNT + CONNECTION_COUNT + GAP_COUNT + TREND_COUNT + RECOMMENDATION_COUNT))
[ "$TOTAL_INSIGHTS" -ge 10 ] && echo "  ✅ Phase 3: Total insights ($TOTAL_INSIGHTS ≥ 10)" && ((TOTAL_PASS++)) || echo "  ❌ Phase 3: Total insights insufficient"

echo ""
echo "📈 OVERALL SCORE: $TOTAL_PASS/$TOTAL_TESTS tests passed"
echo ""

if [ "$TOTAL_PASS" -ge 9 ]; then
    echo "🎉 EXCELLENT! All multi-agent systems working perfectly!"
elif [ "$TOTAL_PASS" -ge 7 ]; then
    echo "✅ GOOD! Multi-agent systems working well with minor issues"
elif [ "$TOTAL_PASS" -ge 5 ]; then
    echo "⚠️  PARTIAL SUCCESS - Some systems need attention"
else
    echo "❌ FAILURE - Multi-agent systems need fixes"
fi

