# 🔔 Admin Notifications System

**Status:** ✅ IMPLEMENTED AND READY TO DEPLOY  
**Date:** November 3, 2025

---

## 📋 Overview

Comprehensive admin notification system that alerts pack administrators via **email** and **push notifications** whenever important actions occur in the Pack 1703 Portal.

---

## 🎯 What Gets Monitored

Admins receive notifications for:

### 1. **New RSVP Submissions** 🎫
- Triggers when someone RSVPs to an event
- Priority: HIGH if payment required and pending
- Includes: Family name, attendees, payment status, dietary restrictions, notes
- Action: View event details

### 2. **RSVP Payments Completed** 💰
- Triggers when payment status changes to "completed"
- Priority: NORMAL
- Includes: Payment amount, family name, attendee count
- Action: View event details

### 3. **Chat Messages** 💬
- Triggers on urgent messages containing:
  - `@admin` mentions
  - Keywords: "urgent", "emergency", "help needed"
- Priority: HIGH
- Includes: Channel name, user name, message content
- Action: View chat

### 4. **Account Requests** 👤
- Triggers when new user requests portal access
- Priority: HIGH
- Includes: Name, email, phone, reason, submission time
- Action: Approve/deny in user management

### 5. **Feedback Submissions** 📝
- Triggers when users submit feedback
- Priority: HIGH if type is "complaint" or priority is "high"
- Includes: User info, feedback type, category, message
- Action: View feedback

### 6. **Resource Submissions** 📚
- Triggers when users submit resources for review
- Priority: NORMAL
- Includes: Submitter info, resource title, description, file name
- Action: Review resource

### 7. **Volunteer Signups** 🙋
- Triggers when someone signs up to volunteer
- Priority: NORMAL
- Includes: Volunteer info, opportunity title, hours, availability
- Action: View volunteer dashboard

---

## 🏗️ Architecture

### Backend (Cloud Functions)

#### **Admin Notification Service** (`functions/src/adminNotificationService.ts`)
Core service that:
- Fetches all admin users (roles: admin, super_admin, root, den_leader)
- Sends email notifications to admins with email preferences enabled
- Sends push notifications to admins with FCM tokens registered
- Logs all notifications for audit trail
- Cleans up invalid FCM tokens automatically

#### **Notification Triggers** (`functions/src/adminNotificationTriggers.ts`)
Firestore triggers:
- `onRSVPCreate` - Monitors `rsvps` collection
- `onRSVPPaymentComplete` - Monitors payment status changes
- `onMessageCreate` - Monitors `chat-messages` collection
- `onAccountRequestCreate` - Monitors `accountRequests` collection
- `onFeedbackCreate` - Monitors `feedback` collection
- `onResourceSubmissionCreate` - Monitors `resource-submissions` collection
- `onVolunteerSignupCreate` - Monitors `volunteer-signups` collection

### Frontend (React)

#### **Push Notification Service** (`src/services/pushNotificationService.ts`)
Handles:
- Firebase Cloud Messaging (FCM) initialization
- Permission requests from users
- FCM token registration
- Foreground message listening
- Browser notification display

---

## 📧 Email Notifications

### Email Template Features
- Professional HTML design with gradient header
- Priority badges (HIGH/NORMAL/LOW)
- Color-coded by priority level
- Action buttons to view details
- Plain text fallback
- Branded footer with links

### Email Content Includes
- Clear subject line with "[Pack 1703 Admin]" prefix
- Personalized greeting
- Notification message
- Detailed data in formatted box
- Call-to-action button
- Link to manage notification preferences

---

## 📱 Push Notifications

### Features
- **Browser notifications** for desktop
- **Mobile notifications** via PWA
- **Foreground** and **background** notifications
- **Action buttons** (View/Dismiss)
- **Priority handling** (high priority requires interaction)
- **Auto-dismiss** after 10 seconds (except high priority)
- **Click-to-navigate** to relevant page

### Platforms Supported
- ✅ Chrome/Edge (desktop & Android)
- ✅ Firefox (desktop & Android)  
- ✅ Safari (desktop & iOS 16.4+)
- ✅ Opera
- ✅ Samsung Internet

### Permission Handling
- Non-intrusive permission request
- Respects user's previous choice
- Graceful degradation if not supported
- Easy opt-out in user settings

---

## ⚙️ Configuration

### Admin User Requirements
To receive notifications, users must:
1. Have role: `admin`, `super_admin`, `root`, or `den_leader`
2. Have status: `approved`
3. For email: `emailNotifications !== false`
4. For push: Valid `fcmToken` registered and `pushNotifications !== false`

### Environment Variables

Add to `.env`:
```bash
# Firebase Cloud Messaging VAPID Key
REACT_APP_FIREBASE_VAPID_KEY=your-vapid-key-here
```

Generate VAPID key:
```bash
# In Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
# Click "Generate key pair"
```

---

## 🚀 Deployment Steps

### 1. Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

New functions deployed:
- `onRSVPCreate`
- `onRSVPPaymentComplete`
- `onMessageCreate`
- `onAccountRequestCreate`
- `onFeedbackCreate`
- `onResourceSubmissionCreate`
- `onVolunteerSignupCreate`

### 2. Deploy Frontend
```bash
npm install
npm run build
firebase deploy --only hosting
```

### 3. Enable Firebase Cloud Messaging
1. Go to Firebase Console → Your Project
2. Navigate to Project Settings → Cloud Messaging
3. Under "Web Push certificates", generate a key pair
4. Copy the key pair value
5. Add to `.env` as `REACT_APP_FIREBASE_VAPID_KEY`

### 4. Request Notification Permission
First time admins log in:
- Browser will prompt for notification permission
- Click "Allow" to receive push notifications
- Can be managed later in user settings

---

## 📊 Monitoring & Logs

### View Notification Logs
```javascript
// In Firestore Console
db.collection('adminNotifications')
  .orderBy('sentAt', 'desc')
  .limit(100)
```

### View Cloud Function Logs
```bash
firebase functions:log --only onRSVPCreate,onMessageCreate
```

### Check FCM Token Status
```javascript
// In Firestore Console
db.collection('users')
  .where('role', 'in', ['admin', 'super_admin'])
  .where('fcmToken', '!=', null)
```

---

## 🧪 Testing

### Test Email Notifications
1. Submit an RSVP as a regular user
2. Check admin email inbox
3. Verify email received with correct details

### Test Push Notifications
1. Grant notification permission as admin
2. Keep browser/tab open
3. Submit feedback as regular user
4. Verify push notification appears

### Test Background Notifications
1. Grant notification permission
2. Close browser/tab
3. Submit account request
4. Verify notification appears even with browser closed

---

## 🔧 Troubleshooting

### No Email Notifications Received

**Check:**
- Admin user has `emailNotifications !== false`
- Email service is configured (`functions/src/emailService.ts`)
- Cloud function logs for errors
- Email in spam folder

### No Push Notifications Received

**Check:**
- Browser supports notifications
- Permission granted (check browser settings)
- FCM token registered in user document
- Service worker registered successfully
- VAPID key configured correctly

### FCM Token Not Saving

**Check:**
- User is authenticated
- Firestore rules allow user to update their own document
- No console errors about permission
- VAPID key is valid

---

## 📈 Future Enhancements

### Planned Features
- [ ] SMS notifications for critical alerts
- [ ] Notification grouping (batch similar notifications)
- [ ] Digest mode (daily/weekly summary)
- [ ] Custom notification sounds
- [ ] In-app notification center
- [ ] Notification statistics dashboard
- [ ] Per-notification-type preferences
- [ ] Slack/Discord integration

### Optimization Opportunities
- Batch notifications for multiple events
- Smart notification timing (respect quiet hours)
- AI-powered notification prioritization
- Notification templates for consistency

---

## 🔐 Security Considerations

### Data Protection
- Only admins receive sensitive notifications
- Email content sanitized
- FCM tokens encrypted in transit
- Audit trail for all notifications

### Privacy
- Users control their notification preferences
- Easy opt-out mechanism
- No personal data in push notification payloads
- Secure FCM token management

### Compliance
- GDPR: User consent required
- CAN-SPAM: Unsubscribe link in emails
- Data retention: Notification logs retained for 90 days

---

## 📝 Usage Examples

### For Administrators

**Enable Push Notifications:**
1. Log in as admin
2. Click notification icon when prompted
3. Allow notifications
4. You'll now receive real-time updates!

**Configure Email Preferences:**
1. Go to Profile/Settings
2. Toggle "Email Notifications"
3. Save preferences

**View Notification History:**
1. Go to Admin Dashboard
2. View "Recent Notifications" panel
3. Filter by type or date

### For Developers

**Add New Notification Type:**
```typescript
// 1. Add to adminNotificationTriggers.ts
export const onNewTrigger = functions.firestore
  .document('collection/{docId}')
  .onCreate(async (snapshot, context) => {
    await adminNotificationService.notifyAdmins({
      type: 'new_type',
      title: 'New Thing Happened',
      message: 'Description',
      priority: 'normal',
      actionUrl: '/path/to/view',
      data: { /* additional data */ }
    });
  });

// 2. Export in index.ts
export { onNewTrigger } from './adminNotificationTriggers';

// 3. Deploy
firebase deploy --only functions
```

---

## 📞 Support

For issues or questions:
- **Email:** cubmaster@sfpack1703.com
- **Documentation:** This file
- **Logs:** Firebase Console → Functions → Logs
- **Status:** Firebase Console → Firestore → adminNotifications collection

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] VAPID key configured in `.env`
- [ ] Cloud Functions built successfully
- [ ] Email service tested and working
- [ ] FCM configured in Firebase Console
- [ ] Service worker registered
- [ ] Admin users have correct roles
- [ ] Firestore rules allow FCM token updates
- [ ] Test notifications sent successfully
- [ ] Documentation updated
- [ ] Team notified of new feature

---

**Last Updated:** November 3, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Production

