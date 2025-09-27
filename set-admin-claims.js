/**
 * Set Admin Claims Script
 * 
 * This script sets the correct admin claims for the user to ensure
 * Firestore rules work properly.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with correct project ID
try {
  admin.initializeApp({
    projectId: 'pack1703-portal'
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const auth = admin.auth();

/**
 * Set admin claims for the user
 */
async function setAdminClaims() {
  console.log('\n🔧 Setting Admin Claims...\n');

  try {
    // The user UID from the console logs
    const userUID = 'PeL8RNQOTmSBDlydI9IG1ogOnW63';
    const userEmail = 'testadmin@pack1703.org';

    console.log(`Setting claims for user: ${userEmail} (${userUID})`);

    // Set comprehensive admin claims
    const adminClaims = {
      role: 'root',
      isAdmin: true,
      adminLevel: 'super',
      permissions: ['read:all', 'write:all', 'delete:all']
    };

    await auth.setCustomUserClaims(userUID, adminClaims);
    console.log('✅ Admin claims set successfully:', adminClaims);

    // Verify the claims were set
    const userRecord = await auth.getUser(userUID);
    console.log('✅ Verified custom claims:', userRecord.customClaims);

    console.log('\n📋 Next Steps:');
    console.log('1. The user MUST sign out and sign back in to refresh their token');
    console.log('2. The custom claims will then be included in the authentication token');
    console.log('3. Firestore rules will recognize the user as an admin');
    console.log('4. RSVP viewer should work correctly');

  } catch (error) {
    console.error('❌ Error setting admin claims:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Admin Claims Setter');
  console.log('Project ID:', admin.app().options.projectId);
  console.log('Timestamp:', new Date().toISOString());
  
  await setAdminClaims();
  
  console.log('\n✅ Script completed');
}

// Run the script
main().catch(console.error);
