# 📧 Google Workspace Email Setup Guide

## Overview

Your Pack 1703 Portal now supports Google Workspace email integration, allowing you to send emails directly through your existing Gmail account.

## 🚀 Quick Setup (3 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process if not already enabled

### Step 2: Generate App Password
1. In Google Account Settings → **Security**
2. Under "2-Step Verification", click **App passwords**
3. Select **Mail** as the app
4. Click **Generate**
5. **Copy the 16-character password** (you won't see it again!)

### Step 3: Configure Environment Variables

#### For Local Development (.env file):
```bash
REACT_APP_GOOGLE_WORKSPACE_EMAIL=cubmaster@sfpack1703.com
REACT_APP_GOOGLE_WORKSPACE_APP_PASSWORD=your_16_character_app_password
```

#### For Cloud Functions (Firebase):
```bash
firebase functions:config:set google.workspace_email="cubmaster@sfpack1703.com"
firebase functions:config:set google.workspace_app_password="your_16_character_app_password"
```

### Step 4: Deploy Functions
```bash
firebase deploy --only functions
```

## ✅ Testing the Email System

### Test 1: User Approval Email
1. Go to your portal: https://sfpack1703.web.app
2. Click "Request Account Access"
3. Fill out the form with a test email
4. Submit the request
5. Check your inbox for the approval notification

### Test 2: Announcement Email
1. Sign in as admin: `testadmin@pack1703.org` / `testadmin123`
2. Go to Chat → General channel
3. Type: `@solyn create a high priority announcement about testing the email system`
4. Check your inbox for the announcement email

## 🔧 Troubleshooting

### Common Issues:

**"Authentication failed"**
- Ensure 2FA is enabled
- Verify the app password is correct (16 characters)
- Check that the email address matches your Google account

**"Less secure app access"**
- Use app passwords instead of your regular password
- App passwords are more secure and required for 2FA accounts

**"Quota exceeded"**
- Gmail has daily sending limits (500 emails/day for free accounts)
- Google Workspace has higher limits (2000 emails/day)

### Email Limits:
- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2000 emails/day
- **Rate limit**: 100 emails/hour

## 📊 Email Features

### What Gets Emailed:
1. **User Approval Notifications** - When someone requests to join
2. **High-Priority Announcements** - Important pack updates
3. **Event Reminders** - Coming soon
4. **RSVP Confirmations** - Coming soon

### Email Templates:
- **HTML emails** with Pack 1703 branding
- **Priority indicators** (High/Medium/Low)
- **Responsive design** for mobile devices
- **Fallback text version** for all email clients

## 🔒 Security Notes

- App passwords are more secure than regular passwords
- Never share your app password
- Regenerate app passwords if compromised
- Use environment variables, never hardcode passwords

## 📞 Support

If you need help:
1. Check the [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
2. Review Firebase Functions logs: `firebase functions:log`
3. Test email connection in the admin panel

---

**Ready to send emails!** 🎉





