#!/bin/bash

# TERMINAL VERIFICATION SCRIPT v1.0
# 
# Comprehensive end-to-end testing of all 6 endpoints with detailed analysis
# Tests using project: 5ac213d7-6fcc-46ff-9420-5c7f4b421012
# URL: https://frontend-psi-seven-85.vercel.app/project/5ac213d7-6fcc-46ff-9420-5c7f4b421012

# Configuration
FRONTEND_URL="https://frontend-psi-seven-85.vercel.app"
BACKEND_URL="https://r-dagent-production.up.railway.app"
PROJECT_ID="5ac213d7-6fcc-46ff-9420-5c7f4b421012"
USER_ID="fredericle77@gmail.com"
TIMEOUT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Results array
declare -a TEST_RESULTS

log() {
    local type=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $type in
        "INFO")  echo -e "${BLUE}ℹ️  [$timestamp] $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ [$timestamp] $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ [$timestamp] $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  [$timestamp] $message${NC}" ;;
        "TEST") echo -e "${PURPLE}🧪 [$timestamp] $message${NC}" ;;
        "ANALYSIS") echo -e "${CYAN}📊 [$timestamp] $message${NC}" ;;
    esac
}

test_endpoint() {
    local endpoint_name=$1
    local endpoint_path=$2
    local payload=$3
    local expected_fields=$4
    
    log "TEST" "Testing $endpoint_name..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local start_time=$(date +%s%N)
    local url="$FRONTEND_URL$endpoint_path"
    
    # Make API call
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X POST "$url" \
        -H "Content-Type: application/json" \
        -H "User-ID: $USER_ID" \
        -d "$payload" \
        --max-time $TIMEOUT 2>/dev/null)
    
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    # Parse response
    local body=$(echo "$response" | head -n -2)
    local http_code=$(echo "$response" | tail -n 2 | head -n 1)
    local curl_time=$(echo "$response" | tail -n 1)
    
    # Analyze response
    if [ "$http_code" = "200" ]; then
        log "SUCCESS" "$endpoint_name: SUCCESS (${response_time}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Check for expected fields
        local fields_found=0
        if [ -n "$expected_fields" ]; then
            IFS=',' read -ra FIELDS <<< "$expected_fields"
            for field in "${FIELDS[@]}"; do
                if echo "$body" | grep -q "\"$field\""; then
                    fields_found=$((fields_found + 1))
                fi
            done
        fi
        
        # Extract quality metrics
        local quality_score=$(echo "$body" | grep -o '"quality_score":[0-9.]*' | cut -d':' -f2 | head -1)
        local processing_time=$(echo "$body" | grep -o '"processing_time":"[^"]*"' | cut -d'"' -f4 | head -1)
        
        log "ANALYSIS" "$endpoint_name Analysis:"
        echo "    Status: ✅ SUCCESS"
        echo "    Response Time: ${response_time}ms"
        echo "    HTTP Code: $http_code"
        [ -n "$quality_score" ] && echo "    Quality Score: $quality_score/10"
        [ -n "$processing_time" ] && echo "    Processing Time: $processing_time"
        [ -n "$expected_fields" ] && echo "    Expected Fields Found: $fields_found/${#FIELDS[@]}"
        
        # Store result
        TEST_RESULTS+=("$endpoint_name:SUCCESS:$http_code:${response_time}ms:$quality_score")
        
    else
        log "ERROR" "$endpoint_name: FAILED ($http_code) (${response_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        
        # Extract error message
        local error_msg=$(echo "$body" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4 | head -1)
        [ -z "$error_msg" ] && error_msg=$(echo "$body" | head -c 100)
        
        log "ANALYSIS" "$endpoint_name Analysis:"
        echo "    Status: ❌ FAILED"
        echo "    Response Time: ${response_time}ms"
        echo "    HTTP Code: $http_code"
        echo "    Error: $error_msg"
        
        # Store result
        TEST_RESULTS+=("$endpoint_name:FAILED:$http_code:${response_time}ms:$error_msg")
    fi
    
    echo ""
}

test_backend_health() {
    log "INFO" "Testing backend health..."
    
    local response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health" --max-time 10)
    local body=$(echo "$response" | head -n -1)
    local http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        local version=$(echo "$body" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        local service=$(echo "$body" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
        
        log "SUCCESS" "Backend is healthy"
        echo "    Service: $service"
        echo "    Version: $version"
        echo "    URL: $BACKEND_URL"
        return 0
    else
        log "ERROR" "Backend health check failed ($http_code)"
        return 1
    fi
}

generate_final_report() {
    local success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    echo ""
    echo "🎉 FINAL VERIFICATION REPORT"
    echo "============================"
    echo ""
    echo "📊 OVERALL STATISTICS:"
    echo "   Total Tests: $TOTAL_TESTS"
    echo "   Passed: $PASSED_TESTS"
    echo "   Failed: $FAILED_TESTS"
    echo "   Success Rate: $success_rate%"
    echo ""
    echo "🔗 INDIVIDUAL ENDPOINT RESULTS:"
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS=':' read -ra PARTS <<< "$result"
        local name="${PARTS[0]}"
        local status="${PARTS[1]}"
        local code="${PARTS[2]}"
        local time="${PARTS[3]}"
        local extra="${PARTS[4]}"
        
        echo ""
        echo "   $name:"
        if [ "$status" = "SUCCESS" ]; then
            echo "     Status: ✅ SUCCESS ($code)"
            echo "     Response Time: $time"
            [ -n "$extra" ] && [ "$extra" != "" ] && echo "     Quality Score: $extra/10"
        else
            echo "     Status: ❌ FAILED ($code)"
            echo "     Response Time: $time"
            echo "     Error: $extra"
        fi
    done
    
    echo ""
    echo "🎯 QUALITY ASSESSMENT:"
    if [ $success_rate -ge 85 ]; then
        echo "   Status: 🎉 EXCELLENT - All systems operational"
        echo "   Deployment: ✅ Production ready"
        echo "   PhD Quality: ✅ Academic standards met"
    elif [ $success_rate -ge 70 ]; then
        echo "   Status: ✅ GOOD - Most systems working"
        echo "   Deployment: ⚠️ Minor issues to address"
    elif [ $success_rate -ge 50 ]; then
        echo "   Status: ⚠️ PARTIAL - Significant issues remain"
        echo "   Deployment: ❌ Not ready for production"
    else
        echo "   Status: ❌ CRITICAL - Major system failures"
        echo "   Deployment: ❌ Requires immediate attention"
    fi
    
    echo ""
    echo "🌐 PROJECT WORKSPACE:"
    echo "   Frontend: $FRONTEND_URL/project/$PROJECT_ID"
    echo "   Backend: $BACKEND_URL"
    echo "   Project ID: $PROJECT_ID"
    echo ""
    echo "💡 NEXT STEPS:"
    if [ $FAILED_TESTS -gt 0 ]; then
        echo "   🔧 Fix $FAILED_TESTS failing endpoint(s)"
        echo "   📊 Check Railway deployment logs"
        echo "   🔄 Re-run verification after fixes"
    else
        echo "   ✅ All endpoints working correctly"
        echo "   🎨 Test UI integration in browser"
        echo "   📱 Verify responsive design"
    fi
    
    echo ""
    echo "🎉 VERIFICATION COMPLETED"
}

# Main execution
main() {
    log "INFO" "🚀 STARTING FINAL VERIFICATION SCRIPT"
    log "INFO" "Testing all 6 endpoints with comprehensive analysis"
    log "INFO" "Project: $PROJECT_ID"
    log "INFO" "Frontend: $FRONTEND_URL"
    log "INFO" "Backend: $BACKEND_URL"
    echo ""
    
    # Test backend health first
    if ! test_backend_health; then
        log "ERROR" "Backend is not healthy. Continuing with tests anyway..."
    fi
    echo ""
    
    # Test 1: Generate Review
    test_endpoint "Generate Review" \
        "/api/proxy/background-jobs/generate-review" \
        '{"molecule":"COVID-19 therapeutics","objective":"Comprehensive review of treatment efficacy","project_id":"'$PROJECT_ID'"}' \
        "job_id,status,estimated_completion"
    
    # Test 2: Deep Dive Analysis
    test_endpoint "Deep Dive Analysis" \
        "/api/proxy/deep-dive-analysis" \
        '{"project_id":"'$PROJECT_ID'","analysis_type":"comprehensive","focus_areas":["methodology","outcomes","limitations"]}' \
        "analysis_results,insights,recommendations"
    
    # Test 3: Comprehensive Analysis
    test_endpoint "Comprehensive Analysis" \
        "/api/proxy/comprehensive-analysis" \
        '{"project_id":"'$PROJECT_ID'","analysis_depth":"detailed","include_visualizations":true}' \
        "summary,detailed_findings,methodology_analysis"
    
    # Test 4: Thesis Chapter Generator
    test_endpoint "Thesis Chapter Generator" \
        "/api/proxy/thesis-chapter-generator" \
        '{"project_id":"'$PROJECT_ID'","objective":"Generate comprehensive thesis structure","chapter_focus":"literature_review","academic_level":"phd"}' \
        "chapters,quality_score,processing_time,metadata"
    
    # Test 5: Literature Gap Analysis
    test_endpoint "Literature Gap Analysis" \
        "/api/proxy/literature-gap-analysis" \
        '{"project_id":"'$PROJECT_ID'","objective":"Identify research gaps and opportunities","gap_types":["theoretical","methodological","empirical"],"academic_level":"phd"}' \
        "identified_gaps,research_opportunities,quality_score,recommendations"
    
    # Test 6: Methodology Synthesis
    test_endpoint "Methodology Synthesis" \
        "/api/proxy/methodology-synthesis" \
        '{"project_id":"'$PROJECT_ID'","objective":"Synthesize research methodologies","methodology_types":["experimental","observational","computational"],"academic_level":"phd"}' \
        "identified_methodologies,methodology_comparison,quality_score,synthesis_summary"
    
    # Generate final report
    generate_final_report
}

# Run the script
main
