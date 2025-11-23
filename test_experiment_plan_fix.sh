#!/bin/bash

# Week 24: Test Experiment Plan Fix
# This script tests that the multi-agent system generates ALL 15 fields

echo "🧪 Testing Experiment Plan Generation (Week 24 Fix)"
echo "=================================================="
echo ""

# Configuration
API_BASE="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"

# Find a protocol to test with
echo "📋 Step 1: Finding a protocol to test..."
PROTOCOL_ID=$(curl -s "${API_BASE}/api/projects/${PROJECT_ID}/protocols" \
  -H "User-ID: ${USER_ID}" | jq -r '.protocols[0].protocol_id')

if [ -z "$PROTOCOL_ID" ] || [ "$PROTOCOL_ID" = "null" ]; then
  echo "❌ No protocols found in project"
  exit 1
fi

echo "✅ Found protocol: ${PROTOCOL_ID}"
echo ""

# Create experiment plan
echo "🚀 Step 2: Creating experiment plan with multi-agent system..."
PLAN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/projects/${PROJECT_ID}/protocols/${PROTOCOL_ID}/experiment-plans" \
  -H "User-ID: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_objective": "Test Week 24 fix - verify all 15 fields are populated",
    "custom_notes": "This is a test to verify the multi-agent system generates complete plans"
  }')

PLAN_ID=$(echo "$PLAN_RESPONSE" | jq -r '.plan_id')

if [ -z "$PLAN_ID" ] || [ "$PLAN_ID" = "null" ]; then
  echo "❌ Failed to create experiment plan"
  echo "$PLAN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Created experiment plan: ${PLAN_ID}"
echo ""

# Fetch the plan details
echo "📊 Step 3: Fetching plan details..."
PLAN_DETAILS=$(curl -s "${API_BASE}/api/projects/${PROJECT_ID}/experiment-plans/${PLAN_ID}" \
  -H "User-ID: ${USER_ID}")

echo ""
echo "🔍 Step 4: Validating ALL 15 fields..."
echo "======================================"

# Check each field
FIELDS=(
  "plan_name"
  "objective"
  "linked_questions"
  "linked_hypotheses"
  "materials"
  "procedure"
  "expected_outcomes"
  "success_criteria"
  "timeline_estimate"
  "estimated_cost"
  "difficulty_level"
  "risk_assessment"
  "troubleshooting_guide"
  "safety_considerations"
  "required_expertise"
)

MISSING_FIELDS=()
EMPTY_FIELDS=()

for field in "${FIELDS[@]}"; do
  VALUE=$(echo "$PLAN_DETAILS" | jq -r ".${field}")
  
  if [ -z "$VALUE" ] || [ "$VALUE" = "null" ]; then
    echo "❌ ${field}: MISSING"
    MISSING_FIELDS+=("$field")
  elif [ "$VALUE" = "[]" ] || [ "$VALUE" = "{}" ]; then
    echo "⚠️  ${field}: EMPTY"
    EMPTY_FIELDS+=("$field")
  else
    echo "✅ ${field}: POPULATED"
  fi
done

echo ""
echo "📈 Step 5: Detailed Field Analysis..."
echo "======================================"

# Check risk_assessment structure
RISKS_COUNT=$(echo "$PLAN_DETAILS" | jq '.risk_assessment.risks | length')
MITIGATION_COUNT=$(echo "$PLAN_DETAILS" | jq '.risk_assessment.mitigation_strategies | length')
echo "Risk Assessment:"
echo "  - Risks: ${RISKS_COUNT}"
echo "  - Mitigation Strategies: ${MITIGATION_COUNT}"

# Check troubleshooting_guide
TROUBLESHOOTING_COUNT=$(echo "$PLAN_DETAILS" | jq '.troubleshooting_guide | length')
echo "Troubleshooting Guide: ${TROUBLESHOOTING_COUNT} scenarios"

# Check safety_considerations
SAFETY_COUNT=$(echo "$PLAN_DETAILS" | jq '.safety_considerations | length')
echo "Safety Considerations: ${SAFETY_COUNT} items"

# Check required_expertise
EXPERTISE_COUNT=$(echo "$PLAN_DETAILS" | jq '.required_expertise | length')
echo "Required Expertise: ${EXPERTISE_COUNT} areas"

# Check materials
MATERIALS_COUNT=$(echo "$PLAN_DETAILS" | jq '.materials | length')
echo "Materials: ${MATERIALS_COUNT} items"

# Check procedure
PROCEDURE_COUNT=$(echo "$PLAN_DETAILS" | jq '.procedure | length')
echo "Procedure: ${PROCEDURE_COUNT} steps"

echo ""
echo "📊 FINAL RESULTS"
echo "================"

if [ ${#MISSING_FIELDS[@]} -eq 0 ] && [ ${#EMPTY_FIELDS[@]} -eq 0 ]; then
  echo "✅ SUCCESS: All 15 fields are populated!"
  echo ""
  echo "Quality Checks:"
  if [ "$RISKS_COUNT" -ge 2 ] && [ "$MITIGATION_COUNT" -ge 2 ]; then
    echo "  ✅ Risk Assessment: ${RISKS_COUNT} risks, ${MITIGATION_COUNT} strategies (PASS)"
  else
    echo "  ⚠️  Risk Assessment: ${RISKS_COUNT} risks, ${MITIGATION_COUNT} strategies (NEEDS IMPROVEMENT)"
  fi
  
  if [ "$TROUBLESHOOTING_COUNT" -ge 2 ]; then
    echo "  ✅ Troubleshooting: ${TROUBLESHOOTING_COUNT} scenarios (PASS)"
  else
    echo "  ⚠️  Troubleshooting: ${TROUBLESHOOTING_COUNT} scenarios (NEEDS IMPROVEMENT)"
  fi
  
  if [ "$SAFETY_COUNT" -ge 2 ]; then
    echo "  ✅ Safety: ${SAFETY_COUNT} items (PASS)"
  else
    echo "  ⚠️  Safety: ${SAFETY_COUNT} items (NEEDS IMPROVEMENT)"
  fi
  
  if [ "$EXPERTISE_COUNT" -ge 2 ]; then
    echo "  ✅ Expertise: ${EXPERTISE_COUNT} areas (PASS)"
  else
    echo "  ⚠️  Expertise: ${EXPERTISE_COUNT} areas (NEEDS IMPROVEMENT)"
  fi
  
  exit 0
else
  echo "❌ FAILURE: Some fields are missing or empty"
  echo ""
  if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
    echo "Missing fields: ${MISSING_FIELDS[*]}"
  fi
  if [ ${#EMPTY_FIELDS[@]} -gt 0 ]; then
    echo "Empty fields: ${EMPTY_FIELDS[*]}"
  fi
  exit 1
fi

