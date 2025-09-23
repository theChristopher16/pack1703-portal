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
    const { userId, newRole } = data;
    
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

// CRITICAL: Submit RSVP function with enhanced validation and counting
export const submitRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to RSVP');
    }

    // Validate required fields
    if (!data.eventId || !data.familyName || !data.email || !data.attendees || !Array.isArray(data.attendees)) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required RSVP data');
    }

    // Validate attendees
    if (data.attendees.length === 0 || data.attendees.length > 20) {
      throw new functions.https.HttpsError('invalid-argument', 'Must have 1-20 attendees');
    }

    // Check if user already has an RSVP for this event
    const existingRSVPQuery = await db.collection('rsvps')
      .where('eventId', '==', data.eventId)
      .where('userId', '==', context.auth.uid)
      .get();

    if (!existingRSVPQuery.empty) {
      throw new functions.https.HttpsError('already-exists', 'You already have an RSVP for this event');
    }

    // Get event details to validate capacity
    const eventRef = db.collection('events').doc(data.eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    
    // Check event capacity
    const currentRSVPCount = await getActualRSVPCount(data.eventId);
    const maxCapacity = eventData?.maxCapacity;
    
    if (maxCapacity && (currentRSVPCount + data.attendees.length) > maxCapacity) {
      const remainingSpots = maxCapacity - currentRSVPCount;
      throw new functions.https.HttpsError('resource-exhausted', 
        `Event is at capacity. Only ${remainingSpots} spots remaining.`);
    }

    // Create RSVP submission with enhanced data
    const rsvpData = {
      eventId: data.eventId,
      userId: context.auth.uid,
      userEmail: context.auth.token.email || data.email,
      familyName: data.familyName,
      email: data.email,
      phone: data.phone || '',
      attendees: data.attendees,
      dietaryRestrictions: data.dietaryRestrictions || '',
      specialNeeds: data.specialNeeds || '',
      notes: data.notes || '',
      ipHash: data.ipHash || '',
      userAgent: data.userAgent || '',
      submittedAt: getTimestamp(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    // Use batch write for atomicity
    const batch = db.batch();
    
    // Add RSVP
    const rsvpRef = db.collection('rsvps').doc();
    batch.set(rsvpRef, rsvpData);

    // Update event RSVP count
    const newRSVPCount = currentRSVPCount + data.attendees.length;
    batch.update(eventRef, {
      currentRSVPs: newRSVPCount,
      updatedAt: getTimestamp()
    });

    // Update or create event statistics
    const eventStatsRef = db.collection('eventStats').doc(data.eventId);
    const eventStatsDoc = await eventStatsRef.get();
    
    if (eventStatsDoc.exists) {
      const statsData = eventStatsDoc.data();
      const currentStatsCount = statsData?.rsvpCount || 0;
      
      batch.update(eventStatsRef, {
        rsvpCount: currentStatsCount + data.attendees.length,
        updatedAt: getTimestamp()
      });
    } else {
      // Create new event stats document
      batch.set(eventStatsRef, {
        eventId: data.eventId,
        rsvpCount: data.attendees.length,
        attendeeCount: data.attendees.length,
        rsvpByDen: {},
        volunteerCount: 0,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      });
    }

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      rsvpId: rsvpRef.id,
      newRSVPCount: newRSVPCount,
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

// Helper function to get actual RSVP count from database
async function getActualRSVPCount(eventId: string): Promise<number> {
  try {
    const rsvpsQuery = await db.collection('rsvps')
      .where('eventId', '==', eventId)
      .get();
    
    let totalAttendees = 0;
    rsvpsQuery.docs.forEach(doc => {
      const rsvpData = doc.data();
      totalAttendees += rsvpData.attendees?.length || 1;
    });
    
    return totalAttendees;
  } catch (error) {
    console.error('Error getting RSVP count:', error);
    return 0;
  }
}

// CRITICAL: Get RSVP count for an event
export const getRSVPCount = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!data.eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
    }

    const count = await getActualRSVPCount(data.eventId);
    
    return {
      success: true,
      eventId: data.eventId,
      rsvpCount: count,
      message: 'RSVP count retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting RSVP count:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get RSVP count');
  }
});

// CRITICAL: Delete RSVP function
export const deleteRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!data.rsvpId) {
      throw new functions.https.HttpsError('invalid-argument', 'RSVP ID is required');
    }

    // Get the RSVP to check ownership
    const rsvpRef = db.collection('rsvps').doc(data.rsvpId);
    const rsvpDoc = await rsvpRef.get();
    
    if (!rsvpDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpData = rsvpDoc.data();
    
    // Check if user owns this RSVP or is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin' || userData?.role === 'root' || userData?.isAdmin;
    
    if (rsvpData?.userId !== context.auth.uid && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'You can only delete your own RSVPs');
    }

    // Use batch write for atomicity
    const batch = db.batch();
    
    // Delete RSVP
    batch.delete(rsvpRef);

    // Update event RSVP count
    const eventRef = db.collection('events').doc(rsvpData!.eventId);
    const currentCount = await getActualRSVPCount(rsvpData!.eventId);
    const newCount = Math.max(0, currentCount - (rsvpData!.attendees?.length || 1));
    
    batch.update(eventRef, {
      currentRSVPs: newCount,
      updatedAt: getTimestamp()
    });

    // Update event statistics
    const eventStatsRef = db.collection('eventStats').doc(rsvpData!.eventId);
    const eventStatsDoc = await eventStatsRef.get();
    
    if (eventStatsDoc.exists) {
      const statsData = eventStatsDoc.data();
      const currentStatsCount = statsData?.rsvpCount || 0;
      const newStatsCount = Math.max(0, currentStatsCount - (rsvpData!.attendees?.length || 1));
      
      batch.update(eventStatsRef, {
        rsvpCount: newStatsCount,
        updatedAt: getTimestamp()
      });
    }

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      message: 'RSVP deleted successfully',
      newRSVPCount: newCount
    };

  } catch (error) {
    console.error('Error deleting RSVP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete RSVP');
  }
});

// Simple test function
export const helloWorld = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  return {
    message: 'Hello from Firebase Cloud Functions!',
    timestamp: new Date().toISOString()
  };
});
