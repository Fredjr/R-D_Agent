#!/bin/bash

# Week 24: Phase 1 - AI Triage Multi-Agent System Test
# Tests the new multi-agent triage system and compares with legacy

set -e

echo "========================================="
echo "PHASE 1: AI TRIAGE MULTI-AGENT TEST"
echo "========================================="
echo ""

# Configuration
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
BASE_URL="https://r-dagent-production.up.railway.app"

# Test papers (mix of must_read, nice_to_know, ignore)
TEST_PMIDS=(
    "41271225"  # FOP paper (should be must_read)
    "39973977"  # Flame-wall paper (should be nice_to_know or ignore)
)

echo "📋 Test Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  User ID: $USER_ID"
echo "  Base URL: $BASE_URL"
echo "  Test PMIDs: ${TEST_PMIDS[@]}"
echo ""

# Function to test a single paper
test_paper() {
    local PMID=$1
    echo "========================================="
    echo "Testing PMID: $PMID"
    echo "========================================="
    
    # Get triage data
    echo "📥 Fetching triage data..."
    RESPONSE=$(curl -s "${BASE_URL}/api/triage/project/${PROJECT_ID}/inbox" \
        -H "User-ID: ${USER_ID}" | jq ".[] | select(.article_pmid == \"${PMID}\")")
    
    if [ -z "$RESPONSE" ]; then
        echo "❌ No triage found for PMID ${PMID}"
        return 1
    fi
    
    # Extract fields
    TRIAGE_STATUS=$(echo "$RESPONSE" | jq -r '.triage_status')
    RELEVANCE_SCORE=$(echo "$RESPONSE" | jq -r '.relevance_score')
    CONFIDENCE_SCORE=$(echo "$RESPONSE" | jq -r '.confidence_score')
    
    # Evidence excerpts
    EVIDENCE_COUNT=$(echo "$RESPONSE" | jq '.evidence_excerpts | length')
    EVIDENCE_POPULATED=$([ "$EVIDENCE_COUNT" -gt 0 ] && echo "✅" || echo "❌")
    
    # Question relevance scores
    Q_SCORES_COUNT=$(echo "$RESPONSE" | jq '.question_relevance_scores | length')
    Q_SCORES_POPULATED=$([ "$Q_SCORES_COUNT" -gt 0 ] && echo "✅" || echo "❌")
    
    # Hypothesis relevance scores
    H_SCORES_COUNT=$(echo "$RESPONSE" | jq '.hypothesis_relevance_scores | length')
    H_SCORES_POPULATED=$([ "$H_SCORES_COUNT" -gt 0 ] && echo "✅" || echo "❌")
    
    # Affected questions/hypotheses
    AFFECTED_Q_COUNT=$(echo "$RESPONSE" | jq '.affected_questions | length')
    AFFECTED_H_COUNT=$(echo "$RESPONSE" | jq '.affected_hypotheses | length')
    
    # Impact assessment
    IMPACT=$(echo "$RESPONSE" | jq -r '.impact_assessment')
    IMPACT_LENGTH=${#IMPACT}
    IMPACT_POPULATED=$([ "$IMPACT_LENGTH" -gt 50 ] && echo "✅" || echo "⚠️")
    
    # AI reasoning
    REASONING=$(echo "$RESPONSE" | jq -r '.ai_reasoning')
    REASONING_LENGTH=${#REASONING}
    REASONING_POPULATED=$([ "$REASONING_LENGTH" -gt 100 ] && echo "✅" || echo "⚠️")
    
    # Print results
    echo ""
    echo "📊 TRIAGE RESULTS:"
    echo "  Status: $TRIAGE_STATUS"
    echo "  Relevance Score: $RELEVANCE_SCORE/100"
    echo "  Confidence Score: $CONFIDENCE_SCORE"
    echo ""
    echo "📝 FIELD POPULATION:"
    echo "  ${EVIDENCE_POPULATED} Evidence Excerpts: $EVIDENCE_COUNT"
    echo "  ${Q_SCORES_POPULATED} Question Relevance Scores: $Q_SCORES_COUNT"
    echo "  ${H_SCORES_POPULATED} Hypothesis Relevance Scores: $H_SCORES_COUNT"
    echo "  Affected Questions: $AFFECTED_Q_COUNT"
    echo "  Affected Hypotheses: $AFFECTED_H_COUNT"
    echo "  ${IMPACT_POPULATED} Impact Assessment: $IMPACT_LENGTH chars"
    echo "  ${REASONING_POPULATED} AI Reasoning: $REASONING_LENGTH chars"
    echo ""
    
    # Show sample evidence
    if [ "$EVIDENCE_COUNT" -gt 0 ]; then
        echo "📄 SAMPLE EVIDENCE:"
        echo "$RESPONSE" | jq -r '.evidence_excerpts[0] | "  Quote: \(.quote)\n  Relevance: \(.relevance)"'
        echo ""
    fi
    
    # Show sample Q/H scores
    if [ "$Q_SCORES_COUNT" -gt 0 ]; then
        echo "🎯 SAMPLE QUESTION SCORE:"
        echo "$RESPONSE" | jq -r '.question_relevance_scores | to_entries[0] | "  Q[\(.key)]: \(.value.score)/100\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)"'
        echo ""
    fi
    
    if [ "$H_SCORES_COUNT" -gt 0 ]; then
        echo "🧪 SAMPLE HYPOTHESIS SCORE:"
        echo "$RESPONSE" | jq -r '.hypothesis_relevance_scores | to_entries[0] | "  H[\(.key)]: \(.value.score)/100 (\(.value.support_type))\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)"'
        echo ""
    fi
    
    # Success criteria check
    echo "✅ SUCCESS CRITERIA:"
    local PASS_COUNT=0
    local TOTAL_COUNT=7
    
    [ "$EVIDENCE_COUNT" -gt 0 ] && echo "  ✅ Evidence excerpts populated" && ((PASS_COUNT++)) || echo "  ❌ Evidence excerpts EMPTY"
    [ "$Q_SCORES_COUNT" -gt 0 ] && echo "  ✅ Question relevance scores populated" && ((PASS_COUNT++)) || echo "  ❌ Question relevance scores EMPTY"
    [ "$H_SCORES_COUNT" -gt 0 ] && echo "  ✅ Hypothesis relevance scores populated" && ((PASS_COUNT++)) || echo "  ❌ Hypothesis relevance scores EMPTY"
    [ "$IMPACT_LENGTH" -gt 50 ] && echo "  ✅ Impact assessment has content" && ((PASS_COUNT++)) || echo "  ❌ Impact assessment too short"
    [ "$REASONING_LENGTH" -gt 100 ] && echo "  ✅ AI reasoning has content" && ((PASS_COUNT++)) || echo "  ❌ AI reasoning too short"
    [ "$CONFIDENCE_SCORE" != "null" ] && echo "  ✅ Confidence score present" && ((PASS_COUNT++)) || echo "  ❌ Confidence score missing"
    [ "$RELEVANCE_SCORE" != "null" ] && echo "  ✅ Relevance score present" && ((PASS_COUNT++)) || echo "  ❌ Relevance score missing"
    
    echo ""
    echo "📈 SCORE: $PASS_COUNT/$TOTAL_COUNT criteria passed"
    echo ""
    
    return 0
}

# Run tests for each paper
for PMID in "${TEST_PMIDS[@]}"; do
    test_paper "$PMID"
    echo ""
done

echo "========================================="
echo "PHASE 1 TEST COMPLETE"
echo "========================================="
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Review the results above"
echo "2. Check that evidence_excerpts are populated (95%+ target)"
echo "3. Check that Q/H relevance scores are populated"
echo "4. Verify impact assessment references specific evidence"
echo "5. If all criteria pass, proceed to Phase 2"
echo ""

