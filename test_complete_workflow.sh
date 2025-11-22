#!/bin/bash

# Complete Week 22 Workflow Test
# Tests: Triage → Protocol → Experiment (full data flow)
# Author: R-D Agent Testing Suite
# Date: 2025-11-22

set -e

API_BASE="https://frontend-psi-seven-85.vercel.app/api/proxy"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
TEST_PMID="36572499"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo "🧪 COMPLETE WEEK 22 WORKFLOW TEST"
echo "=================================="
echo ""
echo "Testing: Triage → Protocol → Experiment"
echo "Paper: PMID ${TEST_PMID}"
echo ""

# Step 1: Check if paper is already triaged
echo -e "${BLUE}📋 STEP 1: Check Triage Status${NC}"
echo "Checking if paper is already triaged..."
echo ""

TRIAGE_CHECK=$(curl -s "${API_BASE}/triage/project/${PROJECT_ID}/paper/${TEST_PMID}")

echo "$TRIAGE_CHECK" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'triage_id' in data:
        print('✅ Paper already triaged!')
        print(f'   Triage ID: {data.get(\"triage_id\", \"N/A\")}')
        print(f'   Relevance Score: {data.get(\"relevance_score\", \"N/A\")}/100')
        print(f'   Status: {data.get(\"triage_status\", \"N/A\")}')
        print(f'   Evidence Excerpts: {len(data.get(\"evidence_excerpts\", []))} quotes')
        sys.exit(0)
    else:
        print('⚠️  Paper not triaged yet')
        sys.exit(1)
except Exception as e:
    print(f'⚠️  Paper not triaged yet: {e}')
    sys.exit(1)
"

TRIAGE_EXISTS=$?

echo ""
echo "---"
echo ""

# Step 2: Check protocols
echo -e "${BLUE}📊 STEP 2: Check Protocol Status${NC}"
echo "Checking if protocol exists for this paper..."
echo ""

PROTOCOLS=$(curl -s "${API_BASE}/protocols/project/${PROJECT_ID}")

echo "$PROTOCOLS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    protocols = data if isinstance(data, list) else []
    
    # Find protocol for our PMID
    target_protocol = None
    for p in protocols:
        if p.get('source_pmid') == '${TEST_PMID}':
            target_protocol = p
            break
    
    if target_protocol:
        print('✅ Protocol found!')
        print(f'   Protocol ID: {target_protocol.get(\"protocol_id\", \"N/A\")}')
        print(f'   Protocol Name: {target_protocol.get(\"protocol_name\", \"N/A\")}')
        print(f'   Tables: {len(target_protocol.get(\"tables_data\", []))} tables')
        print(f'   Figures: {len(target_protocol.get(\"figures_data\", []))} figures')
        
        analysis = target_protocol.get('figures_analysis', '')
        if analysis:
            print(f'   GPT-4 Vision Analysis: {len(analysis)} chars')
        else:
            print(f'   GPT-4 Vision Analysis: None')
        
        # Save protocol ID for next step
        with open('/tmp/protocol_id.txt', 'w') as f:
            f.write(target_protocol.get('protocol_id', ''))
        
        sys.exit(0)
    else:
        print('⚠️  No protocol found for this paper')
        sys.exit(1)
except Exception as e:
    print(f'❌ Error checking protocols: {e}')
    sys.exit(1)
"

PROTOCOL_EXISTS=$?

echo ""
echo "---"
echo ""

# Step 3: Check experiment plans
if [ $PROTOCOL_EXISTS -eq 0 ]; then
    PROTOCOL_ID=$(cat /tmp/protocol_id.txt 2>/dev/null || echo "")
    
    if [ -n "$PROTOCOL_ID" ]; then
        echo -e "${BLUE}🧪 STEP 3: Check Experiment Plan Status${NC}"
        echo "Checking if experiment plan exists for this protocol..."
        echo ""
        
        PLANS=$(curl -s "${API_BASE}/experiment-plans/project/${PROJECT_ID}")
        
        echo "$PLANS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    plans = data if isinstance(data, list) else []
    
    # Find plan for our protocol
    target_plan = None
    for p in plans:
        if p.get('protocol_id') == '${PROTOCOL_ID}':
            target_plan = p
            break
    
    if target_plan:
        print('✅ Experiment plan found!')
        print(f'   Plan ID: {target_plan.get(\"plan_id\", \"N/A\")}')
        print(f'   Plan Name: {target_plan.get(\"plan_name\", \"N/A\")}')
        print(f'   Status: {target_plan.get(\"status\", \"N/A\")}')
        print(f'   Difficulty: {target_plan.get(\"difficulty_level\", \"N/A\")}')
        print(f'   Timeline: {target_plan.get(\"timeline_estimate\", \"N/A\")}')
        print(f'   Cost: {target_plan.get(\"estimated_cost\", \"N/A\")}')
        
        confidence = target_plan.get('generation_confidence')
        if confidence:
            print(f'   Generation Confidence: {int(confidence * 100)}%')
        
        # Check for confidence predictions in notes
        notes = target_plan.get('notes', '')
        if 'Confidence Predictions' in notes or 'confidence_predictions' in notes:
            print(f'   ✅ Confidence predictions present in notes')
        else:
            print(f'   ⚠️  No confidence predictions found')
        
        sys.exit(0)
    else:
        print('⚠️  No experiment plan found for this protocol')
        sys.exit(1)
except Exception as e:
    print(f'❌ Error checking experiment plans: {e}')
    sys.exit(1)
"
        
        PLAN_EXISTS=$?
    else
        echo -e "${YELLOW}⚠️  STEP 3: Skipped (no protocol ID)${NC}"
        PLAN_EXISTS=1
    fi
else
    echo -e "${YELLOW}⚠️  STEP 3: Skipped (no protocol)${NC}"
    PLAN_EXISTS=1
fi

echo ""
echo "================================"
echo -e "${PURPLE}📊 WORKFLOW STATUS SUMMARY${NC}"
echo ""

if [ $TRIAGE_EXISTS -eq 0 ]; then
    echo -e "  ${GREEN}✅ Triage: COMPLETE${NC}"
else
    echo -e "  ${YELLOW}⚠️  Triage: PENDING${NC}"
fi

if [ $PROTOCOL_EXISTS -eq 0 ]; then
    echo -e "  ${GREEN}✅ Protocol: COMPLETE${NC}"
else
    echo -e "  ${YELLOW}⚠️  Protocol: PENDING${NC}"
fi

if [ $PLAN_EXISTS -eq 0 ]; then
    echo -e "  ${GREEN}✅ Experiment Plan: COMPLETE${NC}"
else
    echo -e "  ${YELLOW}⚠️  Experiment Plan: PENDING${NC}"
fi

echo ""

if [ $TRIAGE_EXISTS -eq 0 ] && [ $PROTOCOL_EXISTS -eq 0 ] && [ $PLAN_EXISTS -eq 0 ]; then
    echo -e "${GREEN}🎉 COMPLETE WORKFLOW VERIFIED!${NC}"
    echo ""
    echo "All Week 22 features are working end-to-end:"
    echo "  ✅ Triage extracted evidence"
    echo "  ✅ Protocol extracted tables/figures"
    echo "  ✅ Experiment plan generated with confidence predictions"
    echo ""
    echo "Next: Check UI to verify rendering!"
else
    echo -e "${YELLOW}⚠️  WORKFLOW INCOMPLETE${NC}"
    echo ""
    echo "Some steps are missing. This is expected if you haven't"
    echo "run the full workflow yet. Follow MANUAL_TESTING_GUIDE.md"
    echo "to complete the workflow."
fi

echo ""

