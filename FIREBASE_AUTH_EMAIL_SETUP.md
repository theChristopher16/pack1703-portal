# Firebase Auth Email Configuration Guide

## Issue: Password Reset Emails Not Being Sent

If users are not receiving password reset emails, you need to configure Firebase Auth email settings.

## Step 1: Configure Email Templates

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `pack1703-portal`
3. Navigate to **Authentication** → **Templates**
4. Click on **Password reset** template
5. Configure the following:

### Email Template Settings:
- **Sender name**: Pack 1703 Portal
- **Subject**: Reset your Pack 1703 Portal password
- **Email template**: Customize the message
- **Action URL**: `https://sfpack1703.web.app` (your domain)

## Step 2: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add the following domains:
   - `sfpack1703.web.app`
   - `pack1703-portal.web.app`
   - `localhost` (for development)

## Step 3: Configure SMTP Settings (Optional but Recommended)

1. In Firebase Console, go to **Authentication** → **Settings** → **SMTP settings**
2. Configure custom SMTP server if you want branded emails
3. Or use Firebase's default email service

## Step 4: Test Email Delivery

### Test with Firebase CLI:
```bash
# Test sending a password reset email
firebase auth:export users.json --format json
```

### Test in Browser:
1. Go to your app: `https://sfpack1703.web.app`
2. Click "Sign In"
3. Click "Forgot your password?"
4. Enter a valid email address
5. Check email inbox (including spam folder)

## Step 5: Check Email Delivery Issues

### Common Issues:
1. **Emails going to spam**: Check spam folder
2. **Invalid email format**: Ensure email is properly formatted
3. **Domain not authorized**: Add domain to authorized domains
4. **SMTP not configured**: Use Firebase default or configure custom SMTP

### Debug Steps:
1. Check Firebase Console → Authentication → Users for user creation
2. Check Firebase Console → Functions → Logs for any errors
3. Check browser console for JavaScript errors
4. Verify email address is valid and exists

## Step 6: Alternative: Custom Email Function

If Firebase Auth emails still don't work, we can create a custom Cloud Function to send emails:

```typescript
// functions/src/sendPasswordResetEmail.ts
import { onCall } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import * as nodemailer from 'nodemailer';

export const sendPasswordResetEmail = onCall(async (request) => {
  const { email } = request.data;
  
  try {
    // Generate password reset link
    const resetLink = await getAuth().generatePasswordResetLink(email);
    
    // Send email using custom SMTP
    const transporter = nodemailer.createTransporter({
      // SMTP configuration
    });
    
    await transporter.sendMail({
      from: 'noreply@sfpack1703.com',
      to: email,
      subject: 'Reset your Pack 1703 Portal password',
      html: `
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
});
```

## Quick Fix: Test with Firebase Console

1. Go to Firebase Console → Authentication → Users
2. Find a test user
3. Click the three dots → "Reset password"
4. This will send a password reset email directly from Firebase Console
5. Check if this email arrives

## Contact Support

If emails still don't work after following these steps:
1. Check Firebase Console → Support
2. Contact Firebase Support with your project ID: `pack1703-portal`
3. Provide details about the issue and steps taken

## Next Steps

After configuring email settings:
1. Test password reset functionality
2. Check email delivery
3. Update TODO list with completion status
4. Document any custom configurations made
