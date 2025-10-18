#!/usr/bin/env node

/**
 * Auto-Link Orphaned Users Script
 * 
 * This script automatically links orphaned Firebase Auth users to their
 * account requests without requiring interactive input.
 * 
 * Usage: node scripts/auto-link-orphaned-users.js
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

async function autoLinkOrphanedUsers() {
  console.log('🚀 Auto-Linking Orphaned Users to Account Requests\n');
  
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
        address: requestData.address,
        city: requestData.city,
        state: requestData.state,
        zipCode: requestData.zipCode,
        emergencyContact: requestData.emergencyContact,
        emergencyPhone: requestData.emergencyPhone,
        medicalInfo: requestData.medicalInfo,
        dietaryRestrictions: requestData.dietaryRestrictions,
        specialNeeds: requestData.specialNeeds,
        parentGuardian: requestData.parentGuardian,
        parentPhone: requestData.parentPhone,
        parentEmail: requestData.parentEmail,
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
          createdAt: authUser.metadata.creationTime,
          lastSignIn: authUser.metadata.lastSignInTime,
          providers: authUser.providerData.map(p => p.providerId),
          hasRequest: !!matchingRequest,
          request: matchingRequest
        });
      }
    });
    
    console.log(`🔍 Found ${orphanedUsers.length} orphaned users\n`);
    
    const usersWithRequests = orphanedUsers.filter(user => user.hasRequest);
    const usersWithoutRequests = orphanedUsers.filter(user => !user.hasRequest);
    
    console.log(`📊 Summary:`);
    console.log(`   Users with account requests: ${usersWithRequests.length}`);
    console.log(`   Users without account requests: ${usersWithoutRequests.length}\n`);
    
    // Auto-link users with requests
    if (usersWithRequests.length > 0) {
      console.log('🔗 Auto-linking users with account requests...\n');
      
      for (const user of usersWithRequests) {
        try {
          console.log(`🔗 Linking ${user.email} to account request...`);
          
          // Create user document with pending status
          const userDoc = {
            email: user.email,
            displayName: user.displayName || user.request.displayName || '',
            status: 'pending',
            role: 'parent',
            permissions: [
              'read_content',
              'create_content',
              'update_content',
              'family_management',
              'family_events',
              'family_rsvp',
              'family_volunteer',
              'scout_content',
              'scout_events',
              'scout_chat',
              'chat_read',
              'chat_write',
              'den_members'
            ],
            authProvider: 'google',
            profile: {
              firstName: user.request.firstName || '',
              lastName: user.request.lastName || '',
              phone: user.request.phone || '',
              address: user.request.address || '',
              city: user.request.city || '',
              state: user.request.state || '',
              zipCode: user.request.zipCode || '',
              emergencyContact: user.request.emergencyContact || '',
              emergencyPhone: user.request.emergencyPhone || '',
              medicalInfo: user.request.medicalInfo || '',
              dietaryRestrictions: user.request.dietaryRestrictions || '',
              specialNeeds: user.request.specialNeeds || '',
              den: user.request.den || '',
              rank: user.request.scoutRank || '',
              parentGuardian: user.request.parentGuardian || '',
              parentPhone: user.request.parentPhone || '',
              parentEmail: user.request.parentEmail || '',
              socialData: {
                google: {
                  id: user.uid,
                  email: user.email,
                  name: user.displayName,
                  verifiedEmail: user.emailVerified
                }
              }
            },
            preferences: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedAt: null,
            approvedBy: null
          };
          
          // Create the user document
          await db.collection('users').doc(user.uid).set(userDoc);
          
          // Update the account request to mark it as linked
          await db.collection('accountRequests').doc(user.request.id).update({
            linkedUserId: user.uid,
            linkedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'linked'
          });
          
          console.log(`✅ Successfully linked ${user.email} to account request`);
          console.log(`   - Created pending user document`);
          console.log(`   - Updated account request status to 'linked'`);
          console.log(`   - User is now ready for approval\n`);
          
        } catch (error) {
          console.error(`❌ Error linking ${user.email}:`, error.message);
        }
      }
    }
    
    // Show users without requests
    if (usersWithoutRequests.length > 0) {
      console.log('⚠️  Users without account requests:');
      usersWithoutRequests.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.displayName} (${user.email})`);
      });
      console.log('\n   These users tried to sign in with Google but never submitted account requests.');
      console.log('   You may want to delete them from Firebase Auth or ask them to submit requests.\n');
    }
    
    console.log('✅ Auto-linking complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Check your email for approval notifications');
    console.log('   2. Go to Admin Panel > User Management');
    console.log('   3. Approve the newly linked users');
    console.log('   4. Users will then have full access to the system');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the auto-linking
autoLinkOrphanedUsers().then(() => {
  console.log('\n🎉 Process complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Process failed:', error);
  process.exit(1);
});

