#!/bin/bash

# Cloud Functions Deployment and Testing Script
# This script deploys Cloud Functions and tests their functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
    ((FAILED++))
}

skip() {
    echo -e "${YELLOW}⏭️  SKIP${NC} $1"
    ((SKIPPED++))
}

# Header
echo "=========================================="
echo "Cloud Functions Deployment & Testing"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "functions" ]; then
    fail "functions directory not found. Please run this script from the repository root."
    exit 1
fi

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    fail "Firebase CLI not found. Please install it with 'npm install -g firebase-tools'"
    exit 1
fi

# Check if gcloud is authenticated
log "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    fail "gcloud not authenticated. Please run 'gcloud auth login'"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    fail "No GCP project set. Please run 'gcloud config set project <PROJECT_ID>'"
    exit 1
fi

log "Using GCP project: $PROJECT_ID"
echo ""

# Phase 1: Deploy Cloud Functions
log "Phase 1: Deploying Cloud Functions"
cd functions

# Install dependencies
log "Installing dependencies..."
if npm install; then
    pass "Dependencies installed successfully"
else
    fail "Failed to install dependencies"
    exit 1
fi

# Build functions
log "Building functions..."
if npm run build; then
    pass "Functions built successfully"
else
    fail "Failed to build functions"
    exit 1
fi

# Deploy functions
log "Deploying functions to Firebase..."
if firebase deploy --only functions --project "$PROJECT_ID"; then
    pass "Functions deployed successfully"
else
    fail "Failed to deploy functions"
    exit 1
fi

cd ..
echo ""

# Phase 2: Get Function URLs
log "Phase 2: Retrieving Function URLs"
REGION=$(gcloud config get-value functions/region 2>/dev/null || echo "us-central1")

# Function names to test
FUNCTIONS=(
    "submitRSVP"
    "getRSVPCounts"
    "submitVolunteer"
    "submitFeedback"
)

# Store function URLs
declare -A FUNCTION_URLS

for func in "${FUNCTIONS[@]}"; do
    log "Getting URL for $func..."
    URL=$(gcloud functions describe "$func" --region="$REGION" --project="$PROJECT_ID" --format="value(httpsTrigger.url)" 2>/dev/null || echo "")
    if [ -n "$URL" ]; then
        FUNCTION_URLS["$func"]="$URL"
        pass "Function URL retrieved: $func"
    else
        fail "Failed to get URL for function: $func"
    fi
done

echo ""

# Phase 3: Test Function Endpoints
log "Phase 3: Testing Function Endpoints"

# Test 1: submitRSVP
if [ -n "${FUNCTION_URLS[submitRSVP]}" ]; then
    log "Test 1: Testing submitRSVP function"
    
    # Valid RSVP data
    VALID_RSVP='{
        "eventId": "test-event-123",
        "familyName": "Test Family",
        "attendees": [
            {"name": "John Doe", "age": 35, "dietaryRestrictions": "none"},
            {"name": "Jane Doe", "age": 8, "dietaryRestrictions": "vegetarian"}
        ],
        "contactEmail": "test@example.com",
        "phoneNumber": "555-1234",
        "notes": "Test RSVP submission"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URLS[submitRSVP]}" \
        -H "Content-Type: application/json" \
        -d "$VALID_RSVP" 2>/dev/null || echo "")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        pass "submitRSVP function responded successfully (HTTP $HTTP_CODE)"
    else
        fail "submitRSVP function failed (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
else
    skip "submitRSVP function not available"
fi

# Test 2: getRSVPCounts
if [ -n "${FUNCTION_URLS[getRSVPCounts]}" ]; then
    log "Test 2: Testing getRSVPCounts function"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${FUNCTION_URLS[getRSVPCounts]}?eventId=test-event-123" 2>/dev/null || echo "")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        pass "getRSVPCounts function responded successfully (HTTP $HTTP_CODE)"
    else
        fail "getRSVPCounts function failed (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
else
    skip "getRSVPCounts function not available"
fi

# Test 3: submitVolunteer
if [ -n "${FUNCTION_URLS[submitVolunteer]}" ]; then
    log "Test 3: Testing submitVolunteer function"
    
    VALID_VOLUNTEER='{
        "eventId": "test-event-123",
        "name": "John Volunteer",
        "email": "volunteer@example.com",
        "phoneNumber": "555-5678",
        "roles": ["setup", "cleanup"],
        "availability": "full-day",
        "experience": "experienced"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URLS[submitVolunteer]}" \
        -H "Content-Type: application/json" \
        -d "$VALID_VOLUNTEER" 2>/dev/null || echo "")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        pass "submitVolunteer function responded successfully (HTTP $HTTP_CODE)"
    else
        fail "submitVolunteer function failed (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
else
    skip "submitVolunteer function not available"
fi

# Test 4: submitFeedback
if [ -n "${FUNCTION_URLS[submitFeedback]}" ]; then
    log "Test 4: Testing submitFeedback function"
    
    VALID_FEEDBACK='{
        "eventId": "test-event-123",
        "rating": 5,
        "category": "event-quality",
        "comments": "Great event! Very well organized.",
        "contactEmail": "feedback@example.com",
        "anonymous": false
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URLS[submitFeedback]}" \
        -H "Content-Type: application/json" \
        -d "$VALID_FEEDBACK" 2>/dev/null || echo "")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        pass "submitFeedback function responded successfully (HTTP $HTTP_CODE)"
    else
        fail "submitFeedback function failed (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
else
    skip "submitFeedback function not available"
fi

echo ""

# Phase 4: Load Testing
log "Phase 4: Basic Load Testing"

if [ -n "${FUNCTION_URLS[getRSVPCounts]}" ]; then
    log "Running basic load test on getRSVPCounts function..."
    
    START_TIME=$(date +%s)
    REQUESTS=10
    
    for i in $(seq 1 $REQUESTS); do
        curl -s -o /dev/null -w "%{http_code}" "${FUNCTION_URLS[getRSVPCounts]}?eventId=test-event-123" > /dev/null 2>&1 &
    done
    
    # Wait for all requests to complete
    wait
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    if [ $DURATION -lt 30 ]; then
        pass "Load test completed successfully: $REQUESTS requests in ${DURATION}s"
    else
        fail "Load test took too long: $REQUESTS requests in ${DURATION}s"
    fi
else
    skip "Load testing skipped - function not available"
fi

echo ""

# Phase 5: Error Handling Tests
log "Phase 5: Testing Error Handling"

if [ -n "${FUNCTION_URLS[submitRSVP]}" ]; then
    log "Testing submitRSVP with invalid data..."
    
    # Invalid RSVP data (missing required fields)
    INVALID_RSVP='{
        "eventId": "test-event-123"
    }'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URLS[submitRSVP]}" \
        -H "Content-Type: application/json" \
        -d "$INVALID_RSVP" 2>/dev/null || echo "")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
        pass "submitRSVP properly rejected invalid data (HTTP $HTTP_CODE)"
    else
        fail "submitRSVP should have rejected invalid data (HTTP $HTTP_CODE)"
    fi
else
    skip "Error handling test skipped - function not available"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All Cloud Functions tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some Cloud Functions tests failed. Please review the errors above.${NC}"
    exit 1
fi
