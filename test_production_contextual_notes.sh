#!/bin/bash

# Contextual Notes System - Production Testing Script
# Tests all features from Step 1.1 to 1.6 on production deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://r-dagent-production.up.railway.app"
FRONTEND_URL="https://frontend-psi-seven-85.vercel.app"
TEST_USER_ID="test_user_$(date +%s)"
TEST_PROJECT_ID=""
TEST_ANNOTATION_ID=""
TEST_PMID="38796750"  # Example PMID

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS] $1${NC}"
}

print_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✅ PASS: $1${NC}\n"
}

print_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}❌ FAIL: $1${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create test report file
REPORT_FILE="TEST_EXECUTION_RESULTS_$(date +%Y%m%d_%H%M%S).md"
echo "# Contextual Notes System - Production Test Results" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "**Date:** $(date)" >> $REPORT_FILE
echo "**Backend:** $BACKEND_URL" >> $REPORT_FILE
echo "**Frontend:** $FRONTEND_URL" >> $REPORT_FILE
echo "**Test User:** $TEST_USER_ID" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ============================================
# Phase 1: Backend API Tests
# ============================================

print_header "PHASE 1: BACKEND API TESTS"

# Test 1: Backend Health Check
print_test "Backend Health Check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/docs")
if [ "$RESPONSE" = "200" ]; then
    print_pass "Backend is accessible (HTTP $RESPONSE)"
    echo "- ✅ Backend Health Check: PASS" >> $REPORT_FILE
else
    print_fail "Backend not accessible (HTTP $RESPONSE)"
    echo "- ❌ Backend Health Check: FAIL (HTTP $RESPONSE)" >> $REPORT_FILE
fi

# Test 2: Create Test Project
print_test "Create Test Project"
PROJECT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/projects" \
    -H "Content-Type: application/json" \
    -H "User-ID: $TEST_USER_ID" \
    -d "{
        \"name\": \"Test Project for Contextual Notes\",
        \"description\": \"Automated test project\",
        \"research_question\": \"Testing contextual notes system\"
    }")

TEST_PROJECT_ID=$(echo $PROJECT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('project_id', ''))" 2>/dev/null || echo "")

if [ -n "$TEST_PROJECT_ID" ]; then
    print_pass "Test project created: $TEST_PROJECT_ID"
    echo "- ✅ Create Test Project: PASS (ID: $TEST_PROJECT_ID)" >> $REPORT_FILE
else
    print_fail "Failed to create test project"
    echo "- ❌ Create Test Project: FAIL" >> $REPORT_FILE
    echo "Response: $PROJECT_RESPONSE" >> $REPORT_FILE
    exit 1
fi

# Test 3: Create Annotation with Contextual Fields
print_test "Create Annotation (POST /annotations)"
ANNOTATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations" \
    -H "Content-Type: application/json" \
    -H "User-ID: $TEST_USER_ID" \
    -d "{
        \"content\": \"This is a test finding about CRISPR gene editing - automated test\",
        \"article_pmid\": \"$TEST_PMID\",
        \"note_type\": \"finding\",
        \"priority\": \"high\",
        \"status\": \"active\",
        \"tags\": [\"crispr\", \"gene-editing\", \"automated-test\"],
        \"action_items\": [
            {
                \"description\": \"Review methodology section\",
                \"completed\": false
            }
        ],
        \"is_private\": false
    }")

TEST_ANNOTATION_ID=$(echo $ANNOTATION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('annotation_id', ''))" 2>/dev/null || echo "")

if [ -n "$TEST_ANNOTATION_ID" ]; then
    print_pass "Annotation created: $TEST_ANNOTATION_ID"
    echo "- ✅ Create Annotation: PASS (ID: $TEST_ANNOTATION_ID)" >> $REPORT_FILE
    echo "  - Content: Test finding about CRISPR" >> $REPORT_FILE
    echo "  - Type: finding" >> $REPORT_FILE
    echo "  - Priority: high" >> $REPORT_FILE
    echo "  - Tags: crispr, gene-editing, automated-test" >> $REPORT_FILE
else
    print_fail "Failed to create annotation"
    echo "- ❌ Create Annotation: FAIL" >> $REPORT_FILE
    echo "Response: $ANNOTATION_RESPONSE" >> $REPORT_FILE
fi

# Test 4: Get Annotations (with filters)
print_test "Get Annotations (GET /annotations)"
GET_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations?article_pmid=$TEST_PMID" \
    -H "User-ID: $TEST_USER_ID")

ANNOTATION_COUNT=$(echo $GET_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('annotations', [])))" 2>/dev/null || echo "0")

if [ "$ANNOTATION_COUNT" -gt "0" ]; then
    print_pass "Retrieved $ANNOTATION_COUNT annotation(s)"
    echo "- ✅ Get Annotations: PASS (Count: $ANNOTATION_COUNT)" >> $REPORT_FILE
else
    print_fail "No annotations retrieved"
    echo "- ❌ Get Annotations: FAIL" >> $REPORT_FILE
fi

# Test 5: Filter by Note Type
print_test "Filter by Note Type"
FILTER_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations?note_type=finding" \
    -H "User-ID: $TEST_USER_ID")

FILTERED_COUNT=$(echo $FILTER_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('annotations', [])))" 2>/dev/null || echo "0")

if [ "$FILTERED_COUNT" -gt "0" ]; then
    print_pass "Filter by note_type=finding returned $FILTERED_COUNT result(s)"
    echo "- ✅ Filter by Note Type: PASS" >> $REPORT_FILE
else
    print_fail "Filter by note type failed"
    echo "- ❌ Filter by Note Type: FAIL" >> $REPORT_FILE
fi

# Test 6: Filter by Priority
print_test "Filter by Priority"
PRIORITY_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations?priority=high" \
    -H "User-ID: $TEST_USER_ID")

PRIORITY_COUNT=$(echo $PRIORITY_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('annotations', [])))" 2>/dev/null || echo "0")

if [ "$PRIORITY_COUNT" -gt "0" ]; then
    print_pass "Filter by priority=high returned $PRIORITY_COUNT result(s)"
    echo "- ✅ Filter by Priority: PASS" >> $REPORT_FILE
else
    print_fail "Filter by priority failed"
    echo "- ❌ Filter by Priority: FAIL" >> $REPORT_FILE
fi

# Test 7: Update Annotation
print_test "Update Annotation (PUT /annotations/:id)"
if [ -n "$TEST_ANNOTATION_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PUT "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations/$TEST_ANNOTATION_ID" \
        -H "Content-Type: application/json" \
        -H "User-ID: $TEST_USER_ID" \
        -d "{
            \"content\": \"UPDATED: This is a critical finding about CRISPR\",
            \"priority\": \"critical\",
            \"status\": \"resolved\",
            \"tags\": [\"crispr\", \"gene-editing\", \"automated-test\", \"updated\"]
        }")
    
    UPDATED_PRIORITY=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('priority', ''))" 2>/dev/null || echo "")
    
    if [ "$UPDATED_PRIORITY" = "critical" ]; then
        print_pass "Annotation updated successfully (priority: critical)"
        echo "- ✅ Update Annotation: PASS" >> $REPORT_FILE
    else
        print_fail "Annotation update failed"
        echo "- ❌ Update Annotation: FAIL" >> $REPORT_FILE
    fi
else
    print_fail "Cannot test update - no annotation ID"
    echo "- ❌ Update Annotation: SKIPPED (no annotation ID)" >> $REPORT_FILE
fi

# Test 8: Create Reply (Thread)
print_test "Create Reply to Annotation"
if [ -n "$TEST_ANNOTATION_ID" ]; then
    REPLY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations" \
        -H "Content-Type: application/json" \
        -H "User-ID: $TEST_USER_ID" \
        -d "{
            \"content\": \"This is a reply to the test annotation\",
            \"article_pmid\": \"$TEST_PMID\",
            \"note_type\": \"general\",
            \"priority\": \"medium\",
            \"parent_annotation_id\": \"$TEST_ANNOTATION_ID\"
        }")
    
    REPLY_ID=$(echo $REPLY_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('annotation_id', ''))" 2>/dev/null || echo "")
    
    if [ -n "$REPLY_ID" ]; then
        print_pass "Reply created: $REPLY_ID"
        echo "- ✅ Create Reply: PASS (ID: $REPLY_ID)" >> $REPORT_FILE
    else
        print_fail "Failed to create reply"
        echo "- ❌ Create Reply: FAIL" >> $REPORT_FILE
    fi
else
    print_fail "Cannot test reply - no parent annotation ID"
    echo "- ❌ Create Reply: SKIPPED (no parent annotation ID)" >> $REPORT_FILE
fi

# Test 9: Get Annotation Thread
print_test "Get Annotation Thread (GET /annotations/:id/thread)"
if [ -n "$TEST_ANNOTATION_ID" ]; then
    THREAD_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations/$TEST_ANNOTATION_ID/thread" \
        -H "User-ID: $TEST_USER_ID")
    
    THREAD_DEPTH=$(echo $THREAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('depth', -1))" 2>/dev/null || echo "-1")
    
    if [ "$THREAD_DEPTH" -ge "0" ]; then
        print_pass "Thread retrieved (depth: $THREAD_DEPTH)"
        echo "- ✅ Get Thread: PASS (depth: $THREAD_DEPTH)" >> $REPORT_FILE
    else
        print_fail "Failed to retrieve thread"
        echo "- ❌ Get Thread: FAIL" >> $REPORT_FILE
    fi
else
    print_fail "Cannot test thread - no annotation ID"
    echo "- ❌ Get Thread: SKIPPED (no annotation ID)" >> $REPORT_FILE
fi

# Test 10: Get All Threads
print_test "Get All Threads (GET /annotations/threads)"
THREADS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects/$TEST_PROJECT_ID/annotations/threads" \
    -H "User-ID: $TEST_USER_ID")

THREADS_COUNT=$(echo $THREADS_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('threads', [])))" 2>/dev/null || echo "0")

if [ "$THREADS_COUNT" -gt "0" ]; then
    print_pass "Retrieved $THREADS_COUNT thread(s)"
    echo "- ✅ Get All Threads: PASS (Count: $THREADS_COUNT)" >> $REPORT_FILE
else
    print_fail "No threads retrieved"
    echo "- ❌ Get All Threads: FAIL" >> $REPORT_FILE
fi

# ============================================
# Phase 2: Frontend Tests (Manual)
# ============================================

print_header "PHASE 2: FRONTEND TESTS (MANUAL)"

echo "" >> $REPORT_FILE
echo "## Frontend Tests (Manual Verification Required)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

print_info "Frontend URL: $FRONTEND_URL"
print_info "Test Project ID: $TEST_PROJECT_ID"
print_info "Test Annotation ID: $TEST_ANNOTATION_ID"
print_info ""
print_info "Please manually verify the following in the browser:"
print_info "1. Navigate to $FRONTEND_URL"
print_info "2. Sign in with test account"
print_info "3. Open project: $TEST_PROJECT_ID"
print_info "4. Click on a paper node in Network View"
print_info "5. Verify Notes section appears in sidebar"
print_info "6. Verify annotation is visible with:"
print_info "   - Blue left border (Finding type)"
print_info "   - Critical priority badge (red)"
print_info "   - Resolved status badge"
print_info "   - Tags: #crispr #gene-editing #automated-test #updated"
print_info "7. Test keyboard shortcuts:"
print_info "   - Cmd+N: New note form"
print_info "   - Cmd+R: Refresh"
print_info "   - Esc: Close forms"
print_info "8. Test WebSocket: Open in two tabs, create note in one, verify appears in other"
print_info "9. Test filtering by type, priority, status"
print_info "10. Test reply functionality"

echo "- ⏳ Frontend UI Tests: MANUAL VERIFICATION REQUIRED" >> $REPORT_FILE
echo "  - URL: $FRONTEND_URL" >> $REPORT_FILE
echo "  - Project ID: $TEST_PROJECT_ID" >> $REPORT_FILE
echo "  - Annotation ID: $TEST_ANNOTATION_ID" >> $REPORT_FILE

# ============================================
# Test Summary
# ============================================

print_header "TEST SUMMARY"

echo "" >> $REPORT_FILE
echo "## Test Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "**Total Tests:** $TOTAL_TESTS" >> $REPORT_FILE
echo "**Passed:** $PASSED_TESTS" >> $REPORT_FILE
echo "**Failed:** $FAILED_TESTS" >> $REPORT_FILE

PASS_RATE=0
if [ "$TOTAL_TESTS" -gt "0" ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo "**Pass Rate:** $PASS_RATE%" >> $REPORT_FILE
echo "" >> $REPORT_FILE

print_info "Total Tests: $TOTAL_TESTS"
print_info "Passed: $PASSED_TESTS"
print_info "Failed: $FAILED_TESTS"
print_info "Pass Rate: $PASS_RATE%"
print_info ""
print_info "Test report saved to: $REPORT_FILE"

if [ "$FAILED_TESTS" -eq "0" ]; then
    echo -e "${GREEN}✅ ALL BACKEND TESTS PASSED!${NC}"
    echo "" >> $REPORT_FILE
    echo "✅ **ALL BACKEND TESTS PASSED!**" >> $REPORT_FILE
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "" >> $REPORT_FILE
    echo "❌ **SOME TESTS FAILED - REVIEW REQUIRED**" >> $REPORT_FILE
fi

echo ""
print_info "Next steps:"
print_info "1. Review the test report: $REPORT_FILE"
print_info "2. Manually verify frontend features in browser"
print_info "3. Check browser console for errors"
print_info "4. Test WebSocket real-time updates"
print_info "5. Test keyboard shortcuts"

