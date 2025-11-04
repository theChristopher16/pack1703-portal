# Disable App Check Enforcement

## Problem
App Check is still enforcing on the Firebase Console side, blocking all Firestore access even though we disabled it in the frontend code.

## Solution
You need to disable App Check enforcement in the Firebase Console:

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `pack1703-portal`
3. Go to **App Check** in the left sidebar
4. Click on **APIs** tab
5. Find **Cloud Firestore** in the list
6. Click the toggle to **DISABLE** App Check enforcement for Cloud Firestore
7. Do the same for **Cloud Functions** if needed

### Alternative: Use Firebase CLI
```bash
# Disable App Check enforcement for Firestore
firebase appcheck:enforce --disable --resource=firestore

# Disable App Check enforcement for Functions  
firebase appcheck:enforce --disable --resource=functions
```

## Why This Happened
- We disabled App Check initialization in the frontend code
- But App Check enforcement was still enabled in the Firebase Console
- This caused all Firestore operations to be blocked with "Missing or insufficient permissions"

## After Disabling
- Firestore access should work normally
- Temporary users should be able to read public data
- Authentication flow should work smoothly
- No more page reloads when navigating

## Security Note
- This is a temporary fix to restore functionality
- App Check should be re-enabled once reCAPTCHA is properly configured
- Firestore security rules still provide data protection
