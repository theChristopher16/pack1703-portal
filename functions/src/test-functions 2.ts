import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

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

// Test function to update user role
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

    // Log admin action
    await db.collection('adminActions').add({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || '',
      action: 'update_role',
      entityType: 'user',
      entityId: userId,
      entityName: email || 'User',
      details: { oldRole: 'unknown', newRole: newRole },
      timestamp: getTimestamp(),
      ipAddress: context.rawRequest.ip || 'unknown',
      userAgent: context.rawRequest.headers['user-agent'] || 'unknown',
      success: true
    });

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
