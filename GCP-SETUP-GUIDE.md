# 🚀 **GCP Project Setup Guide**

Step-by-step guide to set up the GCP project for Pack 1703 Firebase migration.

## 🔐 **Step 1: Fix gcloud Authentication**

You're encountering OAuth issues with gcloud. Here are several solutions:

### **Option A: Use Web Browser (Recommended)**
1. **Open your web browser** and go to: https://console.cloud.google.com/
2. **Sign in** with your Google account (cms095@email.latech.edu)
3. **Create a new project** manually through the web interface
4. **Use the Cloud Shell** in the browser for commands

### **Option B: Fix Local gcloud**
```bash
# Update gcloud to latest version
gcloud components update

# Clear all authentication
gcloud auth revoke --all
gcloud config configurations list
gcloud config configurations delete default

# Try authentication again
gcloud auth login --no-launch-browser
# This will give you a URL to copy/paste in browser
```

### **Option C: Use Service Account**
1. **Create a service account** in the GCP console
2. **Download the JSON key**
3. **Set environment variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
   ```

## 🏗️ **Step 2: Create GCP Project (Web Console)**

Since authentication is having issues, let's use the web console:

### **Manual Project Creation**
1. **Go to**: https://console.cloud.google.com/
2. **Click "Select a project"** → "New Project"
3. **Project details**:
   - **Project name**: Pack 1703 RSVP System
   - **Project ID**: `pack1703-rsvp-prod` (must be globally unique)
   - **Organization**: (leave as default or select your organization)
4. **Click "Create"**

### **Enable Billing**
1. **Go to**: https://console.cloud.google.com/billing
2. **Link the project** to your billing account
3. **Set up budget alerts** for $5/month

### **Enable Required APIs**
Go to **APIs & Services** → **Library** and enable:
- Firebase Management API
- Cloud Firestore API
- Cloud Functions API
- Cloud Scheduler API
- Pub/Sub API
- Cloud Storage API
- Secret Manager API
- Cloud Monitoring API
- Identity and Access Management (IAM) API

## 🔥 **Step 3: Set up Firebase (Web Console)**

### **Add Firebase to GCP Project**
1. **Go to**: https://console.firebase.google.com/
2. **Click "Add project"**
3. **Select your existing GCP project**: `pack1703-rsvp-prod`
4. **Configure Firebase**:
   - **Enable Google Analytics**: Yes (optional)
   - **Analytics account**: Create new or use existing
5. **Click "Add Firebase"**

### **Configure Firebase Services**

#### **Authentication**
1. **Go to**: Authentication → Sign-in method
2. **Enable Email/Password**
3. **Add authorized domains**:
   - `sfpack1703.com`
   - `smithstation.io`
   - `localhost` (for development)

#### **Firestore Database**
1. **Go to**: Firestore Database → Create database
2. **Security rules**: Start in **production mode**
3. **Location**: Choose **us-central (Iowa)**
4. **Click "Done"**

#### **Web App Registration**
1. **Go to**: Project settings → General → Your apps
2. **Click "Add app"** → Web app
3. **App details**:
   - **App nickname**: Pack 1703 RSVP App
   - **Firebase Hosting**: Yes
4. **Copy the Firebase config** (we'll need this later)

## 🏠 **Step 4: Configure Firebase Hosting**

### **Add Custom Domains**
1. **Go to**: Hosting → Add custom domain
2. **Add domains**:
   - `sfpack1703.com`
   - `smithstation.io`
3. **Follow DNS verification steps**

### **DNS Configuration (Cloudflare)**
Add these records in Cloudflare:
```
A Record: sfpack1703.com → [Firebase IP from hosting setup]
A Record: smithstation.io → [Firebase IP from hosting setup]
```

## 🔑 **Step 5: Create Service Account for OpenTofu**

### **Manual Service Account Creation**
1. **Go to**: IAM & Admin → Service Accounts
2. **Create Service Account**:
   - **Name**: `opentofu-deploy`
   - **Description**: Service account for OpenTofu infrastructure deployment
3. **Grant Roles**:
   - Editor
   - Firebase Admin
   - Storage Admin
   - Secret Manager Admin
4. **Create and download JSON key**

### **Configure Local Environment**
```bash
# Set environment variable for OpenTofu
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Add to your shell profile
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"' >> ~/.zshrc
```

## ⚙️ **Step 6: Deploy Infrastructure with OpenTofu**

### **Configure Variables**
1. **Edit**: `tofu/gcp/terraform.tfvars`
2. **Set your project ID**:
   ```hcl
   project_id = "your-actual-project-id"  # Replace with your project ID
   ```

### **Deploy Infrastructure**
```bash
cd tofu/gcp

# Initialize OpenTofu
tofu init

# Plan deployment
tofu plan

# Apply infrastructure
tofu apply
```

## 🚨 **Alternative: Use Existing Firebase Project**

If you want to use an existing Firebase project instead:

### **Find Existing Project**
1. **Go to**: https://console.firebase.google.com/
2. **Look for existing projects** you have access to
3. **Get the project ID** from project settings

### **Use Existing Project**
```bash
# Set the existing project
gcloud config set project YOUR_EXISTING_PROJECT_ID

# Continue with OpenTofu deployment
cd tofu/gcp
tofu init
tofu plan
```

## 🎯 **Next Steps After Project Setup**

Once you have a working GCP project:

1. **✅ Project Created**: GCP project with Firebase enabled
2. **✅ APIs Enabled**: All required APIs activated
3. **✅ Billing Linked**: Billing account connected
4. **⏳ Deploy Infrastructure**: Run OpenTofu modules
5. **⏳ Deploy Functions**: Firebase Cloud Functions
6. **⏳ Configure Hosting**: React apps on Firebase Hosting

## 💡 **Recommended Approach**

Given the authentication issues, I recommend:

1. **Use the GCP web console** to create the project manually
2. **Create a service account** with the necessary permissions
3. **Download the service account key**
4. **Use that for OpenTofu authentication**

This approach avoids the OAuth issues and gives you full control over the setup process.

**Would you like me to guide you through the manual web console setup, or would you prefer to try fixing the gcloud authentication first?**
