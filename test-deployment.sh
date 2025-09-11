#!/bin/bash

# Test script for Pack 1703 Portal deployment
echo "🧪 Testing Pack 1703 Portal Deployment"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Check if the correct bundle exists
BUNDLE_FILE="build/static/js/main.66e32d98.js"
if [ ! -f "$BUNDLE_FILE" ]; then
    echo "❌ Expected bundle file not found: $BUNDLE_FILE"
    echo "Available bundles:"
    ls -la build/static/js/main.*.js
    exit 1
fi

echo "✅ Correct bundle file exists: $BUNDLE_FILE"

# Check bundle content
echo "🔍 Checking bundle content..."
HEAD_CONTENT=$(head -c 100 "$BUNDLE_FILE")
if [[ "$HEAD_CONTENT" == *"<"* ]]; then
    echo "❌ Bundle contains HTML content (should be JavaScript)"
    echo "First 100 characters: $HEAD_CONTENT"
    exit 1
fi

if [[ "$HEAD_CONTENT" == *"use strict"* ]]; then
    echo "✅ Bundle contains valid JavaScript"
else
    echo "⚠️  Bundle may not be valid JavaScript"
    echo "First 100 characters: $HEAD_CONTENT"
fi

# Check service worker
echo "🔍 Checking service worker..."
if grep -q "main.66e32d98.js" public/sw.js; then
    echo "✅ Service worker references correct bundle"
else
    echo "❌ Service worker references incorrect bundle"
    echo "Service worker content:"
    grep "main\." public/sw.js
    exit 1
fi

# Start local test server
echo "🚀 Starting local test server..."
cd build
python3 -m http.server 8084 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Test the application
echo "🌐 Testing application..."
curl -s http://localhost:8084/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Local server responding"
else
    echo "❌ Local server not responding"
    kill $SERVER_PID
    exit 1
fi

# Test bundle loading
echo "📦 Testing bundle loading..."
BUNDLE_RESPONSE=$(curl -s -I http://localhost:8084/static/js/main.66e32d98.js)
if [[ "$BUNDLE_RESPONSE" == *"200 OK"* ]]; then
    echo "✅ Bundle loads successfully"
else
    echo "❌ Bundle failed to load"
    echo "Response: $BUNDLE_RESPONSE"
    kill $SERVER_PID
    exit 1
fi

# Clean up
kill $SERVER_PID

echo ""
echo "🎉 All tests passed! Application is ready for deployment."
echo "📋 Next steps:"
echo "   1. Deploy to Firebase: firebase deploy --only hosting"
echo "   2. Clear browser cache"
echo "   3. Test in incognito mode"
