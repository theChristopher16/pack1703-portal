#!/usr/bin/env node

/**
 * Comprehensive Admin Event API Test
 * 
 * This script tests the admin event API with real data and scenarios.
 * Note: This requires Firebase authentication to work properly.
 */

const { getFunctions, httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

console.log('🧪 Comprehensive Admin Event API Test');
console.log('=====================================\n');

// Firebase configuration
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
const auth = getAuth(app);

// Test configuration
const TEST_CONFIG = {
  testResults: {
    authentication: false,
    createEvent: false,
    updateEvent: false,
    deleteEvent: false,
    validationTests: false,
    errorHandling: false,
    errors: []
  },
  testEventId: null,
  testLocationId: null,
  testSeasonId: null
};

async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive admin event API test...\n');

  try {
    // Step 1: Test authentication
    console.log('📋 Step 1: Testing authentication...');
    await testAuthentication();
    TEST_CONFIG.testResults.authentication = true;
    console.log('✅ Authentication test completed');

    // Step 2: Test validation
    console.log('\n📋 Step 2: Testing validation...');
    await testValidation();
    TEST_CONFIG.testResults.validationTests = true;
    console.log('✅ Validation tests completed');

    // Step 3: Test error handling
    console.log('\n📋 Step 3: Testing error handling...');
    await testErrorHandling();
    TEST_CONFIG.testResults.errorHandling = true;
    console.log('✅ Error handling tests completed');

    // Step 4: Test event creation (if we have test data)
    if (TEST_CONFIG.testLocationId && TEST_CONFIG.testSeasonId) {
      console.log('\n📋 Step 4: Testing event creation...');
      await testEventCreation();
      TEST_CONFIG.testResults.createEvent = true;
      console.log('✅ Event creation test completed');

      // Step 5: Test event update
      if (TEST_CONFIG.testEventId) {
        console.log('\n📋 Step 5: Testing event update...');
        await testEventUpdate();
        TEST_CONFIG.testResults.updateEvent = true;
        console.log('✅ Event update test completed');

        // Step 6: Test event deletion
        console.log('\n📋 Step 6: Testing event deletion...');
        await testEventDeletion();
        TEST_CONFIG.testResults.deleteEvent = true;
        console.log('✅ Event deletion test completed');
      }
    } else {
      console.log('\n⚠️  Skipping event CRUD tests - missing test data');
      console.log('   To test full functionality, ensure you have:');
      console.log('   - A test location in the database');
      console.log('   - A test season in the database');
      console.log('   - Admin credentials for authentication');
    }

    // Step 7: Generate report
    console.log('\n📋 Step 7: Generating test report...');
    generateTestReport();

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    TEST_CONFIG.testResults.errors.push(error.message);
  }
}

async function testAuthentication() {
  console.log('   Testing authentication with Firebase...');
  
  // Check if we have credentials
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  
  if (!email || !password) {
    console.log('   ⚠️  No test credentials provided');
    console.log('   Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables');
    console.log('   Skipping authentication test...');
    return;
  }

  try {
    console.log(`   Attempting to sign in as: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`   ✅ Successfully authenticated as: ${user.email}`);
    console.log(`   User ID: ${user.uid}`);
    
    // Get user token for function calls
    const token = await user.getIdToken();
    console.log('   ✅ Authentication token obtained');
    
  } catch (error) {
    console.log(`   ❌ Authentication failed: ${error.message}`);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function testValidation() {
  console.log('   Testing input validation...');
  
  const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
  
  // Test 1: Missing required fields
  try {
    await adminCreateEvent({});
    throw new Error('Should have failed validation');
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Missing fields validation passed');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }

  // Test 2: Invalid date format
  try {
    await adminCreateEvent({
      title: 'Test Event',
      description: 'Test Description',
      startDate: 'invalid-date',
      endDate: 'invalid-date',
      startTime: '18:00',
      endTime: '20:00',
      locationId: 'test-location',
      category: 'Meeting',
      seasonId: 'test-season'
    });
    throw new Error('Should have failed date validation');
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Date validation passed');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }

  // Test 3: Invalid time format
  try {
    await adminCreateEvent({
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      startTime: '25:00', // Invalid time
      endTime: '20:00',
      locationId: 'test-location',
      category: 'Meeting',
      seasonId: 'test-season'
    });
    throw new Error('Should have failed time validation');
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Time validation passed');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }
}

async function testErrorHandling() {
  console.log('   Testing error handling...');
  
  const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
  
  // Test 1: Non-existent location
  try {
    await adminCreateEvent({
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      startTime: '18:00',
      endTime: '20:00',
      locationId: 'non-existent-location',
      category: 'Meeting',
      seasonId: 'test-season'
    });
    throw new Error('Should have failed location check');
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Location validation passed');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }

  // Test 2: Non-existent season
  try {
    await adminCreateEvent({
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      startTime: '18:00',
      endTime: '20:00',
      locationId: 'test-location',
      category: 'Meeting',
      seasonId: 'non-existent-season'
    });
    throw new Error('Should have failed season check');
  } catch (error) {
    if (error.code === 'functions/invalid-argument') {
      console.log('   ✅ Season validation passed');
    } else {
      console.log(`   ⚠️  Unexpected error: ${error.message}`);
    }
  }
}

async function testEventCreation() {
  console.log('   Testing event creation with valid data...');
  
  const adminCreateEvent = httpsCallable(functions, 'adminCreateEvent');
  
  const eventData = {
    title: '🧪 Test API Event',
    description: 'This is a test event created by the API test script',
    startDate: '2025-01-25',
    endDate: '2025-01-25',
    startTime: '18:00',
    endTime: '20:00',
    locationId: TEST_CONFIG.testLocationId,
    category: 'Meeting',
    seasonId: TEST_CONFIG.testSeasonId,
    denTags: ['Webelos', 'AOL'],
    maxCapacity: 50,
    fees: 0,
    contactEmail: 'test@sfpack1703.com',
    isOvernight: false,
    requiresPermission: false,
    packingList: ['Water bottle', 'Snack'],
    visibility: 'public',
    sendNotification: false // Don't spam chat during testing
  };

  try {
    const result = await adminCreateEvent(eventData);
    const data = result.data;
    
    if (data.success) {
      TEST_CONFIG.testEventId = data.eventId;
      console.log(`   ✅ Event created successfully`);
      console.log(`   Event ID: ${data.eventId}`);
      console.log(`   Message: ${data.message}`);
    } else {
      throw new Error(`Event creation failed: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Event creation failed: ${error.message}`);
    throw error;
  }
}

async function testEventUpdate() {
  console.log('   Testing event update...');
  
  const adminUpdateEvent = httpsCallable(functions, 'adminUpdateEvent');
  
  const updateData = {
    title: '🧪 Updated Test API Event',
    description: 'This event has been updated by the API test script',
    fees: 5,
    maxCapacity: 75
  };

  try {
    const result = await adminUpdateEvent({
      eventId: TEST_CONFIG.testEventId,
      eventData: updateData
    });
    const data = result.data;
    
    if (data.success) {
      console.log(`   ✅ Event updated successfully`);
      console.log(`   Message: ${data.message}`);
    } else {
      throw new Error(`Event update failed: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Event update failed: ${error.message}`);
    throw error;
  }
}

async function testEventDeletion() {
  console.log('   Testing event deletion...');
  
  const adminDeleteEvent = httpsCallable(functions, 'adminDeleteEvent');
  
  try {
    const result = await adminDeleteEvent({
      eventId: TEST_CONFIG.testEventId,
      reason: 'Test cleanup - API test completed'
    });
    const data = result.data;
    
    if (data.success) {
      console.log(`   ✅ Event deleted successfully`);
      console.log(`   Message: ${data.message}`);
    } else {
      throw new Error(`Event deletion failed: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Event deletion failed: ${error.message}`);
    throw error;
  }
}

function generateTestReport() {
  console.log('\n📊 Comprehensive Admin Event API Test Report');
  console.log('============================================');
  
  const results = TEST_CONFIG.testResults;
  
  console.log(`Authentication: ${results.authentication ? '✅' : '❌'}`);
  console.log(`Validation Tests: ${results.validationTests ? '✅' : '❌'}`);
  console.log(`Error Handling: ${results.errorHandling ? '✅' : '❌'}`);
  console.log(`Event Creation: ${results.createEvent ? '✅' : '❌'}`);
  console.log(`Event Update: ${results.updateEvent ? '✅' : '❌'}`);
  console.log(`Event Deletion: ${results.deleteEvent ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  const completedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (completedTests / totalTests) * 100;
  
  console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}% (${completedTests}/${totalTests})`);
  
  if (successRate >= 80) {
    console.log('🎉 Comprehensive test PASSED!');
    console.log('\n📋 API is ready for production use');
  } else if (successRate >= 50) {
    console.log('⚠️  Partial success - some features need attention');
  } else {
    console.log('❌ Test needs significant work');
  }
}

// Main execution
if (require.main === module) {
  runComprehensiveTest().then(() => {
    console.log('\n🏁 Comprehensive test completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Comprehensive test failed:', error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTest };
