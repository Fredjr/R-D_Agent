#!/bin/bash

# Week 24: Re-triage All Papers Script
# Re-triages all papers in a project to populate enhanced fields

set -e

BACKEND_URL="https://r-dagent-production.up.railway.app"
USER_ID="${1:-fredericle75019@gmail.com}"
PROJECT_ID="${2:-804494b5-69e0-4b9a-9c7b-f7fb2bddef64}"

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: $0 [USER_ID] [PROJECT_ID]"
  echo ""
  echo "Re-triages all papers in a project to populate enhanced fields."
  echo ""
  echo "Arguments:"
  echo "  USER_ID     User email (default: fredericle75019@gmail.com)"
  echo "  PROJECT_ID  Project UUID (default: 804494b5-69e0-4b9a-9c7b-f7fb2bddef64)"
  echo ""
  echo "Example:"
  echo "  $0 user@example.com abc-123-def"
  exit 0
fi

echo "========================================="
echo "Week 24: Re-triage All Papers"
echo "========================================="
echo ""
echo "User ID:    $USER_ID"
echo "Project ID: $PROJECT_ID"
echo ""

# Get all papers in inbox
echo "📥 Fetching all papers in inbox..."
PAPERS=$(curl -s "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/inbox" \
  -H "User-ID: ${USER_ID}" | jq -r '.[].article_pmid')

PAPER_COUNT=$(echo "$PAPERS" | wc -l | tr -d ' ')
echo "Found $PAPER_COUNT papers to re-triage"
echo ""

# Confirm before proceeding
read -p "⚠️  This will re-triage $PAPER_COUNT papers. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

echo ""
echo "🔄 Re-triaging papers..."
echo "========================================="

SUCCESS_COUNT=0
ERROR_COUNT=0
SKIPPED_COUNT=0

for PMID in $PAPERS; do
  echo -n "📄 Re-triaging $PMID... "
  
  # Re-triage with force_refresh=true
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${BACKEND_URL}/api/triage/project/${PROJECT_ID}/triage" \
    -X POST \
    -H "User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d "{\"article_pmid\": \"${PMID}\", \"force_refresh\": true}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    # Check if evidence was extracted
    EVIDENCE_COUNT=$(echo "$BODY" | jq '.evidence_excerpts | length' 2>/dev/null || echo "0")
    if [ "$EVIDENCE_COUNT" -gt 0 ]; then
      echo "✅ Success ($EVIDENCE_COUNT evidence excerpts)"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "⏭️  Skipped (no evidence - likely 'ignore' status)"
      SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    fi
  else
    echo "❌ Error (HTTP $HTTP_CODE)"
    ERROR_COUNT=$((ERROR_COUNT + 1))
    # Show error details
    echo "$BODY" | jq -r '.detail // "Unknown error"' | sed 's/^/   /'
  fi
  
  # Rate limiting: wait 1 second between requests
  sleep 1
done

echo ""
echo "========================================="
echo "📊 SUMMARY"
echo "========================================="
echo ""
echo "Total papers:     $PAPER_COUNT"
echo "✅ Success:       $SUCCESS_COUNT"
echo "⏭️  Skipped:       $SKIPPED_COUNT"
echo "❌ Errors:        $ERROR_COUNT"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
  echo "⚠️  Some papers failed to re-triage. Check the errors above."
  exit 1
else
  echo "🎉 All papers re-triaged successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Refresh Smart Inbox in the UI"
  echo "2. Verify papers now have evidence excerpts"
  echo "3. Check question/hypothesis relevance scores"
fi

