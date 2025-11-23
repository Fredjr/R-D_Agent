#!/bin/bash

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"

echo "🔍 Checking existing papers in Smart Inbox..."
echo ""

# Get papers from Smart Inbox
PAPERS=$(curl -s "${BACKEND_URL}/api/smart-inbox/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

echo "Papers in Smart Inbox:"
echo "$PAPERS" | jq -r '.papers[]? | {pmid, title: .title[0:60], triage_status, relevance_score}' | head -20

echo ""
echo "Let me check which papers have hypothesis scores >= 40..."
echo ""

# Get first hypothesis
FIRST_HYP_ID=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}" | jq -r '.[0].hypothesis_id')

echo "Hypothesis: ${FIRST_HYP_ID:0:8}..."
echo ""

# Check a few papers
PMIDS=$(echo "$PAPERS" | jq -r '.papers[]?.pmid' | head -5)

for PMID in $PMIDS; do
  if [ -z "$PMID" ] || [ "$PMID" == "null" ]; then
    continue
  fi
  
  echo "Checking PMID ${PMID}..."
  
  # Get triage result
  TRIAGE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/article/${PMID}" \
    -H "User-ID: ${USER_ID}")
  
  HYP_SCORE=$(echo "$TRIAGE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".score // 0")
  RELEVANCE=$(echo "$TRIAGE" | jq -r ".relevance_score // 0")
  
  echo "  Relevance: ${RELEVANCE}, Hypothesis Score: ${HYP_SCORE}"
  
  if [ "$HYP_SCORE" -ge 40 ]; then
    echo "  ✅ This paper scores >= 40!"
    echo ""
    echo "Testing auto-linking with this paper..."
    
    # Get evidence before
    EVIDENCE_BEFORE=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
      -H "User-ID: ${USER_ID}")
    EVIDENCE_COUNT_BEFORE=$(echo "$EVIDENCE_BEFORE" | jq 'length')
    
    echo "  Evidence count BEFORE: ${EVIDENCE_COUNT_BEFORE}"
    
    # Check if this paper is already linked
    ALREADY_LINKED=$(echo "$EVIDENCE_BEFORE" | jq -r ".[] | select(.article_pmid == \"$PMID\") | .article_pmid")
    
    if [ -n "$ALREADY_LINKED" ]; then
      echo "  ℹ️  This paper is already linked as evidence"
      echo "  This means auto-linking worked previously!"
      echo ""
      echo "  Evidence details:"
      echo "$EVIDENCE_BEFORE" | jq -r ".[] | select(.article_pmid == \"$PMID\") | {article_pmid, evidence_type, strength, added_by, added_at}"
      exit 0
    fi
    
    # Re-triage with force_refresh
    echo "  Running triage with force_refresh=true..."
    TRIAGE_REFRESH=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
      -X POST \
      -H "User-ID: ${USER_ID}" \
      -H "Content-Type: application/json" \
      -d "{\"article_pmid\": \"${PMID}\", \"force_refresh\": true}")
    
    echo "  Waiting 5 seconds for auto-linking..."
    sleep 5
    
    # Get evidence after
    EVIDENCE_AFTER=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
      -H "User-ID: ${USER_ID}")
    EVIDENCE_COUNT_AFTER=$(echo "$EVIDENCE_AFTER" | jq 'length')
    
    echo "  Evidence count AFTER: ${EVIDENCE_COUNT_AFTER}"
    
    if [ "$EVIDENCE_COUNT_AFTER" -gt "$EVIDENCE_COUNT_BEFORE" ]; then
      echo ""
      echo "  ✅ SUCCESS! Evidence was auto-linked!"
      echo ""
      echo "  New evidence:"
      echo "$EVIDENCE_AFTER" | jq -r ".[] | select(.article_pmid == \"$PMID\")"
      exit 0
    else
      echo "  ⚠️  Evidence count did not increase"
      echo "  Checking Railway logs for errors..."
    fi
    
    exit 0
  fi
  
  echo ""
done

echo "❌ No papers found with hypothesis score >= 40"
echo "   This means the papers in your inbox are not relevant to your hypothesis"
