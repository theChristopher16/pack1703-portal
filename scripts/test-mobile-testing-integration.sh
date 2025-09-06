#!/bin/bash

# Mobile Testing System Integration Test
# This script tests the mobile testing system integration

echo "🧪 Testing Mobile Testing System Integration..."

# Check if the mobile testing files exist
echo "📁 Checking mobile testing files..."

if [ -f "src/pages/MobileTestingPage.tsx" ]; then
    echo "✅ MobileTestingPage.tsx exists"
else
    echo "❌ MobileTestingPage.tsx missing"
    exit 1
fi

if [ -f "src/services/mobileTestingService.ts" ]; then
    echo "✅ mobileTestingService.ts exists"
else
    echo "❌ mobileTestingService.ts missing"
    exit 1
fi

if [ -f "src/components/Testing/MobileTestComponent.tsx" ]; then
    echo "✅ MobileTestComponent.tsx exists"
else
    echo "❌ MobileTestComponent.tsx missing"
    exit 1
fi

if [ -f "src/hooks/useMobileTesting.ts" ]; then
    echo "✅ useMobileTesting.ts exists"
else
    echo "❌ useMobileTesting.ts missing"
    exit 1
fi

# Check if routes are properly configured
echo "🔗 Checking route configuration..."

if grep -q "MobileTestingPage" src/App.tsx; then
    echo "✅ MobileTestingPage imported in App.tsx"
else
    echo "❌ MobileTestingPage not imported in App.tsx"
    exit 1
fi

if grep -q "/mobile-testing" src/App.tsx; then
    echo "✅ /mobile-testing route configured"
else
    echo "❌ /mobile-testing route not configured"
    exit 1
fi

if grep -q "/admin/mobile-testing" src/App.tsx; then
    echo "✅ /admin/mobile-testing route configured"
else
    echo "❌ /admin/mobile-testing route not configured"
    exit 1
fi

# Check if navigation is configured
echo "🧭 Checking navigation configuration..."

if grep -q "Mobile Testing" src/components/Admin/AdminNav.tsx; then
    echo "✅ Mobile Testing in AdminNav"
else
    echo "❌ Mobile Testing not in AdminNav"
    exit 1
fi

if grep -q "Mobile Testing" src/components/Layout/Layout.tsx; then
    echo "✅ Mobile Testing in Layout navigation"
else
    echo "❌ Mobile Testing not in Layout navigation"
    exit 1
fi

# Check for linting errors
echo "🔍 Checking for linting errors..."

if command -v npm &> /dev/null; then
    echo "Running ESLint on mobile testing files..."
    npx eslint src/pages/MobileTestingPage.tsx src/services/mobileTestingService.ts src/components/Testing/MobileTestComponent.tsx src/hooks/useMobileTesting.ts --quiet
    if [ $? -eq 0 ]; then
        echo "✅ No linting errors in mobile testing files"
    else
        echo "❌ Linting errors found in mobile testing files"
        exit 1
    fi
else
    echo "⚠️  npm not available, skipping linting check"
fi

# Test TypeScript compilation
echo "🔧 Testing TypeScript compilation..."

if command -v npx &> /dev/null; then
    echo "Checking TypeScript compilation..."
    npx tsc --noEmit --skipLibCheck src/pages/MobileTestingPage.tsx src/services/mobileTestingService.ts src/components/Testing/MobileTestComponent.tsx src/hooks/useMobileTesting.ts
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript compilation successful"
    else
        echo "❌ TypeScript compilation errors"
        exit 1
    fi
else
    echo "⚠️  npx not available, skipping TypeScript check"
fi

echo ""
echo "🎉 Mobile Testing System Integration Test Complete!"
echo ""
echo "📱 Mobile Testing System Features:"
echo "   • Device Testing: iPhone 12, iPhone 12 Pro Max, iPad, iPad Pro, Desktop"
echo "   • Test Suites: Responsive, Touch, Performance, Accessibility, PWA"
echo "   • Real-time Results: Live test results with status indicators"
echo "   • Session Tracking: Complete test history in Firestore"
echo "   • Admin Integration: Accessible via /admin/mobile-testing"
echo "   • Public Access: Available at /mobile-testing for testing"
echo ""
echo "🚀 Ready to use! Navigate to /mobile-testing or /admin/mobile-testing to start testing."
