#!/bin/bash

echo "========================================="
echo "TESTING ALL NETWORK FEATURES LOCALLY"
echo "========================================="
echo ""

TEST_PMID="38350768"
BASE_URL="http://localhost:3000"

# Test Similar Work (should exclude source paper now)
echo "1. Testing Similar Work (POST)..."
curl -s -X POST "$BASE_URL/api/proxy/pubmed/recommendations" \
  -H "Content-Type: application/json" \
  -H "User-ID: test_user" \
  -d '{"type":"similar","pmid":"'$TEST_PMID'","limit":10}' | \
  python3 -c "import json, sys; d=json.load(sys.stdin); recs=d.get('recommendations',[]); print(f'✓ {len(recs)} results'); print(f'Source included: {any(r.get(\"pmid\")==\"$TEST_PMID\" for r in recs)}')"

echo ""

# Test Linked Content
echo "2. Testing Linked Content..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/linked?limit=10" | \
  python3 -c "import json, sys; d=json.load(sys.stdin); print(f'✓ {len(d.get(\"linked_content\",[]))} results'); print(f'Types: {set(r.get(\"publication_type\") for r in d.get(\"linked_content\",[])[:3])}')" 2>/dev/null || echo "✗ Failed"

echo ""

# Test Earlier Work
echo "3. Testing Earlier Work..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/earlier?limit=10" | \
  python3 -c "import json, sys; d=json.load(sys.stdin); arts=d.get('earlier_articles',[]); print(f'✓ {len(arts)} results'); print(f'Years: {[r.get(\"year\") for r in arts[:3]]}')" 2>/dev/null || echo "✗ Failed"

echo ""

# Test Later Work
echo "4. Testing Later Work..."
curl -s "$BASE_URL/api/proxy/articles/$TEST_PMID/later?limit=10" | \
  python3 -c "import json, sys; d=json.load(sys.stdin); arts=d.get('later_articles',[]); print(f'✓ {len(arts)} results'); print(f'Years: {[r.get(\"year\") for r in arts[:3]]}')" 2>/dev/null || echo "✗ Failed"

echo ""

# Test Suggested Authors
echo "5. Testing Suggested Authors..."
curl -s -H "User-ID: test_user" "$BASE_URL/api/proxy/articles/$TEST_PMID/authors?limit=10" | \
  python3 -c "import json, sys; d=json.load(sys.stdin); auths=d.get('authors',[]); print(f'✓ {len(auths)} results'); print(f'Sample: {auths[0].get(\"name\") if auths else \"None\"}')" 2>/dev/null || echo "✗ Failed"

echo ""
echo "========================================="
echo "Testing complete!"
echo "========================================="
