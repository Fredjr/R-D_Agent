#!/bin/bash

# Test AI Insights Multi-Agent System (Week 24 Phase 3)

BASE_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID="fredericle75019@gmail.com"

echo "========================================="
echo "TEST AI INSIGHTS MULTI-AGENT SYSTEM"
echo "Week 24 Phase 3"
echo "========================================="
echo ""
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  User ID: $USER_ID"
echo "  Base URL: $BASE_URL"
echo ""

echo "🔄 Regenerating insights with multi-agent system..."
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/insights/projects/$PROJECT_ID/insights/regenerate" \
  -H "Content-Type: application/json" \
  -H "User-ID: $USER_ID")

echo "📥 Response received"
echo ""

# Check if insights were generated
if echo "$RESPONSE" | jq -e '.progress_insights' > /dev/null 2>&1; then
    echo "✅ Insights generation successful!"
    echo ""
    
    # Extract counts
    PROGRESS_COUNT=$(echo "$RESPONSE" | jq '.progress_insights | length')
    CONNECTION_COUNT=$(echo "$RESPONSE" | jq '.connection_insights | length')
    GAP_COUNT=$(echo "$RESPONSE" | jq '.gap_insights | length')
    TREND_COUNT=$(echo "$RESPONSE" | jq '.trend_insights | length')
    RECOMMENDATION_COUNT=$(echo "$RESPONSE" | jq '.recommendations | length')
    
    echo "📊 INSIGHTS RESULTS:"
    echo "  Progress Insights: $PROGRESS_COUNT"
    echo "  Connection Insights: $CONNECTION_COUNT"
    echo "  Gap Insights: $GAP_COUNT"
    echo "  Trend Insights: $TREND_COUNT"
    echo "  Recommendations: $RECOMMENDATION_COUNT"
    echo ""
    
    # Show sample insights
    if [ "$PROGRESS_COUNT" -gt 0 ]; then
        echo "📈 PROGRESS INSIGHTS (sample):"
        echo "$RESPONSE" | jq -r '.progress_insights[:2][] | "  - [\(.impact)] \(.title)\n    \(.description[:150])..."'
        echo ""
    fi
    
    if [ "$CONNECTION_COUNT" -gt 0 ]; then
        echo "🔗 CONNECTION INSIGHTS (sample):"
        echo "$RESPONSE" | jq -r '.connection_insights[:2][] | "  - \(.title)\n    \(.description[:150])..."'
        echo ""
    fi
    
    if [ "$GAP_COUNT" -gt 0 ]; then
        echo "🔍 GAP INSIGHTS (sample):"
        echo "$RESPONSE" | jq -r '.gap_insights[:2][] | "  - [\(.priority)] \(.title)\n    \(.description[:150])..."'
        echo ""
    fi
    
    if [ "$TREND_COUNT" -gt 0 ]; then
        echo "📊 TREND INSIGHTS (sample):"
        echo "$RESPONSE" | jq -r '.trend_insights[:2][] | "  - [\(.confidence)] \(.title)\n    \(.description[:150])..."'
        echo ""
    fi
    
    if [ "$RECOMMENDATION_COUNT" -gt 0 ]; then
        echo "🎯 RECOMMENDATIONS (sample):"
        echo "$RESPONSE" | jq -r '.recommendations[:2][] | "  - [\(.priority)] \(.title)\n    \(.description[:150])..."'
        echo ""
    fi
    
    # Success criteria check
    echo "========================================="
    echo "✅ SUCCESS CRITERIA CHECK:"
    echo "========================================="
    PASS_COUNT=0
    TOTAL_COUNT=6
    
    [ "$PROGRESS_COUNT" -ge 2 ] && echo "  ✅ Progress insights populated ($PROGRESS_COUNT ≥ 2)" && ((PASS_COUNT++)) || echo "  ❌ Progress insights insufficient ($PROGRESS_COUNT < 2)"
    [ "$CONNECTION_COUNT" -ge 1 ] && echo "  ✅ Connection insights populated ($CONNECTION_COUNT ≥ 1)" && ((PASS_COUNT++)) || echo "  ❌ Connection insights insufficient ($CONNECTION_COUNT < 1)"
    [ "$GAP_COUNT" -ge 2 ] && echo "  ✅ Gap insights populated ($GAP_COUNT ≥ 2)" && ((PASS_COUNT++)) || echo "  ❌ Gap insights insufficient ($GAP_COUNT < 2)"
    [ "$TREND_COUNT" -ge 1 ] && echo "  ✅ Trend insights populated ($TREND_COUNT ≥ 1)" && ((PASS_COUNT++)) || echo "  ❌ Trend insights insufficient ($TREND_COUNT < 1)"
    [ "$RECOMMENDATION_COUNT" -ge 3 ] && echo "  ✅ Recommendations populated ($RECOMMENDATION_COUNT ≥ 3)" && ((PASS_COUNT++)) || echo "  ❌ Recommendations insufficient ($RECOMMENDATION_COUNT < 3)"
    
    # Check total insights
    TOTAL_INSIGHTS=$((PROGRESS_COUNT + CONNECTION_COUNT + GAP_COUNT + TREND_COUNT + RECOMMENDATION_COUNT))
    [ "$TOTAL_INSIGHTS" -ge 10 ] && echo "  ✅ Total insights sufficient ($TOTAL_INSIGHTS ≥ 10)" && ((PASS_COUNT++)) || echo "  ❌ Total insights insufficient ($TOTAL_INSIGHTS < 10)"
    
    echo ""
    echo "📈 FINAL SCORE: $PASS_COUNT/$TOTAL_COUNT criteria passed"
    echo ""
    
    if [ "$PASS_COUNT" -ge 5 ]; then
        echo "🎉 SUCCESS! Multi-agent insights system is working well!"
    elif [ "$PASS_COUNT" -ge 3 ]; then
        echo "⚠️  PARTIAL SUCCESS - Some insight types need improvement"
    else
        echo "❌ FAILURE - Multi-agent system needs fixes"
    fi
else
    echo "❌ Insights generation failed!"
    echo "Response: $RESPONSE"
fi

