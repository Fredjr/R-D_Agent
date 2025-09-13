#!/bin/bash

# Quick Verification Tests for R&D Agent Platform
# Run these after deployment to verify basic functionality

echo "🚀 Starting Quick Verification Tests..."

# Test 1: Backend Health Check
echo "📡 Testing backend connectivity..."
curl -I "https://r-dagent-production.up.railway.app/" --max-time 10

# Test 2: Simple Generate Review (should complete without timeout)
echo "🧪 Testing simple generate review..."
curl -X POST "https://r-dagent-production.up.railway.app/generate-review" \
  -H "Content-Type: application/json" \
  -H "User-ID: test@example.com" \
  -d '{
    "molecule": "aspirin",
    "objective": "What are the cardiovascular benefits?",
    "preference": "precision"
  }' \
  --max-time 300 \
  -w "Time: %{time_total}s\n"

# Test 3: Frontend API Proxy
echo "🌐 Testing frontend proxy..."
curl -I "https://frontend-psi-seven-85.vercel.app/api/proxy/generate-review" --max-time 10

# Test 4: New Comprehensive Summary Endpoint
echo "📊 Testing comprehensive summary endpoint..."
curl -X POST "https://r-dagent-production.up.railway.app/projects/test-project-id/generate-comprehensive-summary" \
  -H "Content-Type: application/json" \
  -H "User-ID: test@example.com" \
  --max-time 60 \
  -w "Status: %{http_code}\n"

echo "✅ Quick verification tests completed!"
echo "📋 Next: Run comprehensive testing plan if basic tests pass"
