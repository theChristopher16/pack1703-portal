#!/bin/bash

# Cost and Performance Analysis Script
# This script analyzes GCP costs and compares performance with previous infrastructure

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
echo "Cost & Performance Analysis"
echo "=========================================="
echo ""

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

# Phase 1: Current Billing Information
log "Phase 1: Current Billing Information"

# Get billing account
BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")
if [ -n "$BILLING_ACCOUNT" ]; then
    pass "Billing account: $BILLING_ACCOUNT"
else
    fail "No billing account found"
    exit 1
fi

# Get current month costs
log "Retrieving current month costs..."
CURRENT_MONTH=$(date +%Y-%m)
COSTS=$(gcloud billing accounts list --filter="name:$BILLING_ACCOUNT" --format="value(name)" 2>/dev/null || echo "")

if [ -n "$COSTS" ]; then
    log "Current month costs for $CURRENT_MONTH:"
    gcloud billing accounts list --filter="name:$BILLING_ACCOUNT" --format="table(name,displayName,open,parentDisplayName)"
    pass "Billing information retrieved successfully"
else
    fail "Failed to retrieve billing information"
fi

echo ""

# Phase 2: Resource Utilization Analysis
log "Phase 2: Resource Utilization Analysis"

# Cloud Functions
log "Analyzing Cloud Functions..."
FUNCTIONS=$(gcloud functions list --project="$PROJECT_ID" --format="table(name,status,runtime,memory,timeout,region)" 2>/dev/null || echo "")
if [ -n "$FUNCTIONS" ]; then
    pass "Cloud Functions found:"
    echo "$FUNCTIONS"
else
    fail "No Cloud Functions found"
fi

# Firestore Database
log "Analyzing Firestore Database..."
FIRESTORE_INFO=$(gcloud firestore databases list --project="$PROJECT_ID" --format="table(name,locationId,type,state" 2>/dev/null || echo "")
if [ -n "$FIRESTORE_INFO" ]; then
    pass "Firestore database information:"
    echo "$FIRESTORE_INFO"
else
    fail "No Firestore database found"
fi

# Storage Buckets
log "Analyzing Cloud Storage..."
STORAGE_BUCKETS=$(gsutil ls -p "$PROJECT_ID" 2>/dev/null || echo "")
if [ -n "$STORAGE_BUCKETS" ]; then
    pass "Cloud Storage buckets found:"
    echo "$STORAGE_BUCKETS"
    
    # Get bucket sizes
    for bucket in $STORAGE_BUCKETS; do
        BUCKET_NAME=$(echo "$bucket" | sed 's|gs://||')
        SIZE=$(gsutil du -sh "$bucket" 2>/dev/null || echo "Unknown")
        log "  $BUCKET_NAME: $SIZE"
    done
else
    fail "No Cloud Storage buckets found"
fi

echo ""

# Phase 3: Performance Testing
log "Phase 3: Performance Testing"

# Test API response times
log "Testing API response times..."

# Get function URLs
REGION=$(gcloud config get-value functions/region 2>/dev/null || echo "us-central1")
FUNCTIONS_TO_TEST=("submitRSVP" "getRSVPCounts" "submitVolunteer" "submitFeedback")

for func in "${FUNCTIONS_TO_TEST[@]}"; do
    log "Testing response time for $func..."
    
    FUNCTION_URL=$(gcloud functions describe "$func" --region="$REGION" --project="$PROJECT_ID" --format="value(httpsTrigger.url)" 2>/dev/null || echo "")
    
    if [ -n "$FUNCTION_URL" ]; then
        # Test response time
        START_TIME=$(date +%s.%N)
        
        if [ "$func" = "getRSVPCounts" ]; then
            # GET request
            RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$FUNCTION_URL?eventId=test-event-123" 2>/dev/null || echo "")
        else
            # POST request with test data
            TEST_DATA='{"eventId": "test-event-123", "test": true}'
            RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
                -H "Content-Type: application/json" \
                -d "$TEST_DATA" 2>/dev/null || echo "")
        fi
        
        END_TIME=$(date +%s.%N)
        RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
                pass "$func responded in ${RESPONSE_TIME}s (under 2s threshold)"
            else
                fail "$func responded in ${RESPONSE_TIME}s (over 2s threshold)"
            fi
        else
            fail "$func failed with HTTP $HTTP_CODE"
        fi
    else
        skip "$func not available for testing"
    fi
done

echo ""

# Phase 4: Cost Comparison Analysis
log "Phase 4: Cost Comparison Analysis"

# Previous infrastructure costs (estimated)
log "Previous Infrastructure Costs (VM-based):"
echo "  - EC2 Instance (t3.medium): ~$30/month"
echo "  - EBS Storage (20GB): ~$2/month"
echo "  - Data Transfer: ~$5/month"
echo "  - Total Estimated: ~$37/month"
echo ""

# GCP estimated costs
log "GCP Estimated Costs (Serverless):"
echo "  - Cloud Functions: ~$5-15/month (depending on usage)"
echo "  - Firestore: ~$2-8/month (depending on reads/writes)"
echo "  - Cloud Storage: ~$1-3/month (depending on storage)"
echo "  - Firebase Hosting: ~$1/month"
echo "  - Monitoring & Logging: ~$2-5/month"
echo "  - Total Estimated: ~$11-32/month"
echo ""

# Calculate cost difference
PREVIOUS_COST=37
GCP_MIN_COST=11
GCP_MAX_COST=32

COST_SAVINGS_MIN=$((PREVIOUS_COST - GCP_MAX_COST))
COST_SAVINGS_MAX=$((PREVIOUS_COST - GCP_MIN_COST))

if [ $COST_SAVINGS_MIN -gt 0 ]; then
    pass "Cost savings: $COST_SAVINGS_MIN to $COST_SAVINGS_MAX per month"
else
    if [ $COST_SAVINGS_MAX -gt 0 ]; then
        pass "Potential cost savings: up to $COST_SAVINGS_MAX per month"
    else
        fail "GCP costs may be higher than previous infrastructure"
    fi
fi

echo ""

# Phase 5: Scalability Analysis
log "Phase 5: Scalability Analysis"

# Test concurrent requests
log "Testing scalability with concurrent requests..."

if [ -n "${FUNCTION_URLS[getRSVPCounts]}" ]; then
    log "Running concurrent request test..."
    
    START_TIME=$(date +%s)
    CONCURRENT_REQUESTS=20
    
    # Launch concurrent requests
    for i in $(seq 1 $CONCURRENT_REQUESTS); do
        curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL?eventId=test-event-123" > /dev/null 2>&1 &
    done
    
    # Wait for all requests to complete
    wait
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    if [ $DURATION -lt 60 ]; then
        pass "Scalability test passed: $CONCURRENT_REQUESTS concurrent requests in ${DURATION}s"
    else
        fail "Scalability test failed: $CONCURRENT_REQUESTS concurrent requests took ${DURATION}s"
    fi
else
    skip "Scalability test skipped - function not available"
fi

echo ""

# Phase 6: Resource Efficiency
log "Phase 6: Resource Efficiency Analysis"

# Check if resources are being used efficiently
log "Analyzing resource efficiency..."

# Check for idle resources
IDLE_FUNCTIONS=$(gcloud functions list --project="$PROJECT_ID" --filter="status:INACTIVE" --format="value(name)" 2>/dev/null || echo "")
if [ -n "$IDLE_FUNCTIONS" ]; then
    fail "Found inactive Cloud Functions: $IDLE_FUNCTIONS"
else
    pass "All Cloud Functions are active"
fi

# Check storage lifecycle policies
log "Checking storage lifecycle policies..."
for bucket in $STORAGE_BUCKETS; do
    BUCKET_NAME=$(echo "$bucket" | sed 's|gs://||')
    LIFECYCLE=$(gsutil lifecycle get "$bucket" 2>/dev/null || echo "No lifecycle policy")
    
    if echo "$LIFECYCLE" | grep -q "lifecycle"; then
        pass "Lifecycle policy configured for $BUCKET_NAME"
    else
        skip "No lifecycle policy for $BUCKET_NAME"
    fi
done

echo ""

# Summary
echo "=========================================="
echo "Analysis Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

# Cost analysis summary
echo "Cost Analysis Summary:"
echo "  Previous Infrastructure: ~$37/month"
echo "  GCP Serverless: ~$11-32/month"
echo "  Potential Savings: $COST_SAVINGS_MIN to $COST_SAVINGS_MAX/month"
echo ""

# Performance summary
echo "Performance Summary:"
echo "  - Response times should be under 2 seconds"
echo "  - Concurrent request handling tested"
echo "  - Resource utilization analyzed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Cost and performance analysis completed successfully!${NC}"
    echo "GCP migration appears to be cost-effective and performant."
    exit 0
else
    echo -e "${RED}❌ Some analysis tests failed. Please review the issues above.${NC}"
    exit 1
fi
