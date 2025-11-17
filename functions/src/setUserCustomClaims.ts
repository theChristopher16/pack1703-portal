/**
 * Cloud Function to set custom claims for a user
 * Used for fixing users who have Firestore docs but no custom claims
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const setUserCustomClaims = functions.https.onCall(async (data, context) => {
  // Must be authenticated
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { targetUserId } = data;

  if (!targetUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required');
  }

  try {
    const db = admin.firestore();
    
    // Check if calling user is admin
    const callingUserDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callingUserDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Calling user not found');
    }

    const callingUserRole = callingUserDoc.data()?.role;
    if (!['root', 'super_admin', 'super-admin', 'admin', 'content-admin'].includes(callingUserRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can set custom claims');
    }

    // Get target user's Firestore document
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Target user not found in Firestore');
    }

    const userData = targetUserDoc.data();
    const userRole = userData?.role || 'parent';
    const userPermissions = userData?.permissions || [];

    // Set custom claims based on Firestore data
    await admin.auth().setCustomUserClaims(targetUserId, {
      role: userRole,
      permissions: userPermissions,
      platform: userRole === 'root' || userRole === 'super_admin' || userRole === 'super-admin' 
        ? ['SUPER_ADMIN'] 
        : []
    });

    console.log(`Custom claims set for user ${targetUserId}:`, {
      role: userRole,
      permissions: userPermissions
    });

    return {
      success: true,
      message: 'Custom claims set successfully',
      claims: {
        role: userRole,
        permissions: userPermissions
      }
    };

  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to set custom claims');
  }
});

// Batch function to fix all users who have Firestore docs but no custom claims
export const syncAllUserCustomClaims = functions.https.onCall(async (data, context) => {
  // Must be authenticated as super admin
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const db = admin.firestore();
    
    // Check if calling user is super admin
    const callingUserDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callingUserDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Calling user not found');
    }

    const callingUserRole = callingUserDoc.data()?.role;
    if (!['root', 'super_admin', 'super-admin'].includes(callingUserRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Only super admins can sync all claims');
    }

    // Get all active users from Firestore
    const usersSnapshot = await db.collection('users')
      .where('status', '==', 'active')
      .get();

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userRole = userData.role || 'parent';
        const userPermissions = userData.permissions || [];

        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, {
          role: userRole,
          permissions: userPermissions,
          platform: ['root', 'super_admin', 'super-admin'].includes(userRole) 
            ? ['SUPER_ADMIN'] 
            : []
        });

        successCount++;
        results.push({
          userId,
          email: userData.email,
          success: true
        });

      } catch (error: any) {
        errorCount++;
        results.push({
          userId: userDoc.id,
          email: userDoc.data().email,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `Synced ${successCount} users, ${errorCount} errors`,
      successCount,
      errorCount,
      results
    };

  } catch (error: any) {
    console.error('Error syncing custom claims:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to sync custom claims');
  }
});






