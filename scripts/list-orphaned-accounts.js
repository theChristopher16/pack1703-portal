#!/usr/bin/env node

/**
 * List All Orphaned Accounts Script
 * 
 * This script provides a detailed list of all orphaned Firebase Auth users
 * who don't have corresponding Firestore user documents.
 * 
 * Usage: node scripts/list-orphaned-accounts.js
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

async function listOrphanedAccounts() {
  console.log('🔍 Listing All Orphaned Firebase Auth Accounts\n');
  
  try {
    const authUsers = await auth.listUsers();
    const usersSnapshot = await db.collection('users').get();
    const requestsSnapshot = await db.collection('accountRequests').get();
    
    const orphanedUsers = [];
    const accountRequests = [];
    
    // Process account requests
    requestsSnapshot.forEach((doc) => {
      const requestData = doc.data();
      accountRequests.push({
        id: doc.id,
        email: requestData.email,
        displayName: requestData.displayName,
        status: requestData.status,
        createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
        phone: requestData.phone,
        den: requestData.den,
        scoutRank: requestData.scoutRank,
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        linkedUserId: requestData.linkedUserId
      });
    });
    
    // Find orphaned users
    authUsers.users.forEach((authUser) => {
      const hasFirestoreUser = usersSnapshot.docs.some(doc => doc.id === authUser.uid);
      
      if (!hasFirestoreUser && authUser.uid !== 'ai_solyn' && authUser.uid !== 'ai_nova') {
        const matchingRequest = accountRequests.find(req => req.email === authUser.email);
        
        orphanedUsers.push({
          uid: authUser.uid,
          email: authUser.email || 'No email',
          displayName: authUser.displayName || 'Unknown',
          emailVerified: authUser.emailVerified,
          disabled: authUser.disabled,
          createdAt: authUser.metadata.creationTime,
          lastSignIn: authUser.metadata.lastSignInTime,
          providers: authUser.providerData.map(p => p.providerId),
          customClaims: authUser.customClaims || {},
          hasRequest: !!matchingRequest,
          request: matchingRequest
        });
      }
    });
    
    // Sort by creation date (newest first)
    orphanedUsers.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    
    console.log(`🚨 Found ${orphanedUsers.length} orphaned Firebase Auth accounts\n`);
    
    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned accounts found!');
      return;
    }
    
    // Group by request status
    const usersWithRequests = orphanedUsers.filter(user => user.hasRequest);
    const usersWithoutRequests = orphanedUsers.filter(user => !user.hasRequest);
    
    console.log('📊 SUMMARY:');
    console.log('============================================================');
    console.log(`Total Orphaned Accounts: ${orphanedUsers.length}`);
    console.log(`Users with Account Requests: ${usersWithRequests.length}`);
    console.log(`Users without Account Requests: ${usersWithoutRequests.length}\n`);
    
    // Show all orphaned users
    console.log('🚨 ALL ORPHANED FIREBASE AUTH ACCOUNTS:');
    console.log('============================================================');
    
    orphanedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Account Disabled: ${user.disabled ? '❌ Yes' : '✅ No'}`);
      console.log(`   Auth Providers: ${user.providers.join(', ')}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Sign In: ${user.lastSignIn || 'Never'}`);
      console.log(`   Custom Claims: ${Object.keys(user.customClaims).length > 0 ? JSON.stringify(user.customClaims) : 'None'}`);
      
      if (user.hasRequest) {
        console.log(`   Account Request: ✅ Yes (${user.request.status})`);
        console.log(`   Request Created: ${user.request.createdAt ? user.request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Request Phone: ${user.request.phone || 'Not provided'}`);
        console.log(`   Request Den: ${user.request.den || 'Not specified'}`);
        console.log(`   Request Scout Rank: ${user.request.scoutRank || 'Not specified'}`);
        if (user.request.linkedUserId) {
          console.log(`   Request Linked To: ${user.request.linkedUserId}`);
        }
      } else {
        console.log(`   Account Request: ❌ No`);
      }
      
      console.log('');
    });
    
    // Show users with requests separately
    if (usersWithRequests.length > 0) {
      console.log('🔗 USERS WITH ACCOUNT REQUESTS (Can be linked):');
      console.log('============================================================');
      usersWithRequests.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   Request Status: ${user.request.status}`);
        console.log(`   Request Created: ${user.request.createdAt ? user.request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Phone: ${user.request.phone || 'Not provided'}`);
        console.log(`   Den: ${user.request.den || 'Not specified'}`);
        console.log(`   Scout Rank: ${user.request.scoutRank || 'Not specified'}`);
        console.log('');
      });
    }
    
    // Show users without requests separately
    if (usersWithoutRequests.length > 0) {
      console.log('⚠️  USERS WITHOUT ACCOUNT REQUESTS (Should be deleted):');
      console.log('============================================================');
      usersWithoutRequests.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Last Sign In: ${user.lastSignIn || 'Never'}`);
        console.log(`   Auth Providers: ${user.providers.join(', ')}`);
        console.log('');
      });
    }
    
    console.log('📋 RECOMMENDATIONS:');
    console.log('============================================================');
    
    if (usersWithRequests.length > 0) {
      console.log(`🔗 For ${usersWithRequests.length} users with account requests:`);
      console.log('   - These users can be linked to their existing requests');
      console.log('   - Run: node scripts/link-orphaned-users.js');
      console.log('   - Then approve them through the admin interface\n');
    }
    
    if (usersWithoutRequests.length > 0) {
      console.log(`⚠️  For ${usersWithoutRequests.length} users without account requests:`);
      console.log('   - These users tried to sign in without proper accounts');
      console.log('   - They should be deleted from Firebase Auth');
      console.log('   - Or ask them to submit proper account requests\n');
    }
    
    console.log('🛠️  AVAILABLE ACTIONS:');
    console.log('============================================================');
    console.log('1. Link users with requests: node scripts/link-orphaned-users.js');
    console.log('2. Delete users without requests: node scripts/delete-orphaned-users.js');
    console.log('3. Create account requests for users: node scripts/create-requests-for-orphaned.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the listing
listOrphanedAccounts().then(() => {
  console.log('\n✅ Orphaned accounts listing complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Listing failed:', error);
  process.exit(1);
});

