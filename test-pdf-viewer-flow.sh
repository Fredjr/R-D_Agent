#!/bin/bash
# Test the complete PDF viewer flow for all PMIDs

echo "🧪 Testing Complete PDF Viewer Flow"
echo "===================================="
echo ""

# Test PMIDs
PMIDS=(
  "29622564"
  "33264825"
  "33099609"
  "37345492"
  "38285982"
  "40331662"
  "40327845"
  "38278529"
  "41021024"
  "36719097"
)

BACKEND_URL="https://r-dagent-production.up.railway.app"
FRONTEND_URL="https://frontend-psi-seven-85.vercel.app"

for PMID in "${PMIDS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 Testing PMID: $PMID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Step 1: Test backend PDF URL endpoint
  echo ""
  echo "1️⃣ Testing Backend PDF URL Endpoint..."
  BACKEND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "User-ID: default_user" \
    "$BACKEND_URL/articles/$PMID/pdf-url" 2>&1)
  
  HTTP_STATUS=$(echo "$BACKEND_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
  RESPONSE_BODY=$(echo "$BACKEND_RESPONSE" | sed '/HTTP_STATUS:/d')
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Backend returned 200 OK"
    
    # Parse JSON to check pdf_available
    PDF_AVAILABLE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pdf_available', False))" 2>/dev/null)
    SOURCE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('source', 'unknown'))" 2>/dev/null)
    PDF_URL=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('url', 'N/A'))" 2>/dev/null)
    
    if [ "$PDF_AVAILABLE" = "True" ]; then
      echo "   ✅ PDF Available: Yes"
      echo "   📚 Source: $SOURCE"
      echo "   🔗 URL: ${PDF_URL:0:80}..."
    else
      echo "   ❌ PDF Available: No"
      echo "   Response: $RESPONSE_BODY"
    fi
  else
    echo "   ❌ Backend returned $HTTP_STATUS"
    echo "   Response: $RESPONSE_BODY"
  fi
  
  # Step 2: Test frontend proxy PDF URL endpoint
  echo ""
  echo "2️⃣ Testing Frontend Proxy PDF URL Endpoint..."
  FRONTEND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "User-ID: default_user" \
    "$FRONTEND_URL/api/proxy/articles/$PMID/pdf-url" 2>&1)
  
  HTTP_STATUS=$(echo "$FRONTEND_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
  RESPONSE_BODY=$(echo "$FRONTEND_RESPONSE" | sed '/HTTP_STATUS:/d')
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Frontend proxy returned 200 OK"
    
    # Parse JSON
    PDF_AVAILABLE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pdf_available', False))" 2>/dev/null)
    SOURCE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('source', 'unknown'))" 2>/dev/null)
    
    if [ "$PDF_AVAILABLE" = "True" ]; then
      echo "   ✅ PDF Available: Yes"
      echo "   📚 Source: $SOURCE"
    else
      echo "   ❌ PDF Available: No"
    fi
  else
    echo "   ❌ Frontend proxy returned $HTTP_STATUS"
    echo "   Response: ${RESPONSE_BODY:0:200}..."
  fi
  
  # Step 3: Test PDF proxy endpoint (HEAD request to check if PDF loads)
  echo ""
  echo "3️⃣ Testing PDF Proxy Endpoint (HEAD request)..."
  PDF_PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-ID: default_user" \
    -I "$FRONTEND_URL/api/proxy/articles/$PMID/pdf-proxy" 2>&1)
  
  if [ "$PDF_PROXY_STATUS" = "200" ]; then
    echo "   ✅ PDF proxy returned 200 OK - PDF can be loaded"
  elif [ "$PDF_PROXY_STATUS" = "000" ]; then
    echo "   ⚠️ Connection failed - check network/CORS"
  else
    echo "   ❌ PDF proxy returned $PDF_PROXY_STATUS"
  fi
  
  echo ""
  sleep 1  # Be nice to the servers
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Test completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

