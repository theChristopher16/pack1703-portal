#!/bin/bash

# Comprehensive cache-busting script for Pack 1703 Portal
echo "🚀 Pack 1703 Portal - Cache Busting Script"
echo "=========================================="

# Generate a unique timestamp
TIMESTAMP=$(date +%s)
echo "⏰ Generated timestamp: $TIMESTAMP"

# Update service worker with timestamp
echo "📝 Updating service worker..."
sed -i.bak "s/pack-1703-v[0-9]*/pack-1703-v$TIMESTAMP/g" public/sw.js
sed -i.bak "s/Updated: .*/Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)/g" public/sw.js

echo "✅ Service worker updated to version: pack-1703-v$TIMESTAMP"

# Rebuild the application
echo "🔨 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting --project pack1703-portal

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5

# Check if the new bundle is accessible
BUNDLE_URL="https://pack1703-portal.web.app/static/js/main.66e32d98.js"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BUNDLE_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ New bundle is accessible"
else
    echo "❌ New bundle not accessible (HTTP $HTTP_CODE)"
    exit 1
fi

echo ""
echo "🎉 Cache busting complete!"
echo "📋 Instructions for testing:"
echo "   1. Open browser Developer Tools (F12)"
echo "   2. Go to Application tab → Storage → Clear storage"
echo "   3. Or use incognito/private mode"
echo "   4. Visit: https://pack1703-portal.web.app"
echo ""
echo "🔍 What to check:"
echo "   - Console should show: main.66e32d98.js"
echo "   - No syntax errors"
echo "   - Chat navigation works"
echo "   - 404 page has blue buttons"
