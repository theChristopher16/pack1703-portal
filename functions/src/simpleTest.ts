import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Simple test function to check authentication
export const testAuth = functions.https.onCall(async (request) => {
  try {
    const context = request;
    
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User not found');
    }

    const userData = userDoc.data();
    
    return {
      success: true,
      message: 'Authentication test successful',
      user: {
        uid: context.auth.uid,
        email: context.auth.token.email,
        role: userData?.role || 'unknown',
        isAdmin: userData?.role === 'root' || userData?.role === 'admin' || userData?.role === 'volunteer'
      }
    };
  } catch (error) {
    console.error('Test auth error:', error);
    throw new functions.https.HttpsError('internal', `Test failed: ${error}`);
  }
});
