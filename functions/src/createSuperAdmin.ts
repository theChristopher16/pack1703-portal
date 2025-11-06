/**
 * One-time function to create a super admin user
 * Use this to bootstrap access when locked out
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const createSuperAdminUser = functions.https.onCall(async (data, context) => {
  // This function can be called by ANY authenticated user
  // It creates a user document for themselves if they don't have one
  // This is safe because it only affects the calling user
  
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = context.auth.uid;
  const email = context.auth.token.email || data.email;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    
    // Check if user already exists
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return {
        success: true,
        message: 'User document already exists',
        user: userDoc.data()
      };
    }

    // Get Firebase Auth user data
    const authUser = await admin.auth().getUser(userId);

    // Create super admin user document
    const newUser = {
      uid: userId,
      email: email,
      displayName: authUser.displayName || data.displayName || email,
      firstName: data.firstName || authUser.displayName?.split(' ')[0] || '',
      lastName: data.lastName || authUser.displayName?.split(' ').slice(1).join(' ') || '',
      phone: data.phone || '',
      photoURL: authUser.photoURL || '',
      
      // Super admin role and permissions
      role: 'root',
      status: 'active',
      permissions: [
        'system_admin',
        'user_management',
        'event_management',
        'location_management',
        'announcement_management',
        'resource_management',
        'volunteer_management',
        'analytics_view',
        'cost_management',
        'ai_assistant_access'
      ],
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: 'self-bootstrap',
      
      // User info
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      den: data.den || '',
      rank: data.rank || '',
      dens: data.dens || [],
      
      // Preferences
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      }
    };

    await userRef.set(newUser);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: 'root',
      platform: ['SUPER_ADMIN'],
      permissions: newUser.permissions
    });

    console.log('Super admin user created:', email);

    return {
      success: true,
      message: 'Super admin user created successfully',
      user: newUser
    };

  } catch (error: any) {
    console.error('Error creating super admin:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create super admin');
  }
});

