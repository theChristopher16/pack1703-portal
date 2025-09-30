# 📧 Email System Setup Guide

## Overview

The Pack 1703 Portal now includes a comprehensive email system that supports:
- **User Approval Notifications**: Email cubmaster when someone requests to join
- **Announcement Emails**: Send announcements to all users
- **Invitation Emails**: Send invites to new users
- **Multiple Email Providers**: Support for EmailJS, Resend, and Brevo

## 🚀 Quick Setup (5 minutes)

### Option 1: Google Workspace (Recommended - Uses your existing Gmail)

Since you already have Google Workspace configured, this is the easiest option:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Add to environment variables**:
   ```bash
   REACT_APP_GOOGLE_WORKSPACE_EMAIL=cubmaster@sfpack1703.com
   REACT_APP_GOOGLE_WORKSPACE_APP_PASSWORD=your_16_character_app_password
   ```
4. **For Cloud Functions** (server-side email):
   ```bash
   firebase functions:config:set google.workspace_email="cubmaster@sfpack1703.com"
   firebase functions:config:set google.workspace_app_password="your_16_character_app_password"
   ```

### Option 2: EmailJS (Alternative)

1. **Sign up at [EmailJS](https://www.emailjs.com/)**
2. **Add Email Service**:
   - Choose "Zoho" (since you already have Zoho)
   - Email: `cubmaster@sfpack1703.com`
   - Password: `Double_Lake_Wolf33`
3. **Create Email Template**:
   - Template ID: `pack1703_template`
   - Service ID: `pack1703_email`
4. **Get your User ID** from the EmailJS dashboard
5. **Add to environment variables**:
   ```bash
   REACT_APP_EMAILJS_SERVICE_ID=your_service_id
   REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
   REACT_APP_EMAILJS_USER_ID=your_user_id
   ```

### Option 2: Resend (Alternative)

1. **Sign up at [Resend](https://resend.com/)**
2. **Get API key** from dashboard
3. **Add to environment variables**:
   ```bash
   REACT_APP_RESEND_API_KEY=your_resend_api_key
   ```

### Option 3: Brevo (Alternative)

1. **Sign up at [Brevo](https://www.brevo.com/)**
2. **Get API key** from dashboard
3. **Add to environment variables**:
   ```bash
   REACT_APP_BREVO_API_KEY=your_brevo_api_key
   ```

## 🔧 Cloud Functions Setup

For server-side email sending (user approval notifications), you also need to configure the Cloud Functions environment:

```bash
# Set Firebase Functions environment variables
firebase functions:config:set email.resend_api_key="your_resend_api_key"
firebase functions:config:set email.brevo_api_key="your_brevo_api_key"
firebase functions:config:set email.emailjs_service_id="your_service_id"
firebase functions:config:set email.emailjs_template_id="your_template_id"
firebase functions:config:set email.emailjs_user_id="your_user_id"

# Deploy functions
firebase deploy --only functions
```

## 📋 Features

### User Approval Notifications
- **Trigger**: When someone requests to join the portal
- **Recipient**: Cubmaster (`cubmaster@sfpack1703.com`)
- **Content**: User details, request date, admin panel link
- **Action**: Click to review and approve/deny

### Announcement Emails
- **Trigger**: When creating high-priority announcements or when `sendEmail: true` is set
- **Recipients**: All approved users
- **Content**: Announcement title, content, priority level
- **Format**: HTML and text versions

### Invitation Emails
- **Trigger**: When admins create user invitations
- **Recipients**: Invited users
- **Content**: Invitation details, role, expiration date
- **Action**: Click to join the portal

## 🧪 Testing

### Test User Approval Email
1. Create a new user account
2. Check cubmaster email for notification
3. Verify email contains user details and admin link

### Test Announcement Email
1. Create a high-priority announcement
2. Check user emails for announcement
3. Verify email formatting and content

### Test Invitation Email
1. Create a user invitation from admin panel
2. Check invited user's email
3. Verify invitation link works

## 🔍 Troubleshooting

### Emails Not Sending
1. **Check environment variables**: Ensure API keys are set correctly
2. **Check console logs**: Look for email service errors
3. **Verify email service configuration**: Test with email service dashboard
4. **Check spam folder**: Emails might be filtered

### Email Service Failures
- The system tries multiple services in sequence
- If one fails, it automatically tries the next
- All failures are logged for debugging

### Cloud Functions Issues
- Check Firebase Functions logs: `firebase functions:log`
- Verify environment variables are set: `firebase functions:config:get`
- Test functions locally: `firebase emulators:start --only functions`

## 📊 Monitoring

### Email Delivery Status
- Check browser console for email sending logs
- Monitor Firebase Functions logs for server-side emails
- Use email service dashboards for delivery statistics

### Performance Metrics
- Email sending is asynchronous and won't block user actions
- Failed emails are logged but don't prevent system operation
- Parallel email sending for announcements improves performance

## 🛡️ Security

### API Key Protection
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly

### Email Content
- All email content is sanitized
- No sensitive user data in email templates
- Admin links require authentication

## 📈 Scaling

### Email Limits
- **EmailJS**: 200 emails/month (free), unlimited (paid)
- **Resend**: 100 emails/day (free), unlimited (paid)
- **Brevo**: 300 emails/day (free), unlimited (paid)

### Performance Optimization
- Parallel email sending for announcements
- Failed emails don't block other operations
- Email templates are cached for better performance

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Update email templates as needed
- Rotate API keys quarterly
- Check email service quotas

### Updates
- Email templates can be updated without code changes
- New email providers can be added easily
- Email content is customizable per announcement type

---

*Last Updated: January 2025*
*Version: 1.0*
