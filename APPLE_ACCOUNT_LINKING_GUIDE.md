# 🍎 Apple Account Linking Guide

## Overview
This guide will help you link your Apple ID to your existing root account in the Pack 1703 Portal. This will allow you to sign in using your Apple ID instead of email/password.

## Prerequisites
1. **Existing Root Account**: You must already have a root account set up
2. **Apple Developer Account**: Required for Apple Sign-In configuration
3. **Firebase Project**: Apple Sign-In must be enabled in Firebase

## Step 1: Enable Apple Sign-In in Firebase

### 1.1 Go to Firebase Console
1. Navigate to: https://console.firebase.google.com/project/pack-1703-portal/authentication/providers
2. Click on **"Authentication"** in the left sidebar
3. Go to the **"Sign-in method"** tab

### 1.2 Enable Apple Provider
1. Find **"Apple"** in the list of providers
2. Click on **"Apple"**
3. Toggle **"Enable"** to **ON**
4. Fill in the required fields:
   - **Service ID**: `com.sfpack1703.portal` (or your custom service ID)
   - **Apple Team ID**: Your Apple Developer Team ID
   - **Key ID**: Your Apple Key ID
   - **Private Key**: Upload your Apple private key file (.p8)
5. Click **"Save"**

## Step 2: Apple Developer Account Setup

### 2.1 Create App ID (if not already done)
1. Go to: https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** to create a new identifier
3. Select **"App IDs"** and click **"Continue"**
4. Fill in:
   - **Description**: Pack 1703 Portal
   - **Bundle ID**: `com.sfpack1703.portal`
5. Enable **"Sign In with Apple"** capability
6. Click **"Continue"** and **"Register"**

### 2.2 Create Service ID
1. In the same identifiers page, click **"+"** again
2. Select **"Services IDs"** and click **"Continue"**
3. Fill in:
   - **Description**: Pack 1703 Portal Web
   - **Identifier**: `com.sfpack1703.portal.web`
4. Check **"Sign In with Apple"**
5. Click **"Continue"** and **"Register"**
6. Click **"Configure"** next to "Sign In with Apple"
7. Add your domain: `pack-1703-portal.web.app`
8. Add redirect URL: `https://pack-1703-portal.web.app/__/auth/handler`
9. Click **"Save"**

### 2.3 Create Private Key
1. Go to: https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create a new key
3. Fill in:
   - **Key Name**: Pack 1703 Portal Key
4. Check **"Sign In with Apple"**
5. Click **"Continue"** and **"Register"**
6. **Download the .p8 file** (you can only download it once!)
7. Note the **Key ID** (10-character string)

## Step 3: Link Your Apple Account

### 3.1 Access Account Linking
1. **Sign in** to your root account
2. Go to **Admin Dashboard** → **User Management**
3. Find your user account in the list
4. Click **"Edit"** on your account
5. In the **"Link Social Account"** section, click **"Apple"**

### 3.2 Complete Apple Sign-In
1. A popup will open for Apple Sign-In
2. **Sign in with your Apple ID**
3. **Grant permissions** for the app
4. The account will be automatically linked

## Step 4: Test the Link

### 4.1 Sign Out and Test
1. **Sign out** of your current session
2. On the login page, click **"Continue with Apple"**
3. **Sign in with your Apple ID**
4. You should be automatically signed in to your root account

## Troubleshooting

### Common Issues

#### "auth/operation-not-allowed"
- **Cause**: Apple Sign-In not enabled in Firebase
- **Solution**: Follow Step 1 to enable Apple provider

#### "auth/account-exists-with-different-credential"
- **Cause**: Apple ID already linked to another account
- **Solution**: Use a different Apple ID or contact admin

#### "Invalid redirect URI"
- **Cause**: Redirect URI not configured in Apple Developer Console
- **Solution**: Add `https://pack-1703-portal.web.app/__/auth/handler` to your Service ID

#### "Invalid client"
- **Cause**: Service ID or Team ID incorrect
- **Solution**: Verify your Apple Developer Console settings

### Getting Help
If you encounter issues:
1. Check the browser console for error messages
2. Verify all Apple Developer Console settings
3. Ensure Firebase configuration is correct
4. Contact the system administrator

## Security Notes
- Your Apple ID credentials are never stored in our system
- Apple handles all authentication securely
- You can unlink your Apple account at any time
- Multiple social accounts can be linked to one root account

## Benefits of Apple Account Linking
- **Convenience**: Sign in with Face ID/Touch ID on Apple devices
- **Security**: Apple's secure authentication system
- **Privacy**: Apple's privacy-focused sign-in
- **Backup**: Multiple sign-in methods for account recovery
