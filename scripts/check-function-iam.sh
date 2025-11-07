#!/bin/bash

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not installed"
    echo ""
    echo "To check permissions manually:"
    echo "1. Go to: https://console.cloud.google.com/functions/details/us-central1/updateUserRole?project=pack1703-portal&tab=permissions"
    echo "2. Look for 'allAuthenticatedUsers' with role 'Cloud Functions Invoker'"
    echo ""
    exit 1
fi

echo "🔍 Checking IAM permissions for updateUserRole..."
echo ""

gcloud functions get-iam-policy updateUserRole \
  --region=us-central1 \
  --project=pack1703-portal \
  --format=json

echo ""
echo "✅ If you see 'allAuthenticatedUsers' or 'allUsers' with role 'roles/cloudfunctions.invoker', permissions are correct."
echo "⚠️  If not, you need to add the permission in GCP Console."

