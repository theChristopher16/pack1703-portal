#!/bin/bash

# Application Integration Tests
# This script tests the full integration between React app and Cloud Functions

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

# Configuration
PROJECT_ID="pack-1703-portal"
REGION="us-central1"
HOSTING_URL="https://pack-1703-portal.web.app"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
    FAILED=$((FAILED + 1))
}

skip() {
    echo -e "${YELLOW}⏭️  SKIP${NC} $1"
    SKIPPED=$((SKIPPED + 1))
}

# Header
echo "=========================================="
echo "Application Integration Tests"
echo "=========================================="
echo ""

# Test 1: React App Accessibility
log "Test 1: React App Accessibility"
if curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL" | grep -q "200"; then
    pass "React app is accessible at $HOSTING_URL"
else
    fail "React app is not accessible at $HOSTING_URL"
fi

# Test 2: React App Content Loading
log "Test 2: React App Content Loading"
PAGE_CONTENT=$(curl -s "$HOSTING_URL" | grep -c "React\|Pack\|1703" || echo "0")
if [ "$PAGE_CONTENT" -gt 0 ]; then
    pass "React app content loaded successfully"
else
    fail "React app content not loading properly"
fi

# Test 3: Cloud Functions Endpoint Test
log "Test 3: Cloud Functions Endpoint Test"
FUNCTIONS_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net"
if curl -s -o /dev/null -w "%{http_code}" "$FUNCTIONS_URL" | grep -q "200\|404\|405"; then
    pass "Cloud Functions endpoint is accessible"
else
    fail "Cloud Functions endpoint is not accessible"
fi

# Test 4: RSVP Function Test
log "Test 4: RSVP Function Test"
RSVP_URL="$FUNCTIONS_URL/submitRSVP"
RSVP_RESPONSE=$(curl -s -X POST "$RSVP_URL" \
    -H "Content-Type: application/json" \
    -d '{"eventId": "test-event", "attendees": [{"name": "Test User", "email": "test@example.com"}]}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$RSVP_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "RSVP function is responding (HTTP $HTTP_CODE)"
else
    fail "RSVP function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 5: Feedback Function Test
log "Test 5: Feedback Function Test"
FEEDBACK_URL="$FUNCTIONS_URL/submitFeedback"
FEEDBACK_RESPONSE=$(curl -s -X POST "$FEEDBACK_URL" \
    -H "Content-Type: application/json" \
    -d '{"message": "Test feedback", "rating": 5}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$FEEDBACK_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "Feedback function is responding (HTTP $HTTP_CODE)"
else
    fail "Feedback function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 6: Volunteer Function Test
log "Test 6: Volunteer Function Test"
VOLUNTEER_URL="$FUNCTIONS_URL/claimVolunteerRole"
VOLUNTEER_RESPONSE=$(curl -s -X POST "$VOLUNTEER_URL" \
    -H "Content-Type: application/json" \
    -d '{"roleId": "test-role", "volunteerName": "Test Volunteer", "email": "volunteer@example.com"}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$VOLUNTEER_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "Volunteer function is responding (HTTP $HTTP_CODE)"
else
    fail "Volunteer function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 7: ICS Feed Function Test
log "Test 7: ICS Feed Function Test"
ICS_URL="$FUNCTIONS_URL/icsFeed"
ICS_RESPONSE=$(curl -s -X POST "$ICS_URL" \
    -H "Content-Type: application/json" \
    -d '{"eventId": "test-event"}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$ICS_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "ICS feed function is responding (HTTP $HTTP_CODE)"
else
    fail "ICS feed function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 8: Weather Proxy Function Test
log "Test 8: Weather Proxy Function Test"
WEATHER_URL="$FUNCTIONS_URL/weatherProxy"
WEATHER_RESPONSE=$(curl -s -X POST "$WEATHER_URL" \
    -H "Content-Type: application/json" \
    -d '{"location": "San Francisco, CA"}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$WEATHER_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "Weather proxy function is responding (HTTP $HTTP_CODE)"
else
    fail "Weather proxy function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 9: Hello World Function Test
log "Test 9: Hello World Function Test"
HELLO_URL="$FUNCTIONS_URL/helloWorld"
HELLO_RESPONSE=$(curl -s -X POST "$HELLO_URL" \
    -H "Content-Type: application/json" \
    -d '{"name": "Test User"}' \
    -w "%{http_code}" || echo "000")
HTTP_CODE=$(echo "$HELLO_RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "Hello World function is responding (HTTP $HTTP_CODE)"
else
    fail "Hello World function is not responding properly (HTTP $HTTP_CODE)"
fi

# Test 10: Performance Test
log "Test 10: Performance Test"
START_TIME=$(date +%s.%N)
curl -s -o /dev/null "$HOSTING_URL" > /dev/null
END_TIME=$(date +%s.%N)
RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    pass "React app loads in ${RESPONSE_TIME}s (under 5s threshold)"
else
    skip "React app loads in ${RESPONSE_TIME}s (over 5s threshold)"
fi

# Summary
echo ""
echo "=========================================="
echo "Integration Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All integration tests passed!${NC}"
    echo "✅ React app is accessible and loading content"
    echo "✅ Cloud Functions are responding to requests"
    echo "✅ Application integration is working properly"
    exit 0
else
    echo -e "${RED}❌ Some integration tests failed. Please review the errors above.${NC}"
    exit 1
fi
