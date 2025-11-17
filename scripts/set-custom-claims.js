#!/usr/bin/env node

/**
 * Set custom claims for a user
 * Usage: node scripts/set-custom-claims.js <userId> <role>
 */

const admin = require('firebase-admin');

// Initialize without service account - will use Application Default Credentials
try {
  admin.initializeApp({
    projectId: 'pack1703-portal'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

async function setCustomClaims() {
  const userId = process.argv[2] || 'she4uvqd8QeyVm1Y43SvYvlH0DI2';
  const role = process.argv[3] || 'parent';

  console.log(`\n🔧 Setting custom claims for user: ${userId}`);
  console.log(`   Role: ${role}\n`);

  try {
    // Get user from Firestore to get their permissions
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('❌ User not found in Firestore users collection');
      console.log('   Please create the user document first');
      process.exit(1);
    }

    const userData = userDoc.data();
    const permissions = userData.permissions || [
      'event_view',
      'event_rsvp', 
      'announcement_view',
      'location_view',
      'resource_view',
      'chat_access',
      'profile_edit'
    ];

    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      permissions: permissions,
      platform: ['root', 'super_admin', 'super-admin'].includes(role) ? ['SUPER_ADMIN'] : []
    });

    console.log('✅ Custom claims set successfully!');
    console.log('   Role:', role);
    console.log('   Permissions:', permissions.join(', '));
    console.log('\n⚠️  User must sign out and sign back in for claims to take effect\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
    process.exit(1);
  }
}

setCustomClaims();






