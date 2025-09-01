# Domain Authorization Fix Guide

## 🚨 **Problem**
The app is running on `sfpack1703.com` but Firebase project `pack-1703-portal` doesn't have this domain authorized, causing:
- Access control errors when connecting to Firestore
- Events not being created
- AI unable to create events
- Fetch API errors

## 🔧 **Solution**

### **Step 1: Add Domain to Firebase Authentication**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/pack-1703-portal/authentication/providers

2. **Click Settings tab** (top right)

3. **Scroll to "Authorized domains"** section

4. **Click "Add domain"**

5. **Add domain**: `sfpack1703.com`

6. **Click "Add"**

### **Step 2: Verify Domain Addition**

After adding the domain, you should see:
- `pack-1703-portal.firebaseapp.com` (default)
- `pack-1703-portal.web.app` (default)
- `sfpack1703.com` (newly added)

### **Step 3: Test the Fix**

1. **Wait 2-3 minutes** for changes to propagate
2. **Refresh the app** at https://sfpack1703.com
3. **Check console** - access control errors should be gone
4. **Test event creation** - should work now
5. **Test AI event creation** - should work now

## 🎯 **Expected Results**

After fixing:
- ✅ No more "Fetch API cannot load" errors
- ✅ Events can be created successfully
- ✅ AI can create events
- ✅ Firestore connections work properly
- ✅ All Firebase services accessible

## 🔍 **Verification**

Check browser console for:
- ❌ **Before**: `Fetch API cannot load https://firestore.googleapis.com/... due to access control checks`
- ✅ **After**: No access control errors, normal Firebase operations

## 📞 **If Still Having Issues**

1. **Clear browser cache** and reload
2. **Check DNS propagation** (can take up to 24 hours)
3. **Verify domain ownership** in Firebase Console
4. **Check Firebase project settings** for any restrictions

---
**Status**: 🔄 **PENDING** - Need to add `sfpack1703.com` to Firebase authorized domains
