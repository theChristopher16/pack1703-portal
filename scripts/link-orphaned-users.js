#!/usr/bin/env node

/**
 * Link Orphaned Users to Account Requests Script
 * 
 * This script finds orphaned Firebase Auth users and links them to their
 * account requests, creating proper Firestore user documents for approval.
 * 
 * Usage: node scripts/link-orphaned-users.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../service-account-key.json');
} catch (error) {
  console.log('❌ Service account key not found.');
  console.log('📋 Please download it from Firebase Console:');
  console.log('   1. Go to: https://console.firebase.google.com/project/pack1703-portal/settings/serviceaccounts/adminsdk');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Save as: service-account-key.json in project root');
  console.log('   4. Run this script again');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function findOrphanedUsers() {
  console.log('🔍 Finding orphaned Firebase Auth users...\n');
  
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
      // Check if they have a corresponding account request
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
  
  return { orphanedUsers, accountRequests };
}

async function displayOrphanedUsers(orphanedUsers) {
  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found!');
    return;
  }
  
  console.log(`🚨 Found ${orphanedUsers.length} orphaned Firebase Auth users:\n`);
  
  orphanedUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.displayName} (${user.email})`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Providers: ${user.providers.join(', ')}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Last Sign In: ${user.lastSignIn || 'Never'}`);
    console.log(`   Has Account Request: ${user.hasRequest ? '✅ Yes' : '❌ No'}`);
    
    if (user.hasRequest) {
      console.log(`   Request Status: ${user.request.status}`);
      console.log(`   Request Created: ${user.request.createdAt ? user.request.createdAt.toLocaleString() : 'Unknown'}`);
    }
    console.log('');
  });
}

async function linkUserToRequest(user, request) {
  try {
    console.log(`🔗 Linking ${user.email} to account request...`);
    
    // Create user document with pending status
    const userDoc = {
      email: user.email,
      displayName: user.displayName || request.displayName || '',
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
        firstName: request.firstName || '',
        lastName: request.lastName || '',
        phone: request.phone || '',
        address: request.address || '',
        city: request.city || '',
        state: request.state || '',
        zipCode: request.zipCode || '',
        emergencyContact: request.emergencyContact || '',
        emergencyPhone: request.emergencyPhone || '',
        medicalInfo: request.medicalInfo || '',
        dietaryRestrictions: request.dietaryRestrictions || '',
        specialNeeds: request.specialNeeds || '',
        den: request.den || '',
        rank: request.scoutRank || '',
        parentGuardian: request.parentGuardian || '',
        parentPhone: request.parentPhone || '',
        parentEmail: request.parentEmail || '',
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
    await db.collection('accountRequests').doc(request.id).update({
      linkedUserId: user.uid,
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'linked'
    });
    
    // Send approval notification email
    try {
      const { emailService } = await import('../functions/src/emailService.js');
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || request.displayName || '',
        phone: request.phone || '',
        address: request.address || '',
        emergencyContact: request.emergencyContact || '',
        medicalInfo: request.medicalInfo || ''
      };
      
      await emailService.sendUserApprovalNotification(userData);
      console.log(`✅ Approval notification email sent for ${user.email}`);
    } catch (emailError) {
      console.log(`⚠️  Failed to send approval email for ${user.email}:`, emailError.message);
    }
    
    console.log(`✅ Successfully linked ${user.email} to account request`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error linking ${user.email}:`, error.message);
    return false;
  }
}

async function interactiveMode(orphanedUsers) {
  console.log('\n📝 Interactive Mode');
  console.log('For each orphaned user, choose an action:\n');
  console.log('  [l] Link - Link to account request and create pending user');
  console.log('  [d] Delete - Delete from Firebase Auth (no account request)');
  console.log('  [s] Skip - Leave as is');
  console.log('  [q] Quit\n');
  
  for (let i = 0; i < orphanedUsers.length; i++) {
    const user = orphanedUsers[i];
    
    console.log(`\n--- User ${i + 1} of ${orphanedUsers.length} ---`);
    console.log(`Name: ${user.displayName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Has Request: ${user.hasRequest ? 'Yes' : 'No'}`);
    console.log(`Created: ${user.createdAt}`);
    
    if (user.hasRequest) {
      console.log(`Request Status: ${user.request.status}`);
      console.log(`Request Created: ${user.request.createdAt ? user.request.createdAt.toLocaleString() : 'Unknown'}`);
    }
    
    const action = await question('\nAction? [l/d/s/q]: ');
    
    switch (action.toLowerCase().trim()) {
      case 'l':
        if (user.hasRequest) {
          const success = await linkUserToRequest(user, user.request);
          if (success) {
            console.log(`✅ ${user.email} linked successfully!`);
          }
        } else {
          console.log('❌ Cannot link - no account request found');
        }
        break;
      case 'd':
        const confirm = await question('⚠️  Are you sure you want to delete this user? [y/N]: ');
        if (confirm.toLowerCase().trim() === 'y') {
          try {
            await auth.deleteUser(user.uid);
            console.log(`🗑️  ${user.email} deleted from Firebase Auth`);
          } catch (error) {
            console.error(`❌ Error deleting ${user.email}:`, error.message);
          }
        } else {
          console.log('   Cancelled.');
        }
        break;
      case 's':
        console.log('   Skipped.');
        break;
      case 'q':
        console.log('\n👋 Exiting...');
        return;
      default:
        console.log('   Invalid action. Skipping...');
    }
  }
  
  console.log('\n✅ All users processed!');
}

async function batchMode(orphanedUsers, action) {
  console.log(`\n📦 Batch Mode: ${action} all users with account requests`);
  
  const usersWithRequests = orphanedUsers.filter(user => user.hasRequest);
  
  if (usersWithRequests.length === 0) {
    console.log('No users with account requests found.');
    return;
  }
  
  const confirm = await question(`⚠️  This will ${action} ${usersWithRequests.length} user(s). Continue? [y/N]: `);
  
  if (confirm.toLowerCase().trim() !== 'y') {
    console.log('Cancelled.');
    return;
  }
  
  for (const user of usersWithRequests) {
    await linkUserToRequest(user, user.request);
  }
  
  console.log('\n✅ Batch operation complete!');
}

async function main() {
  console.log('🚀 Link Orphaned Users to Account Requests\n');
  console.log('This script links orphaned Firebase Auth users to their account requests.\n');
  
  try {
    const { orphanedUsers, accountRequests } = await findOrphanedUsers();
    await displayOrphanedUsers(orphanedUsers);
    
    if (orphanedUsers.length === 0) {
      rl.close();
      return;
    }
    
    const usersWithRequests = orphanedUsers.filter(user => user.hasRequest);
    const usersWithoutRequests = orphanedUsers.filter(user => !user.hasRequest);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Users with account requests: ${usersWithRequests.length}`);
    console.log(`   Users without account requests: ${usersWithoutRequests.length}`);
    console.log(`   Total orphaned users: ${orphanedUsers.length}\n`);
    
    console.log('How would you like to proceed?\n');
    console.log('  [1] Interactive mode - Review each user individually');
    console.log('  [2] Batch link all users with requests');
    console.log('  [3] Exit\n');
    
    const mode = await question('Choose mode [1-3]: ');
    
    switch (mode.trim()) {
      case '1':
        await interactiveMode(orphanedUsers);
        break;
      case '2':
        await batchMode(orphanedUsers, 'link');
        break;
      case '3':
        console.log('👋 Exiting...');
        break;
      default:
        console.log('Invalid option. Exiting...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();

