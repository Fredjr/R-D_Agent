#!/bin/bash

# Comprehensive Backend API Testing Script for Contextual Notes
# Tests all features from Step 1.1 to Step 1.6

set -e

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="b700a560-eb62-4237-95d9-a1da0b2fc9ff"
USER_ID="test_contextual_notes_user"

echo "=========================================="
echo "CONTEXTUAL NOTES - COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo ""

# Test counters
PASS=0
FAIL=0

# Helper function
test_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ PASS: $2"
        ((PASS++))
    else
        echo "❌ FAIL: $2"
        ((FAIL++))
    fi
    echo ""
}

# TEST 1: Create annotation with FINDING type
echo "[TEST 1] Create FINDING annotation"
RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
    -H "Content-Type: application/json" \
    -H "User-ID: $USER_ID" \
    -d '{
        "content": "FINDING: Novel mechanism discovered in gene regulation",
        "article_pmid": "38796750",
        "note_type": "finding",
        "priority": "high",
        "status": "active",
        "tags": ["gene-regulation", "mechanism"],
        "action_items": [{"text": "Verify with additional studies", "completed": false}],
        "is_private": false
    }')

if echo "$RESPONSE" | grep -q "annotation_id"; then
    ANNOTATION_ID_1=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['annotation_id'])")
    test_result 0 "Created FINDING annotation (ID: ${ANNOTATION_ID_1:0:8}...)"
else
    test_result 1 "Failed to create FINDING annotation"
fi

# TEST 2: Create annotation with HYPOTHESIS type
echo "[TEST 2] Create HYPOTHESIS annotation"
RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
    -H "Content-Type: application/json" \
    -H "User-ID: $USER_ID" \
    -d '{
        "content": "HYPOTHESIS: This mechanism may apply to other gene families",
        "article_pmid": "38796750",
        "note_type": "hypothesis",
        "priority": "medium",
        "status": "active",
        "tags": ["hypothesis", "gene-families"],
        "is_private": false
    }')

if echo "$RESPONSE" | grep -q "annotation_id"; then
    ANNOTATION_ID_2=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['annotation_id'])")
    test_result 0 "Created HYPOTHESIS annotation (ID: ${ANNOTATION_ID_2:0:8}...)"
else
    test_result 1 "Failed to create HYPOTHESIS annotation"
fi

# TEST 3: Create annotation with TODO type and action items
echo "[TEST 3] Create TODO annotation with multiple action items"
RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
    -H "Content-Type: application/json" \
    -H "User-ID: $USER_ID" \
    -d '{
        "content": "TODO: Follow-up experiments needed",
        "article_pmid": "38796750",
        "note_type": "todo",
        "priority": "critical",
        "status": "active",
        "tags": ["todo", "experiments"],
        "action_items": [
            {"text": "Design experiment protocol", "completed": false},
            {"text": "Request lab resources", "completed": false},
            {"text": "Schedule with team", "completed": false}
        ],
        "is_private": false
    }')

if echo "$RESPONSE" | grep -q "annotation_id"; then
    ANNOTATION_ID_3=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['annotation_id'])")
    ACTION_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['action_items']))")
    if [ "$ACTION_COUNT" -eq 3 ]; then
        test_result 0 "Created TODO with 3 action items (ID: ${ANNOTATION_ID_3:0:8}...)"
    else
        test_result 1 "TODO created but action items count mismatch"
    fi
else
    test_result 1 "Failed to create TODO annotation"
fi

# TEST 4: Get all annotations
echo "[TEST 4] Get all annotations for project"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations" \
    -H "User-ID: $USER_ID")

ANNOTATION_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['annotations']))" 2>/dev/null || echo "0")
if [ "$ANNOTATION_COUNT" -ge 3 ]; then
    test_result 0 "Retrieved $ANNOTATION_COUNT annotations"
else
    test_result 1 "Expected at least 3 annotations, got $ANNOTATION_COUNT"
fi

# TEST 5: Filter by note_type=finding
echo "[TEST 5] Filter annotations by note_type=finding"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?note_type=finding" \
    -H "User-ID: $USER_ID")

FINDING_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([a for a in data['annotations'] if a['note_type']=='finding']))" 2>/dev/null || echo "0")
if [ "$FINDING_COUNT" -ge 1 ]; then
    test_result 0 "Filtered by note_type=finding, found $FINDING_COUNT"
else
    test_result 1 "Filter by note_type failed"
fi

# TEST 6: Filter by priority=high
echo "[TEST 6] Filter annotations by priority=high"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?priority=high" \
    -H "User-ID: $USER_ID")

HIGH_PRIORITY_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([a for a in data['annotations'] if a['priority']=='high']))" 2>/dev/null || echo "0")
if [ "$HIGH_PRIORITY_COUNT" -ge 1 ]; then
    test_result 0 "Filtered by priority=high, found $HIGH_PRIORITY_COUNT"
else
    test_result 1 "Filter by priority failed"
fi

# TEST 7: Filter by status=active
echo "[TEST 7] Filter annotations by status=active"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?status=active" \
    -H "User-ID: $USER_ID")

ACTIVE_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len([a for a in data['annotations'] if a['status']=='active']))" 2>/dev/null || echo "0")
if [ "$ACTIVE_COUNT" -ge 3 ]; then
    test_result 0 "Filtered by status=active, found $ACTIVE_COUNT"
else
    test_result 1 "Filter by status failed"
fi

# TEST 8: Update annotation
echo "[TEST 8] Update annotation status and priority"
if [ -n "$ANNOTATION_ID_1" ]; then
    RESPONSE=$(curl -s -X PUT "$BASE_URL/projects/$PROJECT_ID/annotations/$ANNOTATION_ID_1" \
        -H "Content-Type: application/json" \
        -H "User-ID: $USER_ID" \
        -d '{
            "status": "resolved",
            "priority": "medium"
        }')
    
    if echo "$RESPONSE" | grep -q "resolved"; then
        test_result 0 "Updated annotation status to resolved"
    else
        test_result 1 "Failed to update annotation"
    fi
else
    test_result 1 "Cannot update - no annotation ID"
fi

# TEST 9: Create reply (threaded annotation)
echo "[TEST 9] Create reply to annotation (threading)"
if [ -n "$ANNOTATION_ID_1" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
        -H "Content-Type: application/json" \
        -H "User-ID: $USER_ID" \
        -d "{
            \"content\": \"REPLY: I agree with this finding, here's supporting evidence\",
            \"article_pmid\": \"38796750\",
            \"note_type\": \"general\",
            \"priority\": \"low\",
            \"status\": \"active\",
            \"parent_annotation_id\": \"$ANNOTATION_ID_1\",
            \"tags\": [\"reply\"],
            \"is_private\": false
        }")
    
    if echo "$RESPONSE" | grep -q "annotation_id"; then
        REPLY_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['annotation_id'])")
        test_result 0 "Created reply annotation (ID: ${REPLY_ID:0:8}...)"
    else
        test_result 1 "Failed to create reply"
    fi
else
    test_result 1 "Cannot create reply - no parent annotation ID"
fi

# TEST 10: Get annotation thread
echo "[TEST 10] Get annotation thread"
if [ -n "$ANNOTATION_ID_1" ]; then
    RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations/$ANNOTATION_ID_1/thread" \
        -H "User-ID: $USER_ID")
    
    if echo "$RESPONSE" | grep -q "children"; then
        CHILDREN_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['children']))" 2>/dev/null || echo "0")
        test_result 0 "Retrieved thread with $CHILDREN_COUNT children"
    else
        test_result 1 "Failed to get thread"
    fi
else
    test_result 1 "Cannot get thread - no annotation ID"
fi

# TEST 11: Get all threads
echo "[TEST 11] Get all threads in project"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations/threads" \
    -H "User-ID: $USER_ID")

THREAD_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['threads']))" 2>/dev/null || echo "0")
if [ "$THREAD_COUNT" -ge 1 ]; then
    test_result 0 "Retrieved $THREAD_COUNT threads"
else
    test_result 1 "Failed to get threads"
fi

# TEST 12: Filter by article_pmid
echo "[TEST 12] Filter annotations by article_pmid"
RESPONSE=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?article_pmid=38796750" \
    -H "User-ID: $USER_ID")

ARTICLE_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['annotations']))" 2>/dev/null || echo "0")
if [ "$ARTICLE_COUNT" -ge 3 ]; then
    test_result 0 "Filtered by article_pmid, found $ARTICLE_COUNT"
else
    test_result 1 "Filter by article_pmid failed"
fi

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "✅ PASSED: $PASS"
echo "❌ FAILED: $FAIL"
echo "TOTAL: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    exit 0
else
    echo "⚠️  SOME TESTS FAILED"
    exit 1
fi

