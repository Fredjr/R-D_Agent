#!/bin/bash

# Test script to verify AI triage generates ALL details for every paper
# regardless of triage status (must_read, nice_to_know, or ignore)

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"

echo "========================================="
echo "Testing AI Triage - ALL Details Generation"
echo "========================================="
echo ""
echo "Waiting 30 seconds for Railway deployment..."
sleep 30
echo ""

# Test with a paper that should be "must_read"
echo "📄 Test 1: Re-triaging paper 35650602 (should be must_read)..."
RESPONSE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -X POST \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{"article_pmid": "35650602", "force_refresh": true}')

echo "Status: $(echo "$RESPONSE" | jq -r '.triage_status')"
echo "Relevance: $(echo "$RESPONSE" | jq -r '.relevance_score')"
echo "Evidence excerpts: $(echo "$RESPONSE" | jq '.evidence_excerpts | length')"
echo "Question scores: $(echo "$RESPONSE" | jq '.question_relevance_scores | length')"
echo "Hypothesis scores: $(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')"
echo ""

# Check if ALL details are present
EVIDENCE_COUNT=$(echo "$RESPONSE" | jq '.evidence_excerpts | length')
QUESTION_COUNT=$(echo "$RESPONSE" | jq '.question_relevance_scores | length')
HYPOTHESIS_COUNT=$(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')

if [ "$EVIDENCE_COUNT" -gt 0 ] && [ "$QUESTION_COUNT" -gt 0 ] && [ "$HYPOTHESIS_COUNT" -gt 0 ]; then
  echo "✅ Test 1 PASSED: All details generated for must_read paper"
else
  echo "❌ Test 1 FAILED: Missing details"
  echo "   Evidence: $EVIDENCE_COUNT, Questions: $QUESTION_COUNT, Hypotheses: $HYPOTHESIS_COUNT"
fi

echo ""
echo "========================================="
echo ""

# Test with a paper that might be "ignore" or "nice_to_know"
echo "📄 Test 2: Re-triaging paper 38003266 (might be ignore/nice_to_know)..."
RESPONSE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -X POST \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{"article_pmid": "38003266", "force_refresh": true}')

echo "Status: $(echo "$RESPONSE" | jq -r '.triage_status')"
echo "Relevance: $(echo "$RESPONSE" | jq -r '.relevance_score')"
echo "Evidence excerpts: $(echo "$RESPONSE" | jq '.evidence_excerpts | length')"
echo "Question scores: $(echo "$RESPONSE" | jq '.question_relevance_scores | length')"
echo "Hypothesis scores: $(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')"
echo ""

# Check if ALL details are present (even for ignore/nice_to_know)
EVIDENCE_COUNT=$(echo "$RESPONSE" | jq '.evidence_excerpts | length')
QUESTION_COUNT=$(echo "$RESPONSE" | jq '.question_relevance_scores | length')
HYPOTHESIS_COUNT=$(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')

if [ "$EVIDENCE_COUNT" -gt 0 ] && [ "$QUESTION_COUNT" -gt 0 ] && [ "$HYPOTHESIS_COUNT" -gt 0 ]; then
  echo "✅ Test 2 PASSED: All details generated even for lower relevance paper"
else
  echo "❌ Test 2 FAILED: Missing details for lower relevance paper"
  echo "   Evidence: $EVIDENCE_COUNT, Questions: $QUESTION_COUNT, Hypotheses: $HYPOTHESIS_COUNT"
  echo ""
  echo "⚠️  CRITICAL: Multi-agent system should generate ALL details regardless of triage status!"
fi

echo ""
echo "========================================="
echo "📊 SUMMARY"
echo "========================================="
echo ""
echo "Expected behavior:"
echo "- ALL papers should have evidence_excerpts (length > 0)"
echo "- ALL papers should have question_relevance_scores (length > 0)"
echo "- ALL papers should have hypothesis_relevance_scores (length > 0)"
echo "- Triage status (must_read/nice_to_know/ignore) should NOT affect detail generation"
echo ""
echo "Thresholds:"
echo "- must_read: 70-100"
echo "- nice_to_know: 40-69"
echo "- ignore: 0-39"
echo ""
echo "✅ If both tests passed, the fix is working correctly!"
echo "❌ If any test failed, check Railway logs for errors"

