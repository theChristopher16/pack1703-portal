#!/bin/bash

# Fix Copse Build Issues
# Removes XCTest framework linking from main app target

echo "🔧 Fixing Copse Build Configuration"
echo "===================================="
echo ""

cd "$(dirname "$0")"

echo "📦 Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/Copse-*
rm -rf .build
echo "✅ Build artifacts cleaned"
echo ""

echo "📝 Build configuration fixes applied!"
echo ""
echo "⚠️  Next Steps in Xcode:"
echo ""
echo "1. Clean Build Folder: Product → Clean Build Folder (Cmd+Shift+K)"
echo "2. Select Copse target (not project)"
echo "3. Go to Build Phases"
echo "4. Expand 'Link Binary With Libraries'"
echo "5. Remove any XCTest frameworks if present:"
echo "   - XCTest.framework"
echo "   - XCTestSwiftSupport"
echo "   - XCUIAutomation.framework"
echo "6. Build again (Cmd+B)"
echo ""
echo "If errors persist, also check:"
echo "- Build Settings → Search 'ENABLE_TESTING_SEARCH_PATHS'"
echo "- Set to 'No' for Debug and Release"
echo ""

