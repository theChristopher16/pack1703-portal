import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Helper function to get timestamp
function getTimestamp(): any {
  try {
    if (admin.firestore.Timestamp && admin.firestore.Timestamp.now) {
      return admin.firestore.Timestamp.now();
    }
    return new Date();
  } catch (error) {
    return new Date().toISOString();
  }
}

// CRITICAL: Disable App Check enforcement function
export const disableAppCheckEnforcement = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Only allow root users to disable App Check enforcement
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }
    
    const userData = userDoc.data();
    if (userData?.role !== 'root') {
      throw new functions.https.HttpsError('permission-denied', 'Only root users can disable App Check enforcement');
    }

    // Log the action
    await db.collection('adminActions').add({
      action: 'disable_app_check_enforcement',
      userId: context.auth.uid,
      userEmail: context.auth.token.email,
      timestamp: getTimestamp(),
      details: 'App Check enforcement disabled to restore Firestore access'
    });

    return {
      success: true,
      message: 'App Check enforcement disabled. You must also disable it in the Firebase Console.',
      instructions: [
        '1. Go to Firebase Console > App Check > APIs',
        '2. Disable enforcement for Cloud Firestore',
        '3. Disable enforcement for Cloud Functions',
        '4. This will restore Firestore access'
      ]
    };
  } catch (error: any) {
    console.error('Error disabling App Check enforcement:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// CRITICAL: Update user role function
export const updateUserRole = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { userId, newRole, email } = data;
    
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Only allow the user to update their own role, or require admin privileges
    if (context.auth.uid !== userId) {
      // Check if current user has admin privileges
      const currentUserDoc = await db.collection('users').doc(context.auth.uid).get();
      if (!currentUserDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Current user not found');
      }
      
      const currentUserData = currentUserDoc.data();
      const hasAdminRole = currentUserData?.role === 'root' || currentUserData?.role === 'admin';
      const hasLegacyPermissions = currentUserData?.isAdmin || currentUserData?.isDenLeader || currentUserData?.isCubmaster;
      
      if (!hasAdminRole && !hasLegacyPermissions) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can update other users');
      }
    }

    // Validate role
    const validRoles = ['parent', 'volunteer', 'admin', 'root'];
    if (!validRoles.includes(newRole)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
    }

    // Update user role
    const updateData: any = {
      role: newRole,
      updatedAt: getTimestamp()
    };

    // Set appropriate boolean flags based on role
    if (newRole === 'admin' || newRole === 'root') {
      updateData.isAdmin = true;
      updateData.isDenLeader = true;
      updateData.isCubmaster = true;
      updateData.permissions = ['event_management', 'pack_management', 'user_management', 'location_management', 'announcement_management'];
    } else if (newRole === 'volunteer') {
      updateData.isDenLeader = true;
      updateData.permissions = ['den_content', 'den_events', 'den_members'];
    } else {
      updateData.isAdmin = false;
      updateData.isDenLeader = false;
      updateData.isCubmaster = false;
      updateData.permissions = ['family_management', 'family_events', 'family_rsvp'];
    }

    await db.collection('users').doc(userId).update(updateData);

    return {
      success: true,
      message: `User role updated to ${newRole} successfully`
    };

  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user role');
  }
});

// CRITICAL: Admin update event function
export const adminUpdateEvent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    const hasAdminRole = userData?.role === 'root' || userData?.role === 'admin' || userData?.role === 'leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update events');
    }

    // Update the event
    const eventRef = db.collection('events').doc(data.eventId);
    await eventRef.update({
      ...data.eventData,
      updatedAt: getTimestamp()
    });

    return {
      success: true,
      message: 'Event updated successfully'
    };

  } catch (error) {
    console.error('Error updating event:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update event');
  }
});

// CRITICAL: Admin create event function
export const adminCreateEvent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user has admin privileges
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    const hasAdminRole = userData?.role === 'root' || userData?.role === 'admin' || userData?.role === 'leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create events');
    }

    // Create the event
    const eventData = {
      ...data,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    const eventRef = await db.collection('events').add(eventData);

    return {
      success: true,
      eventId: eventRef.id,
      message: 'Event created successfully'
    };

  } catch (error) {
    console.error('Error creating event:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create event');
  }
});

// CRITICAL: Submit RSVP function
export const submitRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Create RSVP submission
    const rsvpData = {
      ...data,
      userId: context.auth.uid,
      userEmail: context.auth.token.email,
      submittedAt: getTimestamp()
    };

    const rsvpRef = await db.collection('rsvps').add(rsvpData);

    return {
      success: true,
      rsvpId: rsvpRef.id,
      message: 'RSVP submitted successfully'
    };

  } catch (error) {
    console.error('Error submitting RSVP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to submit RSVP');
  }
});

// Simple test function
export const helloWorld = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  return {
    message: 'Hello from Firebase Cloud Functions!',
    timestamp: new Date().toISOString()
  };
});
