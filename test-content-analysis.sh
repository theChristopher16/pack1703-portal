#!/bin/bash

# Comprehensive Content Test Script
echo "🔍 Testing Actual Page Content and Functionality"
echo "==============================================="

BASE_URL="https://pack1703-portal.web.app"

echo "📄 Testing Page Content (not just HTTP codes):"
echo "----------------------------------------------"

# Test a few key routes and check for specific content
test_route_content() {
    local route="$1"
    local expected_content="$2"
    local description="$3"
    
    echo -n "Testing $description ($route)... "
    
    # Get the HTML content
    content=$(curl -s "$BASE_URL$route")
    
    # Check for specific indicators
    if echo "$content" | grep -q "main.32780fdf.js"; then
        echo "✅ Correct JS bundle"
    else
        echo "❌ Wrong JS bundle or missing"
    fi
    
    # Check for React root div
    if echo "$content" | grep -q '<div id="root"></div>'; then
        echo "  ✅ React root div present"
    else
        echo "  ❌ React root div missing"
    fi
    
    # Check for specific content if provided
    if [ -n "$expected_content" ]; then
        if echo "$content" | grep -q "$expected_content"; then
            echo "  ✅ Expected content found"
        else
            echo "  ❌ Expected content missing"
        fi
    fi
}

# Test key routes
test_route_content "/" "Pack 1703" "Home Page"
test_route_content "/chat" "" "Chat Page"
test_route_content "/admin/users" "" "User Management"
test_route_content "/admin/ai" "" "AI Management"

echo ""
echo "🔧 JavaScript Bundle Analysis:"
echo "------------------------------"

# Check if the JS bundle is accessible
echo -n "Checking JS bundle accessibility... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/js/main.32780fdf.js" | grep -q "200"; then
    echo "✅ Bundle accessible"
else
    echo "❌ Bundle not accessible"
fi

# Check bundle size
echo -n "Checking bundle size... "
size=$(curl -s -o /dev/null -w "%{size_download}" "$BASE_URL/static/js/main.32780fdf.js")
if [ "$size" -gt 100000 ]; then
    echo "✅ Bundle size OK ($size bytes)"
else
    echo "❌ Bundle too small ($size bytes) - might be error page"
fi

echo ""
echo "🌐 Browser Testing Instructions:"
echo "-------------------------------"
echo "1. Open: $BASE_URL"
echo "2. Open Developer Tools (F12)"
echo "3. Go to Console tab"
echo "4. Look for errors like:"
echo "   - 'SyntaxError: Unexpected token'"
echo "   - 'Failed to load resource'"
echo "   - 'Route not found'"
echo "   - 'Permission denied'"
echo ""
echo "5. Test navigation:"
echo "   - Click on menu items"
echo "   - Check if they navigate correctly"
echo "   - Look for redirects to admin login"
echo "   - Check for 404 errors"
echo ""
echo "6. Test authentication:"
echo "   - Try logging in with different roles"
echo "   - Check if navigation changes based on role"
echo "   - Verify protected routes work correctly"
echo ""
echo "📋 Common Issues and Solutions:"
echo "==============================="
echo "❌ SyntaxError: Unexpected token '<'"
echo "   → Browser caching old bundle"
echo "   → Solution: Clear browser cache completely"
echo ""
echo "❌ Route redirects to admin login"
echo "   → RoleGuard blocking access"
echo "   → Solution: Check user role and permissions"
echo ""
echo "❌ 404 errors on click"
echo "   → Route not defined in App.tsx"
echo "   → Solution: Add missing route definitions"
echo ""
echo "❌ Goes to home page instead of target"
echo "   → Component has errors or missing imports"
echo "   → Solution: Check component implementation"
echo ""
echo "🔍 Manual Test File Created:"
echo "============================"
echo "Open: test-toolbar-content.html"
echo "This file provides interactive testing buttons for each route."
