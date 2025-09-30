# Den-Specific Announcements Guide

This guide explains how to use the new den-specific announcements feature in the Pack 1703 Portal.

## Overview

The den-specific announcements feature allows administrators to send announcements to specific dens or all dens, providing targeted communication to scout families based on their den assignments.

## Features

### 🎯 Targeted Communication
- Send announcements to specific dens (Lion, Tiger, Wolf, Bear, Webelos, Arrow of Light)
- Send announcements to multiple dens at once
- Send announcements to all dens (default behavior)

### 👥 User Management
- Users can be assigned to multiple dens (useful for families with multiple scouts)
- Each user has a primary den and can belong to additional dens
- Announcements are filtered based on user's den assignments

### 📧 Email Integration
- Email notifications are automatically sent only to users in targeted dens
- Test mode available for safe testing
- Respects user email preferences

### 🔒 Security
- Firestore rules ensure users only see announcements they're authorized to view
- Admin-only access to create and manage announcements

## How to Use

### For Administrators

#### Creating Den-Specific Announcements

1. **Navigate to Announcements**
   - Go to Admin Dashboard → Announcements
   - Click "Create New Announcement"

2. **Fill in Announcement Details**
   - Enter title and content
   - Select category and priority
   - Choose email notification settings

3. **Select Target Dens**
   - In the "Target Dens" section, you'll see all available options:
     - 🏕️ **Pack (All Dens)** - Selects all dens at once
     - 🦁 Lion Den (Kindergarten)
     - 🐯 Tiger Den (1st Grade)
     - 🐺 Wolf Den (2nd Grade)
     - 🐻 Bear Den (3rd Grade)
     - 🏕️ Webelos Den (4th Grade)
     - 🏹 Arrow of Light (5th Grade)

4. **Choose Targeting Options**
   - **Pack (All Dens) selected**: Automatically selects all individual dens
   - **No dens selected**: Announcement goes to all users (same as Pack)
   - **One or more individual dens selected**: Announcement goes only to users in those dens

5. **Create the Announcement**
   - Click "Create Announcement"
   - Emails will be sent automatically if email notifications are enabled

#### Example Scenarios

**Scenario 1: Pack-Wide Announcement (Easy)**
- Click "Pack (All Dens)" - automatically selects all dens
- All families will see this announcement and receive emails

**Scenario 2: Pack-Wide Announcement (Manual)**
- Leave all dens unselected (same result as Pack)
- All families will see this announcement and receive emails

**Scenario 3: Lion Den Meeting**
- Select only "Lion Den"
- Only Lion Den families will see this announcement and receive emails

**Scenario 4: Multi-Den Activity**
- Select "Wolf Den" and "Bear Den"
- Families with scouts in either Wolf or Bear dens will see this announcement

### For Users

#### Viewing Announcements
- Users automatically see only announcements relevant to their den assignments
- No action required - filtering happens automatically
- Users with multiple den assignments see announcements for all their dens

#### Den Assignments
- Den assignments are managed by administrators
- Users can belong to multiple dens (useful for families with multiple scouts)
- Contact your den leader or cubmaster if your den assignment needs updating

## Technical Details

### User Profile Structure
```typescript
interface UserProfile {
  den?: string;           // Primary den (backwards compatibility)
  dens?: string[];        // All dens this user belongs to
  // ... other fields
}
```

### Announcement Structure
```typescript
interface Announcement {
  targetDens?: string[];  // Array of den IDs this announcement targets
  // ... other fields
}
```

### Available Dens
- `pack` - Pack (All Dens) - Special identifier for selecting all dens
- `lion` - Lion Den
- `tiger` - Tiger Den  
- `wolf` - Wolf Den
- `bear` - Bear Den
- `webelos` - Webelos Den
- `arrow-of-light` - Arrow of Light

## Testing

### Test Mode
- Use test mode when creating announcements to send emails only to test addresses
- Test emails: `christopher@smithstation.io`, `welcome-test@smithstation.io`

### Manual Testing
1. Create test users with different den assignments
2. Create announcements targeting different dens
3. Verify users only see relevant announcements
4. Check email delivery to correct recipients

## Troubleshooting

### Users Not Seeing Announcements
1. Check user's den assignments in admin panel
2. Verify announcement target dens are set correctly
3. Ensure user is approved and active

### Emails Not Being Sent
1. Check user's email notification preferences
2. Verify email addresses are valid
3. Check test mode settings
4. Review email service logs

### Permission Issues
1. Ensure user has appropriate role (admin for creating announcements)
2. Check Firestore rules are properly deployed
3. Verify user authentication status

## Best Practices

### Announcement Creation
- Use clear, descriptive titles
- Include relevant details in content
- Select appropriate priority level
- Use test mode for important announcements

### Den Targeting
- Be specific when targeting dens
- Use "all dens" sparingly for truly pack-wide announcements
- Consider multi-den activities when appropriate

### User Management
- Keep den assignments up to date
- Handle families with multiple scouts appropriately
- Communicate den assignment changes to affected families

## Support

For technical issues or questions about den-specific announcements:
1. Check this guide first
2. Review the admin documentation
3. Contact the development team
4. Submit an issue in the project repository

---

*Last updated: January 2025*
