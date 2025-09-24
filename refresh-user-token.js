/**
 * Refresh User Token Script
 * 
 * This script forces a user to refresh their authentication token
 * by revoking their current tokens, which will force them to sign in again
 * with updated custom claims.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
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
 * Revoke user tokens to force re-authentication
 */
async function refreshUserToken() {
  console.log('\n🔄 Refreshing User Token...\n');

  try {
    const userUID = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    const userEmail = 'christophersmithm16@gmail.com';

    console.log(`Refreshing token for user: ${userEmail} (${userUID})`);

    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(userUID);
    console.log('✅ All refresh tokens revoked successfully');

    // Get the user record to show current claims
    const userRecord = await auth.getUser(userUID);
    console.log('✅ Current custom claims:', userRecord.customClaims);

    console.log('\n📋 What happens next:');
    console.log('1. The user will be automatically signed out');
    console.log('2. When they sign back in, they will get a fresh token');
    console.log('3. The fresh token will include the updated custom claims');
    console.log('4. Firestore rules will recognize them as an admin');
    console.log('5. RSVP viewer should work correctly');

  } catch (error) {
    console.error('❌ Error refreshing user token:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 User Token Refresher');
  console.log('Project ID:', admin.app().options.projectId);
  console.log('Timestamp:', new Date().toISOString());
  
  await refreshUserToken();
  
  console.log('\n✅ Script completed');
  console.log('\n🎯 The user should now be signed out automatically');
  console.log('When they sign back in, the RSVP viewer should work!');
}

// Run the script
main().catch(console.error);
