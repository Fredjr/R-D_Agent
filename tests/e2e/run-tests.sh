#!/bin/bash

###############################################################################
# COMPREHENSIVE E2E TEST RUNNER - WEEKS 12-14
#
# This script runs the complete end-to-end test suite for R&D Agent Phase 2
# features including Smart Inbox, Decision Timeline, and Project Alerts.
#
# Usage:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh --headed           # Run with browser visible
#   ./run-tests.sh --debug            # Run in debug mode
#   ./run-tests.sh --ui               # Run in UI mode
#   ./run-tests.sh --backend          # Run backend tests only
#   ./run-tests.sh --inbox            # Run inbox tests only
#   ./run-tests.sh --decisions        # Run decision tests only
#   ./run-tests.sh --alerts           # Run alerts tests only
#   ./run-tests.sh --integration      # Run integration tests only
#   ./run-tests.sh --performance      # Run performance tests only
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║           🧪 COMPREHENSIVE E2E TEST SUITE - WEEKS 12-14 🧪                ║"
echo "║                                                                            ║"
echo "║  Testing: Smart Inbox, Decision Timeline, Project Alerts                  ║"
echo "║  Total Tests: 37 across 8 test suites                                     ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from tests/e2e directory.${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/@playwright/test" ]; then
    echo -e "${YELLOW}🌐 Installing Playwright browsers...${NC}"
    npx playwright install
    echo -e "${GREEN}✓ Browsers installed${NC}"
    echo ""
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo -e "${BLUE}📋 Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No .env file found. Using default values.${NC}"
    echo ""
fi

# Print configuration
echo -e "${BLUE}🔧 Test Configuration:${NC}"
echo "  Test URL: ${TEST_URL:-https://r-d-agent.vercel.app}"
echo "  Backend URL: ${BACKEND_URL:-https://r-dagent-production.up.railway.app}"
echo "  Project ID: ${TEST_PROJECT_ID:-test-project-001}"
echo ""

# Parse command line arguments
MODE="all"
if [ "$1" == "--headed" ]; then
    MODE="headed"
elif [ "$1" == "--debug" ]; then
    MODE="debug"
elif [ "$1" == "--ui" ]; then
    MODE="ui"
elif [ "$1" == "--backend" ]; then
    MODE="backend"
elif [ "$1" == "--inbox" ]; then
    MODE="inbox"
elif [ "$1" == "--decisions" ]; then
    MODE="decisions"
elif [ "$1" == "--alerts" ]; then
    MODE="alerts"
elif [ "$1" == "--integration" ]; then
    MODE="integration"
elif [ "$1" == "--performance" ]; then
    MODE="performance"
fi

# Run tests based on mode
echo -e "${GREEN}🚀 Starting tests...${NC}"
echo ""

START_TIME=$(date +%s)

case $MODE in
    "headed")
        echo -e "${BLUE}Running tests with browser visible...${NC}"
        npx playwright test --headed
        ;;
    "debug")
        echo -e "${BLUE}Running tests in debug mode...${NC}"
        npx playwright test --debug
        ;;
    "ui")
        echo -e "${BLUE}Running tests in UI mode...${NC}"
        npx playwright test --ui
        ;;
    "backend")
        echo -e "${BLUE}Running Backend API tests only...${NC}"
        npx playwright test --grep="Backend API"
        ;;
    "inbox")
        echo -e "${BLUE}Running Smart Inbox tests only...${NC}"
        npx playwright test --grep="Smart Inbox"
        ;;
    "decisions")
        echo -e "${BLUE}Running Decision Timeline tests only...${NC}"
        npx playwright test --grep="Decision Timeline"
        ;;
    "alerts")
        echo -e "${BLUE}Running Project Alerts tests only...${NC}"
        npx playwright test --grep="Project Alerts"
        ;;
    "integration")
        echo -e "${BLUE}Running Integration tests only...${NC}"
        npx playwright test --grep="Integration"
        ;;
    "performance")
        echo -e "${BLUE}Running Performance tests only...${NC}"
        npx playwright test --grep="Performance"
        ;;
    *)
        echo -e "${BLUE}Running all tests...${NC}"
        npx playwright test
        ;;
esac

TEST_EXIT_CODE=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                          TEST EXECUTION COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo -e "${GREEN}Duration: ${DURATION} seconds${NC}"
    echo ""
    echo -e "${BLUE}📊 View detailed report:${NC}"
    echo "  npm run report"
    echo ""
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo -e "${RED}Duration: ${DURATION} seconds${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Debugging options:${NC}"
    echo "  1. View HTML report: npm run report"
    echo "  2. Run in debug mode: ./run-tests.sh --debug"
    echo "  3. Run with browser visible: ./run-tests.sh --headed"
    echo "  4. Run in UI mode: ./run-tests.sh --ui"
    echo ""
fi

exit $TEST_EXIT_CODE

