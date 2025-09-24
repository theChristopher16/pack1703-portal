/**
 * Fix Admin Claims Script
 * 
 * This script verifies and sets the correct admin claims for users
 * to ensure Firestore rules work properly.
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

const db = admin.firestore();
const auth = admin.auth();

/**
 * Set admin claims for a user
 */
async function setAdminClaims(uid, claims) {
  try {
    await auth.setCustomUserClaims(uid, claims);
    console.log(`✅ Set custom claims for ${uid}:`, claims);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set claims for ${uid}:`, error.message);
    return false;
  }
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error(`❌ Failed to get user by email ${email}:`, error.message);
    return null;
  }
}

/**
 * Main function to fix admin claims
 */
async function fixAdminClaims() {
  console.log('\n🔧 Fixing Admin Claims...\n');

  try {
    // Get the admin user
    const adminEmail = 'christophersmithm16@gmail.com';
    console.log(`Looking up user: ${adminEmail}`);
    
    const user = await getUserByEmail(adminEmail);
    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.uid}`);
    console.log(`Current custom claims:`, user.customClaims || {});

    // Set comprehensive admin claims
    const adminClaims = {
      role: 'root',
      isAdmin: true,
      adminLevel: 'super',
      permissions: ['read:all', 'write:all', 'delete:all']
    };

    const success = await setAdminClaims(user.uid, adminClaims);
    
    if (success) {
      console.log('\n✅ Admin claims set successfully');
      
      // Verify the claims were set
      const updatedUser = await auth.getUser(user.uid);
      console.log('Updated custom claims:', updatedUser.customClaims);
      
      // Test Firestore access
      console.log('\n🧪 Testing Firestore access with new claims...');
      const rsvpsSnapshot = await db.collection('rsvps').limit(3).get();
      console.log(`✅ Successfully read ${rsvpsSnapshot.size} RSVP documents`);
      
      if (rsvpsSnapshot.size > 0) {
        const firstRSVP = rsvpsSnapshot.docs[0];
        console.log('Sample RSVP data:', {
          id: firstRSVP.id,
          eventId: firstRSVP.data().eventId,
          familyName: firstRSVP.data().familyName
        });
      }
      
    } else {
      console.error('❌ Failed to set admin claims');
    }

  } catch (error) {
    console.error('❌ Error fixing admin claims:', error);
  }
}

/**
 * Verify current user claims
 */
async function verifyUserClaims() {
  console.log('\n🔍 Verifying Current User Claims...\n');

  try {
    const adminEmail = 'christophersmithm16@gmail.com';
    const user = await getUserByEmail(adminEmail);
    
    if (user) {
      console.log(`User: ${user.email}`);
      console.log(`UID: ${user.uid}`);
      console.log(`Email Verified: ${user.emailVerified}`);
      console.log(`Custom Claims:`, user.customClaims || {});
      console.log(`Creation Time: ${user.metadata.creationTime}`);
      console.log(`Last Sign In: ${user.metadata.lastSignInTime}`);
    }

  } catch (error) {
    console.error('❌ Error verifying user claims:', error);
  }
}

/**
 * Test Firestore rules with current setup
 */
async function testFirestoreRules() {
  console.log('\n🧪 Testing Firestore Rules...\n');

  try {
    // Test 1: Read RSVPs
    console.log('Test 1: Reading RSVPs...');
    const rsvpsSnapshot = await db.collection('rsvps').limit(5).get();
    console.log(`✅ Read ${rsvpsSnapshot.size} RSVP documents`);

    // Test 2: Read users
    console.log('\nTest 2: Reading users...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`✅ Read ${usersSnapshot.size} user documents`);

    // Test 3: Check admin users
    console.log('\nTest 3: Checking admin users...');
    const adminUsersSnapshot = await db.collection('users')
      .where('isAdmin', '==', true)
      .get();
    console.log(`✅ Found ${adminUsersSnapshot.size} admin users`);

    adminUsersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.email} (role: ${data.role})`);
    });

  } catch (error) {
    console.error('❌ Error testing Firestore rules:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Admin Claims Fix Script');
  console.log('Project ID:', admin.app().options.projectId);
  console.log('Timestamp:', new Date().toISOString());
  
  await verifyUserClaims();
  await fixAdminClaims();
  await testFirestoreRules();
  
  console.log('\n✅ Script completed');
  console.log('\n📋 Next Steps:');
  console.log('1. The user should sign out and sign back in to refresh their token');
  console.log('2. Test the RSVP viewer in the application');
  console.log('3. Check browser console for any remaining errors');
}

// Run the script
main().catch(console.error);
