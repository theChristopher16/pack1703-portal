/**
 * Cloud Function to initialize Pack 1703 as an organization
 * This is a one-time callable function for super admins
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const initializePack1703Org = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to initialize Pack 1703');
  }

  // Verify super admin role
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'root' && userRole !== 'super-admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can initialize Pack 1703');
  }

  try {
    const db = admin.firestore();
    const orgsRef = db.collection('organizations');

    // Check if Pack 1703 already exists
    const existingQuery = await orgsRef.where('slug', '==', 'pack1703').get();

    if (!existingQuery.empty) {
      // Update existing Pack 1703
      const docRef = existingQuery.docs[0].ref;
      await docRef.update({
        enabledComponents: [
          // Base components
          'chat',
          'calendar',
          'announcements',
          'locations',
          'resources',
          'profile',
          
          // Pack-specific components
          'analytics',
          'userManagement',
          'finances',
          'seasons',
          'lists',
          'volunteer',
          'ecology',
          'fundraising',
          'dues'
        ],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        message: 'Pack 1703 organization updated with all components enabled',
        id: docRef.id
      };
    }

    // Create new Pack 1703 organization
    const pack1703 = {
      name: 'Pack 1703',
      slug: 'pack1703',
      description: 'Cub Scout Pack 1703 - Main portal application',
      orgType: 'pack',
      isActive: true,
      
      // Enable all pack components by default
      enabledComponents: [
        // Base components
        'chat',
        'calendar',
        'announcements',
        'locations',
        'resources',
        'profile',
        
        // Pack-specific components
        'analytics',
        'userManagement',
        'finances',
        'seasons',
        'lists',
        'volunteer',
        'ecology',
        'fundraising',
        'dues'
      ],
      
      // Branding
      branding: {
        name: 'Pack 1703',
        displayName: 'Cub Scout Pack 1703',
        shortName: 'Pack 1703',
        email: 'cubmaster@sfpack1703.com',
        description: 'Peoria, IL - Cub Scout Pack Portal',
        primaryColor: '#0d9488', // teal-600
        secondaryColor: '#065f46'  // emerald-800
      },
      
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Metadata
      memberCount: 0,
      eventCount: 0,
      locationCount: 0
    };

    const docRef = await orgsRef.add(pack1703);

    return {
      success: true,
      message: 'Pack 1703 organization created successfully',
      id: docRef.id
    };

  } catch (error: any) {
    console.error('Error initializing Pack 1703:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to initialize Pack 1703');
  }
});

