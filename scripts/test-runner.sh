#!/bin/bash

# Pack1703 Portal Test Runner
# Comprehensive test suite for user management and RBAC system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="src"
COVERAGE_DIR="coverage"
JEST_CONFIG="jest.config.js"

# Test categories
declare -a TEST_CATEGORIES=(
  "unit"
  "integration" 
  "e2e"
)

declare -a UNIT_TESTS=(
  "services/authService.test.ts"
  "services/aiService.test.ts"
  "components/Profile/UserProfileManager.test.tsx"
)

declare -a INTEGRATION_TESTS=(
  "auth-flow.test.ts"
  "user-management.test.ts"
  "ai-integration.test.ts"
)

declare -a E2E_TESTS=(
  "user-journey.test.ts"
  "admin-workflow.test.ts"
)

# Statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to print header
print_header() {
  echo -e "${BLUE}"
  echo "============================================================"
  echo "🧪 Pack1703 Portal Test Suite"
  echo "============================================================"
  echo -e "${NC}"
}

# Function to print section header
print_section() {
  local section=$1
  echo -e "${CYAN}"
  echo "============================================================"
  echo "🧪 Running $section Tests"
  echo "============================================================"
  echo -e "${NC}"
}

# Function to print test result
print_test_result() {
  local test_name=$1
  local result=$2
  local duration=$3
  
  if [ "$result" = "PASS" ]; then
    echo -e "✅ ${GREEN}PASS${NC}: $test_name (${duration}ms)"
    ((PASSED_TESTS++))
  elif [ "$result" = "FAIL" ]; then
    echo -e "❌ ${RED}FAIL${NC}: $test_name (${duration}ms)"
    ((FAILED_TESTS++))
  else
    echo -e "⏭️  ${YELLOW}SKIP${NC}: $test_name"
    ((SKIPPED_TESTS++))
  fi
  ((TOTAL_TESTS++))
}

# Function to run Jest tests
run_jest_tests() {
  local pattern=$1
  local category=$2
  
  if [ -z "$pattern" ]; then
    echo "No tests found for pattern: $pattern"
    return 0
  fi
  
  echo "Running Jest tests with pattern: $pattern"
  
  local start_time=$(date +%s%3N)
  
  if npm test -- --testPathPattern="$pattern" --passWithNoTests --silent; then
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    print_test_result "$category Tests" "PASS" "$duration"
  else
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    print_test_result "$category Tests" "FAIL" "$duration"
  fi
}

# Function to run unit tests
run_unit_tests() {
  print_section "Unit"
  
  for test_file in "${UNIT_TESTS[@]}"; do
    if [ -f "$TEST_DIR/$test_file" ]; then
      local start_time=$(date +%s%3N)
      
      if npm test -- "$test_file" --passWithNoTests --silent; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "PASS" "$duration"
      else
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "FAIL" "$duration"
      fi
    else
      print_test_result "$test_file" "SKIP"
    fi
  done
}

# Function to run integration tests
run_integration_tests() {
  print_section "Integration"
  
  for test_file in "${INTEGRATION_TESTS[@]}"; do
    if [ -f "$TEST_DIR/__tests__/integration/$test_file" ]; then
      local start_time=$(date +%s%3N)
      
      if npm test -- "integration/$test_file" --passWithNoTests --silent; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "PASS" "$duration"
      else
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "FAIL" "$duration"
      fi
    else
      print_test_result "$test_file" "SKIP"
    fi
  done
}

# Function to run E2E tests
run_e2e_tests() {
  print_section "End-to-End"
  
  for test_file in "${E2E_TESTS[@]}"; do
    if [ -f "$TEST_DIR/__tests__/e2e/$test_file" ]; then
      local start_time=$(date +%s%3N)
      
      if npm test -- "e2e/$test_file" --passWithNoTests --silent; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "PASS" "$duration"
      else
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        print_test_result "$test_file" "FAIL" "$duration"
      fi
    else
      print_test_result "$test_file" "SKIP"
    fi
  done
}

# Function to run specific test category
run_category() {
  local category=$1
  
  case $category in
    "unit")
      run_unit_tests
      ;;
    "integration")
      run_integration_tests
      ;;
    "e2e")
      run_e2e_tests
      ;;
    "auth")
      run_jest_tests "auth" "Authentication"
      ;;
    "user-management")
      run_jest_tests "user-management" "User Management"
      ;;
    "ai")
      run_jest_tests "aiService" "AI Service"
      ;;
    "services")
      run_jest_tests "services" "Services"
      ;;
    "components")
      run_jest_tests "components" "Components"
      ;;
    *)
      echo "Unknown test category: $category"
      echo "Available categories: unit, integration, e2e, auth, user-management, ai, services, components"
      exit 1
      ;;
  esac
}

# Function to run all tests
run_all_tests() {
  local start_time=$(date +%s%3N)
  
  run_unit_tests
  run_integration_tests
  run_e2e_tests
  
  local end_time=$(date +%s%3N)
  local total_duration=$((end_time - start_time))
  
  echo -e "${PURPLE}"
  echo "============================================================"
  echo "🎯 TEST RESULTS SUMMARY"
  echo "============================================================"
  echo -e "${NC}"
  echo -e "⏱️  Total Test Duration: ${total_duration}ms"
  echo -e "📊 Total Tests: $TOTAL_TESTS"
  echo -e "✅ Total Passed: $PASSED_TESTS"
  echo -e "❌ Total Failed: $FAILED_TESTS"
  echo -e "⏭️  Total Skipped: $SKIPPED_TESTS"
  
  if [ $TOTAL_TESTS -gt 0 ]; then
    local success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo -e "📈 Success Rate: ${success_rate}%"
  fi
  
  echo ""
  
  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
  fi
}

# Function to run tests with coverage
run_coverage() {
  echo -e "${BLUE}Running tests with coverage...${NC}"
  
  if npm run test:coverage; then
    echo -e "${GREEN}Coverage report generated successfully!${NC}"
    echo -e "📊 Coverage report available at: $COVERAGE_DIR/lcov-report/index.html"
  else
    echo -e "${RED}Coverage generation failed!${NC}"
    exit 1
  fi
}

# Function to show help
show_help() {
  echo "Pack1703 Portal Test Runner"
  echo ""
  echo "Usage: $0 [OPTIONS] [CATEGORY]"
  echo ""
  echo "Options:"
  echo "  -h, --help          Show this help message"
  echo "  -c, --coverage      Run tests with coverage"
  echo "  -w, --watch         Run tests in watch mode"
  echo "  -v, --verbose       Run tests with verbose output"
  echo ""
  echo "Categories:"
  echo "  unit               Run unit tests only"
  echo "  integration        Run integration tests only"
  echo "  e2e                Run end-to-end tests only"
  echo "  auth               Run authentication tests only"
  echo "  user-management    Run user management tests only"
  echo "  ai                 Run AI service tests only"
  echo "  services           Run service layer tests only"
  echo "  components         Run component tests only"
  echo "  all                Run all tests (default)"
  echo ""
  echo "Examples:"
  echo "  $0                    # Run all tests"
  echo "  $0 unit               # Run unit tests only"
  echo "  $0 -c                 # Run all tests with coverage"
  echo "  $0 -w auth            # Run auth tests in watch mode"
  echo "  $0 -v user-management # Run user management tests with verbose output"
}

# Main script logic
main() {
  local category="all"
  local coverage=false
  local watch=false
  local verbose=false
  
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -c|--coverage)
        coverage=true
        shift
        ;;
      -w|--watch)
        watch=true
        shift
        ;;
      -v|--verbose)
        verbose=true
        shift
        ;;
      unit|integration|e2e|auth|user-management|ai|services|components|all)
        category=$1
        shift
        ;;
      *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
  
  # Check if we're in the right directory
  if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
  fi
  
  # Check if Jest is available
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
  fi
  
  # Set Jest options
  local jest_options=""
  if [ "$verbose" = true ]; then
    jest_options="$jest_options --verbose"
  fi
  
  if [ "$watch" = true ]; then
    jest_options="$jest_options --watch"
  fi
  
  # Export Jest options for use in functions
  export JEST_OPTIONS="$jest_options"
  
  print_header
  
  # Run tests based on category
  if [ "$coverage" = true ]; then
    run_coverage
  elif [ "$category" = "all" ]; then
    run_all_tests
  else
    run_category "$category"
  fi
}

# Run main function with all arguments
main "$@"
