# SMS Notifications Setup Guide

## Overview

The Pack 1703 Portal has SMS notification infrastructure ready for future implementation. The feature is currently marked as "Coming Soon" in the UI while we evaluate cost-effective SMS solutions.

> **Status**: 🟠 Coming Soon - Infrastructure ready, awaiting cost-effective SMS provider

## Features Implemented

### ✅ Core SMS Infrastructure
- **SMS Service**: Client-side and server-side SMS services using Twilio
- **Cloud Functions**: `sendSMS` and `sendAnnouncementSMS` functions for secure SMS sending
- **Phone Number Validation**: Automatic formatting and validation of phone numbers
- **User Preferences**: SMS notification preferences in user profiles

### ✅ User Interface Updates
- **Profile Management**: Phone number field with validation and SMS preference toggle
- **Announcement Creation**: SMS sending option in announcement form
- **Visual Indicators**: SMS status indicators in announcement lists

### ✅ Integration Points
- **Announcement System**: SMS sending integrated with existing announcement flow
- **User Targeting**: Respects user SMS preferences and phone number availability
- **Test Mode**: Support for test phone numbers during development

## Setup Requirements

### 1. Twilio Account Setup

1. **Create Twilio Account**
   - Sign up at [twilio.com](https://www.twilio.com)
   - Verify your phone number
   - Get a Twilio phone number for sending SMS

2. **Get Credentials**
   - Account SID: Found in Twilio Console Dashboard
   - Auth Token: Found in Twilio Console Dashboard
   - Phone Number: Your Twilio phone number (e.g., +1234567890)

### 2. Environment Variables

Add the following environment variables to your Firebase Functions configuration:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Firebase Functions Deployment

Deploy the updated Cloud Functions:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Usage Guide

### For Administrators

#### Creating Announcements with SMS

1. **Navigate to Admin Panel**
   - Go to `/admin/announcements`
   - Click "Create New Announcement"

2. **Configure SMS Settings**
   - Fill in announcement details
   - Check "Send SMS notification" to enable SMS
   - Use "Test mode" for testing with test phone numbers

3. **Target Users**
   - SMS will be sent to users who:
     - Have SMS notifications enabled in their profile
     - Have a valid phone number
     - Are in the targeted dens (if specified)

#### User Management

1. **View SMS Preferences**
   - Go to `/admin/users`
   - Check user profiles for phone numbers and SMS preferences

2. **Enable SMS for Users**
   - Users can enable SMS in their profile settings
   - Phone numbers are required for SMS notifications

### For Users

#### Setting Up SMS Notifications

1. **Add Phone Number**
   - Go to your profile settings
   - Add your phone number in the "Contact Information" section
   - Phone number will be automatically formatted

2. **Enable SMS Notifications**
   - Check "SMS notifications" in the Preferences section
   - You'll receive text messages for important announcements

#### SMS Message Format

SMS messages are automatically formatted to fit the 160-character limit:

```
🚨 Pack 1703: [Announcement Title] - [Brief content] Contact cubmaster@sfpack1703.com for details.
```

## Technical Implementation

### SMS Service Architecture

```typescript
// Client-side SMS service
src/services/smsService.ts
- sendSMS()
- sendAnnouncementSMS()
- formatPhoneNumber()
- isValidPhoneNumber()

// Server-side SMS service
functions/src/smsService.ts
- Twilio integration
- Secure credential handling
- Error handling and logging
```

### Cloud Functions

```typescript
// Direct SMS sending
sendSMS(data, context)
- Validates phone number
- Sends SMS via Twilio
- Returns success/failure status

// Announcement SMS sending
sendAnnouncementSMS(data, context)
- Gets target users
- Checks SMS preferences
- Sends to multiple users
- Returns delivery statistics
```

### Database Schema

```typescript
// User document
{
  phone: string,
  preferences: {
    smsNotifications: boolean
  }
}

// Announcement document
{
  sendSMS: boolean,
  // ... other fields
}
```

## Testing

### Test Phone Numbers

The system includes test phone numbers for development:

```javascript
const testPhones = ['+15551234567', '+15559876543'];
```

### Test Mode

Enable test mode when creating announcements to:
- Only send to test phone numbers
- Avoid sending to real users
- Test SMS functionality safely

### Test Script

Run the test script to verify SMS functionality:

```bash
node test-sms-system.js
```

## Security Considerations

### Phone Number Privacy
- Phone numbers are stored securely in Firestore
- Only accessible to authorized users
- Used only for SMS notifications

### Twilio Security
- Credentials stored in Firebase Functions environment
- Not exposed to client-side code
- Secure API calls to Twilio

### User Consent
- Users must explicitly enable SMS notifications
- Can disable SMS at any time
- Phone number is optional

## Cost Management

### Twilio Pricing
- SMS messages cost approximately $0.0075 per message
- Monitor usage in Twilio Console
- Set up billing alerts

### Optimization
- SMS only sent for high-priority announcements
- Respects user preferences
- Test mode prevents accidental charges

## Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check Twilio credentials
   - Verify phone number format
   - Check user SMS preferences

2. **Invalid Phone Numbers**
   - Ensure phone numbers include country code
   - Use format: +1234567890
   - Check for typos

3. **Functions Not Deployed**
   - Run `firebase deploy --only functions`
   - Check Firebase Console for errors
   - Verify environment variables

### Debug Steps

1. **Check Cloud Function Logs**
   ```bash
   firebase functions:log
   ```

2. **Verify User Data**
   - Check Firestore for user phone numbers
   - Verify SMS preferences are enabled

3. **Test with Test Mode**
   - Use test phone numbers
   - Enable test mode in announcements

## Future Enhancements

### Planned Features
- **SMS Templates**: Customizable SMS message templates
- **Delivery Reports**: Track SMS delivery status
- **Scheduled SMS**: Send SMS at specific times
- **SMS Replies**: Handle incoming SMS responses

### Integration Opportunities
- **Event Reminders**: SMS reminders for upcoming events
- **Emergency Alerts**: Critical safety notifications
- **RSVP Reminders**: Follow-up SMS for event RSVPs

## Support

For technical support or questions about SMS notifications:

1. **Check Documentation**: Review this guide and code comments
2. **Test Functionality**: Use test mode and test phone numbers
3. **Monitor Logs**: Check Firebase Functions logs for errors
4. **Contact Admin**: Reach out to pack leadership for assistance

---

*Last Updated: January 2025*
*Version: 1.0*
