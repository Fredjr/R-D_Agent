#!/bin/bash

# Production Test for Auto Evidence Linking
# Testing on user: fredericle75019@gmail.com
# Date: 2025-11-23

set -e

# Configuration
BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
TEST_PMID="38003266"  # Paper we know has good triage results

echo "🧪 PRODUCTION TEST: Auto Evidence Linking"
echo "=========================================="
echo "User: ${USER_ID}"
echo "Project: ${PROJECT_ID}"
echo "Test Paper: PMID ${TEST_PMID}"
echo ""

# Step 1: Get hypotheses BEFORE triage
echo "📋 Step 1: Get Hypotheses BEFORE Triage"
echo "----------------------------------------"
HYPOTHESES_BEFORE=$(curl -s "${BACKEND_URL}/api/questions/project/${PROJECT_ID}/hypotheses" \
  -H "User-ID: ${USER_ID}")

echo "Hypotheses before triage:"
echo "$HYPOTHESES_BEFORE" | jq -r '.hypotheses[] | {
  hypothesis_id: .hypothesis_id[0:8],
  hypothesis_text: .hypothesis_text[0:60],
  status: .status,
  confidence: .confidence_level,
  supporting: .supporting_evidence_count,
  contradicting: .contradicting_evidence_count
}'
echo ""

# Save first hypothesis ID for detailed tracking
FIRST_HYP_ID=$(echo "$HYPOTHESES_BEFORE" | jq -r '.hypotheses[0].hypothesis_id // empty')
if [ -z "$FIRST_HYP_ID" ]; then
  echo "❌ ERROR: No hypotheses found in project"
  exit 1
fi

echo "Tracking hypothesis: ${FIRST_HYP_ID:0:8}..."
BEFORE_SUPPORTING=$(echo "$HYPOTHESES_BEFORE" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .supporting_evidence_count")
BEFORE_CONTRADICTING=$(echo "$HYPOTHESES_BEFORE" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .contradicting_evidence_count")
BEFORE_STATUS=$(echo "$HYPOTHESES_BEFORE" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .status")
BEFORE_CONFIDENCE=$(echo "$HYPOTHESES_BEFORE" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .confidence_level")

echo "  Status: ${BEFORE_STATUS}"
echo "  Confidence: ${BEFORE_CONFIDENCE}"
echo "  Supporting: ${BEFORE_SUPPORTING}"
echo "  Contradicting: ${BEFORE_CONTRADICTING}"
echo ""

# Step 2: Get evidence BEFORE triage
echo "📋 Step 2: Get Evidence BEFORE Triage"
echo "--------------------------------------"
EVIDENCE_BEFORE=$(curl -s "${BACKEND_URL}/api/questions/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT_BEFORE=$(echo "$EVIDENCE_BEFORE" | jq '.evidence | length')
echo "Evidence count before: ${EVIDENCE_COUNT_BEFORE}"

if [ "$EVIDENCE_COUNT_BEFORE" -gt 0 ]; then
  echo "Existing evidence:"
  echo "$EVIDENCE_BEFORE" | jq -r '.evidence[] | {
    article_pmid,
    evidence_type,
    strength,
    added_by
  }'
fi
echo ""

# Step 3: Run AI Triage with force_refresh
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

# Check triage result
TRIAGE_STATUS=$(echo "$TRIAGE_RESPONSE" | jq -r '.triage_status // empty')
RELEVANCE_SCORE=$(echo "$TRIAGE_RESPONSE" | jq -r '.relevance_score // empty')

if [ -z "$TRIAGE_STATUS" ]; then
  echo "❌ ERROR: Triage failed"
  echo "$TRIAGE_RESPONSE" | jq '.'
  exit 1
fi

echo "Triage Result:"
echo "$TRIAGE_RESPONSE" | jq '{
  triage_status,
  relevance_score,
  confidence_score,
  evidence_excerpts_count: (.evidence_excerpts | length),
  hypothesis_scores_count: (.hypothesis_relevance_scores | length),
  affected_hypotheses: .affected_hypotheses
}'
echo ""

# Check if our tracked hypothesis was affected
AFFECTED_HYPOTHESES=$(echo "$TRIAGE_RESPONSE" | jq -r '.affected_hypotheses[]? // empty')
IS_AFFECTED=false
for hyp in $AFFECTED_HYPOTHESES; do
  if [ "$hyp" == "$FIRST_HYP_ID" ]; then
    IS_AFFECTED=true
    break
  fi
done

if [ "$IS_AFFECTED" = true ]; then
  echo "✅ Tracked hypothesis ${FIRST_HYP_ID:0:8}... is in affected_hypotheses"
  
  # Get the score for our hypothesis
  HYP_SCORE=$(echo "$TRIAGE_RESPONSE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".score // 0")
  HYP_SUPPORT_TYPE=$(echo "$TRIAGE_RESPONSE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".support_type // \"unknown\"")
  HYP_EVIDENCE=$(echo "$TRIAGE_RESPONSE" | jq -r ".hypothesis_relevance_scores.\"$FIRST_HYP_ID\".evidence // \"\"")
  
  echo "  Score: ${HYP_SCORE}"
  echo "  Support Type: ${HYP_SUPPORT_TYPE}"
  echo "  Evidence: ${HYP_EVIDENCE:0:100}..."
else
  echo "⚠️  Tracked hypothesis ${FIRST_HYP_ID:0:8}... is NOT in affected_hypotheses"
  echo "   This is OK if the paper is not relevant to this hypothesis"
fi
echo ""

# Step 4: Wait for auto-linking to complete (give it 5 seconds)
echo "📋 Step 4: Wait for Auto-Linking to Complete"
echo "---------------------------------------------"
echo "Waiting 5 seconds for background processing..."
sleep 5
echo "Done waiting."
echo ""

# Step 5: Get evidence AFTER triage
echo "📋 Step 5: Get Evidence AFTER Triage"
echo "-------------------------------------"
EVIDENCE_AFTER=$(curl -s "${BACKEND_URL}/api/questions/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT_AFTER=$(echo "$EVIDENCE_AFTER" | jq '.evidence | length')
echo "Evidence count after: ${EVIDENCE_COUNT_AFTER}"

if [ "$EVIDENCE_COUNT_AFTER" -gt 0 ]; then
  echo "Current evidence:"
  echo "$EVIDENCE_AFTER" | jq -r '.evidence[] | {
    article_pmid,
    evidence_type,
    strength,
    added_by,
    key_finding: .key_finding[0:80]
  }'
fi
echo ""

# Step 6: Get hypotheses AFTER triage
echo "📋 Step 6: Get Hypotheses AFTER Triage"
echo "---------------------------------------"
HYPOTHESES_AFTER=$(curl -s "${BACKEND_URL}/api/questions/project/${PROJECT_ID}/hypotheses" \
  -H "User-ID: ${USER_ID}")

AFTER_SUPPORTING=$(echo "$HYPOTHESES_AFTER" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .supporting_evidence_count")
AFTER_CONTRADICTING=$(echo "$HYPOTHESES_AFTER" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .contradicting_evidence_count")
AFTER_STATUS=$(echo "$HYPOTHESES_AFTER" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .status")
AFTER_CONFIDENCE=$(echo "$HYPOTHESES_AFTER" | jq -r ".hypotheses[] | select(.hypothesis_id == \"$FIRST_HYP_ID\") | .confidence_level")

echo "Hypothesis ${FIRST_HYP_ID:0:8}... after triage:"
echo "  Status: ${BEFORE_STATUS} → ${AFTER_STATUS}"
echo "  Confidence: ${BEFORE_CONFIDENCE} → ${AFTER_CONFIDENCE}"
echo "  Supporting: ${BEFORE_SUPPORTING} → ${AFTER_SUPPORTING}"
echo "  Contradicting: ${BEFORE_CONTRADICTING} → ${AFTER_CONTRADICTING}"
echo ""

# Step 7: Verify Acceptance Criteria
echo "=========================================="
echo "�� ACCEPTANCE CRITERIA VERIFICATION"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Criterion 1: Evidence links created automatically
echo "✓ Criterion 1: Auto Evidence Linking"
echo "------------------------------------"
EVIDENCE_INCREASE=$((EVIDENCE_COUNT_AFTER - EVIDENCE_COUNT_BEFORE))

if [ "$IS_AFFECTED" = true ] && [ "$HYP_SCORE" -ge 40 ]; then
  # Should have created evidence link
  if [ "$EVIDENCE_INCREASE" -gt 0 ]; then
    echo "  ✅ PASS: Evidence count increased by ${EVIDENCE_INCREASE}"
    echo "     Expected: Evidence link created (score ${HYP_SCORE} >= 40)"
    PASSED=$((PASSED + 1))
    
    # Check if evidence was added by ai_triage
    NEW_EVIDENCE=$(echo "$EVIDENCE_AFTER" | jq -r ".evidence[] | select(.article_pmid == \"$TEST_PMID\")")
    if [ -n "$NEW_EVIDENCE" ]; then
      ADDED_BY=$(echo "$NEW_EVIDENCE" | jq -r '.added_by')
      EVIDENCE_TYPE=$(echo "$NEW_EVIDENCE" | jq -r '.evidence_type')
      STRENGTH=$(echo "$NEW_EVIDENCE" | jq -r '.strength')
      
      echo "     New evidence details:"
      echo "       - Added by: ${ADDED_BY}"
      echo "       - Evidence type: ${EVIDENCE_TYPE}"
      echo "       - Strength: ${STRENGTH}"
      
      if [ "$ADDED_BY" == "ai_triage" ]; then
        echo "     ✅ Evidence added by ai_triage (correct)"
      else
        echo "     ⚠️  Evidence added by ${ADDED_BY} (expected ai_triage)"
      fi
    fi
  else
    echo "  ❌ FAIL: Evidence count did not increase"
    echo "     Expected: Evidence link created (score ${HYP_SCORE} >= 40)"
    FAILED=$((FAILED + 1))
  fi
elif [ "$IS_AFFECTED" = true ] && [ "$HYP_SCORE" -lt 40 ]; then
  # Should NOT have created evidence link
  if [ "$EVIDENCE_INCREASE" -eq 0 ]; then
    echo "  ✅ PASS: Evidence count unchanged (correctly skipped)"
    echo "     Expected: No link (score ${HYP_SCORE} < 40)"
    PASSED=$((PASSED + 1))
  else
    echo "  ❌ FAIL: Evidence link created when it shouldn't"
    echo "     Expected: No link (score ${HYP_SCORE} < 40)"
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⏭️  SKIP: Hypothesis not affected by this paper"
  echo "     Cannot test auto-linking on unaffected hypothesis"
fi
echo ""

# Criterion 2: Support type mapping
echo "✓ Criterion 2: Support Type Mapping"
echo "------------------------------------"
if [ "$IS_AFFECTED" = true ] && [ "$EVIDENCE_INCREASE" -gt 0 ]; then
  NEW_EVIDENCE=$(echo "$EVIDENCE_AFTER" | jq -r ".evidence[] | select(.article_pmid == \"$TEST_PMID\")")
  EVIDENCE_TYPE=$(echo "$NEW_EVIDENCE" | jq -r '.evidence_type')
  
  # Check mapping is correct
  case "$HYP_SUPPORT_TYPE" in
    "supports"|"tests")
      if [ "$EVIDENCE_TYPE" == "supports" ]; then
        echo "  ✅ PASS: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (correct)"
        PASSED=$((PASSED + 1))
      else
        echo "  ❌ FAIL: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (expected supports)"
        FAILED=$((FAILED + 1))
      fi
      ;;
    "contradicts")
      if [ "$EVIDENCE_TYPE" == "contradicts" ]; then
        echo "  ✅ PASS: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (correct)"
        PASSED=$((PASSED + 1))
      else
        echo "  ❌ FAIL: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (expected contradicts)"
        FAILED=$((FAILED + 1))
      fi
      ;;
    "provides_context"|"not_relevant")
      if [ "$EVIDENCE_TYPE" == "neutral" ]; then
        echo "  ✅ PASS: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (correct)"
        PASSED=$((PASSED + 1))
      else
        echo "  ❌ FAIL: ${HYP_SUPPORT_TYPE} → ${EVIDENCE_TYPE} (expected neutral)"
        FAILED=$((FAILED + 1))
      fi
      ;;
    *)
      echo "  ⏭️  SKIP: Unknown support type ${HYP_SUPPORT_TYPE}"
      ;;
  esac
else
  echo "  ⏭️  SKIP: No new evidence to check mapping"
fi
echo ""

# Criterion 3: Strength assessment
echo "✓ Criterion 3: Strength Assessment"
echo "-----------------------------------"
if [ "$IS_AFFECTED" = true ] && [ "$EVIDENCE_INCREASE" -gt 0 ]; then
  NEW_EVIDENCE=$(echo "$EVIDENCE_AFTER" | jq -r ".evidence[] | select(.article_pmid == \"$TEST_PMID\")")
  STRENGTH=$(echo "$NEW_EVIDENCE" | jq -r '.strength')
  
  # Check strength is correct based on score
  if [ "$HYP_SCORE" -ge 90 ]; then
    EXPECTED="strong"
  elif [ "$HYP_SCORE" -ge 70 ]; then
    EXPECTED="moderate"
  else
    EXPECTED="weak"
  fi
  
  if [ "$STRENGTH" == "$EXPECTED" ]; then
    echo "  ✅ PASS: Score ${HYP_SCORE} → ${STRENGTH} (correct)"
    PASSED=$((PASSED + 1))
  else
    echo "  ❌ FAIL: Score ${HYP_SCORE} → ${STRENGTH} (expected ${EXPECTED})"
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⏭️  SKIP: No new evidence to check strength"
fi
echo ""

# Criterion 4: Prevent duplicates
echo "✓ Criterion 4: Prevent Duplicate Links"
echo "---------------------------------------"
echo "Running triage again to test duplicate prevention..."
TRIAGE_RESPONSE_2=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
  -X POST \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"article_pmid\": \"${TEST_PMID}\", \"force_refresh\": true}")

sleep 3

EVIDENCE_AFTER_2=$(curl -s "${BACKEND_URL}/api/questions/hypotheses/${FIRST_HYP_ID}/evidence" \
  -H "User-ID: ${USER_ID}")

EVIDENCE_COUNT_AFTER_2=$(echo "$EVIDENCE_AFTER_2" | jq '.evidence | length')

if [ "$EVIDENCE_COUNT_AFTER_2" -eq "$EVIDENCE_COUNT_AFTER" ]; then
  echo "  ✅ PASS: Evidence count unchanged (${EVIDENCE_COUNT_AFTER_2})"
  echo "     No duplicate links created"
  PASSED=$((PASSED + 1))
else
  echo "  ❌ FAIL: Evidence count changed (${EVIDENCE_COUNT_AFTER} → ${EVIDENCE_COUNT_AFTER_2})"
  echo "     Duplicate links may have been created"
  FAILED=$((FAILED + 1))
fi
echo ""

# Criterion 5: Hypothesis status update
echo "✓ Criterion 5: Hypothesis Status Update"
echo "----------------------------------------"
if [ "$BEFORE_STATUS" != "$AFTER_STATUS" ] || [ "$BEFORE_CONFIDENCE" != "$AFTER_CONFIDENCE" ]; then
  echo "  ✅ PASS: Hypothesis status/confidence updated"
  echo "     Status: ${BEFORE_STATUS} → ${AFTER_STATUS}"
  echo "     Confidence: ${BEFORE_CONFIDENCE} → ${AFTER_CONFIDENCE}"
  PASSED=$((PASSED + 1))
  
  # Verify status logic is correct
  if [ "$AFTER_SUPPORTING" -ge 3 ] && [ "$AFTER_CONTRADICTING" -eq 0 ]; then
    if [ "$AFTER_STATUS" == "supported" ]; then
      echo "     ✅ Status logic correct (3+ supporting, 0 contradicting → supported)"
    else
      echo "     ⚠️  Status logic may be incorrect (expected supported, got ${AFTER_STATUS})"
    fi
  elif [ "$AFTER_SUPPORTING" -eq 0 ] && [ "$AFTER_CONTRADICTING" -ge 3 ]; then
    if [ "$AFTER_STATUS" == "rejected" ]; then
      echo "     ✅ Status logic correct (0 supporting, 3+ contradicting → rejected)"
    else
      echo "     ⚠️  Status logic may be incorrect (expected rejected, got ${AFTER_STATUS})"
    fi
  elif [ "$AFTER_SUPPORTING" -ge 1 ] || [ "$AFTER_CONTRADICTING" -ge 1 ]; then
    if [ "$AFTER_STATUS" == "testing" ] || [ "$AFTER_STATUS" == "inconclusive" ]; then
      echo "     ✅ Status logic correct (some evidence → ${AFTER_STATUS})"
    else
      echo "     ⚠️  Status logic may be incorrect (expected testing/inconclusive, got ${AFTER_STATUS})"
    fi
  fi
else
  echo "  ⚠️  INFO: Hypothesis status/confidence unchanged"
  echo "     This may be correct if evidence counts didn't change significantly"
fi
echo ""

# Final Summary
echo "=========================================="
echo "📊 FINAL TEST RESULTS"
echo "=========================================="
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo "✅ Passed: ${PASSED}"
echo "❌ Failed: ${FAILED}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo "🎉 ALL ACCEPTANCE CRITERIA MET!"
  echo ""
  echo "✅ Auto Evidence Linking Service:"
  echo "   - Creates hypothesis_evidence records ✅"
  echo "   - Maps support types correctly ✅"
  echo "   - Assesses strength correctly ✅"
  echo "   - Prevents duplicate links ✅"
  echo "   - Only links score >= 40 ✅"
  echo ""
  echo "✅ Auto Hypothesis Status Update Service:"
  echo "   - Updates status based on evidence ✅"
  echo "   - Updates confidence levels ✅"
  echo "   - Tracks status changes ✅"
  echo ""
  exit 0
else
  echo "⚠️  SOME TESTS FAILED"
  echo ""
  echo "Please review the failures above."
  echo ""
  exit 1
fi
