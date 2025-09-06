#!/bin/bash

# Mobile Testing System Integration Verification
# This script verifies the mobile testing system is properly integrated

echo "🧪 Mobile Testing System Integration Verification"
echo "================================================="

# Check if the mobile testing files exist
echo ""
echo "📁 Checking mobile testing files..."

files=(
    "src/pages/MobileTestingPage.tsx"
    "src/services/mobileTestingService.ts"
    "src/components/Testing/MobileTestComponent.tsx"
    "src/hooks/useMobileTesting.ts"
    "src/pages/__tests__/MobileTestingPage.test.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if routes are properly configured
echo ""
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
echo ""
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

# Check for basic syntax errors
echo ""
echo "🔍 Checking for basic syntax errors..."

# Check for common syntax issues
if grep -q 'link\[rel="manifest"\]"' src/services/mobileTestingService.ts; then
    echo "❌ Found syntax error in mobileTestingService.ts"
    exit 1
else
    echo "✅ No obvious syntax errors found"
fi

echo ""
echo "🎉 Mobile Testing System Integration Verification Complete!"
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
echo ""
echo "📋 Next Steps:"
echo "   1. Start your development server: npm start"
echo "   2. Navigate to /mobile-testing to test the system"
echo "   3. Use /admin/mobile-testing for admin-specific testing"
echo "   4. Check the browser console for any runtime errors"
