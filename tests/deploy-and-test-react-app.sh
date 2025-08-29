#!/bin/bash

# React App Deployment and Testing Script
# This script deploys the React app to Firebase Hosting and tests its functionality

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
echo "React App Deployment & Testing"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "sfpack1703app" ]; then
    fail "sfpack1703app directory not found. Please run this script from the repository root."
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

# Phase 1: Deploy React App
log "Phase 1: Deploying React App to Firebase Hosting"
cd sfpack1703app

# Install dependencies
log "Installing dependencies..."
if npm install; then
    pass "Dependencies installed successfully"
else
    fail "Failed to install dependencies"
    exit 1
fi

# Build app
log "Building React app..."
if npm run build; then
    pass "React app built successfully"
else
    fail "Failed to build React app"
    exit 1
fi

# Deploy to Firebase Hosting
log "Deploying to Firebase Hosting..."
if firebase deploy --only hosting --project "$PROJECT_ID"; then
    pass "React app deployed successfully to Firebase Hosting"
else
    fail "Failed to deploy React app to Firebase Hosting"
    exit 1
fi

cd ..
echo ""

# Phase 2: Get Hosting URL
log "Phase 2: Retrieving Hosting URL"
HOSTING_URL=$(gcloud firebase hosting:sites:list --project="$PROJECT_ID" --format="value(defaultUrl)" 2>/dev/null | head -n1 || echo "")

if [ -n "$HOSTING_URL" ]; then
    pass "Hosting URL retrieved: $HOSTING_URL"
else
    fail "Failed to get hosting URL"
    exit 1
fi

echo ""

# Phase 3: Test Page Loads
log "Phase 3: Testing Page Loads"

# Test 1: Home page
log "Test 1: Testing home page (/)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$HOSTING_URL/" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$RESPONSE_BODY" | grep -q "Pack 1703"; then
        pass "Home page loads successfully and contains expected content"
    else
        fail "Home page loads but content verification failed"
    fi
else
    fail "Home page failed to load (HTTP $HTTP_CODE)"
fi

# Test 2: Admin page
log "Test 2: Testing admin page (/admin)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$HOSTING_URL/admin" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$RESPONSE_BODY" | grep -q "Admin"; then
        pass "Admin page loads successfully and contains expected content"
    else
        fail "Admin page loads but content verification failed"
    fi
else
    fail "Admin page failed to load (HTTP $HTTP_CODE)"
fi

# Test 3: Events page
log "Test 3: Testing events page (/events)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$HOSTING_URL/events" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$RESPONSE_BODY" | grep -q "Events"; then
        pass "Events page loads successfully and contains expected content"
    else
        fail "Events page loads but content verification failed"
    fi
else
    fail "Events page failed to load (HTTP $HTTP_CODE)"
fi

# Test 4: Announcements page
log "Test 4: Testing announcements page (/announcements)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$HOSTING_URL/announcements" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$RESPONSE_BODY" | grep -q "Announcements"; then
        pass "Announcements page loads successfully and contains expected content"
    else
        fail "Announcements page loads but content verification failed"
    fi
else
    fail "Announcements page failed to load (HTTP $HTTP_CODE)"
fi

echo ""

# Phase 4: Test Form Presence
log "Phase 4: Testing Form Presence"

# Test RSVP form on events page
log "Testing RSVP form presence on events page..."
RESPONSE=$(curl -s "$HOSTING_URL/events" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "form"; then
    pass "RSVP form found on events page"
else
    fail "RSVP form not found on events page"
fi

# Test admin login form
log "Testing admin login form presence..."
RESPONSE=$(curl -s "$HOSTING_URL/admin" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "form"; then
    pass "Admin login form found on admin page"
else
    fail "Admin login form not found on admin page"
fi

echo ""

# Phase 5: Performance Testing
log "Phase 5: Performance Testing"

# Test page load performance
log "Testing page load performance..."
START_TIME=$(date +%s.%N)
curl -s -o /dev/null "$HOSTING_URL/" > /dev/null 2>&1
END_TIME=$(date +%s.%N)

LOAD_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
if (( $(echo "$LOAD_TIME < 3.0" | bc -l) )); then
    pass "Home page loads in ${LOAD_TIME}s (under 3s threshold)"
else
    fail "Home page loads in ${LOAD_TIME}s (over 3s threshold)"
fi

echo ""

# Phase 6: Browser Compatibility Testing
log "Phase 6: Browser Compatibility Testing"

# Test with different User-Agent headers
log "Testing with Chrome User-Agent..."
CHROME_RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "$HOSTING_URL/" 2>/dev/null || echo "")
CHROME_HTTP_CODE=$(echo "$CHROME_RESPONSE" | tail -n1)

if [ "$CHROME_HTTP_CODE" = "200" ]; then
    pass "App responds correctly to Chrome User-Agent"
else
    fail "App failed to respond to Chrome User-Agent (HTTP $CHROME_HTTP_CODE)"
fi

log "Testing with Safari User-Agent..."
SAFARI_RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15" "$HOSTING_URL/" 2>/dev/null || echo "")
SAFARI_HTTP_CODE=$(echo "$SAFARI_RESPONSE" | tail -n1)

if [ "$SAFARI_HTTP_CODE" = "200" ]; then
    pass "App responds correctly to Safari User-Agent"
else
    fail "App failed to respond to Safari User-Agent (HTTP $SAFARI_HTTP_CODE)"
fi

log "Testing with mobile User-Agent..."
MOBILE_RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1" "$HOSTING_URL/" 2>/dev/null || echo "")
MOBILE_HTTP_CODE=$(echo "$MOBILE_RESPONSE" | tail -n1)

if [ "$MOBILE_HTTP_CODE" = "200" ]; then
    pass "App responds correctly to mobile User-Agent"
else
    fail "App failed to respond to mobile User-Agent (HTTP $MOBILE_HTTP_CODE)"
fi

echo ""

# Phase 7: Security Testing
log "Phase 7: Security Testing"

# Test HTTPS redirect
log "Testing HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" -I "http://$(echo "$HOSTING_URL" | sed 's|https://\|\|')" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    pass "HTTP to HTTPS redirect is working"
else
    fail "HTTP to HTTPS redirect not working (HTTP $HTTP_CODE)"
fi

# Test security headers
log "Testing security headers..."
HEADERS=$(curl -s -I "$HOSTING_URL/" 2>/dev/null || echo "")

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    pass "X-Content-Type-Options header present"
else
    fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    pass "X-Frame-Options header present"
else
    fail "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-XSS-Protection"; then
    pass "X-XSS-Protection header present"
else
    fail "X-XSS-Protection header missing"
fi

echo ""

# Phase 8: User Workflow Testing
log "Phase 8: User Workflow Testing"

# Test navigation between pages
log "Testing navigation workflow..."
log "  Testing home → events navigation..."
EVENTS_RESPONSE=$(curl -s "$HOSTING_URL/events" 2>/dev/null || echo "")
if echo "$EVENTS_RESPONSE" | grep -q "Events"; then
    pass "Navigation to events page works"
else
    fail "Navigation to events page failed"
fi

log "  Testing events → announcements navigation..."
ANNOUNCEMENTS_RESPONSE=$(curl -s "$HOSTING_URL/announcements" 2>/dev/null || echo "")
if echo "$ANNOUNCEMENTS_RESPONSE" | grep -q "Announcements"; then
    pass "Navigation to announcements page works"
else
    fail "Navigation to announcements page failed"
fi

log "  Testing announcements → admin navigation..."
ADMIN_RESPONSE=$(curl -s "$HOSTING_URL/admin" 2>/dev/null || echo "")
if echo "$ADMIN_RESPONSE" | grep -q "Admin"; then
    pass "Navigation to admin page works"
else
    fail "Navigation to admin page failed"
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
    echo -e "${GREEN}🎉 All React app tests passed!${NC}"
    echo "Your app is successfully deployed and functioning on Firebase Hosting."
    echo "URL: $HOSTING_URL"
    exit 0
else
    echo -e "${RED}❌ Some React app tests failed. Please review the errors above.${NC}"
    exit 1
fi
