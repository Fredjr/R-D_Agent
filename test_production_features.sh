#!/bin/bash

BASE_URL="https://frontend-psi-seven-85.vercel.app"
TEST_PMID="38350768"

echo "Testing Production Deployment: $BASE_URL"
echo "Test PMID: $TEST_PMID"
echo ""

# Test Citations
echo "1. Testing Citations Network..."
curl -s "$BASE_URL/api/proxy/pubmed/citations?pmid=$TEST_PMID&limit=10" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Citations: {len(d.get(\"citations\", []))} results')" 2>/dev/null || echo "✗ Citations: FAILED"

# Test References
echo "2. Testing References Network..."
curl -s "$BASE_URL/api/proxy/pubmed/references?pmid=$TEST_PMID&limit=10" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ References: {len(d.get(\"references\", []))} results')" 2>/dev/null || echo "✗ References: FAILED"

# Test Similar Work (via recommendations)
echo "3. Testing Similar Work..."
curl -s -X POST "$BASE_URL/api/proxy/pubmed/recommendations" \
  -H "Content-Type: application/json" \
  -H "User-ID: test_user" \
  -d '{"type":"similar","pmid":"'$TEST_PMID'","limit":10}' | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Similar Work: {len(d.get(\"recommendations\", []))} results')" 2>/dev/null || echo "✗ Similar Work: FAILED"

# Test Linked Content
echo "4. Testing Linked Content..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/linked?limit=10" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Linked Content: {len(d.get(\"linked_content\", []))} results') if 'linked_content' in d else print('⚠ Linked Content: Not implemented')" 2>/dev/null || echo "✗ Linked Content: FAILED"

# Test Earlier Work
echo "5. Testing Earlier Work..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/earlier?limit=10" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Earlier Work: {len(d.get(\"earlier_articles\", []))} results') if 'earlier_articles' in d else print('⚠ Earlier Work: Not implemented')" 2>/dev/null || echo "✗ Earlier Work: FAILED"

# Test Later Work
echo "6. Testing Later Work..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/later?limit=10" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Later Work: {len(d.get(\"later_articles\", []))} results') if 'later_articles' in d else print('⚠ Later Work: Not implemented')" 2>/dev/null || echo "✗ Later Work: FAILED"

# Test Suggested Authors
echo "7. Testing Suggested Authors..."
curl -s -H "User-ID: test_user" "$BASE_URL/api/proxy/articles/$TEST_PMID/authors?include_profiles=true" | python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ Suggested Authors: {len(d.get(\"authors\", []))} results') if 'authors' in d else print('⚠ Suggested Authors: Not implemented')" 2>/dev/null || echo "✗ Suggested Authors: FAILED"

echo ""
echo "Testing complete!"
