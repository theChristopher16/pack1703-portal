#!/usr/bin/env node

/**
 * Create Account Requests for Orphaned Users Script
 * 
 * This script creates account requests for orphaned Firebase Auth users
 * so they can be properly approved through the normal process.
 * 
 * Usage: node scripts/create-requests-for-orphaned.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../service-account-key.json');
} catch (error) {
  console.log('❌ Service account key not found.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createRequestsForOrphaned() {
  console.log('🚀 Creating Account Requests for Orphaned Users\n');
  
  try {
    const authUsers = await auth.listUsers();
    const usersSnapshot = await db.collection('users').get();
    const requestsSnapshot = await db.collection('accountRequests').get();
    
    const orphanedUsers = [];
    const existingRequests = [];
    
    // Process existing account requests
    requestsSnapshot.forEach((doc) => {
      const requestData = doc.data();
      existingRequests.push(requestData.email);
    });
    
    // Find orphaned users
    authUsers.users.forEach((authUser) => {
      const hasFirestoreUser = usersSnapshot.docs.some(doc => doc.id === authUser.uid);
      const hasExistingRequest = existingRequests.includes(authUser.email);
      
      if (!hasFirestoreUser && !hasExistingRequest && authUser.uid !== 'ai_solyn' && authUser.uid !== 'ai_nova') {
        orphanedUsers.push({
          uid: authUser.uid,
          email: authUser.email || 'No email',
          displayName: authUser.displayName || 'Unknown',
          emailVerified: authUser.emailVerified,
          createdAt: authUser.metadata.creationTime,
          lastSignIn: authUser.metadata.lastSignInTime,
          providers: authUser.providerData.map(p => p.providerId)
        });
      }
    });
    
    console.log(`🔍 Found ${orphanedUsers.length} orphaned users without account requests\n`);
    
    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned users found!');
      return;
    }
    
    // Show users that will get requests
    console.log('📋 Users that will get account requests:');
    console.log('============================================================');
    orphanedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Sign In: ${user.lastSignIn || 'Never'}`);
      console.log(`   Auth Providers: ${user.providers.join(', ')}`);
      console.log('');
    });
    
    console.log('🔗 Creating account requests...\n');
    
    // Create account requests for each orphaned user
    for (const user of orphanedUsers) {
      try {
        console.log(`📝 Creating account request for ${user.email}...`);
        
        // Extract name parts from display name
        const nameParts = (user.displayName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create the account request document
        const accountRequest = {
          email: user.email,
          displayName: user.displayName || '',
          firstName: firstName,
          lastName: lastName,
          phone: '', // Will need to be filled in later
          address: '',
          city: '',
          state: '',
          zipCode: '',
          emergencyContact: '',
          emergencyPhone: '',
          medicalInfo: '',
          dietaryRestrictions: '',
          specialNeeds: '',
          den: '', // Will need to be filled in later
          scoutRank: '', // Will need to be filled in later
          parentGuardian: '',
          parentPhone: '',
          parentEmail: '',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          linkedUserId: null,
          linkedAt: null,
          source: 'orphaned_google_user',
          notes: `Created from orphaned Google user. Original sign-in: ${user.createdAt}`
        };
        
        // Add the account request to Firestore
        const docRef = await db.collection('accountRequests').add(accountRequest);
        
        console.log(`✅ Successfully created account request for ${user.email}`);
        console.log(`   Request ID: ${docRef.id}`);
        console.log(`   Status: pending`);
        console.log(`   Source: orphaned_google_user`);
        console.log(`   Note: Phone, den, and scout rank need to be filled in\n`);
        
      } catch (error) {
        console.error(`❌ Error creating request for ${user.email}:`, error.message);
      }
    }
    
    console.log('📋 SUMMARY:');
    console.log('============================================================');
    console.log(`Total orphaned users: ${orphanedUsers.length}`);
    console.log(`Account requests created: ${orphanedUsers.length}`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('============================================================');
    console.log('1. Go to Admin Panel > User Management > Join Requests');
    console.log('2. You should now see the new account requests');
    console.log('3. Fill in missing information (phone, den, scout rank)');
    console.log('4. Approve the requests');
    console.log('5. Users can then sign in with Google and will be linked automatically');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('============================================================');
    console.log('- Phone numbers, den, and scout rank are empty and need to be filled in');
    console.log('- You may want to contact these users to get the missing information');
    console.log('- Once approved, they can sign in with Google and will be linked automatically');
    console.log('- The authentication fix will prevent this from happening again');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the creation
createRequestsForOrphaned().then(() => {
  console.log('\n🎉 Account request creation complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Creation failed:', error);
  process.exit(1);
});

