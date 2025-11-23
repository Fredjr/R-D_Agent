#!/bin/bash

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"

echo "🔍 Checking Current Evidence on Hypothesis..."
echo ""

# Get hypothesis
FIRST_HYP_ID=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}" | jq -r '.[0].hypothesis_id')

echo "Hypothesis: ${FIRST_HYP_ID:0:8}..."
echo ""

# Get hypothesis details
HYP_DETAILS=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}" | jq '.[0]')

echo "Hypothesis Details:"
echo "$HYP_DETAILS" | jq '{
  hypothesis_text,
  status,
  confidence_level,
  supporting_evidence_count,
  contradicting_evidence_count
}'
echo ""

# Get evidence
EVIDENCE=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT=$(echo "$EVIDENCE" | jq 'length')

echo "Evidence Count: ${EVIDENCE_COUNT}"
echo ""

if [ "$EVIDENCE_COUNT" -gt 0 ]; then
  echo "✅ Evidence exists! Let's check if any was added by ai_triage:"
  echo ""
  echo "$EVIDENCE" | jq -r '.[] | {
    article_pmid,
    evidence_type,
    strength,
    added_by,
    added_at,
    key_finding: .key_finding[0:80]
  }'
  echo ""
  
  AI_TRIAGE_COUNT=$(echo "$EVIDENCE" | jq '[.[] | select(.added_by == "ai_triage")] | length')
  
  if [ "$AI_TRIAGE_COUNT" -gt 0 ]; then
    echo "🎉 SUCCESS! Found ${AI_TRIAGE_COUNT} evidence link(s) added by ai_triage!"
    echo ""
    echo "This proves auto-linking is working! ✅"
  else
    echo "ℹ️  All evidence was added manually (not by ai_triage)"
    echo "   Auto-linking hasn't been triggered yet"
  fi
else
  echo "ℹ️  No evidence exists yet"
  echo "   Need to triage a paper with score >= 40 to test auto-linking"
fi
