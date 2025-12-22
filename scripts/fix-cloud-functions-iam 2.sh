#!/bin/bash

# Fix Cloud Functions IAM Permissions
# This script grants the necessary permissions for Cloud Functions to be called from the web

PROJECT_ID="pack1703-portal"
REGION="us-central1"
FUNCTION_NAME="updateUserRole"

echo "🔧 Fixing Cloud Functions IAM permissions for ${FUNCTION_NAME}..."
echo ""

# Get the Cloud Functions service account
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
echo "📋 Using service account: ${SERVICE_ACCOUNT}"
echo ""

# Option 1: Make the function publicly callable (not recommended but will fix the issue)
echo "Option 1: Make function publicly callable (testing only)"
echo "Command: gcloud functions add-iam-policy-binding ${FUNCTION_NAME} \\"
echo "  --region=${REGION} \\"
echo "  --member='allUsers' \\"
echo "  --role='roles/cloudfunctions.invoker' \\"
echo "  --project=${PROJECT_ID}"
echo ""

# Option 2: Grant permission to all authenticated users (better)
echo "Option 2: Allow all authenticated users (recommended)"
echo "Command: gcloud functions add-iam-policy-binding ${FUNCTION_NAME} \\"
echo "  --region=${REGION} \\"
echo "  --member='allAuthenticatedUsers' \\"
echo "  --role='roles/cloudfunctions.invoker' \\"
echo "  --project=${PROJECT_ID}"
echo ""

# Check current IAM policy
echo "📊 Checking current IAM policy..."
echo "Command: gcloud functions get-iam-policy ${FUNCTION_NAME} \\"
echo "  --region=${REGION} \\"
echo "  --project=${PROJECT_ID}"
echo ""

echo "⚠️  To fix the 403 error, run ONE of the commands above."
echo ""
echo "💡 For production, use Option 2 (allAuthenticatedUsers)"
echo "   For testing, you can temporarily use Option 1 (allUsers)"

