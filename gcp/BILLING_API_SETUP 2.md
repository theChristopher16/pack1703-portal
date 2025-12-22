# 🔧 Cloud Billing API Setup Guide

This guide explains how to enable the Cloud Billing API for organization billing account management.

## 🚀 Quick Start: Enable via GCP Console

### Step 1: Enable the API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **pack1703-portal** (or your project ID)
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Cloud Billing API"**
5. Click on **Cloud Billing API**
6. Click the **Enable** button
7. Wait for activation (usually instant)

### Step 2: Verify Billing is Enabled
1. Go to **Billing** → **Account management**
2. Ensure your project has a billing account linked
3. Note your billing account ID (format: `01XX-XXXX-XXXX`)

### Step 3: Set Up Service Account Permissions
To use the Billing API from Cloud Functions, you need a service account with billing permissions:

1. Go to **IAM & Admin** → **Service Accounts**
2. Find or create the service account used by Cloud Functions (usually `PROJECT_ID@appspot.gserviceaccount.com`)
3. Click **Edit** → **Add Another Role**
4. Add one of these roles:
   - **Billing Account Administrator** (`roles/billing.admin`) - Full control
   - **Billing Account Manager** (`roles/billing.accountManager`) - Can create/link accounts
   - **Billing Account Viewer** (`roles/billing.viewer`) - Read-only access

### Step 4: Grant Billing Account Access via IAM

**Important**: Billing account permissions are managed at the **billing account level**, not the project level. You need to grant the service account access to the billing account itself.

#### Option A: Via gcloud CLI (Recommended)

First, get your billing account ID:
```bash
gcloud billing accounts list
```

Then grant the service account access:
```bash
# For pack1703-portal project, use this billing account:
BILLING_ACCOUNT_ID="011E25-695C11-DE734B"

# Grant Billing Account Administrator role to Cloud Functions service account
# Note: billing.accountManager doesn't exist - use billing.admin instead
gcloud billing accounts add-iam-policy-binding $BILLING_ACCOUNT_ID \
  --member="serviceAccount:pack1703-portal@appspot.gserviceaccount.com" \
  --role="roles/billing.admin"
```

#### Option B: Via Terraform (See below)

#### Option C: Via GCP Console (Alternative Method)

The billing account permissions interface has changed. Try this:

1. Go to: https://console.cloud.google.com/billing
2. Click on **your billing account name** (not just the project)
3. Look for **IAM** or **Permissions** in the left sidebar
4. If not visible, try the direct URL: `https://console.cloud.google.com/billing/ACCOUNT_ID/permissions` (replace ACCOUNT_ID)
5. Click **Grant Access** or **Add Principal**
6. Add: `pack1703-portal@appspot.gserviceaccount.com`
7. Select role: **Billing Account Administrator** (`roles/billing.admin`)

**Note**: If you can't find the permissions tab, use the gcloud CLI method above - it's more reliable.

## 🔧 Enable via gcloud CLI

```bash
# Set your project
gcloud config set project pack1703-portal

# Enable the Billing API
gcloud services enable cloudbilling.googleapis.com

# Verify it's enabled
gcloud services list --enabled | grep billing
```

## 🏗️ Enable via Terraform (Infrastructure as Code)

The Billing API has already been added to `gcp/main.tf`. To apply:

```bash
cd gcp
terraform init
terraform plan  # Review changes
terraform apply # Apply changes
```

### Grant Billing Account Permissions via Terraform

Add your billing account ID to `terraform.tfvars`:

```hcl
billing_account_id = "01XX-XXXX-XXXX"  # Your billing account ID
```

Then Terraform will automatically grant the Cloud Functions service account (`PROJECT_ID@appspot.gserviceaccount.com`) the `Billing Account Administrator` role (`roles/billing.admin`).

**To find your billing account ID:**
```bash
gcloud billing accounts list
```

Look for an account with `OPEN = True` - that's your active billing account.

## 📋 Required Permissions

For the Cloud Function to create/link billing accounts, the service account needs:

- **Billing Account Administrator** (`roles/billing.admin`) - Required for creating/linking accounts
  - Full control over billing accounts
  - Can create, modify, link, and delete billing accounts
  - **Note**: `roles/billing.accountManager` doesn't exist - use `billing.admin` instead

## 🔐 Security Best Practices

1. **Principle of Least Privilege**: Note that `billing.accountManager` doesn't exist - `billing.admin` is required for creating/linking billing accounts
2. **Service Account Isolation**: Use a dedicated service account for billing operations
3. **Audit Logging**: Monitor billing API calls in Cloud Audit Logs
4. **Cost Alerts**: Set up billing alerts to monitor usage

## ✅ Verify Setup

After enabling, test with:

```bash
# List billing accounts (requires permissions)
gcloud billing accounts list

# Check if API is enabled
gcloud services list --enabled --filter="name:cloudbilling.googleapis.com"
```

## 📚 Additional Resources

- [Cloud Billing API Documentation](https://cloud.google.com/billing/docs/reference/rest)
- [Setting up Billing API Authentication](https://cloud.google.com/billing/docs/how-to/billing-api-setup)
- [Billing IAM Roles](https://cloud.google.com/billing/docs/how-to/billing-access)

## 🚨 Troubleshooting

### Error: "API not enabled"
- Make sure you've enabled the API in the correct project
- Wait a few minutes after enabling - API activation can take time

### Error: "Permission denied"
- Verify the service account has billing permissions
- Check that the billing account is linked to your project
- Ensure you're using the correct billing account ID

### Error: "Billing account not found"
- Verify the billing account ID format (should be `01XX-XXXX-XXXX`)
- Check that the billing account exists and is accessible
- Ensure billing account is linked to your project
