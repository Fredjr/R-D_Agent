#!/bin/bash

# Comprehensive Network Features Test Script
# Tests all network exploration features with real PubMed papers

BASE_URL="http://localhost:3000"
TEST_PMID="38350768"  # COVID-19 vaccine safety paper

echo "========================================="
echo "COMPREHENSIVE NETWORK FEATURES TEST"
echo "========================================="
echo "Test PMID: $TEST_PMID"
echo "Base URL: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_field=$3
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s "$endpoint")
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ FAILED: Could not reach endpoint${NC}"
        echo ""
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "${RED}✗ FAILED: Invalid JSON response${NC}"
        echo "Response: ${response:0:200}..."
        echo ""
        return 1
    fi
    
    # Check for error messages
    if echo "$response" | grep -q '"error"'; then
        error_msg=$(echo "$response" | python3 -c "import json, sys; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null)
        echo -e "${RED}✗ FAILED: API returned error${NC}"
        echo "Error: $error_msg"
        echo ""
        return 1
    fi
    
    # Check for "not yet implemented" message
    if echo "$response" | grep -q '"message".*"not yet implemented"'; then
        echo -e "${YELLOW}⚠ NOT IMPLEMENTED${NC}"
        echo ""
        return 2
    fi
    
    # Check if expected field exists and has data
    count=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); print(len(d.get('$expected_field', [])))" 2>/dev/null)
    
    if [ "$count" = "" ]; then
        echo -e "${RED}✗ FAILED: Could not parse response${NC}"
        echo ""
        return 1
    fi
    
    if [ "$count" -eq 0 ]; then
        echo -e "${YELLOW}⚠ WARNING: No results returned${NC}"
        echo ""
        return 2
    fi
    
    echo -e "${GREEN}✓ SUCCESS: $count results returned${NC}"
    
    # Show first result
    first_result=$(echo "$response" | python3 -c "import json, sys; d=json.load(sys.stdin); items=d.get('$expected_field', []); print(f'{items[0][\"pmid\"]}: {items[0][\"title\"][:60]}... ({items[0].get(\"year\", \"N/A\")})') if items else print('No items')" 2>/dev/null)
    echo "First result: $first_result"
    echo ""
    
    return 0
}

echo "========================================="
echo "PRIORITY 0: CRITICAL FEATURES"
echo "========================================="
echo ""

# Test Citations Network
test_endpoint "Citations Network" \
    "$BASE_URL/api/proxy/pubmed/citations?pmid=$TEST_PMID&limit=10" \
    "citations"
citations_status=$?

# Test References Network
test_endpoint "References Network" \
    "$BASE_URL/api/proxy/pubmed/references?pmid=$TEST_PMID&limit=10" \
    "references"
references_status=$?

# Test Linked Content
test_endpoint "Linked Content" \
    "$BASE_URL/api/proxy/articles/$TEST_PMID/linked?limit=10" \
    "linked_content"
linked_status=$?

# Test Suggested Authors
test_endpoint "Suggested Authors" \
    "$BASE_URL/api/proxy/articles/$TEST_PMID/authors?include_profiles=true" \
    "authors"
authors_status=$?

echo "========================================="
echo "PRIORITY 1: TEMPORAL FEATURES"
echo "========================================="
echo ""

# Test Similar Work
test_endpoint "Similar Work (Recommendations)" \
    "$BASE_URL/api/proxy/pubmed/recommendations" \
    "recommendations"
similar_status=$?

# Test Earlier Work
test_endpoint "Earlier Work" \
    "$BASE_URL/api/proxy/articles/$TEST_PMID/earlier?limit=10" \
    "earlier_articles"
earlier_status=$?

# Test Later Work
test_endpoint "Later Work" \
    "$BASE_URL/api/proxy/articles/$TEST_PMID/later?limit=10" \
    "later_articles"
later_status=$?

echo "========================================="
echo "SUMMARY"
echo "========================================="
echo ""

print_status() {
    local name=$1
    local status=$2
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ $name: WORKING${NC}"
    elif [ $status -eq 2 ]; then
        echo -e "${YELLOW}⚠ $name: NOT IMPLEMENTED${NC}"
    else
        echo -e "${RED}✗ $name: FAILED${NC}"
    fi
}

echo "Priority 0 (Critical):"
print_status "  Citations Network" $citations_status
print_status "  References Network" $references_status
print_status "  Linked Content" $linked_status
print_status "  Suggested Authors" $authors_status

echo ""
echo "Priority 1 (Temporal):"
print_status "  Similar Work" $similar_status
print_status "  Earlier Work" $earlier_status
print_status "  Later Work" $later_status

echo ""
echo "========================================="

# Calculate overall status
total_tests=7
working=0
not_implemented=0
failed=0

for status in $citations_status $references_status $linked_status $authors_status $similar_status $earlier_status $later_status; do
    if [ $status -eq 0 ]; then
        ((working++))
    elif [ $status -eq 2 ]; then
        ((not_implemented++))
    else
        ((failed++))
    fi
done

echo "Overall: $working/$total_tests working, $not_implemented not implemented, $failed failed"
echo "========================================="

