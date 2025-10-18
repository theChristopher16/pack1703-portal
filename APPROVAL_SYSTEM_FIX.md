# Approval System Fix - Social Login Bypass Issue

## Issue Summary

**Date Discovered:** October 17, 2025  
**Severity:** High - Security/Access Control  
**Status:** Fixed

### Problem Description

Several users were found in the authentication database who never went through the proper approval workflow. This occurred because users signing in with **social login providers (Google, Apple, Facebook, etc.)** bypassed the approval system entirely.

**Affected Users:**
- Stephen Tadlock
- Wei Gao
- *Potentially others*

### Root Cause

The `createUserFromFirebaseUser()` method in `src/services/authService.ts` was directly creating approved user accounts for social login users, rather than calling the `createPendingUser` cloud function that:
1. Creates users with `pending` status
2. Sends approval notification emails to pack leadership (`cubmaster@sfpack1703.com`)
3. Requires admin approval before access is granted

**Code Flow Comparison:**

**Email/Password Signup (CORRECT):**
```
User signs up → createUserWithEmailAndPassword() 
→ createPendingUser() cloud function 
→ User status: PENDING 
→ Email sent to cubmaster 
→ User cannot access system until approved
```

**Social Login (INCORRECT - BEFORE FIX):**
```
User signs in with Google → createUserFromFirebaseUser() 
→ User status: APPROVED 
→ NO email sent 
→ User has immediate access ❌
```

**Social Login (CORRECT - AFTER FIX):**
```
User signs in with Google → createUserFromFirebaseUser() 
→ createPendingUser() cloud function 
→ User status: PENDING 
→ Email sent to cubmaster 
→ User signed out immediately 
→ User cannot access system until approved ✅
```

## Solution Implemented

### 1. Fixed Social Login Flow

Modified `src/services/authService.ts` to:
- Check if user is the first user (root account) - if yes, create as SUPER_ADMIN with approved status
- For all other users, call `createPendingUser` cloud function
- Sign out user immediately after account creation
- Display clear message: "Account created successfully! Your account is pending approval."

**Key Changes:**
```typescript
// Before: Direct creation with approved status
await setDoc(doc(db, 'users', firebaseUser.uid), {
  ...userData,
  status: 'approved',  // ❌ Wrong!
  // ...
});

// After: Use cloud function with pending status
const createPendingUserFunction = httpsCallable(functions, 'createPendingUser');
await createPendingUserFunction({
  userId: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName || '',
  // ...
});
await signOut(this.auth);  // ✅ Correct!
```

### 2. Created Fix Script

Created `scripts/fix-unapproved-users.js` to:
- Identify users who bypassed the approval system
- Provide interactive and batch modes to:
  - **Approve** users with proper metadata (approvedBy, approvedAt)
  - **Set to Pending** for re-approval
  - **Remove** users entirely
  - **Skip** users

**Usage:**
```bash
node scripts/fix-unapproved-users.js
```

## How to Use the Fix Script

### Prerequisites

1. Ensure you have the Firebase Admin service account key:
   ```bash
   # Place service-account-key.json in the project root
   ```

2. Install dependencies if needed:
   ```bash
   npm install firebase-admin
   ```

### Running the Script

```bash
cd /Users/christophersmith/Documents/GitHub/pack1703-portal
node scripts/fix-unapproved-users.js
```

### Interactive Mode (Recommended)

Choose option `[1]` to review each user individually:

```
Name: Stephen Tadlock
Email: stephen.tadlock@example.com
Role: parent
Created: 10/15/2025, 3:42:15 PM

Action? [a/p/r/s/q]: 
  [a] Approve - Approve with current role
  [p] Pending - Set to pending (requires admin approval)
  [r] Remove - Delete completely
  [s] Skip - Leave as is
  [q] Quit
```

### Batch Mode

For multiple users with the same action:
- Option `[2]`: Approve all users
- Option `[3]`: Set all to pending status

## Verification Steps

After running the fix script, verify the changes:

### 1. Check User Status in Firebase Console

```bash
# Login to Firebase Console
# Navigate to: Firestore Database > users collection
# Verify each user has:
- status: 'approved'
- approvedBy: (admin UID)
- approvedAt: (timestamp)
```

### 2. Test Social Login Flow

1. Create a test Google account
2. Try to sign in with Google
3. Verify:
   - Account creation message shows "pending approval"
   - User is signed out immediately
   - Email notification sent to cubmaster@sfpack1703.com
   - User cannot access system until approved

### 3. Check Admin Panel

1. Login as admin
2. Navigate to Admin Panel > User Management
3. Verify pending users appear in approval queue

## Prevention Measures

### Code Changes

✅ **Fixed** `createUserFromFirebaseUser()` to use proper approval workflow  
✅ **Added** automatic sign-out for pending users  
✅ **Improved** error messages for pending/denied users  
✅ **Ensured** first user (root) is still auto-approved as SUPER_ADMIN

### Testing

- [ ] **TODO:** Add integration tests for social login approval flow
- [ ] **TODO:** Add E2E tests for new user signup and approval
- [ ] **TODO:** Add monitoring alerts for users without approval metadata

### Documentation

✅ **Created** this documentation  
✅ **Created** fix script with usage instructions  
✅ **Updated** AI_AGENTS_DOCUMENTATION.md with approval requirements

## Future Improvements

1. **Automated Monitoring**: Create a scheduled function to check for users who bypass approval
2. **Admin Alerts**: Send immediate notifications when new users sign up
3. **Approval Dashboard**: Create dedicated admin UI for reviewing pending users
4. **Two-Factor Approval**: Require two admins to approve new users
5. **Temporary Access**: Allow limited guest access while approval is pending

## Related Files

- `src/services/authService.ts` - Fixed social login flow
- `functions/src/userApproval.ts` - Cloud function for creating pending users
- `functions/src/emailService.ts` - Email notifications to cubmaster
- `scripts/fix-unapproved-users.js` - Script to fix existing users
- `APPROVAL_SYSTEM_FIX.md` - This documentation

## Timeline

| Date | Action |
|------|--------|
| 10/17/2025 | Issue discovered by user |
| 10/17/2025 | Root cause identified in `authService.ts` |
| 10/17/2025 | Fix implemented and tested |
| 10/17/2025 | Fix script created |
| 10/17/2025 | Documentation completed |

## Contact

For questions or issues related to this fix, contact:
- **Pack Leadership**: cubmaster@sfpack1703.com
- **Technical Issues**: Create an issue in the GitHub repository

---

**Last Updated:** October 17, 2025  
**Version:** 1.0  
**Author:** AI Assistant (Solyn)

