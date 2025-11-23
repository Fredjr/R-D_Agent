#!/bin/bash

# Week 24: Test multi-agent system with a paper that has a good abstract

set -e

echo "========================================="
echo "TEST MULTI-AGENT WITH GOOD PAPER"
echo "========================================="
echo ""

# Configuration
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
BASE_URL="https://r-dagent-production.up.railway.app"
PMID="33099609"  # Mineralocorticoid receptor antagonists paper (has good abstract)

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  User ID: $USER_ID"
echo "  Base URL: $BASE_URL"
echo "  PMID: $PMID"
echo ""

echo "🔄 Triggering re-triage with force_refresh=true..."
echo ""

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/triage/project/${PROJECT_ID}/triage" \
    -H "User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d "{\"article_pmid\": \"${PMID}\", \"force_refresh\": true}")

echo "📥 Response received"
echo ""

# Check if successful
TRIAGE_ID=$(echo "$RESPONSE" | jq -r '.triage_id')
if [ "$TRIAGE_ID" != "null" ] && [ -n "$TRIAGE_ID" ]; then
    echo "✅ Re-triage successful!"
    echo "  Triage ID: $TRIAGE_ID"
    
    # Extract key fields
    TRIAGE_STATUS=$(echo "$RESPONSE" | jq -r '.triage_status')
    RELEVANCE_SCORE=$(echo "$RESPONSE" | jq -r '.relevance_score')
    CONFIDENCE_SCORE=$(echo "$RESPONSE" | jq -r '.confidence_score')
    EVIDENCE_COUNT=$(echo "$RESPONSE" | jq '.evidence_excerpts | length')
    Q_SCORES_COUNT=$(echo "$RESPONSE" | jq '.question_relevance_scores | length')
    H_SCORES_COUNT=$(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')
    
    echo ""
    echo "📊 TRIAGE RESULTS:"
    echo "  Status: $TRIAGE_STATUS"
    echo "  Relevance Score: $RELEVANCE_SCORE/100"
    echo "  Confidence Score: $CONFIDENCE_SCORE"
    echo "  Evidence Excerpts: $EVIDENCE_COUNT"
    echo "  Question Scores: $Q_SCORES_COUNT"
    echo "  Hypothesis Scores: $H_SCORES_COUNT"
    echo ""
    
    # Show evidence if available
    if [ "$EVIDENCE_COUNT" -gt 0 ]; then
        echo "📄 EVIDENCE EXCERPTS:"
        echo "$RESPONSE" | jq -r '.evidence_excerpts[] | "  Quote: \(.quote)\n  Relevance: \(.relevance)\n"'
        echo ""
    else
        echo "⚠️  NO EVIDENCE EXCERPTS FOUND!"
        echo ""
    fi
    
    # Show Q/H scores if available
    if [ "$Q_SCORES_COUNT" -gt 0 ]; then
        echo "🎯 QUESTION RELEVANCE SCORES:"
        echo "$RESPONSE" | jq -r '.question_relevance_scores | to_entries[] | "  Q[\(.key)]: \(.value.score)/100\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)\n"'
        echo ""
    else
        echo "⚠️  NO QUESTION SCORES FOUND!"
        echo ""
    fi
    
    if [ "$H_SCORES_COUNT" -gt 0 ]; then
        echo "🧪 HYPOTHESIS RELEVANCE SCORES:"
        echo "$RESPONSE" | jq -r '.hypothesis_relevance_scores | to_entries[] | "  H[\(.key)]: \(.value.score)/100 (\(.value.support_type))\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)\n"'
        echo ""
    else
        echo "⚠️  NO HYPOTHESIS SCORES FOUND!"
        echo ""
    fi
    
    # Show impact assessment
    IMPACT=$(echo "$RESPONSE" | jq -r '.impact_assessment')
    echo "💡 IMPACT ASSESSMENT:"
    echo "  $IMPACT"
    echo ""
    
    # Show AI reasoning
    REASONING=$(echo "$RESPONSE" | jq -r '.ai_reasoning')
    echo "🧠 AI REASONING:"
    echo "  $REASONING"
    echo ""
    
    # Success criteria check
    echo "========================================="
    echo "✅ SUCCESS CRITERIA CHECK:"
    echo "========================================="
    local PASS_COUNT=0
    local TOTAL_COUNT=7
    
    [ "$EVIDENCE_COUNT" -gt 0 ] && echo "  ✅ Evidence excerpts populated ($EVIDENCE_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Evidence excerpts EMPTY"
    [ "$Q_SCORES_COUNT" -gt 0 ] && echo "  ✅ Question relevance scores populated ($Q_SCORES_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Question relevance scores EMPTY"
    [ "$H_SCORES_COUNT" -gt 0 ] && echo "  ✅ Hypothesis relevance scores populated ($H_SCORES_COUNT)" && ((PASS_COUNT++)) || echo "  ❌ Hypothesis relevance scores EMPTY"
    [ "${#IMPACT}" -gt 50 ] && echo "  ✅ Impact assessment has content (${#IMPACT} chars)" && ((PASS_COUNT++)) || echo "  ❌ Impact assessment too short"
    [ "${#REASONING}" -gt 100 ] && echo "  ✅ AI reasoning has content (${#REASONING} chars)" && ((PASS_COUNT++)) || echo "  ❌ AI reasoning too short"
    [ "$CONFIDENCE_SCORE" != "null" ] && echo "  ✅ Confidence score present ($CONFIDENCE_SCORE)" && ((PASS_COUNT++)) || echo "  ❌ Confidence score missing"
    [ "$RELEVANCE_SCORE" != "null" ] && echo "  ✅ Relevance score present ($RELEVANCE_SCORE)" && ((PASS_COUNT++)) || echo "  ❌ Relevance score missing"
    
    echo ""
    echo "📈 FINAL SCORE: $PASS_COUNT/$TOTAL_COUNT criteria passed"
    echo ""
    
    if [ "$PASS_COUNT" -ge 5 ]; then
        echo "🎉 SUCCESS! Multi-agent system is working well!"
    else
        echo "⚠️  WARNING: Some criteria not met. Check logs."
    fi
else
    echo "❌ Re-triage failed!"
    echo "Response: $RESPONSE"
    exit 1
fi

