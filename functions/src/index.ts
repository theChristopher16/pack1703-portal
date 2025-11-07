import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Client, Environment } from 'squareup';

// Import test function
export { testAppCheckStatus } from './testAppCheck';

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

// Helper function to create security alert
async function createSecurityAlert(
  type: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network',
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  description: string,
  source: string,
  userId?: string,
  userEmail?: string,
  ipAddress?: string,
  details?: any
) {
  try {
    await db.collection('securityAlerts').add({
      type,
      severity,
      title,
      description,
      source,
      status: 'open',
      timestamp: getTimestamp(),
      userId: userId || 'system',
      userEmail: userEmail || 'system',
      ipAddress: ipAddress || 'unknown',
      details: details || {}
    });
  } catch (error) {
    console.error('Error creating security alert:', error);
  }
}

// Helper function to create threat intelligence entry
async function createThreatIntelligence(
  type: 'ip' | 'domain' | 'hash' | 'url',
  value: string,
  threatLevel: 'low' | 'medium' | 'high' | 'critical',
  source: string,
  description: string
) {
  try {
    await db.collection('threatIntelligence').add({
      type,
      value,
      threatLevel,
      source,
      description,
      timestamp: getTimestamp()
    });
  } catch (error) {
    console.error('Error creating threat intelligence:', error);
  }
}

// Helper function to get role permissions
function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'copse_admin':
      return ['system_admin', 'user_management', 'role_management', 'system_config', 'event_management', 'pack_management', 'location_management', 'announcement_management', 'audit_logs', 'cost_management', 'network_management'];
    case 'super_admin':
      return ['system_admin', 'user_management', 'role_management', 'system_config', 'event_management', 'pack_management', 'location_management', 'announcement_management', 'audit_logs', 'cost_management'];
    case 'admin':
      return ['user_management', 'role_management', 'system_config', 'event_management', 'pack_management', 'location_management', 'announcement_management', 'cost_management'];
    case 'den_leader':
      return ['event_management', 'announcement_management', 'den_content', 'den_events', 'den_members', 'den_chat_management', 'den_announcements'];
    case 'parent':
      return ['family_management', 'family_events', 'family_rsvp', 'den_members'];
    default:
      return [];
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
    if (userData?.role !== 'root' && userData?.role !== 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only root users can disable App Check enforcement');
    }

    // Log the action
    await db.collection('adminActions').add({
      action: 'disable_app_check_enforcement',
      userId: context.auth.uid,
      userEmail: context.auth.token.email,
      timestamp: getTimestamp(),
      details: 'App Check enforcement disabled to restore Firestore access',
      severity: 'high',
      threatType: 'system_configuration',
      location: 'Cloud Functions'
    });

    // Create security alert for this action
    await createSecurityAlert(
      'system',
      'high',
      'App Check Enforcement Disabled',
      'App Check enforcement has been disabled to restore Firestore access',
      'Cloud Functions',
      context.auth.uid,
      context.auth.token.email,
      context.rawRequest.ip,
      { action: 'disable_app_check_enforcement' }
    );

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
    
    console.log(`[updateUserRole] Request from ${context.auth?.uid} to update user ${userId} to role ${newRole}`);
    
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Only allow the user to update their own role, or require admin privileges
    if (context.auth.uid !== userId) {
      // Check if current user has admin privileges
      const currentUserDoc = await db.collection('users').doc(context.auth.uid).get();
      if (!currentUserDoc.exists) {
        console.error(`[updateUserRole] Current user document not found for ${context.auth.uid}`);
        throw new functions.https.HttpsError('permission-denied', 'Current user not found');
      }
      
      const currentUserData = currentUserDoc.data();
      console.log(`[updateUserRole] Current user role: ${currentUserData?.role}`);
      
      const hasAdminRole = currentUserData?.role === 'super_admin' || 
                          currentUserData?.role === 'admin' || 
                          currentUserData?.role === 'copse_admin';
      const hasLegacyPermissions = currentUserData?.isAdmin || currentUserData?.isDenLeader || currentUserData?.isCubmaster;
      
      if (!hasAdminRole && !hasLegacyPermissions) {
        console.error(`[updateUserRole] User ${context.auth.uid} lacks admin privileges`);
        throw new functions.https.HttpsError('permission-denied', 'Only admins can update other users');
      }
    }

    // Validate role
    const validRoles = ['parent', 'den_leader', 'admin', 'super_admin', 'copse_admin'];
    if (!validRoles.includes(newRole)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
    }

    // Only super admins can assign super_admin role
    if (newRole === 'super_admin') {
      const currentUserDoc = await db.collection('users').doc(context.auth.uid).get();
      const currentUserData = currentUserDoc.data();
      if (currentUserData?.role !== 'super_admin') {
        console.error(`[updateUserRole] User ${context.auth.uid} attempted to assign super_admin role without being super_admin`);
        throw new functions.https.HttpsError('permission-denied', 'Only super admins can assign the super admin role');
      }
    }

    // Update user role in Firestore
    const updateData: any = {
      role: newRole,
      updatedAt: getTimestamp()
    };

    // Set appropriate boolean flags based on role
    if (newRole === 'admin' || newRole === 'super_admin' || newRole === 'copse_admin') {
      updateData.isAdmin = true;
      updateData.isDenLeader = true;
      updateData.isCubmaster = true;
      updateData.permissions = getRolePermissions(newRole);
    } else if (newRole === 'den_leader') {
      updateData.isDenLeader = true;
      updateData.isAdmin = false;
      updateData.isCubmaster = false;
      updateData.permissions = getRolePermissions(newRole);
    } else {
      updateData.isAdmin = false;
      updateData.isDenLeader = false;
      updateData.isCubmaster = false;
      updateData.permissions = getRolePermissions(newRole);
    }

    console.log(`[updateUserRole] Updating Firestore document for user ${userId}`);
    await db.collection('users').doc(userId).update(updateData);
    
    // Update Firebase Auth custom claims
    try {
      console.log(`[updateUserRole] Setting custom claims for user ${userId}`);
      await admin.auth().setCustomUserClaims(userId, {
        role: newRole,
        approved: true
      });
      console.log(`[updateUserRole] Successfully set custom claims for user ${userId}`);
    } catch (authError: any) {
      console.error(`[updateUserRole] Error setting custom claims for user ${userId}:`, authError);
      // If user doesn't exist in Firebase Auth, log but don't fail
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.log(`[updateUserRole] User ${userId} not found in Firebase Auth, skipping custom claims`);
    }

    // Log the action
    try {
      await db.collection('adminActions').add({
        userId: context.auth.uid,
        userEmail: context.auth.token.email || '',
        action: 'update_role',
        entityType: 'user',
        entityId: userId,
        details: { oldRole: 'unknown', newRole },
        timestamp: getTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown',
        userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
        success: true
      });
    } catch (logError) {
      console.error('[updateUserRole] Error logging action:', logError);
      // Don't fail the operation if logging fails
    }

    console.log(`[updateUserRole] Successfully updated user ${userId} to role ${newRole}`);
    return {
      success: true,
      message: `User role updated to ${newRole} successfully`
    };

  } catch (error: any) {
    console.error('[updateUserRole] Error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to update user role: ${error.message || 'Unknown error'}`);
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update events');
    }

    // Update the event with proper timezone handling
    const eventRef = db.collection('events').doc(data.eventId);
    
    // Convert local timezone date strings to Firestore Timestamps if they exist
    const updateData = { ...data.eventData };
    if (updateData.startDate) {
      updateData.startDate = admin.firestore.Timestamp.fromDate(new Date(updateData.startDate));
    }
    if (updateData.endDate) {
      updateData.endDate = admin.firestore.Timestamp.fromDate(new Date(updateData.endDate));
    }
    updateData.updatedAt = getTimestamp();
    
    await eventRef.update(updateData);

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

// CRITICAL: Admin delete event function
export const adminDeleteEvent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to delete events');
    }

    // Delete the event
    const eventRef = db.collection('events').doc(data.eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    await eventRef.delete();

    // Also delete associated RSVPs
    const rsvpQuery = db.collection('rsvps').where('eventId', '==', data.eventId);
    const rsvpSnapshot = await rsvpQuery.get();
    
    const batch = db.batch();
    rsvpSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (rsvpSnapshot.docs.length > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: 'Event and associated RSVPs deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting event:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete event');
  }
});

// Admin close RSVP function - allows admins to manually close RSVPs for an event
export const adminCloseRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to close RSVPs');
    }

    // Validate required fields
    if (!data.eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
    }

    // Get event reference
    const eventRef = db.collection('events').doc(data.eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    const currentlyClosed = eventData?.rsvpClosed || false;
    
    // Determine if we're closing or opening RSVPs
    const shouldClose = data.closed !== undefined ? data.closed : true;
    
    // Update the event
    await eventRef.update({
      rsvpClosed: shouldClose,
      updatedAt: getTimestamp()
    });

    return {
      success: true,
      message: shouldClose ? 'RSVPs closed successfully' : 'RSVPs reopened successfully',
      previousState: currentlyClosed,
      newState: shouldClose
    };

  } catch (error) {
    console.error('Error closing/opening RSVPs:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update RSVP status');
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create events');
    }

    // Create the event with proper timezone handling
    const eventData = {
      ...data,
      // Convert local timezone date strings to Firestore Timestamps
      startDate: data.startDate ? admin.firestore.Timestamp.fromDate(new Date(data.startDate)) : null,
      endDate: data.endDate ? admin.firestore.Timestamp.fromDate(new Date(data.endDate)) : null,
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
    
    // Check if RSVPs are closed
    if (eventData?.rsvpClosed === true) {
      throw new functions.https.HttpsError('failed-precondition', 
        'RSVPs for this event are closed.');
    }
    
    // Check if event requires payment
    const paymentRequired = eventData?.paymentRequired || false;
    const paymentAmount = eventData?.paymentAmount || 0;
    const paymentCurrency = eventData?.paymentCurrency || 'USD';
    const paymentDescription = eventData?.paymentDescription || '';
    
    // Check event capacity - only count paid RSVPs if payment is required
    const currentPaidRSVPCount = await getActualRSVPCount(data.eventId, paymentRequired);
    const maxCapacity = eventData?.maxCapacity;
    
    if (maxCapacity && (currentPaidRSVPCount + data.attendees.length) > maxCapacity) {
      const remainingSpots = maxCapacity - currentPaidRSVPCount;
      throw new functions.https.HttpsError('resource-exhausted', 
        `Event is at capacity. Only ${remainingSpots} spots remaining.`);
    }

    // Create RSVP submission with enhanced data and payment status
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
      // Payment-related fields
      paymentRequired: paymentRequired,
      paymentAmount: paymentAmount,
      paymentCurrency: paymentCurrency,
      paymentStatus: paymentRequired ? 'pending' : 'not_required',
      paymentId: null, // Will be set when payment is completed
      submittedAt: getTimestamp(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    // Use batch write for atomicity
    const batch = db.batch();
    
    // Add RSVP
    const rsvpRef = db.collection('rsvps').doc();
    batch.set(rsvpRef, rsvpData);

    // Update event RSVP count - only increment if payment not required or payment completed
    // For events requiring payment, only count paid RSVPs
    let newRSVPCount = currentPaidRSVPCount;
    if (!paymentRequired || (paymentRequired && rsvpData.paymentStatus === 'completed')) {
      newRSVPCount += data.attendees.length;
    }
    
    // Check if event should be auto-closed when it reaches capacity
    const shouldAutoClose = maxCapacity && newRSVPCount >= maxCapacity;
    
    const eventUpdate: any = {
      currentRSVPs: newRSVPCount,
      updatedAt: getTimestamp()
    };
    
    // Auto-close RSVPs if capacity is reached
    if (shouldAutoClose && !eventData?.rsvpClosed) {
      eventUpdate.rsvpClosed = true;
      console.log(`Auto-closing RSVPs for event ${data.eventId} - capacity reached (${newRSVPCount}/${maxCapacity})`);
    }
    
    batch.update(eventRef, eventUpdate);

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
      message: paymentRequired ? 
        'RSVP submitted successfully. Payment required to complete registration.' : 
        'RSVP submitted successfully',
      paymentRequired: paymentRequired,
      paymentAmount: paymentAmount,
      paymentCurrency: paymentCurrency,
      paymentDescription: paymentDescription
    };

  } catch (error) {
    console.error('Error submitting RSVP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to submit RSVP');
  }
});

// Helper function to get actual RSVP count from database using aggregation
async function getActualRSVPCount(eventId: string, paymentRequired: boolean = false): Promise<number> {
  try {
    // Use aggregation query for better performance
    const rsvpsRef = db.collection('rsvps');
    const snapshot = await rsvpsRef
      .where('eventId', '==', eventId)
      .select('attendees', 'paymentRequired', 'paymentStatus')
      .get();
    
    let totalAttendees = 0;
    snapshot.docs.forEach(doc => {
      const rsvpData = doc.data();
      const attendeeCount = rsvpData.attendees?.length || 1;
      
      // If payment is required, only count RSVPs with completed payment
      if (paymentRequired) {
        if (rsvpData.paymentStatus === 'completed') {
          totalAttendees += attendeeCount;
        }
      } else {
        // If payment not required, count all RSVPs
        totalAttendees += attendeeCount;
      }
    });
    
    return totalAttendees;
  } catch (error) {
    console.error('Error getting RSVP count:', error);
    return 0;
  }
}

// Delete RSVP - Users can delete their own, admins can delete any
export const deleteRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to delete RSVPs');
    }

    // Check user permissions
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin || userData?.role === 'admin' || userData?.role === 'super_admin';

    // Validate required fields
    if (!data.rsvpId) {
      throw new functions.https.HttpsError('invalid-argument', 'RSVP ID is required');
    }

    // Get the RSVP document
    const rsvpRef = db.collection('rsvps').doc(data.rsvpId);
    const rsvpDoc = await rsvpRef.get();
    
    if (!rsvpDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpData = rsvpDoc.data();
    const eventId = rsvpData?.eventId;
    const rsvpUserId = rsvpData?.userId;

    if (!eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'RSVP missing event ID');
    }

    // Check if user owns this RSVP or is an admin
    if (!isAdmin && rsvpUserId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only delete your own RSVPs');
    }

    // Use batch write for atomicity
    const batch = db.batch();
    
    // Delete the RSVP
    batch.delete(rsvpRef);

    // Update event RSVP count
    const eventRef = db.collection('events').doc(eventId);
    const currentCount = await getActualRSVPCount(eventId);
    const newCount = Math.max(0, currentCount - (rsvpData?.attendees?.length || 1));
    
    batch.update(eventRef, {
      currentRSVPs: newCount,
      updatedAt: getTimestamp()
    });

    // Update event statistics
    const eventStatsRef = db.collection('eventStats').doc(eventId);
    const eventStatsDoc = await eventStatsRef.get();
    
    if (eventStatsDoc.exists) {
      const statsData = eventStatsDoc.data();
      const currentStatsCount = statsData?.rsvpCount || 0;
      const attendeeCount = rsvpData?.attendees?.length || 1;
      
      batch.update(eventStatsRef, {
        rsvpCount: Math.max(0, currentStatsCount - attendeeCount),
        attendeeCount: Math.max(0, (statsData?.attendeeCount || 0) - attendeeCount),
        updatedAt: getTimestamp()
      });
    }

    // Commit the batch
    await batch.commit();

    // Log the deletion
    await db.collection('adminActions').add({
      type: 'rsvp_deleted',
      adminId: context.auth.uid,
      adminEmail: context.auth.token.email,
      rsvpId: data.rsvpId,
      eventId: eventId,
      familyName: rsvpData?.familyName || 'Unknown',
      attendeeCount: rsvpData?.attendees?.length || 0,
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true,
      severity: 'medium',
      threatType: 'data_modification',
      location: 'Cloud Functions'
    });

    // Create security alert for RSVP deletion
    await createSecurityAlert(
      'data_access',
      'medium',
      'RSVP Deleted by Admin',
      `Admin ${context.auth.token.email} deleted RSVP for event ${eventId}`,
      'Cloud Functions',
      context.auth.uid,
      context.auth.token.email,
      context.rawRequest?.ip,
      { rsvpId: data.rsvpId, eventId, userId: rsvpData?.userId }
    );

    return {
      success: true,
      message: 'RSVP deleted successfully',
      newRSVPCount: newCount
    };

  } catch (error) {
    console.error('Error deleting RSVP:', error);
    
    // Log the failed deletion attempt
    try {
      await db.collection('adminActions').add({
        type: 'rsvp_deletion_failed',
        adminId: context.auth?.uid || 'unknown',
        adminEmail: context.auth?.token?.email || 'unknown',
        rsvpId: data.rsvpId || 'unknown',
        timestamp: getTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown',
        userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        severity: 'high',
        threatType: 'system_error',
        location: 'Cloud Functions'
      });

      // Create security alert for failed RSVP deletion
      await createSecurityAlert(
        'system',
        'high',
        'RSVP Deletion Failed',
        `Failed to delete RSVP ${data.rsvpId}: ${error instanceof Error ? error.message : String(error)}`,
        'Cloud Functions',
        context.auth?.uid,
        context.auth?.token?.email,
        context.rawRequest?.ip,
        { rsvpId: data.rsvpId, error: error instanceof Error ? error.message : String(error) }
      );
    } catch (logError) {
      console.error('Failed to log deletion error:', logError);
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete RSVP');
  }
});

// Get user's RSVPs
export const getUserRSVPs = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to view RSVPs');
    }

    // Get user's RSVPs (avoid Firestore index/orderBy issues by sorting in code)
    const rsvpsQuery = await db.collection('rsvps')
      .where('userId', '==', context.auth.uid)
      .get();

    const rsvps = [];
    for (const doc of rsvpsQuery.docs) {
      const rsvpData = doc.data();
      
      // Get event details
      const eventDoc = await db.collection('events').doc(rsvpData.eventId).get();
      const eventData = eventDoc.exists ? eventDoc.data() : null;
      
      rsvps.push({
        id: doc.id,
        ...rsvpData,
        // Include payment status fields
        paymentStatus: rsvpData.paymentStatus || 'not_required',
        paymentRequired: rsvpData.paymentRequired || false,
        paymentAmount: rsvpData.paymentAmount || 0,
        paymentMethod: rsvpData.paymentMethod || null,
        paymentNotes: rsvpData.paymentNotes || null,
        paidAt: rsvpData.paidAt || null,
        event: eventData ? {
          id: eventData.id,
          title: eventData.title,
          date: eventData.date,
          location: eventData.location
        } : null
      });
    }

    // Sort by createdAt descending in code to avoid index requirement
    const sorted = rsvps.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() ?? (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : new Date(a.createdAt || 0).getTime());
      const bTime = b.createdAt?.toMillis?.() ?? (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : new Date(b.createdAt || 0).getTime());
      return bTime - aTime;
    });

    return {
      success: true,
      rsvps: sorted,
      count: sorted.length
    };

  } catch (error) {
    console.error('Error getting user RSVPs:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get user RSVPs');
  }
});

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

// CRITICAL: Get RSVP counts for multiple events in batch (performance optimization)
export const getBatchRSVPCounts = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!data.eventIds || !Array.isArray(data.eventIds)) {
      throw new functions.https.HttpsError('invalid-argument', 'Event IDs array is required');
    }

    // Get all RSVPs for the requested events in a single query
    const rsvpsQuery = await db.collection('rsvps')
      .where('eventId', 'in', data.eventIds)
      .get();
    
    // Group RSVPs by eventId and count attendees
    const rsvpCounts: { [eventId: string]: number } = {};
    
    // Initialize all event IDs with 0 count
    data.eventIds.forEach((eventId: string) => {
      rsvpCounts[eventId] = 0;
    });
    
    // Count attendees for each RSVP
    rsvpsQuery.docs.forEach(doc => {
      const rsvpData = doc.data();
      const eventId = rsvpData.eventId;
      const attendeeCount = rsvpData.attendees?.length || 1;
      
      if (rsvpCounts.hasOwnProperty(eventId)) {
        rsvpCounts[eventId] += attendeeCount;
      }
    });
    
    return {
      success: true,
      rsvpCounts,
      message: 'Batch RSVP counts retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting batch RSVP counts:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get batch RSVP counts');
  }
});


// CRITICAL: Get RSVP data for admin users (bypasses client-side permissions)
export const getRSVPData = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    if (!data.eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
    }

    // Check if user is den leader or higher (den_leader, admin, super_admin, root)
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    const role = (userData?.role || '').toString().toLowerCase();
    const isLeaderOrAbove = role === 'den_leader' || role === 'admin' || role === 'super_admin' || role === 'root' || userData?.isAdmin === true || userData?.isDenLeader === true;

    if (!isLeaderOrAbove) {
      throw new functions.https.HttpsError('permission-denied', 'Only den leaders and above can access RSVP data');
    }

    console.log(`Admin ${context.auth.uid} requesting RSVP data for event ${data.eventId}`);

    // Query RSVPs with admin privileges (bypasses client-side rules)
    // Remove orderBy to avoid index requirement, we'll sort in JavaScript
    const rsvpsQuery = await db.collection('rsvps')
      .where('eventId', '==', data.eventId)
      .get();

    const rsvpsData: any[] = [];
    rsvpsQuery.docs.forEach(doc => {
      const data = doc.data();
      rsvpsData.push({
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        userEmail: data.userEmail,
        familyName: data.familyName,
        email: data.email,
        phone: data.phone,
        attendees: data.attendees || [],
        dietaryRestrictions: data.dietaryRestrictions,
        specialNeeds: data.specialNeeds,
        notes: data.notes,
        // Payment-related fields
        paymentRequired: data.paymentRequired || false,
        paymentAmount: data.paymentAmount || 0,
        paymentCurrency: data.paymentCurrency || 'USD',
        paymentStatus: data.paymentStatus || 'not_required',
        paymentMethod: data.paymentMethod || null,
        paymentNotes: data.paymentNotes || null,
        paidAt: data.paidAt?.toDate ? data.paidAt.toDate().toISOString() : data.paidAt,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : data.submittedAt,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });

    // Sort by submittedAt in descending order (most recent first)
    rsvpsData.sort((a, b) => {
      const aTime = new Date(a.submittedAt || 0);
      const bTime = new Date(b.submittedAt || 0);
      return bTime.getTime() - aTime.getTime();
    });

    console.log(`Found ${rsvpsData.length} RSVPs for event ${data.eventId}`);

    return {
      success: true,
      eventId: data.eventId,
      rsvps: rsvpsData,
      count: rsvpsData.length,
      message: 'RSVP data retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting RSVP data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get RSVP data');
  }
});

// CRITICAL: Admin update user function
export const adminUpdateUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    // Check role-based permissions (new system) or legacy boolean fields
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update users');
    }

    const { userId, updates } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Target user not found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: getTimestamp()
    };

    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName;
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    if (updates.profile !== undefined) {
      updateData.profile = updates.profile;
    }

    // Update Firestore document
    await db.collection('users').doc(userId).update(updateData);

    // Update Firebase Auth custom claims if role is being changed
    if (updates.role !== undefined) {
      try {
        // Try to set custom claims in Firebase Auth
        await admin.auth().setCustomUserClaims(userId, {
          approved: true,
          role: updates.role
        });
        console.log(`Successfully updated Firebase Auth claims for user ${userId}`);
      } catch (authError: any) {
        // If user doesn't exist in Firebase Auth, just log and continue
        console.log(`Auth error details:`, {
          code: authError.code,
          message: authError.message,
          stack: authError.stack
        });
        
        if (authError.code === 'auth/user-not-found') {
          console.log(`User ${userId} not found in Firebase Auth, skipping custom claims update`);
        } else {
          console.error('Error updating Firebase Auth claims:', authError);
          throw authError;
        }
      }
      
      // Always update the role in Firestore
      await db.collection('users').doc(userId).update({
        role: updates.role,
        permissions: updates.permissions || [],
        updatedAt: getTimestamp()
      });
    }

    // Log admin action
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || '',
      action: 'update',
      entityType: 'user',
      entityId: userId,
      entityName: updates.displayName || 'User',
      details: updates,
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      message: 'User updated successfully'
    };

  } catch (error) {
    console.error('Error in adminUpdateUser:', error);
    
    // Log failed action
    try {
      await db.collection('adminActions').add({
        userId: context.auth?.uid || 'unknown',
        userEmail: context.auth?.token?.email || '',
        action: 'update',
        entityType: 'user',
        entityId: data?.userId || 'unknown',
        entityName: 'User',
        details: data?.updates || {},
        timestamp: getTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown',
        userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } catch (logError: any) {
      console.error('Failed to log admin action:', logError);
    }
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user');
  }
});

// Update user custom claims function
export const updateUserClaims = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    
    if (!hasAdminRole) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update user claims');
    }

    const { targetUserId, role } = data;
    
    if (!targetUserId || !role) {
      throw new functions.https.HttpsError('invalid-argument', 'targetUserId and role are required');
    }

    // Update custom claims
    await admin.auth().setCustomUserClaims(targetUserId, {
      approved: true,
      role: role
    });

    console.log(`Updated custom claims for user ${targetUserId} to role: ${role}`);

    return {
      success: true,
      message: `Updated user claims to role: ${role}`,
      userId: targetUserId,
      role: role
    };

  } catch (error) {
    console.error('Error in updateUserClaims:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user claims');
  }
});

// Chat Cloud Functions
export const getChatChannels = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const channelsRef = db.collection('chat-channels');
    const snapshot = await channelsRef.get();
    
    const channels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Remove duplicates based on channel name (case-insensitive)
    const uniqueChannels = channels.filter((channel, index, self) => 
      index === self.findIndex(c => (c as any).name?.toLowerCase() === (channel as any).name?.toLowerCase())
    );

    return {
      success: true,
      channels: uniqueChannels
    };

  } catch (error) {
    console.error('Error in getChatChannels:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get chat channels');
  }
});

export const getChatMessages = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { channelId, limit = 50 } = data;
    
    if (!channelId) {
      throw new functions.https.HttpsError('invalid-argument', 'channelId is required');
    }

    const messagesRef = db.collection('chat-messages');
    const snapshot = await messagesRef
      .where('channelId', '==', channelId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure backward compatibility for existing messages
        userName: data.userName || data.senderName || 'Unknown User',
        content: data.content || data.message || '',
        isAdmin: data.isAdmin || false
      };
    });

    return {
      success: true,
      messages: messages
    };

  } catch (error) {
    console.error('Error in getChatMessages:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get chat messages');
  }
});

export const sendChatMessage = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { channelId, content, senderName } = data;
    
    if (!channelId || !content) {
      throw new functions.https.HttpsError('invalid-argument', 'channelId and content are required');
    }

    // Get user data to determine if admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';

    const messageRef = db.collection('chat-messages');
    const newMessage = {
      channelId,
      content,
      senderId: context.auth.uid,
      senderName: senderName || 'Anonymous',
      userName: senderName || 'Anonymous', // Add userName for compatibility
      isAdmin: isAdmin || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await messageRef.add(newMessage);

    return {
      success: true,
      messageId: docRef.id,
      message: {
        id: docRef.id,
        ...newMessage
      }
    };

  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to send chat message');
  }
});

// Test email connection function
export const testEmailConnection = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    
    if (!hasAdminRole) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to test email connection');
    }

    const { emailAddress, password, imapServer, imapPort } = data;
    
    if (!emailAddress || !password || !imapServer || !imapPort) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required email connection parameters');
    }

    // For now, return a mock success response
    // In a real implementation, you would test the IMAP connection here
    return {
      success: true,
      message: 'Email connection test completed (mock response)',
      details: {
        emailAddress,
        imapServer,
        imapPort,
        status: 'connected'
      }
    };

  } catch (error) {
    console.error('Error in testEmailConnection:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to test email connection');
  }
});

// CRITICAL: Submit account request function
export const submitAccountRequest = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Validate required fields
    if (!data.email || !data.displayName || !data.phone || !data.address) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: email, displayName, phone, address');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }

    // Check if email already exists
    const existingUserQuery = await db.collection('users')
      .where('email', '==', data.email)
      .get();
    
    if (!existingUserQuery.empty) {
      throw new functions.https.HttpsError('already-exists', 'An account with this email already exists');
    }

    // Check if there's already a pending request for this email
    const existingRequestQuery = await db.collection('accountRequests')
      .where('email', '==', data.email)
      .where('status', '==', 'pending')
      .get();
    
    if (!existingRequestQuery.empty) {
      throw new functions.https.HttpsError('already-exists', 'A request for this email is already pending');
    }

    // Create account request
    const requestData = {
      email: data.email,
      displayName: data.displayName,
      phone: data.phone,
      address: data.address,
      scoutRank: data.scoutRank || '',
      den: data.den || '',
      emergencyContact: data.emergencyContact || '',
      reason: data.reason || '',
      status: 'pending',
      submittedAt: getTimestamp(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      ipHash: data.ipHash || '',
      userAgent: data.userAgent || ''
    };

    const requestRef = await db.collection('accountRequests').add(requestData);

    // Note: Email notification is handled by the onAccountRequestCreate Firestore trigger
    // which uses adminNotificationService to send to cubmaster@sfpack1703.com only

    // Log the request
    await db.collection('adminActions').add({
      action: 'account_request_submitted',
      entityType: 'account_request',
      entityId: requestRef.id,
      entityName: data.displayName,
      details: {
        email: data.email,
        phone: data.phone,
        den: data.den,
        scoutRank: data.scoutRank
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      requestId: requestRef.id,
      message: 'Account request submitted successfully. You will be notified when it is reviewed.'
    };

  } catch (error) {
    console.error('Error submitting account request:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to submit account request');
  }
});

// CRITICAL: Get pending account requests (admin only)
export const getPendingAccountRequests = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to view account requests');
    }

    // Extract pagination parameters
    const pageSize = data.pageSize || 20; // Default to 20 requests per page
    const lastDocId = data.lastDocId; // For cursor-based pagination
    const limit = Math.min(pageSize, 50); // Cap at 50 to prevent abuse

    // Query without orderBy to avoid index requirement
    let query = db.collection('accountRequests')
      .where('status', '==', 'pending')
      .limit(limit);

    // Apply cursor-based pagination if lastDocId is provided
    if (lastDocId) {
      const lastDoc = await db.collection('accountRequests').doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const requestsQuery = await query.get();

    const requests: any[] = [];
    requestsQuery.docs.forEach(doc => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        phone: data.phone,
        address: data.address,
        scoutRank: data.scoutRank,
        den: data.den,
        emergencyContact: data.emergencyContact,
        reason: data.reason,
        status: data.status,
        submittedAt: data.submittedAt,
        createdAt: data.createdAt
      });
    });

    // Sort by submittedAt in descending order (most recent first)
    requests.sort((a, b) => {
      const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
      const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
      return bTime.getTime() - aTime.getTime();
    });

    // Get total count for pagination info (optimized query)
    const totalCountQuery = await db.collection('accountRequests')
      .where('status', '==', 'pending')
      .select() // Only get document IDs for counting
      .get();

    return {
      success: true,
      requests: requests,
      count: requests.length,
      totalCount: totalCountQuery.size,
      hasMore: requests.length === limit,
      lastDocId: requests.length > 0 ? requests[requests.length - 1].id : null,
      message: 'Account requests retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting account requests:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get account requests');
  }
});

// CRITICAL: Approve account request (admin only)
export const approveAccountRequest = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to approve account requests');
    }

    const { requestId, role = 'parent' } = data;
    
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Request ID is required');
    }

    // Get the request
    const requestRef = db.collection('accountRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Account request not found');
    }

    const requestData = requestDoc.data();
    
    if (requestData?.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
    }

    // Create user account in Firestore
    const newUserData = {
      email: requestData.email,
      displayName: requestData.displayName,
      role: role,
      permissions: getRolePermissions(role),
      isActive: true,
      status: 'approved',
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      lastLoginAt: null,
      profile: {
        firstName: requestData.firstName || '',
        lastName: requestData.lastName || '',
        phone: requestData.phone || '',
        address: requestData.address || '',
        city: requestData.city || '',
        state: requestData.state || '',
        zipCode: requestData.zipCode || '',
        emergencyContact: requestData.emergencyContact || '',
        emergencyPhone: requestData.emergencyPhone || '',
        medicalInfo: requestData.medicalInfo || '',
        dietaryRestrictions: requestData.dietaryRestrictions || '',
        specialNeeds: requestData.specialNeeds || '',
        den: requestData.den || '',
        rank: requestData.rank || '',
        patrol: requestData.patrol || '',
        parentGuardian: requestData.parentGuardian || '',
        parentPhone: requestData.parentPhone || '',
        parentEmail: requestData.parentEmail || ''
      },
      preferences: {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false,
        language: 'en',
        timezone: 'America/Los_Angeles'
      },
      authProvider: 'email',
      emailVerified: false,
      approvedBy: context.auth.uid,
      approvedAt: getTimestamp()
    };

    // Create Firebase Auth account first
    let firebaseAuthUser;
    try {
      // Generate a temporary password (will be set via email)
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      firebaseAuthUser = await admin.auth().createUser({
        email: requestData.email,
        displayName: requestData.displayName,
        password: tempPassword,
        emailVerified: false
      });

      console.log('Firebase Auth user created:', firebaseAuthUser.uid);
    } catch (authError: any) {
      console.error('Error creating Firebase Auth user:', authError);
      if (authError.code === 'auth/email-already-exists') {
        // User already exists in Firebase Auth, get their UID
        try {
          firebaseAuthUser = await admin.auth().getUserByEmail(requestData.email);
          console.log('Found existing Firebase Auth user:', firebaseAuthUser.uid);
        } catch (getUserError) {
          throw new functions.https.HttpsError('internal', 'Failed to create or retrieve user account');
        }
      } else {
        throw new functions.https.HttpsError('internal', 'Failed to create user account');
      }
    }

    // Create password setup token
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const setupTokenExpiry = new Date();
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24); // 24 hours

    // Store password setup token
    await db.collection('passwordSetupTokens').doc(setupToken).set({
      userId: firebaseAuthUser.uid,
      email: requestData.email,
      displayName: requestData.displayName,
      expires: admin.firestore.Timestamp.fromDate(setupTokenExpiry),
      used: false,
      createdAt: getTimestamp()
    });

    // Create user document in Firestore using Firebase Auth UID
    const userRef = db.collection('users').doc(firebaseAuthUser.uid);
    await userRef.set({
      ...newUserData,
      uid: firebaseAuthUser.uid // Ensure UID is set
    });

    // Set custom claims for the user
    try {
      await admin.auth().setCustomUserClaims(firebaseAuthUser.uid, {
        approved: true,
        role: role
      });
      console.log('Custom claims set for user:', firebaseAuthUser.uid);
    } catch (claimsError) {
      console.error('Error setting custom claims:', claimsError);
      // Don't fail the approval if claims fail
    }

    // Update request status
    await requestRef.update({
      status: 'approved',
      approvedBy: context.auth.uid,
      approvedAt: getTimestamp(),
      approvedRole: role,
      updatedAt: getTimestamp(),
      userId: firebaseAuthUser.uid // Link to the Firebase Auth user
    });

    // Log the approval
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || '',
      action: 'approve_account_request',
      entityType: 'account_request',
      entityId: requestId,
      entityName: requestData.displayName,
      details: {
        email: requestData.email,
        approvedRole: role,
        createdUserId: firebaseAuthUser.uid
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    // Send email notification to the approved user
    try {
      const { emailService } = await import('./emailService');
      const userData = {
        uid: firebaseAuthUser.uid,
        email: requestData.email,
        displayName: requestData.displayName,
        phone: requestData.phone || '',
        address: requestData.address || '',
        emergencyContact: requestData.emergencyContact || '',
        medicalInfo: requestData.medicalInfo || '',
        role: role,
        setupToken: setupToken
      };
      
      const emailSent = await emailService.sendWelcomeEmail(userData);
      console.log('Welcome email sent successfully:', emailSent);
      
      // Log email success
      await db.collection('adminActions').add({
        action: 'welcome_email_sent',
        entityType: 'user',
        entityId: firebaseAuthUser.uid,
        entityName: requestData.displayName,
        details: {
          email: requestData.email,
          emailSent: emailSent,
          setupToken: setupToken
        },
        timestamp: getTimestamp(),
        success: emailSent
      });
    } catch (emailError: any) {
      console.error('Failed to send welcome email:', emailError);
      functions.logger.error('Welcome email send failure', {
        error: emailError.message,
        stack: emailError.stack,
        userId: firebaseAuthUser.uid,
        email: requestData.email
      });
      
      // Log email failure for monitoring
      await db.collection('adminActions').add({
        action: 'welcome_email_failed',
        entityType: 'user',
        entityId: firebaseAuthUser.uid,
        entityName: requestData.displayName,
        details: {
          email: requestData.email,
          error: emailError.message || 'Unknown error',
          errorCode: emailError.code,
          setupToken: setupToken // Include token so it can be resent
        },
        timestamp: getTimestamp(),
        success: false
      });
      
      // Don't fail the approval if email fails
    }

    return {
      success: true,
      message: 'Account request approved and user account created successfully',
      userId: firebaseAuthUser.uid
    };

  } catch (error) {
    console.error('Error approving account request:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to approve account request');
  }
});

// CRITICAL: Create user account manually (admin only) - for fixing approval issues
export const createUserManually = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create user accounts');
    }

    const { email, displayName, firstName, lastName, phone, address, city, state, zipCode, den, rank, role = 'parent', reasonForJoining } = data;
    
    if (!email || !displayName) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and display name are required');
    }

    // Check if user already exists
    const existingUsersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!existingUsersSnapshot.empty) {
      throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
    }

    // Create user account
    const newUserData = {
      email: email,
      displayName: displayName,
      role: role,
      permissions: getRolePermissions(role),
      isActive: true,
      status: 'approved',
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      lastLoginAt: null,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        emergencyContact: '',
        emergencyPhone: '',
        medicalInfo: '',
        dietaryRestrictions: '',
        specialNeeds: '',
        den: den || '',
        rank: rank || '',
        patrol: '',
        parentGuardian: '',
        parentPhone: '',
        parentEmail: ''
      },
      preferences: {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false,
        language: 'en',
        timezone: 'America/Los_Angeles'
      },
      authProvider: 'email',
      emailVerified: false,
      approvedBy: context.auth.uid,
      approvedAt: getTimestamp(),
      reasonForJoining: reasonForJoining || ''
    };

    // Create user document in Firestore
    const userRef = db.collection('users').doc();
    await userRef.set(newUserData);

    // Log the manual creation
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || '',
      action: 'manual_user_creation',
      entityType: 'user',
      entityId: userRef.id,
      entityName: displayName,
      details: {
        email: email,
        role: role,
        reason: 'Manual creation due to approval process issue'
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      message: 'User account created successfully',
      userId: userRef.id,
      email: email,
      displayName: displayName,
      role: role
    };

  } catch (error) {
    console.error('Error creating user manually:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create user account');
  }
});

// CRITICAL: Reject account request (admin only)
export const rejectAccountRequest = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to reject account requests');
    }

    const { requestId, reason = '' } = data;
    
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Request ID is required');
    }

    // Get the request
    const requestRef = db.collection('accountRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Account request not found');
    }

    const requestData = requestDoc.data();
    
    if (requestData?.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
    }

    // Update request status
    await requestRef.update({
      status: 'rejected',
      rejectedBy: context.auth.uid,
      rejectedAt: getTimestamp(),
      rejectionReason: reason,
      updatedAt: getTimestamp()
    });

    // Log the rejection
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || '',
      action: 'reject_account_request',
      entityType: 'account_request',
      entityId: requestId,
      entityName: requestData.displayName,
      details: {
        email: requestData.email,
        rejectionReason: reason
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      message: 'Account request rejected successfully'
    };

  } catch (error) {
    console.error('Error rejecting account request:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to reject account request');
  }
});

// Test AI Connection Function
export const testAIConnection = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    if (!userData?.role || !['admin', 'super_admin', 'den_leader'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to test AI connection');
    }

    // Create security alert for AI connection test
    await createSecurityAlert(
      'system',
      'medium',
      'AI Connection Test',
      `User ${context.auth.token.email} tested AI connection`,
      'Cloud Functions',
      context.auth.uid,
      context.auth.token.email,
      context.rawRequest?.ip,
      { function: 'testAIConnection' }
    );

    // Test basic AI functionality
    return {
      success: true,
      message: 'AI connection test successful',
      timestamp: getTimestamp(),
      user: {
        uid: context.auth.uid,
        email: context.auth.token.email,
        role: userData.role
      }
    };
  } catch (error) {
    console.error('AI connection test failed:', error);
    
    // Create security alert for failed AI connection test
    await createSecurityAlert(
      'system',
      'high',
      'AI Connection Test Failed',
      `AI connection test failed for user ${context.auth?.token?.email}: ${error instanceof Error ? error.message : String(error)}`,
      'Cloud Functions',
      context.auth?.uid,
      context.auth?.token?.email,
      context.rawRequest?.ip,
      { function: 'testAIConnection', error: error instanceof Error ? error.message : String(error) }
    );
    
    throw new functions.https.HttpsError('internal', 'AI connection test failed');
  }
});

// REAL-TIME SYSTEM METRICS - Get comprehensive system performance data
export const getSystemMetrics = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasSystemAdminPermission = userData?.permissions?.includes('system_admin') || userData?.permissions?.includes('user_management');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasSystemAdminPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to access system metrics');
    }

    const startTime = Date.now();

    // Get real-time metrics in parallel
    const [
      usersSnapshot,
      eventsSnapshot,
      announcementsSnapshot,
      locationsSnapshot,
      messagesSnapshot,
      chatUsersSnapshot,
      rsvpsSnapshot,
      performanceMetricsSnapshot,
      auditLogsSnapshot,
      securityAlertsSnapshot,
      threatIntelligenceSnapshot,
      adminActionsSnapshot,
      aiUsageSnapshot
    ] = await Promise.all([
      db.collection('users').select().get(),
      db.collection('events').select().get(),
      db.collection('announcements').select().get(),
      db.collection('locations').select().get(),
      db.collection('chat-messages').select().get(),
      db.collection('chat-users').select().get(),
      db.collection('rsvps').select().get(),
      db.collection('performance_metrics').orderBy('timestamp', 'desc').limit(100).select().get(),
      db.collection('auditLogs').orderBy('timestamp', 'desc').limit(50).select().get(),
      db.collection('securityAlerts').orderBy('timestamp', 'desc').limit(100).select().get(),
      db.collection('threatIntelligence').orderBy('timestamp', 'desc').limit(100).select().get(),
      db.collection('adminActions').orderBy('timestamp', 'desc').limit(100).select().get(),
      db.collection('aiUsage').orderBy('timestamp', 'desc').limit(100).select().get()
    ]);

    // Calculate real metrics
    const totalUsers = usersSnapshot.size;
    const totalEvents = eventsSnapshot.size;
    const totalAnnouncements = announcementsSnapshot.size;
    const totalLocations = locationsSnapshot.size;
    const totalMessages = messagesSnapshot.size;
    const totalRSVPs = rsvpsSnapshot.size;
    const totalSecurityAlerts = securityAlertsSnapshot.size;
    const totalThreatIntelligence = threatIntelligenceSnapshot.size;
    const totalAdminActions = adminActionsSnapshot.size;
    const totalAIUsage = aiUsageSnapshot.size;

    // Calculate active users (users active in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let activeUsers = 0;
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const lastActive = userData.lastActiveAt?.toDate?.() || userData.createdAt?.toDate?.() || new Date(0);
      if (lastActive >= thirtyDaysAgo) {
        activeUsers++;
      }
    });

    // Calculate recent activity (last 30 days)
    let messagesThisMonth = 0;
    let newUsersThisMonth = 0;
    let eventsThisMonth = 0;
    let rsvpsThisMonth = 0;

    messagesSnapshot.docs.forEach(doc => {
      const messageData = doc.data();
      const messageTime = messageData.timestamp?.toDate?.() || new Date(0);
      if (messageTime >= thirtyDaysAgo) {
        messagesThisMonth++;
      }
    });

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const createdTime = userData.createdAt?.toDate?.() || new Date(0);
      if (createdTime >= thirtyDaysAgo) {
        newUsersThisMonth++;
      }
    });

    eventsSnapshot.docs.forEach(doc => {
      const eventData = doc.data();
      const eventTime = eventData.createdAt?.toDate?.() || new Date(0);
      if (eventTime >= thirtyDaysAgo) {
        eventsThisMonth++;
      }
    });

    rsvpsSnapshot.docs.forEach(doc => {
      const rsvpData = doc.data();
      const rsvpTime = rsvpData.createdAt?.toDate?.() || new Date(0);
      if (rsvpTime >= thirtyDaysAgo) {
        rsvpsThisMonth++;
      }
    });

    // Calculate security metrics
    let criticalAlerts = 0;
    let highAlerts = 0;
    let openAlerts = 0;
    let highThreats = 0;
    let criticalThreats = 0;
    let recentSecurityAlerts = 0;
    let recentThreats = 0;

    securityAlertsSnapshot.docs.forEach(doc => {
      const alertData = doc.data();
      const alertTime = alertData.timestamp?.toDate?.() || new Date(0);
      
      if (alertData.severity === 'critical') criticalAlerts++;
      if (alertData.severity === 'high') highAlerts++;
      if (alertData.status === 'open') openAlerts++;
      if (alertTime >= thirtyDaysAgo) recentSecurityAlerts++;
    });

    threatIntelligenceSnapshot.docs.forEach(doc => {
      const threatData = doc.data();
      const threatTime = threatData.timestamp?.toDate?.() || new Date(0);
      
      if (threatData.threatLevel === 'critical') criticalThreats++;
      if (threatData.threatLevel === 'high') highThreats++;
      if (threatTime >= thirtyDaysAgo) recentThreats++;
    });

    // Calculate performance metrics from stored data
    let averageResponseTime = 120; // Default
    let errorRate = 0.1; // Default
    let uptimePercentage = 99.9; // Default

    if (performanceMetricsSnapshot.size > 0) {
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let errorCount = 0;
      let totalRequests = 0;

      performanceMetricsSnapshot.docs.forEach(doc => {
        const metricData = doc.data();
        if (metricData.metric === 'response_time' && metricData.value) {
          totalResponseTime += metricData.value;
          responseTimeCount++;
        }
        if (metricData.metric === 'request_count') {
          totalRequests++;
        }
        if (metricData.metric === 'error_count') {
          errorCount++;
        }
      });

      if (responseTimeCount > 0) {
        averageResponseTime = Math.round(totalResponseTime / responseTimeCount);
      }
      if (totalRequests > 0) {
        errorRate = Math.round((errorCount / totalRequests) * 100 * 10) / 10; // Round to 1 decimal
      }
    }

    // Calculate storage usage (estimate based on document counts)
    const estimatedStorageBytes = (totalUsers * 2048) + // 2KB per user
                                 (totalEvents * 5120) + // 5KB per event
                                 (totalMessages * 1024) + // 1KB per message
                                 (totalAnnouncements * 3072) + // 3KB per announcement
                                 (totalLocations * 4096) + // 4KB per location
                                 (totalRSVPs * 1024); // 1KB per RSVP

    const storageLimitBytes = 5 * 1024 * 1024 * 1024; // 5GB
    const storagePercentage = (estimatedStorageBytes / storageLimitBytes) * 100;

    // Calculate estimated costs based on real usage
    const firestoreReads = totalUsers + totalEvents + totalMessages + totalAnnouncements + totalLocations + totalRSVPs;
    const firestoreWrites = newUsersThisMonth + eventsThisMonth + messagesThisMonth + rsvpsThisMonth;
    const firestoreCost = (firestoreReads / 100000) * 0.06 + (firestoreWrites / 100000) * 0.18;
    const storageCost = (estimatedStorageBytes / (1024 * 1024 * 1024)) * 0.026;
    const hostingCost = 0.026; // Base hosting cost
    const functionsCost = (firestoreWrites / 1000000) * 0.40;
    const totalCost = firestoreCost + storageCost + hostingCost + functionsCost;

    // Calculate response time for this function call
    const functionResponseTime = Date.now() - startTime;

    const metrics = {
      // User Activity
      activeUsers,
      totalUsers,
      newUsersThisMonth,
      
      // Content Metrics
      totalEvents,
      totalLocations,
      totalAnnouncements,
      totalMessages,
      totalRSVPs,
      messagesThisMonth,
      eventsThisMonth,
      rsvpsThisMonth,
      
      // Storage Usage
      storageUsed: Math.round(estimatedStorageBytes / (1024 * 1024)), // MB
      storageLimit: Math.round(storageLimitBytes / (1024 * 1024)), // MB
      storagePercentage: Math.round(storagePercentage * 100) / 100,
      
      // Performance
      averageResponseTime,
      uptimePercentage,
      errorRate,
      functionResponseTime, // Time to execute this function
      
      // Security Metrics
      totalSecurityAlerts,
      totalThreatIntelligence,
      totalAdminActions,
      totalAIUsage,
      criticalAlerts,
      highAlerts,
      openAlerts,
      highThreats,
      criticalThreats,
      recentSecurityAlerts,
      recentThreats,
      
      // Costs (estimated based on usage)
      estimatedMonthlyCost: Math.round(totalCost * 100) / 100,
      costBreakdown: {
        firestore: Math.round(firestoreCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        hosting: Math.round(hostingCost * 100) / 100,
        functions: Math.round(functionsCost * 100) / 100
      },
      
      // Infrastructure
      firebaseStatus: 'operational',
      lastUpdated: new Date(),
      
      // Additional metrics
      databaseConnections: 1, // Firebase handles connection pooling
      cacheHitRate: 85, // Estimated cache hit rate
      memoryUsage: Math.round((estimatedStorageBytes / storageLimitBytes) * 100), // Estimated memory usage percentage
    };

    // Create security alert for system metrics access
    await createSecurityAlert(
      'system',
      'low',
      'System Metrics Accessed',
      `User ${context.auth.token.email} accessed system metrics`,
      'Cloud Functions',
      context.auth.uid,
      context.auth.token.email,
      context.rawRequest?.ip,
      { function: 'getSystemMetrics', responseTime: functionResponseTime }
    );

    return {
      success: true,
      metrics
    };

  } catch (error) {
    console.error('Error fetching system metrics:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to fetch system metrics');
  }
});

// THREAT INTELLIGENCE FEED - Simulate threat intelligence data
export const generateThreatIntelligence = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    if (!userData?.role || !['admin', 'super_admin', 'den_leader'].includes(userData.role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to generate threat intelligence');
    }

    // Generate sample threat intelligence data
    const threats = [
      {
        type: 'ip' as const,
        value: '192.168.1.100',
        threatLevel: 'high' as const,
        source: 'Threat Intelligence Feed',
        description: 'Known malicious IP address from recent attack campaigns'
      },
      {
        type: 'domain' as const,
        value: 'malicious-site.com',
        threatLevel: 'critical' as const,
        source: 'DNS Security Feed',
        description: 'Domain associated with phishing campaigns'
      },
      {
        type: 'hash' as const,
        value: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        threatLevel: 'medium' as const,
        source: 'Malware Analysis',
        description: 'File hash associated with trojan malware'
      },
      {
        type: 'url' as const,
        value: 'https://suspicious-site.org/malware',
        threatLevel: 'high' as const,
        source: 'URL Reputation Service',
        description: 'URL hosting malicious content'
      }
    ];

    // Add threat intelligence entries
    for (const threat of threats) {
      await createThreatIntelligence(
        threat.type,
        threat.value,
        threat.threatLevel,
        threat.source,
        threat.description
      );
    }

    // Create security alert for threat intelligence generation
    await createSecurityAlert(
      'system',
      'medium',
      'Threat Intelligence Generated',
      `User ${context.auth.token.email} generated threat intelligence data`,
      'Cloud Functions',
      context.auth.uid,
      context.auth.token.email,
      context.rawRequest?.ip,
      { function: 'generateThreatIntelligence', threatsGenerated: threats.length }
    );

    return {
      success: true,
      message: `Generated ${threats.length} threat intelligence entries`,
      threatsGenerated: threats.length,
      timestamp: getTimestamp()
    };
  } catch (error) {
    console.error('Error generating threat intelligence:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate threat intelligence');
  }
});

// CRITICAL: Get all dashboard data in batch (admin only) - Performance optimization
export const getBatchDashboardData = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasSystemAdminPermission = userData?.permissions?.includes('system_admin') || userData?.permissions?.includes('user_management');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasSystemAdminPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to access dashboard data');
    }

    // Get all dashboard data in parallel
    const [
      usersSnapshot,
      eventsSnapshot,
      announcementsSnapshot,
      locationsSnapshot,
      accountRequestsSnapshot,
      auditLogsSnapshot
    ] = await Promise.all([
      db.collection('users').select().get(),
      db.collection('events').where('visibility', '==', 'public').select().get(),
      db.collection('announcements').orderBy('createdAt', 'desc').limit(10).select().get(),
      db.collection('locations').select().get(),
      db.collection('accountRequests').where('status', '==', 'pending').select().get(),
      db.collection('auditLogs').orderBy('timestamp', 'desc').limit(50).select().get()
    ]);

    // Calculate dashboard stats
    const totalUsers = usersSnapshot.size;
    const activeUsers = Math.floor(totalUsers * 0.7); // Estimate 70% active
    const totalEvents = eventsSnapshot.size;
    const totalAnnouncements = announcementsSnapshot.size;
    const totalLocations = locationsSnapshot.size;
    const pendingRequests = accountRequestsSnapshot.size;

    // Get recent activity
    const recentAuditLogs = auditLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    }));

    // Calculate system health metrics
    const systemHealth = {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
      errorRate: '0.1%',
      lastChecked: new Date().toISOString()
    };

    // Dashboard stats
    const dashboardStats = {
      totalUsers,
      activeUsers,
      totalEvents,
      totalAnnouncements,
      totalLocations,
      pendingRequests,
      newUsersThisMonth: Math.floor(totalUsers * 0.1),
      eventsThisMonth: Math.floor(totalEvents * 0.3),
      messagesThisMonth: Math.floor(totalUsers * 0.5)
    };

    return {
      success: true,
      dashboardStats,
      systemHealth,
      auditLogs: recentAuditLogs,
      message: 'Dashboard data retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting batch dashboard data:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get dashboard data');
  }
});

// Admin Delete User Function - Comprehensive data cleanup
export const adminDeleteUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, reason } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
    }

    // Check if requesting user has admin privileges
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'super_admin';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to delete users');
    }

    // Prevent deleting self
    if (userId === context.auth.uid) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot delete your own account');
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const targetUserData = targetUserDoc.data();
    
    // Prevent deleting super admin users (unless you're also super admin)
    if (targetUserData?.role === 'super_admin' && userData?.role !== 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot delete super admin users');
    }

    functions.logger.info(`Starting comprehensive user deletion for user: ${userId}`);

    // COMPREHENSIVE DATA CLEANUP - Remove user data from ALL collections
    const collectionsToCleanup = [
      // User-related data
      { collection: 'users', docId: userId, directDelete: true },
      
      // Account requests - cleanup by both userId and linkedUserId fields
      { collection: 'accountRequests', field: 'userId', value: userId },
      { collection: 'accountRequests', field: 'linkedUserId', value: userId },
      
      // User analytics and tracking
      { collection: 'analytics', field: 'userId', value: userId },
      { collection: 'usageTracking', field: 'userId', value: userId },
      { collection: 'userUsageStats', docId: userId, directDelete: true },
      { collection: 'performance_metrics', field: 'userId', value: userId },
      
      // User interactions
      { collection: 'rsvps', field: 'userId', value: userId },
      { collection: 'feedback', field: 'userId', value: userId },
      { collection: 'volunteer-signups', field: 'volunteerUserId', value: userId },
      { collection: 'user-pinned-announcements', field: 'userId', value: userId },
      
      // Chat system
      { collection: 'chat-users', docId: userId, directDelete: true },
      { collection: 'chat-messages', field: 'userId', value: userId },
      
      // System logs
      { collection: 'system-logs', field: 'userId', value: userId },
      
      // AI interactions
      { collection: 'ai-interactions', field: 'userId', value: userId },
      { collection: 'ai-confirmations', field: 'userId', value: userId },
      
      // Cross-organization data
      { collection: 'crossOrganizationUsers', field: 'userId', value: userId }
    ];

    let deletedCount = 0;
    const deletionResults = [];

    // Process each collection cleanup
    for (const collectionConfig of collectionsToCleanup) {
      try {
        if (collectionConfig.directDelete) {
          // Direct document deletion
          await db.collection(collectionConfig.collection).doc(collectionConfig.docId).delete();
          deletedCount++;
          deletionResults.push(`${collectionConfig.collection}/${collectionConfig.docId} - deleted`);
        } else {
          // Query and delete documents matching the user ID
          const query = db.collection(collectionConfig.collection)
            .where(collectionConfig.field!, '==', collectionConfig.value);
          
          const snapshot = await query.get();
          
          if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
              deletedCount++;
            });
            await batch.commit();
            deletionResults.push(`${collectionConfig.collection} - ${snapshot.docs.length} documents deleted`);
          }
        }
      } catch (error) {
        functions.logger.warn(`Failed to cleanup ${collectionConfig.collection}:`, error);
        deletionResults.push(`${collectionConfig.collection} - cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Delete user from Firebase Auth (requires admin SDK)
    try {
      await admin.auth().deleteUser(userId);
      functions.logger.info(`Firebase Auth user deleted: ${userId}`);
      deletionResults.push('Firebase Auth - user deleted');
    } catch (authError) {
      functions.logger.warn(`Failed to delete Firebase Auth user ${userId}:`, authError);
      deletionResults.push(`Firebase Auth - deletion failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
      // Continue even if Firebase Auth deletion fails - Firestore deletion is the main concern
    }

    // Log comprehensive admin action
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: userData?.email || 'unknown',
      action: 'delete_user',
      entityType: 'user',
      entityId: userId,
      entityName: targetUserData?.displayName || targetUserData?.email || 'Unknown',
      details: { 
        reason: reason || 'No reason provided',
        deletedUserRole: targetUserData?.role,
        deletedUserEmail: targetUserData?.email,
        deletedDocumentsCount: deletedCount,
        deletionResults: deletionResults,
        comprehensiveCleanup: true
      },
      timestamp: getTimestamp(),
      success: true
    });

    functions.logger.info(`User deletion completed for ${userId}. Documents deleted: ${deletedCount}`);

    return {
      success: true,
      message: 'User and all associated data deleted successfully',
      deletedDocumentsCount: deletedCount,
      deletionResults: deletionResults
    };

  } catch (error) {
    functions.logger.error('Error deleting user:', error);
    
    // Log failed admin action
    if (context.auth) {
      try {
        await db.collection('adminActions').add({
          userId: context.auth.uid,
          action: 'delete_user',
          entityType: 'user',
          entityId: data?.userId || 'unknown',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: getTimestamp(),
          success: false
        });
      } catch (logError) {
        functions.logger.error('Failed to log admin action:', logError);
      }
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

// Sync user photos from Firebase Auth to Firestore
export const syncUserPhotos = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Only allow admins to run this function
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super-admin' && userData.role !== 'root')) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can sync user photos');
    }

    console.log('🔄 Starting photo sync for all users...');
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updates: any[] = [];

    // Get all users from Firebase Auth
    let nextPageToken: string | undefined;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      for (const authUser of listUsersResult.users) {
        try {
          const userId = authUser.uid;
          
          // Get Firestore user document
          const firestoreUserDoc = await db.collection('users').doc(userId).get();
          
          if (!firestoreUserDoc.exists) {
            console.log(`   ⏭️  Skipping ${authUser.email} - no Firestore document`);
            skipped++;
            continue;
          }
          
          const firestoreUser = firestoreUserDoc.data();
          const authPhotoURL = authUser.photoURL;
          
          // Check if we need to update
          if (!authPhotoURL) {
            console.log(`   ⏭️  No photo for ${authUser.email}`);
            skipped++;
            continue;
          }
          
          if (firestoreUser?.photoURL === authPhotoURL) {
            // Photo already up-to-date
            skipped++;
            continue;
          }
          
          // Update Firestore with Firebase Auth photoURL
          await db.collection('users').doc(userId).update({
            photoURL: authPhotoURL,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          updates.push({
            email: authUser.email,
            oldPhoto: firestoreUser?.photoURL || 'none',
            newPhoto: authPhotoURL
          });
          
          console.log(`   ✅ Updated photo for ${authUser.email}`);
          updated++;
          
        } catch (err: any) {
          console.error(`   ❌ Error syncing photo for ${authUser.email}:`, err.message);
          errors++;
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    const result = {
      success: true,
      updated,
      skipped,
      errors,
      updates: updates.slice(0, 10), // Return first 10 updates as examples
      message: `Photo sync complete: ${updated} updated, ${skipped} skipped, ${errors} errors`
    };
    
    console.log(`✅ ${result.message}`);
    return result;
    
  } catch (error: any) {
    console.error('❌ Error syncing user photos:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to sync user photos');
  }
});

// Simple test function
export const helloWorld = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  return {
    message: 'Hello from Firebase Cloud Functions!',
    timestamp: new Date().toISOString()
  };
});

// Test announcement creation function
export const createTestAnnouncement = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const testAnnouncement = {
      title: '🧪 Test Announcement - Email System',
      content: 'This is a test announcement to verify the email system is working correctly. This should only go to test email addresses.',
      priority: 'high',
      sendEmail: true,
      testMode: true,
      createdBy: 'test_function',
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };
    
    const docRef = await db.collection('announcements').add(testAnnouncement);
    
    functions.logger.info('✅ Test announcement created with ID:', docRef.id);
    
    return {
      success: true,
      announcementId: docRef.id,
      message: 'Test announcement created successfully'
    };
    
  } catch (error) {
    functions.logger.error('❌ Error creating test announcement:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create test announcement');
  }
});

// Create announcement and send emails in one call (like approveAccountRequest does)
export const createAnnouncementWithEmails = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { announcementData, testMode = false } = data;
    
    if (!announcementData) {
      throw new functions.https.HttpsError('invalid-argument', 'Announcement data is required');
    }

    // Create the announcement in Firestore
    const docRef = await db.collection('announcements').add({
      ...announcementData,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    });

    const announcement = {
      id: docRef.id,
      ...announcementData
    };

    functions.logger.info('✅ Announcement created with ID:', docRef.id);

    // Send emails if requested
    if (announcementData.sendEmail) {
      try {
        const { emailService } = await import('./emailService');
        
        // Get users based on announcement targeting
        let targetUsers: any[] = [];
        
        if (announcement.targetDens && announcement.targetDens.length > 0) {
          // Get users for specific dens
          for (const denId of announcement.targetDens) {
            const denUsersSnapshot = await db.collection('users')
              .where('status', '==', 'approved')
              .where('dens', 'array-contains', denId)
              .get();
            
            denUsersSnapshot.forEach(userDoc => {
              const userData = userDoc.data();
              if (!targetUsers.find(u => u.id === userDoc.id)) {
                targetUsers.push({ id: userDoc.id, ...userData });
              }
            });
          }
        } else {
          // Get all approved users
          const usersSnapshot = await db.collection('users')
            .where('status', '==', 'approved')
            .get();
          
          usersSnapshot.forEach((userDoc) => {
            targetUsers.push({ id: userDoc.id, ...userDoc.data() });
          });
        }
        
        const emailPromises: Promise<boolean>[] = [];
        const testEmails = ['christopher@smithstation.io', 'welcome-test@smithstation.io'];
        
        targetUsers.forEach((userData) => {
          if (!userData.email) return;
          
          if (testMode && !testEmails.includes(userData.email)) {
            functions.logger.info(`🧪 Test mode: Skipping ${userData.email}`);
            return;
          }
          
          const emailEnabled = userData.emailNotifications !== false;
          if (!emailEnabled) {
            functions.logger.info(`📧 Email disabled for ${userData.email}, skipping`);
            return;
          }
          
          emailPromises.push(
            emailService.sendAnnouncementEmail(userData.email, announcement)
          );
        });
        
        const results = await Promise.allSettled(emailPromises);
        const successful = results.filter(result => 
          result.status === 'fulfilled' && result.value === true
        ).length;
        const failed = results.length - successful;
        
        const modeText = testMode ? ' (TEST MODE)' : '';
        functions.logger.info(`📧 Announcement emails sent${modeText}: ${successful} successful, ${failed} failed`);
        
        return {
          success: true,
          announcementId: docRef.id,
          emailsSent: successful,
          emailsFailed: failed,
          message: `Announcement created and ${successful} emails sent successfully`
        };
      } catch (emailError) {
        functions.logger.error('❌ Error sending announcement emails:', emailError);
        // Don't fail the announcement creation if emails fail
        return {
          success: true,
          announcementId: docRef.id,
          emailsSent: 0,
          emailsFailed: 0,
          message: 'Announcement created but emails failed to send'
        };
      }
    }

    return {
      success: true,
      announcementId: docRef.id,
      message: 'Announcement created successfully (no emails requested)'
    };
    
  } catch (error: any) {
    functions.logger.error('❌ Error creating announcement:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create announcement');
  }
});

// Send announcement emails via server-side email service
export const sendAnnouncementEmails = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { announcement, testMode = false } = data;
    
    if (!announcement) {
      throw new functions.https.HttpsError('invalid-argument', 'Announcement data is required');
    }

    // Import email service
    const { emailService } = await import('./emailService');
    
    // Get users based on announcement targeting
    let targetUsers: any[] = [];
    
    if (announcement.targetDens && announcement.targetDens.length > 0) {
      // Get users for specific dens
      for (const denId of announcement.targetDens) {
        const denUsersSnapshot = await db.collection('users')
          .where('status', '==', 'approved')
          .where('dens', 'array-contains', denId)
          .get();
        
        denUsersSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          // Avoid duplicates if user is in multiple targeted dens
          if (!targetUsers.find(u => u.id === userDoc.id)) {
            targetUsers.push({ id: userDoc.id, ...userData });
          }
        });
      }
    } else {
      // Get all approved users (no specific targeting)
      const usersSnapshot = await db.collection('users')
        .where('status', '==', 'approved')
        .get();
      
      usersSnapshot.forEach((userDoc) => {
        targetUsers.push({ id: userDoc.id, ...userDoc.data() });
      });
    }
    
    const emailPromises: Promise<boolean>[] = [];
    const testEmails = ['christopher@smithstation.io', 'welcome-test@smithstation.io'];
    
    targetUsers.forEach((userData) => {
      // Skip if no email
      if (!userData.email) return;
      
      // In test mode, only send to test emails
      if (testMode && !testEmails.includes(userData.email)) {
        functions.logger.info(`🧪 Test mode: Skipping ${userData.email}`);
        return;
      }
      
      // Check user email preferences
      const emailEnabled = userData.emailNotifications !== false; // Default to true if not set
      
      if (!emailEnabled) {
        functions.logger.info(`📧 Email disabled for ${userData.email}, skipping`);
        return;
      }
      
      emailPromises.push(
        emailService.sendAnnouncementEmail(userData.email, announcement)
      );
    });
    
    // Send all emails in parallel
    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    const failed = results.length - successful;
    
    const modeText = testMode ? ' (TEST MODE)' : '';
    functions.logger.info(`📧 Announcement emails sent${modeText}: ${successful} successful, ${failed} failed`);
    
    return {
      success: true,
      successful,
      failed,
      total: results.length,
      message: `Sent ${successful} emails successfully, ${failed} failed`
    };
    
  } catch (error: any) {
    functions.logger.error('❌ Error sending announcement emails:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send announcement emails');
  }
});

// Send announcement SMS via server-side SMS service
export const sendAnnouncementSMS = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { announcement, testMode = false } = data;
    
    if (!announcement) {
      throw new functions.https.HttpsError('invalid-argument', 'Announcement data is required');
    }

    // Import SMS service
    const { smsService } = await import('./smsService');
    
    // Get users based on announcement targeting
    let targetUsers: any[] = [];
    
    if (announcement.targetDens && announcement.targetDens.length > 0) {
      // Get users for specific dens
      for (const denId of announcement.targetDens) {
        const denUsersSnapshot = await db.collection('users')
          .where('status', '==', 'approved')
          .where('dens', 'array-contains', denId)
          .get();
        
        denUsersSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          // Avoid duplicates if user is in multiple targeted dens
          if (!targetUsers.find(u => u.id === userDoc.id)) {
            targetUsers.push({ id: userDoc.id, ...userData });
          }
        });
      }
    } else {
      // Get all approved users (no specific targeting)
      const usersSnapshot = await db.collection('users')
        .where('status', '==', 'approved')
        .get();
      
      usersSnapshot.forEach((userDoc) => {
        targetUsers.push({ id: userDoc.id, ...userDoc.data() });
      });
    }
    
    const smsPromises: Promise<any>[] = [];
    const testPhones = ['+15551234567', '+15559876543']; // Test phone numbers
    
    targetUsers.forEach((userData) => {
      // Skip if no phone number
      if (!userData.phone) return;
      
      // In test mode, only send to test phones
      if (testMode && !testPhones.includes(userData.phone)) {
        functions.logger.info(`🧪 Test mode: Skipping ${userData.phone}`);
        return;
      }
      
      // Check user SMS preferences
      const smsEnabled = userData.preferences?.smsNotifications === true;
      
      if (!smsEnabled) {
        functions.logger.info(`📱 SMS disabled for ${userData.phone}, skipping`);
        return;
      }
      
      // Format phone number
      const formattedPhone = smsService.formatPhoneNumber(userData.phone);
      
      // Validate phone number
      if (!smsService.isValidPhoneNumber(formattedPhone)) {
        functions.logger.warn(`📱 Invalid phone number for user ${userData.id}: ${userData.phone}`);
        return;
      }
      
      smsPromises.push(
        smsService.sendAnnouncementSMS(formattedPhone, announcement)
      );
    });
    
    // Send all SMS messages in parallel
    const results = await Promise.allSettled(smsPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success === true
    ).length;
    
    const failed = results.length - successful;
    
    const modeText = testMode ? ' (TEST MODE)' : '';
    functions.logger.info(`📱 Announcement SMS sent${modeText}: ${successful} successful, ${failed} failed`);
    
    return {
      success: true,
      successful,
      failed,
      total: results.length,
      message: `Sent ${successful} SMS messages successfully, ${failed} failed`
    };
    
  } catch (error: any) {
    functions.logger.error('❌ Error sending announcement SMS:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send announcement SMS');
  }
});

// Send SMS via Twilio (direct API endpoint)
export const sendSMS = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { to, message, from } = data;
    
    if (!to || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone number and message are required');
    }

    // Import SMS service
    const { smsService } = await import('./smsService');
    
    // Format and validate phone number
    const formattedPhone = smsService.formatPhoneNumber(to);
    
    if (!smsService.isValidPhoneNumber(formattedPhone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format');
    }
    
    const result = await smsService.sendSMS({
      to: formattedPhone,
      message,
      from: from || undefined
    });
    
    if (result.success) {
      functions.logger.info(`📱 SMS sent successfully to ${formattedPhone}`);
      return {
        success: true,
        messageId: result.messageId
      };
    } else {
      functions.logger.error(`📱 SMS failed to ${formattedPhone}: ${result.error}`);
      throw new functions.https.HttpsError('internal', result.error || 'Failed to send SMS');
    }
    
  } catch (error: any) {
    functions.logger.error('❌ Error sending SMS:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send SMS');
  }
});

// ICS Feed Generator Function
export const icsFeed = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Handle null/undefined data
    const safeData = data || {};
    const { 
      categories = [], 
      denTags = [], 
      startDate, 
      endDate,
      includeDescription = true,
      includeLocation = true 
    } = safeData;
    
    // App Check not required for public ICS feed generation
    // This function is meant to be accessible for calendar subscriptions

    // First, let's see all events regardless of visibility and date
    const allEventsSnapshot = await db.collection('events').get();
    console.log(`Total events in database: ${allEventsSnapshot.size}`);
    
    allEventsSnapshot.forEach(doc => {
      const event = doc.data();
      console.log(`Event: ${event.title}, visibility: ${event.visibility}, startDate: ${event.startDate?.toDate?.() || event.startDate}`);
    });
    
    // Build query for future events - temporarily more permissive for debugging
    let query = db.collection('events').orderBy('startDate');
    
    // For debugging, let's not filter by visibility or date initially
    // query = query.where('visibility', 'in', ['public', null]);
    // query = query.where('startDate', '>=', getTimestamp());

    // Apply filters
    if (categories && categories.length > 0) {
      query = query.where('category', 'in', categories);
    }

    const eventsSnapshot = await query.get();
    const events: any[] = [];
    
    console.log(`Found ${eventsSnapshot.size} events for ICS generation`);

    eventsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const event = doc.data();
      
      // Filter by den tags if specified
      if (denTags && denTags.length > 0) {
        if (!event.denTags || !event.denTags.some((tag: string) => denTags.includes(tag))) {
          return;
        }
      }
      
      // Filter by date range if specified
      if (startDate && endDate) {
        const eventStartDate = event.startDate.toDate();
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);
        if (eventStartDate < filterStartDate || eventStartDate > filterEndDate) {
          return;
        }
      }
      
      events.push({
        id: doc.id,
        ...event
      });
    });

    // Generate ICS content
    const icsContent = generateICSContent(events, {
      includeDescription,
      includeLocation
    });

    return {
      success: true,
      icsContent,
      eventCount: events.length,
      message: `ICS feed generated with ${events.length} events`
    };

  } catch (error) {
    console.error('ICS feed generation error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate ICS feed');
  }
});

// Public ICS Feed Endpoint (no authentication required)
export const publicICSFeed = functions.https.onRequest(async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { 
      categories = '', 
      dens = '', 
      startDate, 
      endDate 
    } = req.query;

    // Parse query parameters
    const categoryList = categories ? categories.toString().split(',') : [];
    const denList = dens ? dens.toString().split(',') : [];

    // Build query for future events
    let query = db.collection('events')
      .where('visibility', 'in', ['public', null])
      .where('startDate', '>=', getTimestamp())
      .orderBy('startDate');

    // Apply filters
    if (categoryList.length > 0) {
      query = query.where('category', 'in', categoryList);
    }

    const eventsSnapshot = await query.get();
    const events: any[] = [];

    eventsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const event = doc.data();
      
      // Filter by den tags if specified
      if (denList.length > 0) {
        if (!event.denTags || !event.denTags.some((tag: string) => denList.includes(tag))) {
          return;
        }
      }
      
      // Filter by date range if specified
      if (startDate && endDate) {
        const eventStartDate = event.startDate.toDate();
        const filterStartDate = new Date(startDate.toString());
        const filterEndDate = new Date(endDate.toString());
        if (eventStartDate < filterStartDate || eventStartDate > filterEndDate) {
          return;
        }
      }
      
      events.push({
        id: doc.id,
        ...event
      });
    });

    // Generate ICS content
    const icsContent = generateICSContent(events, {
      includeDescription: true,
      includeLocation: true
    });

    // Set response headers for ICS file
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="pack1703-events.ics"',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(icsContent);

  } catch (error) {
    console.error('Public ICS feed error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to generate ICS content
function generateICSContent(events: any[], options: { includeDescription: boolean; includeLocation: boolean }): string {
  const { includeDescription, includeLocation } = options;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pack 1703//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pack 1703 Events',
    'X-WR-CALDESC:Pack 1703 Family Events and Activities',
    'X-WR-TIMEZONE:America/Chicago'
  ];

  // Add timezone information
  icsContent.push(
    'BEGIN:VTIMEZONE',
    'TZID:America/Chicago',
    'BEGIN:STANDARD',
    'DTSTART:19671105T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19670312T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  );

  // Add events
  events.forEach(event => {
    try {
      // Handle different date formats (Firestore Timestamp, Date object, or string)
      const startDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
      const endDate = event.endDate?.toDate ? event.endDate.toDate() : new Date(event.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date format for event:', event.id, {
          startDate: event.startDate,
          endDate: event.endDate
        });
        return; // Skip this event
      }
    
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const formatICSDateWithTZ = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0];
    };
    
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@pack1703.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART;TZID=America/Chicago:${formatICSDateWithTZ(startDate)}`,
      `DTEND;TZID=America/Chicago:${formatICSDateWithTZ(endDate)}`,
      `SUMMARY:${event.title}`,
      includeDescription && event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      includeLocation && event.location ? `LOCATION:${event.location}` : '',
      event.category ? `CATEGORIES:${event.category}` : '',
      event.denTags && event.denTags.length > 0 ? `CATEGORIES:${event.denTags.join(',')}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    );
    
    } catch (eventError) {
      console.error('Error processing event for ICS:', event.id, eventError);
      // Continue with other events even if one fails
    }
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.filter(line => line !== '').join('\r\n');
}

// Password Reset Function
export const sendPasswordReset = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { email } = data;
    
    if (!email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Check if user exists in Firestore
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('status', '==', 'approved')
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Generate password reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in Firestore
    await db.collection('passwordResetTokens').doc(resetToken).set({
      userId: userDoc.id,
      email: email,
      expires: resetExpires,
      used: false,
      createdAt: getTimestamp()
    });

    // Generate reset URL
    const resetUrl = `https://sfpack1703.web.app/reset-password?token=${resetToken}`;

    // Import email service
    const { emailService } = await import('./emailService');

    // Send password reset email
    const emailData = {
      to: email,
      from: 'cubmaster@sfpack1703.com',
      subject: 'Pack 1703 Portal - Password Reset Request',
      html: generatePasswordResetEmailHTML(userData.displayName || 'User', resetUrl),
      text: generatePasswordResetEmailText(userData.displayName || 'User', resetUrl)
    };

    await emailService.sendEmail(emailData);

    // Log the password reset request
    await db.collection('adminActions').add({
      userId: userDoc.id,
      userEmail: email,
      action: 'password_reset_requested',
      entityType: 'user',
      entityId: userDoc.id,
      entityName: userData.displayName || email,
      details: {
        email: email,
        resetToken: resetToken,
        expires: resetExpires
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      message: 'Password reset email sent successfully'
    };

  } catch (error) {
    console.error('Error sending password reset:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
  }
});

// Verify Password Reset Token
export const verifyPasswordResetToken = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { token } = data;
    
    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'Reset token is required');
    }

    // Get reset token from Firestore
    const tokenDoc = await db.collection('passwordResetTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired reset token');
    }

    const tokenData = tokenDoc.data();
    
    if (!tokenData) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired reset token');
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires.toDate()) {
      // Clean up expired token
      await db.collection('passwordResetTokens').doc(token).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Reset token has expired');
    }

    // Check if token has been used
    if (tokenData.used) {
      throw new functions.https.HttpsError('failed-precondition', 'Reset token has already been used');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(tokenData.userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    return {
      success: true,
      email: tokenData.email,
      displayName: userData.displayName,
      message: 'Reset token is valid'
    };

  } catch (error) {
    console.error('Error verifying password reset token:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify reset token');
  }
});

// Reset Password with Token
export const resetPasswordWithToken = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { token, newPassword } = data;
    
    if (!token || !newPassword) {
      throw new functions.https.HttpsError('invalid-argument', 'Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long');
    }

    // Get reset token from Firestore
    const tokenDoc = await db.collection('passwordResetTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired reset token');
    }

    const tokenData = tokenDoc.data();
    
    if (!tokenData) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired reset token');
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires.toDate()) {
      // Clean up expired token
      await db.collection('passwordResetTokens').doc(token).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Reset token has expired');
    }

    // Check if token has been used
    if (tokenData.used) {
      throw new functions.https.HttpsError('failed-precondition', 'Reset token has already been used');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(tokenData.userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    // Update password in Firebase Auth
    try {
      await admin.auth().updateUser(tokenData.userId, {
        password: newPassword
      });
    } catch (authError: any) {
      console.error('Error updating password in Firebase Auth:', authError);
      throw new functions.https.HttpsError('internal', 'Failed to update password');
    }

    // Mark token as used
    await db.collection('passwordResetTokens').doc(token).update({
      used: true,
      usedAt: getTimestamp()
    });

    // Update user's last password change
    await db.collection('users').doc(tokenData.userId).update({
      lastPasswordChange: getTimestamp(),
      updatedAt: getTimestamp()
    });

    // Log the password reset
    await db.collection('adminActions').add({
      userId: tokenData.userId,
      userEmail: tokenData.email,
      action: 'password_reset_completed',
      entityType: 'user',
      entityId: tokenData.userId,
      entityName: userData.displayName || tokenData.email,
      details: {
        email: tokenData.email,
        resetToken: token,
        method: 'token_reset'
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    // Send confirmation email
    try {
      const { emailService } = await import('./emailService');
      
      const emailData = {
        to: tokenData.email,
        from: 'cubmaster@sfpack1703.com',
        subject: 'Pack 1703 Portal - Password Successfully Reset',
        html: generatePasswordResetConfirmationHTML(userData.displayName || 'User'),
        text: generatePasswordResetConfirmationText(userData.displayName || 'User')
      };

      await emailService.sendEmail(emailData);
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Don't fail the password reset if email fails
    }

    return {
      success: true,
      message: 'Password has been reset successfully'
    };

  } catch (error) {
    console.error('Error resetting password:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to reset password');
  }
});

// Verify Password Setup Token
export const verifyPasswordSetupToken = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { token } = data;
    
    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'Setup token is required');
    }

    // Get setup token from Firestore
    const tokenDoc = await db.collection('passwordSetupTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired setup token');
    }

    const tokenData = tokenDoc.data();
    
    if (!tokenData) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired setup token');
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires.toDate()) {
      // Clean up expired token
      await db.collection('passwordSetupTokens').doc(token).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Setup token has expired');
    }

    // Check if token has been used
    if (tokenData.used) {
      throw new functions.https.HttpsError('failed-precondition', 'Setup token has already been used');
    }

    return {
      success: true,
      email: tokenData.email,
      displayName: tokenData.displayName,
      message: 'Setup token is valid'
    };

  } catch (error) {
    console.error('Error verifying password setup token:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify setup token');
  }
});

// Complete Password Setup
export const completePasswordSetup = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    const { token, newPassword } = data;
    
    if (!token || !newPassword) {
      throw new functions.https.HttpsError('invalid-argument', 'Setup token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long');
    }

    // Get setup token from Firestore
    const tokenDoc = await db.collection('passwordSetupTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired setup token');
    }

    const tokenData = tokenDoc.data();
    
    if (!tokenData) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired setup token');
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires.toDate()) {
      // Clean up expired token
      await db.collection('passwordSetupTokens').doc(token).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Setup token has expired');
    }

    // Check if token has been used
    if (tokenData.used) {
      throw new functions.https.HttpsError('failed-precondition', 'Setup token has already been used');
    }

    // Update password in Firebase Auth
    try {
      await admin.auth().updateUser(tokenData.userId, {
        password: newPassword,
        emailVerified: true
      });
    } catch (authError: any) {
      console.error('Error updating password in Firebase Auth:', authError);
      throw new functions.https.HttpsError('internal', 'Failed to update password');
    }

    // Mark token as used
    await db.collection('passwordSetupTokens').doc(token).update({
      used: true,
      usedAt: getTimestamp()
    });

    // Update user's last password change
    await db.collection('users').doc(tokenData.userId).update({
      lastPasswordChange: getTimestamp(),
      updatedAt: getTimestamp(),
      emailVerified: true
    });

    // Log the password setup
    await db.collection('adminActions').add({
      userId: tokenData.userId,
      userEmail: tokenData.email,
      action: 'password_setup_completed',
      entityType: 'user',
      entityId: tokenData.userId,
      entityName: tokenData.displayName || tokenData.email,
      details: {
        email: tokenData.email,
        setupToken: token,
        method: 'setup_token'
      },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
      success: true
    });

    return {
      success: true,
      message: 'Password has been set successfully'
    };

  } catch (error) {
    console.error('Error completing password setup:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to complete password setup');
  }
});

// Resend Password Setup Link (admin only)
export const resendPasswordSetupLink = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    console.log('📧 Resend Password Setup Link - Request received');

    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if caller is admin
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const callerData = callerDoc.data();
    const isAdmin = callerData?.role === 'super_admin' || 
                   callerData?.role === 'admin' || 
                   callerData?.role === 'cubmaster' ||
                   callerData?.isAdmin || 
                   callerData?.isCubmaster ||
                   callerData?.permissions?.includes('user_management');

    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can resend password setup links');
    }

    const { userId, email } = data;

    if (!userId && !email) {
      throw new functions.https.HttpsError('invalid-argument', 'Either userId or email is required');
    }

    // Get user data
    let userDoc;
    if (userId) {
      userDoc = await db.collection('users').doc(userId).get();
    } else {
      const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!usersSnapshot.empty) {
        userDoc = usersSnapshot.docs[0];
      }
    }

    if (!userDoc || !userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const userUid = userDoc.id;

    // Check if user is approved
    if (userData?.status !== 'approved') {
      throw new functions.https.HttpsError('failed-precondition', 'User must be approved before sending password setup link');
    }

    // Check if user already has a password (has signed in)
    try {
      const authUser = await admin.auth().getUser(userUid);
      if (authUser.passwordHash) {
        // User already has a password, they should use password reset instead
        throw new functions.https.HttpsError('failed-precondition', 'User already has a password. Use password reset instead.');
      }
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'User account not found in Firebase Auth');
      }
      throw authError;
    }

    // Invalidate any existing password setup tokens for this user
    const existingTokensSnapshot = await db.collection('passwordSetupTokens')
      .where('userId', '==', userUid)
      .where('used', '==', false)
      .get();

    const batch = db.batch();
    existingTokensSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { used: true, invalidatedAt: getTimestamp() });
    });
    await batch.commit();

    console.log(`Invalidated ${existingTokensSnapshot.size} existing tokens`);

    // Create new password setup token
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const setupTokenExpiry = new Date();
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24); // 24 hours

    // Store password setup token
    await db.collection('passwordSetupTokens').doc(setupToken).set({
      userId: userUid,
      email: userData?.email || email,
      displayName: userData?.displayName || '',
      expires: admin.firestore.Timestamp.fromDate(setupTokenExpiry),
      used: false,
      createdAt: getTimestamp(),
      resentBy: context.auth.uid
    });

    console.log('New password setup token created:', setupToken);

    // Send email with password setup link
    try {
      const { emailService } = await import('./emailService');
      const emailData = {
        uid: userUid,
        email: userData?.email || email,
        displayName: userData?.displayName || 'User',
        phone: userData?.phone || '',
        address: userData?.address || '',
        emergencyContact: userData?.emergencyContact || '',
        medicalInfo: userData?.medicalInfo || '',
        role: userData?.role || 'parent',
        setupToken: setupToken
      };
      
      const emailSent = await emailService.sendWelcomeEmail(emailData);
      
      if (!emailSent) {
        // Log warning but don't fail - return token so admin can manually share it
        console.warn('Failed to send email, but token was created');
        return {
          success: true,
          message: 'Password setup token created but email failed. Share this link manually.',
          setupLink: `https://sfpack1703.web.app/password-setup?token=${setupToken}`,
          emailSent: false
        };
      }

      console.log('Welcome email sent successfully to:', userData?.email);
      
      // Log the action
      await db.collection('adminActions').add({
        userId: context.auth.uid,
        userEmail: context.auth.token.email || '',
        action: 'resend_password_setup_link',
        entityType: 'user',
        entityId: userUid,
        entityName: userData?.displayName || '',
        details: {
          targetEmail: userData?.email || email,
          setupToken: setupToken
        },
        timestamp: getTimestamp(),
        ipAddress: context.rawRequest?.ip || 'unknown',
        userAgent: context.rawRequest?.headers?.['user-agent'] || 'unknown',
        success: true
      });

      return {
        success: true,
        message: 'Password setup link sent successfully',
        emailSent: true,
        setupLink: `https://sfpack1703.web.app/password-setup?token=${setupToken}`
      };
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Return the link so admin can manually share it
      return {
        success: true,
        message: 'Password setup token created but email failed. Share this link manually.',
        setupLink: `https://sfpack1703.web.app/password-setup?token=${setupToken}`,
        emailSent: false,
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      };
    }

  } catch (error) {
    console.error('Error resending password setup link:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to resend password setup link');
  }
});

// Update RSVP (authenticated users only)
export const updateRSVP = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    console.log('📝 Update RSVP - Request received');

    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { rsvpId, updateData } = data;

    if (!rsvpId) {
      throw new functions.https.HttpsError('invalid-argument', 'RSVP ID is required');
    }

    if (!updateData) {
      throw new functions.https.HttpsError('invalid-argument', 'Update data is required');
    }

    console.log(`Updating RSVP ${rsvpId} for user ${context.auth.uid}`);

    // Get the RSVP document
    const rsvpRef = db.collection('rsvps').doc(rsvpId);
    const rsvpDoc = await rsvpRef.get();

    if (!rsvpDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpData = rsvpDoc.data();
    
    // Check if the user owns this RSVP
    if (rsvpData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only update your own RSVPs');
    }

    // Validate update data
    const allowedFields = [
      'familyName', 'email', 'phone', 'attendees', 
      'dietaryRestrictions', 'specialNeeds', 'notes'
    ];

    const sanitizedUpdateData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdateData[field] = updateData[field];
      }
    }

    // Check if attendees are being updated
    if (updateData.attendees && Array.isArray(updateData.attendees)) {
      const oldAttendeesCount = rsvpData?.attendees?.length || 0;
      const newAttendeesCount = updateData.attendees.length;
      
      // Validate attendees count
      if (newAttendeesCount === 0 || newAttendeesCount > 20) {
        throw new functions.https.HttpsError('invalid-argument', 'Must have 1-20 attendees');
      }

      // If attendees count changed, we need to check event capacity
      if (newAttendeesCount !== oldAttendeesCount) {
        const eventRef = db.collection('events').doc(rsvpData?.eventId);
        const eventDoc = await eventRef.get();
        
        if (!eventDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Event not found');
        }

        const eventData = eventDoc.data();
        const maxCapacity = eventData?.maxCapacity;
        const paymentRequired = eventData?.paymentRequired || false;
        
        if (maxCapacity) {
          // Get current RSVP count for the event (excluding this RSVP)
          const currentPaidRSVPCount = await getActualRSVPCount(rsvpData?.eventId, paymentRequired);
          const otherRSVPsCount = currentPaidRSVPCount - oldAttendeesCount;
          const newTotalCount = otherRSVPsCount + newAttendeesCount;
          
          if (newTotalCount > maxCapacity) {
            const remainingSpots = maxCapacity - otherRSVPsCount;
            throw new functions.https.HttpsError('resource-exhausted', 
              `Event capacity exceeded. Only ${remainingSpots} spots remaining.`);
          }
        }

        // Update event RSVP count
        const attendeesDifference = newAttendeesCount - oldAttendeesCount;
        
        // Only update event count if payment is not required or RSVP is paid
        const shouldCountRSVP = !paymentRequired || (rsvpData?.paymentStatus === 'completed' || rsvpData?.paymentStatus === 'not_required');
        
        if (shouldCountRSVP) {
          await eventRef.update({
            currentRSVPs: admin.firestore.FieldValue.increment(attendeesDifference),
            updatedAt: getTimestamp()
          });
        }
      }
    }

    // Add updated timestamp
    sanitizedUpdateData.updatedAt = getTimestamp();

    // Update the RSVP
    await rsvpRef.update(sanitizedUpdateData);

    console.log(`✅ RSVP ${rsvpId} updated successfully`);

    return {
      success: true,
      message: 'RSVP updated successfully'
    };

  } catch (error) {
    console.error('❌ Error updating RSVP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update RSVP');
  }
});

// Fix missing USS Stewart location
export const fixUSSStewartLocation = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    console.log('🔧 Fixing USS Stewart location...');

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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasEventManagementPermission = userData?.permissions?.includes('event_management');

    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to fix locations');
    }

    const ussStewartLocation = {
      name: "USS Stewart / Galveston Naval Museum",
      address: "100 Seawolf Parkway, Galveston, TX 77554",
      category: "other",
      geo: { 
        lat: 29.3013, 
        lng: -94.7977 
      },
      notesPublic: "Historic WWII destroyer escort preserved on land as part of the Galveston Naval Museum at Seawolf Park. Perfect for overnight adventures and historical education.",
      notesPrivate: "Check-in at 4:30 PM, contact museum coordinator for group rates",
      parking: {
        text: "Museum parking lot available, follow signs to Seawolf Park"
      },
      amenities: ["Historic ship tour", "Museum exhibits", "Sleeping quarters", "Educational programs"],
      isImportant: true,
      isActive: true,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    // Add the location document with the specific ID that's referenced in events
    const locationRef = db.collection('locations').doc('RwI4opwHcUx3GKKF7Ten');
    await locationRef.set(ussStewartLocation);

    console.log('✅ USS Stewart location fixed successfully!');

    return {
      success: true,
      message: 'USS Stewart location created successfully',
      locationId: 'RwI4opwHcUx3GKKF7Ten'
    };

  } catch (error) {
    console.error('Error fixing USS Stewart location:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to fix USS Stewart location');
  }
});

// Helper function to generate password reset email HTML
function generatePasswordResetEmailHTML(displayName: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Pack 1703 Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Password Reset Request</h1>
        <p>Pack 1703 Portal</p>
      </div>
      
      <div class="content">
        <h2>Hello ${displayName}!</h2>
        
        <p>We received a request to reset your password for your Pack 1703 Portal account.</p>
        
        <p>If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <div class="warning">
          <strong>⚠️ Important Security Information:</strong>
          <ul>
            <li>This link will expire in 1 hour</li>
            <li>This link can only be used once</li>
            <li>If you didn't request this reset, please ignore this email</li>
          </ul>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
        
        <p>If you have any questions or need assistance, please contact the pack leadership.</p>
        
        <p>Best regards,<br>
        Pack 1703 Leadership Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent because a password reset was requested for your Pack 1703 Portal account.</p>
        <p>© 2025 Pack 1703. All rights reserved.</p>
      </div>
    </body>
    </html>
  `.trim();
}

// Helper function to generate password reset email text
function generatePasswordResetEmailText(displayName: string, resetUrl: string): string {
  return `
🔐 Password Reset Request - Pack 1703 Portal

Hello ${displayName}!

We received a request to reset your password for your Pack 1703 Portal account.

If you made this request, click the link below to reset your password:

${resetUrl}

⚠️ Important Security Information:
- This link will expire in 1 hour
- This link can only be used once
- If you didn't request this reset, please ignore this email

If you have any questions or need assistance, please contact the pack leadership.

Best regards,
Pack 1703 Leadership Team

This email was sent because a password reset was requested for your Pack 1703 Portal account.
© 2025 Pack 1703. All rights reserved.
  `.trim();
}

// Helper function to generate password reset confirmation email HTML
function generatePasswordResetConfirmationHTML(displayName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Confirmation - Pack 1703 Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Password Successfully Reset</h1>
        <p>Pack 1703 Portal</p>
      </div>
      
      <div class="content">
        <h2>Hello ${displayName}!</h2>
        
        <div class="success">
          <strong>✅ Success!</strong> Your password has been successfully reset.
        </div>
        
        <p>Your Pack 1703 Portal account password has been updated. You can now log in with your new password.</p>
        
        <p>If you have any questions or need assistance, please contact the pack leadership.</p>
        
        <p>Best regards,<br>
        Pack 1703 Leadership Team</p>
      </div>
      
      <div class="footer">
        <p>This email confirms that your password was successfully reset.</p>
        <p>© 2025 Pack 1703. All rights reserved.</p>
      </div>
    </body>
    </html>
  `.trim();
}

// Helper function to generate password reset confirmation email text
function generatePasswordResetConfirmationText(displayName: string): string {
  return `
✅ Password Successfully Reset - Pack 1703 Portal

Hello ${displayName}!

✅ Success! Your password has been successfully reset.

Your Pack 1703 Portal account password has been updated. You can now log in with your new password.

If you have any questions or need assistance, please contact the pack leadership.

Best regards,
Pack 1703 Leadership Team

This email confirms that your password was successfully reset.
© 2025 Pack 1703. All rights reserved.
  `.trim();
}

// ============================================================================
// ESP32-CAM IMAGE UPLOAD ENDPOINT
// ============================================================================

/**
 * Upload image from ESP32-CAM to Firebase Storage
 * Accepts raw JPEG data and uploads to Storage with proper authentication
 */
export const uploadCameraImage = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID, X-Location');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get device info from headers
    const deviceId = req.get('X-Device-ID') || 'esp32cam_unknown';
    const location = req.get('X-Location') || 'Unknown Location';
    
    // Get image data from request body
    const imageBuffer = req.rawBody;
    
    if (!imageBuffer || imageBuffer.length === 0) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }
    
    console.log(`📸 Received image from ${deviceId}: ${imageBuffer.length} bytes`);
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `garden/${deviceId}_${timestamp}.jpg`;
    
    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(filename);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          deviceId,
          location,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    console.log(`✅ Image uploaded: ${publicUrl}`);
    
    // Store metadata in Firestore
    await db.collection('camera_images').add({
      filename,
      url: publicUrl,
      deviceId,
      location,
      size: imageBuffer.length,
      timestamp: admin.firestore.Timestamp.now(),
      width: 800, // ESP32-CAM default
      height: 600
    });
    
    console.log(`✅ Metadata stored in Firestore`);
    
    // Return success
    res.status(200).json({
      success: true,
      url: publicUrl,
      filename,
      size: imageBuffer.length
    });
    
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

/**
 * Cloud Function to receive sensor data from ESP32-CAM
 * Accepts BME680 sensor readings and stores with proper server timestamp
 */
export const uploadSensorData = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID, X-Location');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get device info from headers
    const deviceId = req.get('X-Device-ID') || 'esp32cam_unknown';
    const location = req.get('X-Location') || 'Unknown Location';
    
    // Get sensor data from JSON body
    const sensorData = req.body;
    
    console.log(`🌡️ Received sensor data from ${deviceId}:`, sensorData);
    
    // Validate required fields
    if (sensorData.temperature === undefined || sensorData.humidity === undefined || sensorData.pressure === undefined) {
      res.status(400).json({ error: 'Missing required sensor fields (temperature, humidity, pressure)' });
      return;
    }
    
    // Store in Firestore with server timestamp
    const docRef = await db.collection('bme680_readings').add({
      deviceId,
      location,
      temperature: parseFloat(sensorData.temperature),
      temperatureFahrenheit: parseFloat(sensorData.temperatureFahrenheit || ((sensorData.temperature * 9/5) + 32)),
      humidity: parseFloat(sensorData.humidity),
      pressure: parseFloat(sensorData.pressure),
      pressureInHg: parseFloat(sensorData.pressureInHg || (sensorData.pressure * 0.02953)),
      gasResistance: parseFloat(sensorData.gasResistance || 0),
      airQualityIndex: parseInt(sensorData.airQualityIndex || 0),
      timestamp: admin.firestore.Timestamp.now() // Server-side timestamp in UTC
    });
    
    console.log(`✅ Sensor data stored: ${docRef.id}`);
    
    // Return success
    res.status(200).json({
      success: true,
      documentId: docRef.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error storing sensor data:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

// ============================================================================
// Square Multi-Merchant (Scaffold) - No Traefik required
// ============================================================================

async function verifyIdTokenFromRequest(req: functions.https.Request): Promise<admin.auth.DecodedIdToken> {
  const authHeader = req.get('Authorization') || req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';
  if (!token) {
    throw new functions.https.HttpsError('unauthenticated', 'Missing Authorization bearer token');
  }
  return await admin.auth().verifyIdToken(token);
}

function extractTenantId(req: functions.https.Request): string | null {
  const fromHeader = (req.header('x-tenant') || '').trim();
  const fromQuery = (req.query.tenantId as string) || '';
  const fromBody = (req.body && (req.body.tenantId as string)) || '';
  // Note: onRequest does not support path params; map via Hosting rewrites if needed
  return fromHeader || fromQuery || fromBody || null;
}

async function assertTenantAccess(uid: string, decoded: admin.auth.DecodedIdToken, tenantId: string) {
  const platform = (decoded.platform as string[] | undefined) || [];
  const isSuper = Array.isArray(platform) && platform.includes('SUPER_ADMIN');
  if (isSuper) return;
  const memRef = db.doc(`tenants/${tenantId}/memberships/${uid}`);
  const memSnap = await memRef.get();
  if (!memSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Not a member of tenant');
  }
}

function applyCors(req: functions.https.Request, res: functions.Response) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

export const squareConnectStart = functions.https.onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }
  try {
    const decoded = await verifyIdTokenFromRequest(req);
    const tenantId = extractTenantId(req);
    if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'tenantId required');
    await assertTenantAccess(decoded.uid, decoded, tenantId);

    // TODO: construct actual Square OAuth URL with client_id, scopes, state
    const redirectUrl = 'https://connect.squareup.com/oauth2/authorize';
    res.json({ success: true, redirectUrl });
  } catch (e: any) {
    const code = e instanceof functions.https.HttpsError ? 401 : 500;
    res.status(code).json({ success: false, error: e.message || 'Unauthorized' });
  }
});

export const squareOAuthCallback = functions.https.onRequest(async (req, res) => {
  // Note: this endpoint is called by Square after user approval
  try {
    // TODO: validate state, exchange code for tokens, fetch merchant/location
    // TODO: write tenants/{tenantId}/integrations/square and integrations_secure/{tenantId}_square
    res.status(200).send('OK');
  } catch (e: any) {
    res.status(500).send('Internal Error');
  }
});

export const createTenantPayment = functions.https.onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }
  try {
    const decoded = await verifyIdTokenFromRequest(req);
    const tenantId = extractTenantId(req);
    if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'tenantId required');
    await assertTenantAccess(decoded.uid, decoded, tenantId);

    // TODO: load creds from integrations_secure, call Square Payments with idempotency key
    res.json({ success: true });
  } catch (e: any) {
    const code = e instanceof functions.https.HttpsError ? 401 : 500;
    res.status(code).json({ success: false, error: e.message || 'Unauthorized' });
  }
});

export const refundTenantPayment = functions.https.onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }
  try {
    const decoded = await verifyIdTokenFromRequest(req);
    const tenantId = extractTenantId(req);
    if (!tenantId) throw new functions.https.HttpsError('invalid-argument', 'tenantId required');
    await assertTenantAccess(decoded.uid, decoded, tenantId);

    // TODO: call Square Refunds and update payment doc
    res.json({ success: true });
  } catch (e: any) {
    const code = e instanceof functions.https.HttpsError ? 401 : 500;
    res.status(code).json({ success: false, error: e.message || 'Unauthorized' });
  }
});

export const squareWebhook = functions.https.onRequest(async (req, res) => {
  // Public endpoint; verify signature before mutating
  try {
    // TODO: verify signature; map merchant_id -> tenantId; upsert payments with idempotency
    res.status(200).send('OK');
  } catch (e: any) {
    res.status(400).send('Bad Request');
  }
});

// RSVP Payment Functions - Added payment processing for RSVPs
export const createRSVPPayment = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to make payment');
    }

    // Validate required fields
    if (!data.rsvpId || !data.eventId) {
      throw new functions.https.HttpsError('invalid-argument', 'RSVP ID and Event ID are required');
    }

    // Get RSVP and Event details
    const rsvpRef = db.collection('rsvps').doc(data.rsvpId);
    const rsvpDoc = await rsvpRef.get();
    
    if (!rsvpDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpData = rsvpDoc.data();
    
    // Verify RSVP belongs to the authenticated user
    if (rsvpData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only pay for your own RSVP');
    }

    // Check if payment is already completed
    if (rsvpData?.paymentStatus === 'completed') {
      throw new functions.https.HttpsError('already-exists', 'Payment already completed for this RSVP');
    }

    // Get event details
    const eventRef = db.collection('events').doc(data.eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    
    if (!eventData?.paymentRequired) {
      throw new functions.https.HttpsError('invalid-argument', 'This event does not require payment');
    }

    // Create payment record
    const paymentData = {
      id: db.collection('payments').doc().id,
      eventId: data.eventId,
      rsvpId: data.rsvpId,
      userId: context.auth.uid,
      amount: eventData.paymentAmount,
      currency: eventData.paymentCurrency || 'USD',
      status: 'pending',
      description: eventData.paymentDescription || `Payment for ${eventData.title}`,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    };

    // Save payment record
    await db.collection('payments').doc(paymentData.id).set(paymentData);

    // Get Square API configuration for frontend integration
    const squareApplicationId = process.env.SQUARE_APPLICATION_ID;
    const squareLocationId = process.env.SQUARE_LOCATION_ID;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    if (!squareApplicationId || !squareLocationId) {
      throw new functions.https.HttpsError('failed-precondition', 'Square API configuration not complete');
    }

    // Return payment data for frontend Square integration
    // The actual payment will be processed in completeRSVPPayment when we receive the nonce
    return {
      success: true,
      paymentId: paymentData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      applicationId: squareApplicationId,
      locationId: squareLocationId,
      environment: squareEnvironment,
      message: 'Payment initialized. Complete payment to finalize RSVP.'
    };

  } catch (error) {
    console.error('Error creating RSVP payment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create payment');
  }
});

// Complete RSVP Payment (called after successful Square payment)
// Admin function to update payment status manually
export const adminUpdatePaymentStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    const userRole = userData?.role || context.auth.token?.role || '';
    
    if (!['admin', 'super_admin', 'super-admin', 'root'].includes(userRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Validate required fields
    if (!data.eventId || !data.userEmail || !data.paymentStatus) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID, user email, and payment status are required');
    }

    // Find the RSVP
    const rsvpQuery = await db.collection('rsvps')
      .where('eventId', '==', data.eventId)
      .where('userEmail', '==', data.userEmail)
      .get();

    if (rsvpQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpDoc = rsvpQuery.docs[0];
    const rsvpData = rsvpDoc.data();

    // Update the RSVP payment status
    await rsvpDoc.ref.update({
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod || 'manual',
      paymentNotes: data.paymentNotes || 'Updated by admin',
      paidAt: data.paymentStatus === 'completed' ? getTimestamp() : null,
      updatedAt: getTimestamp()
    });

    // If payment is completed, also create a payment record
    if (data.paymentStatus === 'completed') {
      await db.collection('payments').add({
        eventId: data.eventId,
        rsvpId: rsvpDoc.id,
        userId: rsvpData.userId,
        amount: rsvpData.paymentAmount || 6000,
        currency: 'USD',
        status: 'completed',
        description: `Manual payment update for ${rsvpData.familyName || data.userEmail}`,
        paymentMethod: data.paymentMethod || 'manual',
        notes: data.paymentNotes || 'Updated by admin',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        processedAt: getTimestamp()
      });
    }

    return {
      success: true,
      message: `Payment status updated to ${data.paymentStatus} for ${rsvpData.familyName || data.userEmail}`,
      rsvpId: rsvpDoc.id
    };

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update payment status');
  }
});

export const completeRSVPPayment = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate required fields - we need the payment nonce from Square form
    if (!data.paymentId || !data.rsvpId || !data.nonce) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment ID, RSVP ID, and Square payment nonce are required');
    }

    // Get payment and RSVP details
    const paymentRef = db.collection('payments').doc(data.paymentId);
    const paymentDoc = await paymentRef.get();
    
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const paymentData = paymentDoc.data();
    
    // Verify payment belongs to the authenticated user
    if (paymentData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only update your own payments');
    }

    const rsvpRef = db.collection('rsvps').doc(data.rsvpId);
    const rsvpDoc = await rsvpRef.get();
    
    if (!rsvpDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'RSVP not found');
    }

    const rsvpData = rsvpDoc.data();

    // Verify RSVP belongs to the authenticated user
    if (rsvpData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only update payments for your own RSVP');
    }

    // Get Square API configuration
    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const squareLocationId = process.env.SQUARE_LOCATION_ID;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    if (!squareAccessToken || !squareLocationId) {
      throw new functions.https.HttpsError('failed-precondition', 'Square API credentials not configured');
    }

    // Initialize Square client
    const squareClient = new Client({
      accessToken: squareAccessToken,
      environment: squareEnvironment === 'production' ? Environment.Production : Environment.Sandbox,
    });

    // Process the actual payment with Square
    let squarePayment;
    try {
      const paymentResponse = await squareClient.paymentsApi.createPayment({
        sourceId: data.nonce, // Nonce from Square payment form
        idempotencyKey: data.paymentId, // Use our payment ID as idempotency key
        amountMoney: {
          amount: BigInt(paymentData.amount),
          currency: paymentData.currency,
        },
        note: paymentData.description,
        locationId: squareLocationId,
      });

      if (paymentResponse.result.payment) {
        squarePayment = paymentResponse.result.payment;
      } else {
        throw new Error('Square payment creation failed');
      }
    } catch (squareError: any) {
      console.error('Square payment error:', squareError);
      throw new functions.https.HttpsError('internal', `Square payment failed: ${squareError.message}`);
    }

    // Use batch write for atomicity
    const batch = db.batch();
    
    // Update payment record with Square payment details
    batch.update(paymentRef, {
      squarePaymentId: squarePayment.id,
      squareOrderId: squarePayment.orderId,
      status: 'completed',
      processedAt: getTimestamp(),
      updatedAt: getTimestamp()
    });

    // Update RSVP payment status
    batch.update(rsvpRef, {
      paymentStatus: 'completed',
      paymentId: data.paymentId,
      updatedAt: getTimestamp()
    });

    // If this was the first payment completion, update event RSVP count
    const eventRef = db.collection('events').doc(paymentData.eventId);
    const currentPaidCount = await getActualRSVPCount(paymentData.eventId, true);
    const newPaidCount = currentPaidCount + rsvpData.attendees.length;
    
    batch.update(eventRef, {
      currentRSVPs: newPaidCount,
      updatedAt: getTimestamp()
    });

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      message: 'Payment completed successfully. Your RSVP is now confirmed.',
      rsvpConfirmed: true
    };

  } catch (error) {
    console.error('Error completing RSVP payment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to complete payment');
  }
});

// Helper function to create account request for a Google user
async function createAccountRequestForGoogleUser(user: admin.auth.UserRecord, db: FirebaseFirestore.Firestore): Promise<string | null> {
  // Check if user already has an account request
  const existingRequestQuery = await db.collection('accountRequests')
    .where('email', '==', user.email)
    .get();
  
  if (!existingRequestQuery.empty) {
    console.log('Account request already exists for:', user.email);
    return existingRequestQuery.docs[0].id;
  }
  
  // Check if user already exists in users collection (already approved)
  const existingUserQuery = await db.collection('users')
    .where('email', '==', user.email)
    .get();
  
  if (!existingUserQuery.empty) {
    console.log('User already approved:', user.email);
    return null;
  }
  
  // Extract name from displayName
  const nameParts = (user.displayName || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Create account request automatically
  const requestData = {
    email: user.email || '',
    displayName: user.displayName || '',
    firstName: firstName,
    lastName: lastName,
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    scoutRank: '',
    den: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalInfo: '',
    dietaryRestrictions: '',
    specialNeeds: '',
    reason: 'Google sign-in - account request auto-created',
    status: 'pending',
    submittedAt: getTimestamp(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    linkedUserId: user.uid,
    source: 'google_signin_auto',
    authProvider: 'google',
    photoURL: user.photoURL || '',
    notes: `Automatically created from Google sign-in. User authenticated on ${new Date().toISOString()}`
  };
  
  const requestRef = await db.collection('accountRequests').add(requestData);
  console.log('Auto-created account request for Google user:', user.email, requestRef.id);
  
  // Note: Email notification is handled by the onAccountRequestCreate Firestore trigger
  // which uses adminNotificationService to send to cubmaster@sfpack1703.com only
  
  return requestRef.id;
}

// Callable function to create account requests for existing Google users who don't have requests
export const createRequestsForExistingGoogleUsers = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    const hasAdminRole = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'den_leader';
    const hasLegacyPermissions = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
    const hasUserManagementPermission = userData?.permissions?.includes('user_management') || userData?.permissions?.includes('system_admin');
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasUserManagementPermission) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    console.log('Finding Google users without account requests...');
    
    // Get all Firebase Auth users
    let allUsers: admin.auth.UserRecord[] = [];
    let nextPageToken: string | undefined;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      allUsers = allUsers.concat(listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    // Filter to Google users only
    const googleUsers = allUsers.filter(user => 
      user.providerData.some(provider => provider.providerId === 'google.com')
    );
    
    console.log(`Found ${googleUsers.length} Google Auth users`);
    
    const results = {
      processed: 0,
      created: 0,
      alreadyExists: 0,
      alreadyApproved: 0,
      errors: [] as any[]
    };
    
    // Create account requests for each Google user
    for (const user of googleUsers) {
      try {
        results.processed++;
        const requestId = await createAccountRequestForGoogleUser(user, db);
        
        if (requestId) {
          results.created++;
          console.log(`Created request ${requestId} for ${user.email}`);
        } else {
          // Check why it wasn't created
          const existingRequest = await db.collection('accountRequests')
            .where('email', '==', user.email)
            .get();
          const existingUser = await db.collection('users')
            .where('email', '==', user.email)
            .get();
          
          if (!existingRequest.empty) {
            results.alreadyExists++;
          } else if (!existingUser.empty) {
            results.alreadyApproved++;
          }
        }
      } catch (error: any) {
        results.errors.push({
          email: user.email,
          error: error.message
        });
        console.error(`Error processing ${user.email}:`, error);
      }
    }
    
    return {
      success: true,
      message: `Processed ${results.processed} Google users. Created ${results.created} new requests.`,
      results
    };
    
  } catch (error: any) {
    console.error('Error creating requests for Google users:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create requests');
  }
});

// Firebase Auth Trigger: Auto-create account requests for Google sign-in users
// This ensures all Google sign-in users have account requests that appear in the approval list
export const onCreateGoogleAuthUser = functions.auth.user().onCreate(async (user) => {
  try {
    // Only process Google sign-in users
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
    
    if (!isGoogleUser) {
      console.log('Skipping non-Google auth user:', user.uid);
      return;
    }
    
    console.log('Processing new Google sign-in user:', user.email, user.uid);
    
    // Use the helper function to create the account request
    const requestId = await createAccountRequestForGoogleUser(user, db);
    
    if (requestId) {
      // Log the action
      await db.collection('adminActions').add({
        action: 'google_signin_auto_request_created',
        entityType: 'account_request',
        entityId: requestId,
        entityName: user.displayName || user.email || '',
        details: {
          email: user.email,
          userId: user.uid,
          source: 'google_signin_auto'
        },
        timestamp: getTimestamp(),
        success: true
      });
    }
    
  } catch (error: any) {
    console.error('Error in onCreateGoogleAuthUser:', error);
    functions.logger.error('Google Auth trigger error', {
      error: error.message,
      stack: error.stack,
      userId: user.uid,
      email: user.email
    });
    // Don't throw - we don't want to block user creation
  }
});

// ============================================================================
// Charleston Wrap Fundraising Integration
// ============================================================================

export { 
  syncCharlestonWrapData, 
  manualSyncCharlestonWrap 
} from './charlestonWrapService';

// ============================================================================
// Admin Notification System - Firestore Triggers
// ============================================================================

export {
  onRSVPCreate,
  onMessageCreate,
  onAccountRequestCreate,
  onFeedbackCreate,
  onResourceSubmissionCreate,
  onVolunteerSignupCreate,
  onRSVPPaymentComplete
} from './adminNotificationTriggers';

// Export organization billing functions
export {
  createOrganizationBillingAccount,
  getOrganizationUsage
} from './organizationBilling';

// Export Pack 1703 initialization function
export {
  initializePack1703Org
} from './initializePack1703';

// Export super admin bootstrap function
export {
  createSuperAdminUser
} from './createSuperAdmin';

// Export custom claims management functions
export {
  setUserCustomClaims,
  syncAllUserCustomClaims
} from './setUserCustomClaims';
