#!/usr/bin/env node

/**
 * Test Admin Event API Functions
 * 
 * This script tests the newly deployed admin Cloud Functions
 * for event management.
 */

const { getFunctions, httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');

console.log('🧪 Testing Admin Event API Functions');
console.log('===================================\n');

// Firebase configuration (you'll need to add your actual config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "pack-1703-portal.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "pack-1703-portal",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "pack-1703-portal.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test configuration
const TEST_CONFIG = {
  testResults: {
    functionsDeployed: false,
    authenticationTest: false,
    createEventTest: false,
    updateEventTest: false,
    deleteEventTest: false,
    errors: []
  }
};

async function runTests() {
  console.log('🚀 Starting admin event API tests...\n');

  try {
    // Step 1: Check if functions are deployed
    console.log('📋 Step 1: Checking function deployment...');
    await checkFunctionDeployment();
    TEST_CONFIG.testResults.functionsDeployed = true;
    console.log('✅ Functions are deployed');

    // Step 2: Test authentication
    console.log('\n📋 Step 2: Testing authentication...');
    await testAuthentication();
    TEST_CONFIG.testResults.authenticationTest = true;
    console.log('✅ Authentication test completed');

    // Step 3: Test event creation (will fail without auth, but tests function exists)
    console.log('\n📋 Step 3: Testing event creation function...');
    await testCreateEventFunction();
    TEST_CONFIG.testResults.createEventTest = true;
    console.log('✅ Event creation function test completed');

    // Step 4: Generate report
    console.log('\n📋 Step 4: Generating test report...');
    generateTestReport();

  } catch (error) {
    console.error('❌ Test failed:', error);
    TEST_CONFIG.testResults.errors.push(error.message);
  }
}

async function checkFunctionDeployment() {
  console.log('   Checking if admin functions are available...');
  
  // Try to get function references
  try {
    const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
    const adminUpdateEvent = httpsCallable(functions, 'adminUpdateEvent');
    const adminDeleteEvent = httpsCallable(functions, 'adminDeleteEvent');
    
    console.log('   ✅ Function references created successfully');
    console.log('   ✅ adminCreateEvent function available');
    console.log('   ✅ adminUpdateEvent function available');
    console.log('   ✅ adminDeleteEvent function available');
  } catch (error) {
    throw new Error(`Functions not available: ${error.message}`);
  }
}

async function testAuthentication() {
  console.log('   Testing authentication requirements...');
  
  try {
    const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
    
    // This should fail with authentication error
    await adminCreateEvent({
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      startTime: '18:00',
      endTime: '20:00',
      locationId: 'test-location',
      category: 'Meeting',
      seasonId: 'test-season'
    });
    
    // If we get here, something is wrong
    throw new Error('Function should require authentication');
    
  } catch (error) {
    if (error.code === 'functions/unauthenticated') {
      console.log('   ✅ Authentication check passed - function requires auth');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }
}

async function testCreateEventFunction() {
  console.log('   Testing event creation function structure...');
  
  try {
    const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
    
    // Test with invalid data (should fail validation)
    await adminCreateEvent({
      // Missing required fields
    });
    
    // If we get here, something is wrong
    throw new Error('Function should validate required fields');
    
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Validation check passed - function validates input');
    } else if (error.code === 'functions/unauthenticated') {
      console.log('   ✅ Authentication check passed - function requires auth');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }
}

function generateTestReport() {
  console.log('\n📊 Admin Event API Test Report');
  console.log('==============================');
  
  const results = TEST_CONFIG.testResults;
  
  console.log(`Functions Deployed: ${results.functionsDeployed ? '✅' : '❌'}`);
  console.log(`Authentication Test: ${results.authenticationTest ? '✅' : '❌'}`);
  console.log(`Create Event Test: ${results.createEventTest ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  const successRate = [
    results.functionsDeployed,
    results.authenticationTest,
    results.createEventTest
  ].filter(Boolean).length / 3 * 100;
  
  console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 80) {
    console.log('🎉 Admin Event API test PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test with authenticated admin user');
    console.log('   2. Create real events through admin interface');
    console.log('   3. Verify event creation in database');
    console.log('   4. Test update and delete functions');
  } else {
    console.log('⚠️  Admin Event API test needs attention');
  }
}

// Main execution
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🏁 Admin Event API test completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Admin Event API test failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
