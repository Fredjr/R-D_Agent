#!/bin/bash

# Week 24: Trigger re-triage with multi-agent system

set -e

echo "========================================="
echo "TRIGGER RE-TRIAGE WITH MULTI-AGENT"
echo "========================================="
echo ""

# Configuration
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"
BASE_URL="https://r-dagent-production.up.railway.app"
PMID="41271225"  # FOP paper

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

echo "📥 Response:"
echo "$RESPONSE" | jq '.'
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
        echo "$RESPONSE" | jq -r '.evidence_excerpts[] | "  - \(.quote)\n    Relevance: \(.relevance)\n"'
        echo ""
    fi
    
    # Show Q/H scores if available
    if [ "$Q_SCORES_COUNT" -gt 0 ]; then
        echo "🎯 QUESTION RELEVANCE SCORES:"
        echo "$RESPONSE" | jq -r '.question_relevance_scores | to_entries[] | "  Q[\(.key)]: \(.value.score)/100\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)\n"'
        echo ""
    fi
    
    if [ "$H_SCORES_COUNT" -gt 0 ]; then
        echo "🧪 HYPOTHESIS RELEVANCE SCORES:"
        echo "$RESPONSE" | jq -r '.hypothesis_relevance_scores | to_entries[] | "  H[\(.key)]: \(.value.score)/100 (\(.value.support_type))\n  Reasoning: \(.value.reasoning)\n  Evidence: \(.value.evidence)\n"'
        echo ""
    fi
    
    echo "✅ SUCCESS! Multi-agent triage is working!"
else
    echo "❌ Re-triage failed!"
    echo "Response: $RESPONSE"
    exit 1
fi

