#!/usr/bin/env node

/**
 * List Admin Users Script
 * 
 * This script lists all admin users in the system.
 * 
 * Usage: node list-admin-users.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAdminUsers() {
  try {
    console.log('🔍 Admin Users in the system:');
    console.log('============================\n');
    
    // Get all users
    const usersQuery = await db.collection('users').get();

    if (usersQuery.empty) {
      console.log('   No users found');
      return;
    }

    let adminCount = 0;
    usersQuery.docs.forEach((doc, index) => {
      const userData = doc.data();
      const isAdmin = userData.role === 'admin' || 
                     userData.role === 'root' || 
                     userData.profile?.isAdmin === true ||
                     userData.profile?.isCubmaster === true ||
                     userData.profile?.isDenLeader === true;
      
      if (isAdmin) {
        adminCount++;
        console.log(`   ${adminCount}. ${userData.displayName || 'Unknown'}`);
        console.log(`      Email: ${userData.email}`);
        console.log(`      Role: ${userData.role}`);
        console.log(`      Profile Flags:`);
        console.log(`        - isAdmin: ${userData.profile?.isAdmin || false}`);
        console.log(`        - isCubmaster: ${userData.profile?.isCubmaster || false}`);
        console.log(`        - isDenLeader: ${userData.profile?.isDenLeader || false}`);
        console.log(`        - isAI: ${userData.profile?.isAI || false}`);
        console.log(`      Permissions: ${userData.permissions?.length || 0} total`);
        if (userData.permissions?.length > 0) {
          const aiPermissions = userData.permissions.filter(p => p.startsWith('ai_'));
          console.log(`        - AI Permissions: ${aiPermissions.length}`);
        }
        console.log('');
      }
    });

    console.log(`Total admin users found: ${adminCount}`);

  } catch (error) {
    console.error('❌ Error listing admin users:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Admin Users List Script');
    console.log('==========================\n');

    await listAdminUsers();

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { listAdminUsers };