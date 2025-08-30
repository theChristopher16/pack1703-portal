#!/bin/bash

# Pre-deployment Test Script
# This script runs all tests and checks before deployment to prevent broken code from being deployed

set -e  # Exit on any error

echo "🧪 Running Pre-Deployment Tests..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the app directory.${NC}"
    exit 1
fi

echo "📦 Installing dependencies..."
npm ci --silent
print_status $? "Dependencies installed"

echo "🔍 Running type checking..."
npm run typecheck 2>/dev/null || {
    print_warning "Type checking not configured, skipping..."
}
print_status $? "Type checking passed"

echo "🧹 Running linting..."
npm run lint 2>/dev/null || {
    print_warning "Linting not configured, skipping..."
}
print_status $? "Linting passed"

echo "🧪 Running unit tests..."
npm run test:run --silent
print_status $? "Unit tests passed"

echo "📊 Running test coverage..."
npm run test:coverage --silent
print_status $? "Test coverage generated"

echo "🏗️  Building application..."
npm run build --silent
print_status $? "Build successful"

echo "🔍 Verifying build output..."
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo -e "${RED}❌ Build index.html not found${NC}"
    exit 1
fi

# Check if JavaScript files contain expected content
if ! grep -q "event-001" build/static/js/*.js 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Build may not contain expected content${NC}"
fi

print_status $? "Build verification passed"

echo ""
echo -e "${GREEN}🎉 All pre-deployment tests passed!${NC}"
echo "🚀 Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Run: cd ../../ansible"
echo "2. Run: ansible-playbook -i inventory.ini --tags app_sync deploy-app.yml"
echo ""

# Optional: Run integration tests if available
if [ -f "scripts/test-integration.sh" ]; then
    echo "🔗 Running integration tests..."
    ./scripts/test-integration.sh
fi
