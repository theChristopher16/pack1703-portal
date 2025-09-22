#!/usr/bin/env node

/**
 * Update User Role Script
 * This script updates a user's role to admin so they can manage events
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

async function updateUserRole() {
  console.log('🔧 Updating user role to admin...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // User details from the logs
    const userEmail = 'christophersmithm16@gmail.com';
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    
    console.log('📋 Checking current user role...');
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('❌ User document not found in Firestore');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    console.log('👤 Current user data:');
    console.log('  Role:', userData.role);
    console.log('  isAdmin:', userData.isAdmin);
    console.log('  isDenLeader:', userData.isDenLeader);
    console.log('  isCubmaster:', userData.isCubmaster);
    
    // Update user role to admin
    console.log('🔧 Updating user role to admin...');
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      isAdmin: true,
      isDenLeader: true,
      isCubmaster: true,
      permissions: [
        'event_management',
        'pack_management',
        'user_management',
        'location_management',
        'announcement_management'
      ],
      updatedAt: new Date()
    });
    
    console.log('✅ User role updated successfully!');
    console.log('   Role: admin');
    console.log('   isAdmin: true');
    console.log('   isDenLeader: true');
    console.log('   isCubmaster: true');
    console.log('   Permissions: event_management, pack_management, user_management, location_management, announcement_management');
    
    console.log('\n🎉 You should now be able to update events!');
    console.log('   Try updating an event again in the browser.');
    
  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
    process.exit(1);
  }
}

// Run the update
updateUserRole();
