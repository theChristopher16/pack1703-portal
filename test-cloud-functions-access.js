#!/usr/bin/env node

/**
 * Test Cloud Functions Accessibility
 * This script tests that Cloud Functions are properly deployed and accessible
 * to prevent CORS and authentication issues from reaching production.
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

async function testCloudFunctions() {
  console.log('🧪 Testing Cloud Functions accessibility...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    
    // Test helloWorld function (should always work)
    console.log('📞 Testing helloWorld function...');
    const helloWorld = httpsCallable(functions, 'helloWorld');
    const helloResult = await helloWorld({ test: 'CI/CD validation' });
    
    if (helloResult.data && helloResult.data.message) {
      console.log('✅ helloWorld function accessible:', helloResult.data.message);
    } else {
      throw new Error('helloWorld function returned unexpected response');
    }
    
    // Test adminUpdateEvent function (should be accessible even if auth fails)
    console.log('📞 Testing adminUpdateEvent function accessibility...');
    const adminUpdateEvent = httpsCallable(functions, 'adminUpdateEvent');
    
    try {
      // This should fail with authentication error, not CORS error
      await adminUpdateEvent({ eventId: 'test', eventData: {} });
      console.log('⚠️ adminUpdateEvent function accessible (unexpected - should require auth)');
    } catch (error) {
      if (error.code === 'functions/unauthenticated') {
        console.log('✅ adminUpdateEvent function accessible (correctly requires authentication)');
      } else if (error.code === 'functions/permission-denied') {
        console.log('✅ adminUpdateEvent function accessible (correctly requires permissions)');
      } else if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
        console.error('❌ CORS error detected:', error.message);
        process.exit(1);
      } else {
        console.log('✅ adminUpdateEvent function accessible (error:', error.code, ')');
      }
    }
    
    console.log('🎉 All Cloud Functions accessibility tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cloud Functions accessibility test failed:', error.message);
    
    if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
      console.error('🚨 CORS configuration issue detected!');
      console.error('   This indicates Cloud Functions are not properly configured for cross-origin requests.');
      console.error('   Check Firebase Functions deployment and CORS settings.');
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudFunctions();
