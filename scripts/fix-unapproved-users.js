#!/usr/bin/env node

/**
 * Fix Unapproved Users Script
 * 
 * This script identifies users who bypassed the approval system (typically through social login)
 * and allows the admin to either:
 * 1. Approve them with a specific role
 * 2. Set them to pending status (requires re-approval)
 * 3. Remove them from the system
 * 
 * Usage: node scripts/fix-unapproved-users.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../service-account-key.json');

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

async function findUnapprovedUsers() {
  console.log('🔍 Searching for users who bypassed the approval system...\n');
  
  const usersSnapshot = await db.collection('users').get();
  const problematicUsers = [];
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const userId = doc.id;
    
    // Skip AI assistant accounts
    if (userId === 'ai_solyn' || userId === 'ai_nova') {
      continue;
    }
    
    // Find users who are 'approved' but have no approvedBy or approvedAt
    // OR users who have no status field (old data structure)
    const hasApprovalMetadata = userData.approvedBy || userData.approvedAt;
    const isApproved = userData.status === 'approved' || !userData.status;
    
    if (isApproved && !hasApprovalMetadata) {
      // Check if this is the first/root user (they don't need approval)
      if (userData.role === 'super_admin') {
        console.log(`✅ Skipping root user: ${userData.email} (${userId})`);
        continue;
      }
      
      problematicUsers.push({
        uid: userId,
        email: userData.email,
        displayName: userData.displayName || 'Unknown',
        role: userData.role || 'parent',
        status: userData.status || 'approved',
        createdAt: userData.createdAt?.toDate?.() || new Date(),
        authProvider: userData.authProvider || 'unknown'
      });
    }
  }
  
  return problematicUsers;
}

async function displayUsers(users) {
  if (users.length === 0) {
    console.log('✅ No problematic users found! All users have proper approval records.\n');
    return;
  }
  
  console.log(`⚠️  Found ${users.length} user(s) who bypassed the approval system:\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.displayName} (${user.email})`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Auth Provider: ${user.authProvider}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    console.log('');
  });
}

async function fixUser(user, action, adminUid = 'system') {
  const userRef = db.collection('users').doc(user.uid);
  
  switch (action) {
    case 'approve':
      console.log(`✅ Approving ${user.email}...`);
      await userRef.update({
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Set custom claims in Firebase Auth
      await auth.setCustomUserClaims(user.uid, {
        approved: true,
        role: user.role
      });
      
      console.log(`✅ User ${user.email} approved successfully!`);
      break;
      
    case 'pending':
      console.log(`⏳ Setting ${user.email} to pending status...`);
      await userRef.update({
        status: 'pending',
        approvedAt: null,
        approvedBy: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Remove custom claims
      await auth.setCustomUserClaims(user.uid, {
        approved: false,
        role: user.role
      });
      
      console.log(`⏳ User ${user.email} set to pending. They will need admin approval.`);
      break;
      
    case 'remove':
      console.log(`🗑️  Removing ${user.email}...`);
      
      // Delete from Firestore
      await userRef.delete();
      
      // Delete from Firebase Auth
      try {
        await auth.deleteUser(user.uid);
        console.log(`🗑️  User ${user.email} removed successfully!`);
      } catch (error) {
        console.error(`❌ Error removing user from Auth: ${error.message}`);
        console.log('   User document deleted from Firestore, but Auth user may still exist.');
      }
      break;
      
    default:
      console.log(`⏭️  Skipping ${user.email}...`);
  }
}

async function interactiveMode(users) {
  console.log('\n📝 Interactive Mode');
  console.log('For each user, choose an action:\n');
  console.log('  [a] Approve - Approve the user with their current role');
  console.log('  [p] Pending - Set to pending status (requires admin approval)');
  console.log('  [r] Remove - Delete the user completely');
  console.log('  [s] Skip - Leave as is');
  console.log('  [q] Quit\n');
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    console.log(`\n--- User ${i + 1} of ${users.length} ---`);
    console.log(`Name: ${user.displayName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Created: ${user.createdAt.toLocaleString()}`);
    
    const action = await question('\nAction? [a/p/r/s/q]: ');
    
    switch (action.toLowerCase().trim()) {
      case 'a':
        await fixUser(user, 'approve');
        break;
      case 'p':
        await fixUser(user, 'pending');
        break;
      case 'r':
        const confirm = await question('⚠️  Are you sure? [y/N]: ');
        if (confirm.toLowerCase().trim() === 'y') {
          await fixUser(user, 'remove');
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

async function batchMode(users, action) {
  console.log(`\n📦 Batch Mode: ${action} all users`);
  
  const confirm = await question(`⚠️  This will ${action} ${users.length} user(s). Continue? [y/N]: `);
  
  if (confirm.toLowerCase().trim() !== 'y') {
    console.log('Cancelled.');
    return;
  }
  
  for (const user of users) {
    await fixUser(user, action);
  }
  
  console.log('\n✅ Batch operation complete!');
}

async function main() {
  console.log('🚀 Fix Unapproved Users Script\n');
  console.log('This script helps identify and fix users who bypassed the approval system.\n');
  
  try {
    const users = await findUnapprovedUsers();
    await displayUsers(users);
    
    if (users.length === 0) {
      rl.close();
      return;
    }
    
    console.log('How would you like to proceed?\n');
    console.log('  [1] Interactive mode - Review each user individually');
    console.log('  [2] Batch approve all');
    console.log('  [3] Batch set all to pending');
    console.log('  [4] Exit\n');
    
    const mode = await question('Choose mode [1-4]: ');
    
    switch (mode.trim()) {
      case '1':
        await interactiveMode(users);
        break;
      case '2':
        await batchMode(users, 'approve');
        break;
      case '3':
        await batchMode(users, 'pending');
        break;
      case '4':
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

