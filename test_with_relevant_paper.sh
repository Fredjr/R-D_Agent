#!/bin/bash

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"

# Try multiple papers to find one that scores >= 40
TEST_PMIDS=("35650602" "36070789" "34567890" "38003266")

echo "🔍 Finding a relevant paper for hypothesis..."
echo ""

FIRST_HYP_ID=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}" | jq -r '.[0].hypothesis_id')

echo "Hypothesis: ${FIRST_HYP_ID:0:8}..."
echo "Testing multiple papers to find one with score >= 40..."
echo ""

for PMID in "${TEST_PMIDS[@]}"; do
  echo "Testing PMID ${PMID}..."
  
  TRIAGE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
    -X POST \
    -H "User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d "{\"article_pmid\": \"${PMID}\", \"force_refresh\": false}")
  
  SCORE=$(echo "$TRIAGE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".score // 0")
  RELEVANCE=$(echo "$TRIAGE" | jq -r ".relevance_score // 0")
  
  echo "  Relevance: ${RELEVANCE}, Hypothesis Score: ${SCORE}"
  
  if [ "$SCORE" -ge 40 ]; then
    echo "  ✅ Found relevant paper! PMID ${PMID} scores ${SCORE}"
    echo ""
    echo "Now testing auto-linking with this paper..."
    echo ""
    
    # Get evidence BEFORE
    EVIDENCE_BEFORE=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
      -H "User-ID: ${USER_ID}")
    EVIDENCE_COUNT_BEFORE=$(echo "$EVIDENCE_BEFORE" | jq 'length')
    
    echo "Evidence count BEFORE: ${EVIDENCE_COUNT_BEFORE}"
    
    # Run triage with force_refresh
    echo "Running triage with force_refresh=true..."
    TRIAGE_REFRESH=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
      -X POST \
      -H "User-ID: ${USER_ID}" \
      -H "Content-Type: application/json" \
      -d "{\"article_pmid\": \"${PMID}\", \"force_refresh\": true}")
    
    echo "Waiting 5 seconds for auto-linking..."
    sleep 5
    
    # Get evidence AFTER
    EVIDENCE_AFTER=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
      -H "User-ID: ${USER_ID}")
    EVIDENCE_COUNT_AFTER=$(echo "$EVIDENCE_AFTER" | jq 'length')
    
    echo "Evidence count AFTER: ${EVIDENCE_COUNT_AFTER}"
    
    if [ "$EVIDENCE_COUNT_AFTER" -gt "$EVIDENCE_COUNT_BEFORE" ]; then
      echo "✅ SUCCESS: Evidence count increased!"
      echo ""
      echo "New evidence:"
      echo "$EVIDENCE_AFTER" | jq -r ".[] | select(.article_pmid == \"$PMID\") | {article_pmid, evidence_type, strength, added_by}"
    else
      echo "⚠️  Evidence count did not increase"
      echo "   This may mean feature flags are not enabled"
    fi
    
    exit 0
  fi
  
  echo ""
done

echo "❌ No papers scored >= 40 for this hypothesis"
echo "   Cannot test auto-linking without a relevant paper"
