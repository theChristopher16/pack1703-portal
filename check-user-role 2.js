#!/usr/bin/env node

/**
 * Check User Role Script
 * This script checks what role a user has in the database
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

async function checkUserRole() {
  console.log('🔍 Checking user role for christophersmithm16@gmail.com...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // User ID from the logs
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    
    console.log('📋 Fetching user document...');
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('❌ User document not found in Firestore');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    console.log('👤 User data:', JSON.stringify(userData, null, 2));
    
    // Check role
    console.log('\n🔍 Role Analysis:');
    console.log('  Role:', userData.role || 'undefined');
    console.log('  isAdmin:', userData.isAdmin || false);
    console.log('  isDenLeader:', userData.isDenLeader || false);
    console.log('  isCubmaster:', userData.isCubmaster || false);
    console.log('  Permissions:', userData.permissions || []);
    
    // Check if user has admin permissions
    const hasAdminRole = userData.role === 'root' || userData.role === 'admin' || userData.role === 'leader';
    const hasLegacyPermissions = userData.isAdmin || userData.isDenLeader || userData.isCubmaster;
    const hasEventManagementPermission = userData.permissions?.includes('event_management');
    
    console.log('\n✅ Permission Check:');
    console.log('  hasAdminRole:', hasAdminRole);
    console.log('  hasLegacyPermissions:', hasLegacyPermissions);
    console.log('  hasEventManagementPermission:', hasEventManagementPermission);
    
    if (!hasAdminRole && !hasLegacyPermissions && !hasEventManagementPermission) {
      console.log('\n❌ User does NOT have admin permissions');
      console.log('   This explains the 403 Forbidden error');
      console.log('   The user needs one of:');
      console.log('   - role: "root", "admin", or "leader"');
      console.log('   - isAdmin: true');
      console.log('   - isDenLeader: true');
      console.log('   - isCubmaster: true');
      console.log('   - permissions: ["event_management"]');
    } else {
      console.log('\n✅ User HAS admin permissions');
      console.log('   The 403 error might be due to a different issue');
    }
    
  } catch (error) {
    console.error('❌ Error checking user role:', error.message);
    process.exit(1);
  }
}

// Run the check
checkUserRole();
