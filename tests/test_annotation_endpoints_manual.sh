#!/bin/bash

# Manual test script for annotation endpoints
# This tests against the actual running server

echo "🧪 Testing Annotation Endpoints"
echo "================================"
echo ""

# Configuration
BASE_URL="http://localhost:8000"
PROJECT_ID="test_project_123"
USER_ID="test_user_123"

echo "📝 Test 1: Create annotation with contextual fields"
echo "------------------------------------------------------------"

RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID" \
  -d '{
    "content": "This paper shows insulin affects mitochondrial function",
    "article_pmid": "38796750",
    "note_type": "finding",
    "priority": "high",
    "status": "active",
    "tags": ["insulin", "mitochondria", "important"],
    "related_pmids": ["12345", "67890"],
    "action_items": [
      {
        "text": "Follow up with team",
        "completed": false,
        "due_date": "2025-11-15"
      }
    ]
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract annotation_id for later tests
ANNOTATION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('annotation_id', ''))" 2>/dev/null)

if [ -n "$ANNOTATION_ID" ]; then
  echo "✅ Created annotation: $ANNOTATION_ID"
else
  echo "❌ Failed to create annotation"
fi

echo ""
echo "📝 Test 2: Get all annotations"
echo "------------------------------------------------------------"

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations" \
  -H "User-ID: $USER_ID" | python3 -m json.tool 2>/dev/null

echo ""
echo "📝 Test 3: Get annotations filtered by note_type=finding"
echo "------------------------------------------------------------"

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?note_type=finding" \
  -H "User-ID: $USER_ID" | python3 -m json.tool 2>/dev/null

echo ""
echo "📝 Test 4: Get annotations filtered by priority=high"
echo "------------------------------------------------------------"

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations?priority=high" \
  -H "User-ID: $USER_ID" | python3 -m json.tool 2>/dev/null

echo ""

if [ -n "$ANNOTATION_ID" ]; then
  echo "📝 Test 5: Update annotation"
  echo "------------------------------------------------------------"
  
  curl -s -X PUT "$BASE_URL/projects/$PROJECT_ID/annotations/$ANNOTATION_ID" \
    -H "Content-Type: application/json" \
    -H "User-ID: $USER_ID" \
    -d '{
      "note_type": "hypothesis",
      "priority": "critical",
      "tags": ["insulin", "mitochondria", "important", "reviewed"],
      "status": "resolved"
    }' | python3 -m json.tool 2>/dev/null
  
  echo ""
fi

echo "📝 Test 6: Create parent annotation"
echo "------------------------------------------------------------"

PARENT_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID" \
  -d '{
    "content": "Parent note about research direction",
    "article_pmid": "38796750",
    "note_type": "general",
    "priority": "medium"
  }')

echo "$PARENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PARENT_RESPONSE"

PARENT_ID=$(echo "$PARENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('annotation_id', ''))" 2>/dev/null)

if [ -n "$PARENT_ID" ]; then
  echo "✅ Created parent: $PARENT_ID"
else
  echo "❌ Failed to create parent"
fi

echo ""

if [ -n "$PARENT_ID" ]; then
  echo "📝 Test 7: Create child annotation"
  echo "------------------------------------------------------------"
  
  CHILD_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
    -H "Content-Type: application/json" \
    -H "User-ID: $USER_ID" \
    -d "{
      \"content\": \"Child note with follow-up thought\",
      \"article_pmid\": \"38796750\",
      \"note_type\": \"finding\",
      \"priority\": \"medium\",
      \"parent_annotation_id\": \"$PARENT_ID\"
    }")
  
  echo "$CHILD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHILD_RESPONSE"
  
  CHILD_ID=$(echo "$CHILD_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('annotation_id', ''))" 2>/dev/null)
  
  if [ -n "$CHILD_ID" ]; then
    echo "✅ Created child: $CHILD_ID"
  else
    echo "❌ Failed to create child"
  fi
  
  echo ""
  echo "📝 Test 8: Get annotation thread"
  echo "------------------------------------------------------------"
  
  curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations/$PARENT_ID/thread" \
    -H "User-ID: $USER_ID" | python3 -m json.tool 2>/dev/null
  
  echo ""
fi

echo "📝 Test 9: Get all threads"
echo "------------------------------------------------------------"

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/annotations/threads" \
  -H "User-ID: $USER_ID" | python3 -m json.tool 2>/dev/null

echo ""
echo "📝 Test 10: Test invalid note_type (should fail with 422)"
echo "------------------------------------------------------------"

curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/annotations" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID" \
  -d '{
    "content": "Test note",
    "article_pmid": "38796750",
    "note_type": "invalid_type"
  }' | python3 -m json.tool 2>/dev/null

echo ""
echo "================================"
echo "✅ Manual tests complete!"
echo "================================"

