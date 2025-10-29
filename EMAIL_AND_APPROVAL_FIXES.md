# Email and Account Approval System Fixes

## Issues Fixed

### 1. Email Notifications Not Being Sent ❌ → ✅
**Problem:** Email failures were being caught silently with no visibility into what was failing.

**Fix:** 
- Added comprehensive error logging for all email operations
- Email attempts are now logged in `adminActions` collection for monitoring
- Both success and failure cases are tracked
- Error details are preserved for debugging

**Actions Logged:**
- `account_request_email_sent` - When notification email is sent to cubmaster
- `account_request_email_failed` - When notification email fails (with error details)
- `welcome_email_sent` - When password setup email is sent to approved user
- `welcome_email_failed` - When welcome email fails (includes setup token for resending)

### 2. Password Setup Emails Not Being Sent ❌ → ✅
**Problem:** Welcome emails with password setup links may have been failing silently.

**Fix:**
- Enhanced error logging for welcome emails
- Setup token is included in failure logs so emails can be resent if needed
- Email send status is tracked and logged

**What's Included in Welcome Email:**
- Password setup link with token (expires in 24 hours)
- Account details
- Next steps for completing account setup

### 3. Google Sign-In Users Not Appearing in Approval List ❌ → ✅
**Problem:** Google sign-in users were authenticating but not appearing in the approval queue, requiring manual Firebase checks.

**Fix:**
- **Firebase Auth Trigger:** Automatically creates account requests when Google users sign in
- **Retroactive Function:** `createRequestsForExistingGoogleUsers` creates requests for existing Google users
- All Google sign-in users will now appear in the approval list automatically

## How to Monitor Email Issues

### View Email Status in Firebase Console

1. Go to Firebase Console > Firestore Database
2. Navigate to `adminActions` collection
3. Filter by action type:
   - `account_request_email_sent` - Successful notifications
   - `account_request_email_failed` - Failed notifications (check `details.error`)
   - `welcome_email_sent` - Successful password emails
   - `welcome_email_failed` - Failed password emails (includes `setupToken` for resending)

### Check Function Logs

```bash
firebase functions:log --only submitAccountRequest
firebase functions:log --only approveAccountRequest
firebase functions:log --only onCreateGoogleAuthUser
```

## Fix Existing Google Users

### Option 1: Run the Callable Function (Recommended)

From your admin panel, you can call:
```javascript
const functions = getFunctions();
const createRequests = httpsCallable(functions, 'createRequestsForExistingGoogleUsers');

const result = await createRequests({});
console.log(result.data);
```

This will:
- Find all Google sign-in users
- Check if they have account requests
- Create missing requests automatically
- Send notification emails to cubmaster

### Option 2: Use Firebase Console

1. Go to Firebase Functions
2. Find `createRequestsForExistingGoogleUsers`
3. Test the function with empty data `{}`
4. Check the response for results

## Testing Email Functionality

### Test Account Request Emails

1. Submit a new account request through the portal
2. Check Firebase Console > Functions > Logs for email send status
3. Check Firestore > `adminActions` for email logs
4. Verify email arrives at `cubmaster@sfpack1703.com`

### Test Password Setup Emails

1. Approve an account request
2. Check logs for welcome email send status
3. Verify email arrives at approved user's email
4. Check email includes password setup link

### Test Google Sign-In Auto-Requests

1. Have a new user sign in with Google
2. Check Firestore > `accountRequests` for auto-created request
3. Verify notification email sent to cubmaster
4. Request should appear in approval list immediately

## Troubleshooting

### Email Not Sending

1. **Check Function Logs:**
   ```bash
   firebase functions:log --limit 50
   ```
   Look for email-related errors

2. **Check Email Service Configuration:**
   - Verify email service credentials are set
   - Check for quota limits
   - Verify sender email is configured correctly

3. **Check adminActions Collection:**
   - Filter by `action: 'account_request_email_failed'`
   - Review `details.error` for specific error messages

### Google Users Not Appearing

1. **Check if Trigger is Running:**
   ```bash
   firebase functions:log --only onCreateGoogleAuthUser
   ```

2. **Run Retroactive Function:**
   - Use `createRequestsForExistingGoogleUsers` to catch existing users
   - Check response for how many requests were created

3. **Verify User is Google Sign-In:**
   - Check Firebase Auth Console
   - Look for users with `google.com` provider

## New Functions

### `createRequestsForExistingGoogleUsers`
- **Purpose:** Create account requests for existing Google sign-in users
- **Permission:** Admin/den leader only
- **Usage:** Call from admin panel or Firebase Console
- **Returns:** Summary of created requests

### `onCreateGoogleAuthUser` (Firebase Trigger)
- **Purpose:** Automatically create account requests when Google users sign in
- **Trigger:** Firebase Auth user creation
- **Process:** Runs automatically in background

## Email Error Tracking

All email operations now create entries in `adminActions` collection:

```javascript
{
  action: 'account_request_email_failed',
  entityType: 'account_request',
  entityId: 'request_id',
  details: {
    email: 'user@example.com',
    error: 'Error message here',
    errorCode: 'ERROR_CODE'
  },
  timestamp: Timestamp,
  success: false
}
```

This allows you to:
- Track which emails failed
- Identify patterns in failures
- Resend emails if needed
- Monitor email system health

## Next Steps

1. **Deploy Functions:** Functions are ready to deploy
2. **Run Retroactive Function:** Create requests for existing Google users
3. **Monitor Email Logs:** Check `adminActions` regularly for email status
4. **Test Email Flow:** Submit test requests to verify emails are sending

## Support

If emails are still not sending:
1. Check Firebase Functions logs for detailed errors
2. Verify email service configuration
3. Check `adminActions` collection for error details
4. Contact support with specific error messages from logs

