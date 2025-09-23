#!/usr/bin/env node

/**
 * Update User Role Script
 * This script calls the updateUserRole Cloud Function to fix permission issues
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
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
    const functions = getFunctions(app, 'us-central1');
    const auth = getAuth(app);
    
    // User details from the logs
    const userEmail = 'christophersmithm16@gmail.com';
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    
    console.log('🔐 Signing in...');
    // Note: This requires the user's password, which we don't have
    // Instead, we'll create a simple HTML page that the user can run in their browser
    
    console.log('❌ Cannot sign in programmatically without password');
    console.log('📝 Please run this in your browser console instead:');
    console.log('');
    console.log('// Copy and paste this into your browser console:');
    console.log('const updateUserRole = firebase.functions().httpsCallable("updateUserRole");');
    console.log('updateUserRole({');
    console.log('  userId: "biD4B9cWVWgOPxJlOZgGKifDJst2",');
    console.log('  newRole: "admin",');
    console.log('  email: "christophersmithm16@gmail.com"');
    console.log('}).then(result => {');
    console.log('  console.log("✅ Role updated:", result.data);');
    console.log('}).catch(error => {');
    console.log('  console.error("❌ Error:", error);');
    console.log('});');
    console.log('');
    console.log('🎯 This will update your role to admin so you can manage events!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the update
updateUserRole();
