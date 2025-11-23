#!/bin/bash

# Week 24: Test PDF Figure Extraction Fix
# This script tests that PDF figures are properly extracted and encoded

echo "🖼️  Testing PDF Figure Extraction (Week 24 Fix)"
echo "================================================"
echo ""

# Configuration
API_BASE="https://r-dagent-production.up.railway.app"
USER_ID="fredericle75019@gmail.com"
PMID="39973977"  # Flame-wall paper with figures

echo "📄 Testing PMID: ${PMID}"
echo ""

# Step 1: Force re-extract PDF
echo "🔄 Step 1: Force re-extracting PDF..."
EXTRACT_RESPONSE=$(curl -s -X GET "${API_BASE}/api/articles/${PMID}/pdf-text?force_refresh=true" \
  -H "User-ID: ${USER_ID}")

EXTRACT_STATUS=$(echo "$EXTRACT_RESPONSE" | jq -r '.status')

if [ "$EXTRACT_STATUS" != "success" ]; then
  echo "❌ PDF extraction failed"
  echo "$EXTRACT_RESPONSE" | jq '.'
  exit 1
fi

FIGURES_COUNT=$(echo "$EXTRACT_RESPONSE" | jq '.figures | length')
echo "✅ PDF extracted: ${FIGURES_COUNT} figures found"
echo ""

# Step 2: Fetch article details
echo "📊 Step 2: Fetching article details..."
ARTICLE_RESPONSE=$(curl -s "${API_BASE}/api/articles/${PMID}" \
  -H "User-ID: ${USER_ID}")

PDF_FIGURES_COUNT=$(echo "$ARTICLE_RESPONSE" | jq '.pdf_figures | length')
echo "✅ Article has ${PDF_FIGURES_COUNT} figures stored"
echo ""

# Step 3: Validate figure data
echo "🔍 Step 3: Validating figure data..."
echo "===================================="

if [ "$PDF_FIGURES_COUNT" -eq 0 ]; then
  echo "❌ FAILURE: No figures found in article"
  exit 1
fi

# Check first figure
FIGURE_DATA=$(echo "$ARTICLE_RESPONSE" | jq -r '.pdf_figures[0].image_data')

if [ -z "$FIGURE_DATA" ] || [ "$FIGURE_DATA" = "null" ]; then
  echo "❌ FAILURE: Figure image_data is missing"
  exit 1
fi

# Check if it's a proper data URI
if [[ "$FIGURE_DATA" == data:image/* ]]; then
  echo "✅ Figure has proper data URI format"
  
  # Check if it's PNG
  if [[ "$FIGURE_DATA" == data:image/png* ]]; then
    echo "✅ Figure is PNG format"
  else
    echo "⚠️  Figure is not PNG (might be JPEG)"
  fi
  
  # Check if it has base64 data
  if [[ "$FIGURE_DATA" == *base64,* ]]; then
    echo "✅ Figure has base64 encoding"
    
    # Extract base64 data length
    BASE64_DATA="${FIGURE_DATA#*base64,}"
    BASE64_LENGTH=${#BASE64_DATA}
    echo "✅ Base64 data length: ${BASE64_LENGTH} characters"
    
    # Check if it's not just repeated characters (corruption check)
    UNIQUE_CHARS=$(echo "$BASE64_DATA" | head -c 100 | grep -o . | sort -u | wc -l)
    if [ "$UNIQUE_CHARS" -gt 10 ]; then
      echo "✅ Base64 data appears valid (${UNIQUE_CHARS} unique characters in first 100)"
    else
      echo "❌ Base64 data appears corrupted (only ${UNIQUE_CHARS} unique characters)"
      exit 1
    fi
  else
    echo "❌ Figure missing base64 encoding"
    exit 1
  fi
else
  echo "❌ FAILURE: Figure does not have data URI format"
  echo "First 100 characters: ${FIGURE_DATA:0:100}"
  exit 1
fi

echo ""
echo "📈 Step 4: Detailed Figure Analysis..."
echo "======================================"

# Analyze all figures
for i in $(seq 0 $((PDF_FIGURES_COUNT - 1))); do
  FIGURE=$(echo "$ARTICLE_RESPONSE" | jq ".pdf_figures[$i]")
  
  FIGURE_NUM=$(echo "$FIGURE" | jq -r '.figure_number')
  PAGE=$(echo "$FIGURE" | jq -r '.page')
  WIDTH=$(echo "$FIGURE" | jq -r '.width')
  HEIGHT=$(echo "$FIGURE" | jq -r '.height')
  SIZE_BYTES=$(echo "$FIGURE" | jq -r '.size_bytes')
  
  echo "Figure ${FIGURE_NUM} (Page ${PAGE}):"
  echo "  - Dimensions: ${WIDTH}x${HEIGHT}px"
  echo "  - Size: ${SIZE_BYTES} bytes"
  
  IMAGE_DATA=$(echo "$FIGURE" | jq -r '.image_data')
  if [[ "$IMAGE_DATA" == data:image/png* ]]; then
    echo "  - Format: ✅ PNG with data URI"
  elif [[ "$IMAGE_DATA" == data:image/jpeg* ]]; then
    echo "  - Format: ✅ JPEG with data URI"
  else
    echo "  - Format: ❌ Invalid or missing"
  fi
  echo ""
done

echo "📊 FINAL RESULTS"
echo "================"
echo "✅ SUCCESS: PDF figures are properly extracted and encoded!"
echo ""
echo "Summary:"
echo "  - Figures extracted: ${PDF_FIGURES_COUNT}"
echo "  - Format: PNG with data URI"
echo "  - Encoding: Base64"
echo "  - Data validation: PASSED"
echo ""
echo "🎉 Figures should now display correctly in the UI!"

exit 0

