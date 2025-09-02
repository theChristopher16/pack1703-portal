# Apple Sign-In Domain Configuration Fix

## 🚨 **Problem**
Apple Sign-In shows "CONTINUE TO THE APP" window and fails because:
- Apple Sign-In is configured for `pack-1703-portal.firebaseapp.com`
- Your app runs on `sfpack1703.com`
- Domain mismatch causes redirect issues

## 🔧 **Solution**

### **Step 1: Update Firebase Authentication Settings**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/pack-1703-portal/authentication/providers

2. **Click on Apple provider** (should be enabled)

3. **Update Authorized Domains**:
   - Add: `sfpack1703.com`
   - Remove or keep: `pack-1703-portal.firebaseapp.com` (optional)

4. **Update OAuth Redirect URLs**:
   - Add: `https://sfpack1703.com/__/auth/handler`
   - Remove: `https://pack-1703-portal.firebaseapp.com/__/auth/handler`

### **Step 2: Update Apple Developer Configuration**

1. **Go to Apple Developer Console**: https://developer.apple.com/account/resources/identifiers/list/serviceId

2. **Find your Service ID** (should be `com.sfpack1703.portal`)

3. **Update Return URLs**:
   - Add: `https://sfpack1703.com/__/auth/handler`
   - Remove: `https://pack-1703-portal.firebaseapp.com/__/auth/handler`

### **Step 3: Verify Configuration**

After updating both Firebase and Apple Developer settings:

1. **Wait 2-3 minutes** for changes to propagate
2. **Clear browser cache** and cookies
3. **Test Apple Sign-In** again
4. **Check console** for any remaining errors

## 🎯 **Expected Results**

After fixing:
- ✅ **No more "CONTINUE TO THE APP" window**
- ✅ **Apple Sign-In works directly**
- ✅ **Account linking works properly**
- ✅ **No more 400 errors from Firestore**

## 🔍 **Verification**

Check that these URLs are configured in both places:
- **Firebase Console**: `https://sfpack1703.com/__/auth/handler`
- **Apple Developer**: `https://sfpack1703.com/__/auth/handler`

## 📞 **If Still Having Issues**

1. **Check App Check status** - Make sure it's properly configured
2. **Verify domain ownership** - Ensure `sfpack1703.com` is verified
3. **Check browser console** - Look for any remaining errors
4. **Test in incognito mode** - Eliminate cache issues

---
**Status**: 🔄 **PENDING** - Need to update Apple Sign-In domain configuration
