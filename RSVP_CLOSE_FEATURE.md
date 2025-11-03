# RSVP Close Feature Implementation

## Overview
This feature allows administrators to manually close RSVPs for events, and automatically closes RSVPs when an event reaches capacity. This provides better control over event registration and prevents overbooking.

## Changes Made

### 1. Database Schema Updates

#### `src/types/firestore.ts`
- Added `rsvpClosed?: boolean` field to the `Event` interface
- This field tracks whether RSVPs are closed for an event (either manually by admin or automatically when full)

### 2. Cloud Functions

#### `functions/src/index.ts`

**New Cloud Function: `adminCloseRSVP`**
- Allows admins to manually close or reopen RSVPs for an event
- Permissions: Requires admin, den_leader, super_admin, or event_management permission
- Parameters:
  - `eventId` (required): The event ID
  - `closed` (optional, default: true): Whether to close (true) or open (false) RSVPs
- Returns: Success status, message, previous state, and new state

**Updated Cloud Function: `submitRSVP`**
- Added check for `rsvpClosed` field before allowing RSVP submission
- Throws error if RSVPs are closed: `'RSVPs for this event are closed.'`
- Automatically closes RSVPs when capacity is reached:
  - Sets `rsvpClosed: true` when `newRSVPCount >= maxCapacity`
  - Logs the auto-closure action
  - Only auto-closes if not already closed

### 3. Admin Service

#### `src/services/adminService.ts`

**Added to `adminFunctions` object:**
```typescript
closeRSVP: httpsCallable(functions, 'adminCloseRSVP')
```

**New Service Method: `closeRSVP`**
```typescript
async closeRSVP(eventId: string, closed: boolean = true): Promise<{
  success: boolean;
  error?: string;
  previousState?: boolean;
  newState?: boolean;
}>
```
- Calls the cloud function to close/open RSVPs
- Logs the action to audit logs
- Returns success status and state information

### 4. Admin UI

#### `src/pages/AdminEvents.tsx`

**Event Interface Updated:**
- Added `rsvpClosed?: boolean` field

**New Handler Function:**
```typescript
const handleCloseRSVP = async (eventId: string, currentlyClosed: boolean)
```
- Confirms action with user
- Calls `adminService.closeRSVP()`
- Refreshes event list on success
- Shows appropriate success/error notifications

**UI Updates:**
- Added RSVP status indicator: Shows "RSVPs Closed" badge when closed
- Added Close/Reopen RSVP button:
  - Yellow button with "🚫 Close" when RSVPs are open
  - Green button with "✅ Reopen" when RSVPs are closed
  - Button is responsive and flexes with other action buttons

### 5. User-Facing RSVP Form

#### `src/components/Forms/RSVPForm.tsx`

**Props Interface Updated:**
- Added `rsvpClosed?: boolean` parameter

**New Validation:**
- Checks `rsvpClosed` prop before showing form
- Shows user-friendly message when RSVPs are closed:
  ```
  RSVPs Closed
  RSVPs for this event are now closed. 
  Please contact the event organizer if you have questions.
  ```
- Message appears in yellow alert box with warning icon

**Check Order:**
1. First checks if RSVPs are closed
2. Then checks if event is at capacity
3. Then checks if user is authenticated
4. Finally shows the RSVP form

#### `src/pages/EventDetailPage.tsx`
- Updated RSVPForm component call to pass `rsvpClosed` prop
- Prop value comes from `event?.rsvpClosed || false`

## Feature Behavior

### Admin Actions
1. **Manual Close**: Admin clicks "🚫 Close" button → RSVPs are closed → Button changes to "✅ Reopen"
2. **Manual Reopen**: Admin clicks "✅ Reopen" button → RSVPs are reopened → Button changes to "🚫 Close"
3. **Visual Indicator**: When closed, event card shows "RSVPs Closed" badge

### Automatic Closure
1. When an RSVP is submitted that brings the event to capacity
2. System automatically sets `rsvpClosed: true`
3. Logs the auto-closure action to console
4. Future RSVP attempts will be blocked

### User Experience
1. Users attempting to RSVP for a closed event see:
   - Clear message that RSVPs are closed
   - Instruction to contact organizer if needed
   - Professional yellow alert design
2. Error is shown before authentication check (better UX)
3. Message is distinct from "Event at Capacity" message

## Security & Permissions

### Cloud Function Security
- Requires authentication to call `adminCloseRSVP`
- Validates user has one of:
  - `role: 'super_admin'`
  - `role: 'admin'`
  - `role: 'den_leader'`
  - `isAdmin: true` (legacy)
  - `isDenLeader: true` (legacy)
  - `permissions: ['event_management']`

### Firestore Rules
- `rsvpClosed` field should be added to Firestore security rules
- Only admins should be able to write to this field
- All users can read this field

### Recommended Firestore Rule Update
```javascript
match /events/{eventId} {
  allow read: if true;
  allow create: if isAdmin(request);
  allow update: if isAdmin(request) || 
                   (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentRSVPs', 'rsvpClosed', 'updatedAt']));
  allow delete: if isAdmin(request);
}
```

## Testing Checklist

### Manual Testing
- [ ] Admin can close RSVPs via admin panel
- [ ] Admin can reopen RSVPs via admin panel
- [ ] RSVP button changes appearance when closed/opened
- [ ] "RSVPs Closed" badge appears when closed
- [ ] Users see "RSVPs Closed" message when trying to RSVP
- [ ] RSVPs automatically close when capacity is reached
- [ ] Cannot submit RSVP when closed (backend validation)
- [ ] Notifications appear correctly for close/reopen actions

### Edge Cases
- [ ] Opening RSVPs for already-full event allows new RSVPs
- [ ] Closing RSVPs doesn't affect existing RSVPs
- [ ] Auto-closure only happens once (idempotent)
- [ ] Manual reopen works after auto-closure
- [ ] Permission denied for non-admin users

## Deployment Notes

1. Deploy cloud functions first:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions:adminCloseRSVP
   firebase deploy --only functions:submitRSVP
   ```

2. Deploy client-side code:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. Update Firestore security rules if needed

4. Test in production with a test event

## Future Enhancements

1. **Waitlist Feature**: Allow users to join a waitlist when RSVPs are closed or at capacity
2. **Scheduled Closure**: Allow admins to set a date/time when RSVPs automatically close
3. **Close Reason**: Allow admins to specify why RSVPs were closed
4. **Email Notifications**: Notify users on waitlist when RSVPs reopen
5. **Bulk Operations**: Close/open RSVPs for multiple events at once
6. **Event History**: Track when RSVPs were closed/reopened and by whom

## Support

If you encounter any issues with this feature:
1. Check cloud function logs in Firebase Console
2. Check browser console for client-side errors
3. Verify user has appropriate permissions
4. Check Firestore rules if database operations fail

---

**Implementation Date**: January 2025
**Version**: 1.0
**Status**: Complete ✅




