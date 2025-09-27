#!/bin/bash

# Comprehensive Toolbar Component Test Script
echo "🧪 Testing All Toolbar Components"
echo "================================="

# Test URLs based on navigation service
declare -a PUBLIC_ROUTES=(
    "/"
    "/events"
    "/announcements"
    "/locations"
    "/volunteer"
)

declare -a AUTHENTICATED_ROUTES=(
    "/chat"
    "/resources"
    "/feedback"
    "/data-audit"
)

declare -a ADMIN_ROUTES=(
    "/analytics"
    "/admin/events"
    "/admin/announcements"
    "/admin/locations"
    "/admin/volunteer"
    "/admin/users"
    "/admin/fundraising"
    "/admin/finances"
    "/admin/seasons"
    "/admin/lists"
    "/admin/permissions-audit"
    "/admin/reminders"
)

declare -a ROOT_ROUTES=(
    "/admin/ai"
    "/admin/cost-management"
    "/multi-tenant"
    "/admin/settings"
    "/soc"
    "/admin/database"
    "/admin/system"
    "/admin/performance"
)

BASE_URL="https://pack1703-portal.web.app"

echo "🌐 Testing Public Routes (should work for everyone):"
echo "---------------------------------------------------"
for route in "${PUBLIC_ROUTES[@]}"; do
    echo -n "Testing $route... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ OK"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "🔐 Testing Authenticated Routes (should redirect to login if not authenticated):"
echo "------------------------------------------------------------------------------"
for route in "${AUTHENTICATED_ROUTES[@]}"; do
    echo -n "Testing $route... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "✅ OK (HTTP $HTTP_CODE)"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "👑 Testing Admin Routes (should redirect to login if not admin):"
echo "---------------------------------------------------------------"
for route in "${ADMIN_ROUTES[@]}"; do
    echo -n "Testing $route... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "✅ OK (HTTP $HTTP_CODE)"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "🔒 Testing Root Routes (should redirect to login if not root):"
echo "-------------------------------------------------------------"
for route in "${ROOT_ROUTES[@]}"; do
    echo -n "Testing $route... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        echo "✅ OK (HTTP $HTTP_CODE)"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "📋 Test Summary:"
echo "================"
echo "✅ 200: Route loads successfully"
echo "✅ 301/302: Route redirects (expected for protected routes)"
echo "❌ 404: Route not found (needs fixing)"
echo "❌ 500: Server error (needs fixing)"
echo ""
echo "🔍 Manual Testing Required:"
echo "1. Log in as different user roles (parent, admin, root)"
echo "2. Check that navigation dropdown shows correct items for each role"
echo "3. Verify that clicking each item takes you to the correct page"
echo "4. Check that protected routes redirect appropriately"
echo ""
echo "🌐 Test URL: $BASE_URL"
