#!/bin/bash

# Simple Production Test for Auto Evidence Linking
# User: fredericle75019@gmail.com

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
TEST_PMID="38003266"

echo "🧪 PRODUCTION TEST: Auto Evidence Linking"
echo "=========================================="
echo ""

# Step 1: Get hypotheses BEFORE
echo "📋 Step 1: Get Hypotheses BEFORE Triage"
echo "----------------------------------------"
HYPOTHESES_BEFORE=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

echo "Hypotheses:"
echo "$HYPOTHESES_BEFORE" | jq -r '.[] | {
  hypothesis_id: .hypothesis_id[0:8],
  hypothesis_text: .hypothesis_text[0:60],
  status,
  confidence_level,
  supporting_evidence_count,
  contradicting_evidence_count
}'

FIRST_HYP_ID=$(echo "$HYPOTHESES_BEFORE" | jq -r '.[0].hypothesis_id')
echo ""
echo "Tracking hypothesis: ${FIRST_HYP_ID:0:8}..."

BEFORE_SUPPORTING=$(echo "$HYPOTHESES_BEFORE" | jq -r ".[0].supporting_evidence_count")
BEFORE_CONTRADICTING=$(echo "$HYPOTHESES_BEFORE" | jq -r ".[0].contradicting_evidence_count")
BEFORE_STATUS=$(echo "$HYPOTHESES_BEFORE" | jq -r ".[0].status")
BEFORE_CONFIDENCE=$(echo "$HYPOTHESES_BEFORE" | jq -r ".[0].confidence_level")

echo "  Status: ${BEFORE_STATUS}"
echo "  Confidence: ${BEFORE_CONFIDENCE}"
echo "  Supporting: ${BEFORE_SUPPORTING}"
echo "  Contradicting: ${BEFORE_CONTRADICTING}"
echo ""

# Step 2: Get evidence BEFORE
echo "📋 Step 2: Get Evidence BEFORE Triage"
echo "--------------------------------------"
EVIDENCE_BEFORE=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT_BEFORE=$(echo "$EVIDENCE_BEFORE" | jq 'length')
echo "Evidence count: ${EVIDENCE_COUNT_BEFORE}"

if [ "$EVIDENCE_COUNT_BEFORE" -gt 0 ]; then
  echo "Existing evidence:"
  echo "$EVIDENCE_BEFORE" | jq -r '.[] | {article_pmid, evidence_type, strength, added_by}'
fi
echo ""

# Step 3: Run AI Triage
echo "📋 Step 3: Run AI Triage (force_refresh=true)"
echo "----------------------------------------------"
echo "Running triage on PMID ${TEST_PMID}..."

TRIAGE_RESPONSE=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -X POST \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"article_pmid\": \"${TEST_PMID}\", \"force_refresh\": true}")

echo "Triage completed!"
echo ""

echo "Triage Result:"
echo "$TRIAGE_RESPONSE" | jq '{
  triage_status,
  relevance_score,
  confidence_score,
  evidence_excerpts_count: (.evidence_excerpts | length),
  hypothesis_scores_count: (.hypothesis_relevance_scores | length),
  affected_hypotheses
}'
echo ""

# Check if hypothesis was affected
AFFECTED=$(echo "$TRIAGE_RESPONSE" | jq -r ".affected_hypotheses[]? | select(. == \"$FIRST_HYP_ID\")")
if [ -n "$AFFECTED" ]; then
  echo "✅ Hypothesis ${FIRST_HYP_ID:0:8}... is affected"
  HYP_SCORE=$(echo "$TRIAGE_RESPONSE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".score")
  HYP_SUPPORT_TYPE=$(echo "$TRIAGE_RESPONSE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".support_type")
  echo "  Score: ${HYP_SCORE}"
  echo "  Support Type: ${HYP_SUPPORT_TYPE}"
else
  echo "⚠️  Hypothesis ${FIRST_HYP_ID:0:8}... is NOT affected"
fi
echo ""

# Step 4: Wait for auto-linking
echo "📋 Step 4: Wait for Auto-Linking (5 seconds)"
echo "---------------------------------------------"
sleep 5
echo ""

# Step 5: Get evidence AFTER
echo "📋 Step 5: Get Evidence AFTER Triage"
echo "-------------------------------------"
EVIDENCE_AFTER=$(curl -s "${BACKEND_URL}/api/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT_AFTER=$(echo "$EVIDENCE_AFTER" | jq 'length')
echo "Evidence count: ${EVIDENCE_COUNT_AFTER}"

if [ "$EVIDENCE_COUNT_AFTER" -gt 0 ]; then
  echo "Current evidence:"
  echo "$EVIDENCE_AFTER" | jq -r '.[] | {article_pmid, evidence_type, strength, added_by, key_finding: .key_finding[0:60]}'
fi
echo ""

# Step 6: Get hypotheses AFTER
echo "📋 Step 6: Get Hypotheses AFTER Triage"
echo "---------------------------------------"
HYPOTHESES_AFTER=$(curl -s "${BACKEND_URL}/api/hypotheses/project/${PROJECT_ID}" \
  -H "User-ID: ${USER_ID}")

AFTER_SUPPORTING=$(echo "$HYPOTHESES_AFTER" | jq -r ".[0].supporting_evidence_count")
AFTER_CONTRADICTING=$(echo "$HYPOTHESES_AFTER" | jq -r ".[0].contradicting_evidence_count")
AFTER_STATUS=$(echo "$HYPOTHESES_AFTER" | jq -r ".[0].status")
AFTER_CONFIDENCE=$(echo "$HYPOTHESES_AFTER" | jq -r ".[0].confidence_level")

echo "Hypothesis ${FIRST_HYP_ID:0:8}... after triage:"
echo "  Status: ${BEFORE_STATUS} → ${AFTER_STATUS}"
echo "  Confidence: ${BEFORE_CONFIDENCE} → ${AFTER_CONFIDENCE}"
echo "  Supporting: ${BEFORE_SUPPORTING} → ${AFTER_SUPPORTING}"
echo "  Contradicting: ${BEFORE_CONTRADICTING} → ${AFTER_CONTRADICTING}"
echo ""

# Step 7: Verify Acceptance Criteria
echo "=========================================="
echo "📊 ACCEPTANCE CRITERIA VERIFICATION"
echo "=========================================="
echo ""

EVIDENCE_INCREASE=$((EVIDENCE_COUNT_AFTER - EVIDENCE_COUNT_BEFORE))

echo "✓ Criterion 1: Auto Evidence Linking"
if [ -n "$AFFECTED" ] && [ "$HYP_SCORE" -ge 40 ]; then
  if [ "$EVIDENCE_INCREASE" -gt 0 ]; then
    echo "  ✅ PASS: Evidence count increased by ${EVIDENCE_INCREASE}"
    
    # Check if added by ai_triage
    NEW_EVIDENCE=$(echo "$EVIDENCE_AFTER" | jq -r ".[] | select(.article_pmid == \"$TEST_PMID\")")
    if [ -n "$NEW_EVIDENCE" ]; then
      ADDED_BY=$(echo "$NEW_EVIDENCE" | jq -r '.added_by')
      echo "  ✅ Evidence added by: ${ADDED_BY}"
    fi
  else
    echo "  ❌ FAIL: Evidence count did not increase (score ${HYP_SCORE} >= 40)"
  fi
else
  echo "  ⏭️  SKIP: Hypothesis not affected or score < 40"
fi
echo ""

echo "✓ Criterion 2: Hypothesis Status Update"
if [ "$BEFORE_STATUS" != "$AFTER_STATUS" ] || [ "$BEFORE_CONFIDENCE" != "$AFTER_CONFIDENCE" ]; then
  echo "  ✅ PASS: Status/confidence updated"
else
  echo "  ⚠️  INFO: Status/confidence unchanged"
fi
echo ""

echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo "Evidence: ${BEFORE_SUPPORTING}S/${BEFORE_CONTRADICTING}C → ${AFTER_SUPPORTING}S/${AFTER_CONTRADICTING}C"
echo "Status: ${BEFORE_STATUS} → ${AFTER_STATUS}"
echo "Confidence: ${BEFORE_CONFIDENCE} → ${AFTER_CONFIDENCE}"
echo ""

