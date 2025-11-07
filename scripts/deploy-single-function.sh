#!/bin/bash

# Deploy a single function with optimized settings
# This helps avoid build timeouts

FUNCTION_NAME="updateUserRole"

echo "🚀 Deploying ${FUNCTION_NAME} with optimized settings..."
echo ""

# First, clean the functions build directory
echo "🧹 Cleaning build artifacts..."
cd functions
rm -rf lib/*.map
rm -rf node_modules/.cache
cd ..

# Deploy with longer timeout and optimizations
echo "📦 Deploying function..."
firebase deploy --only functions:${FUNCTION_NAME} \
  --force \
  --debug

echo ""
echo "✅ Deployment complete!"

