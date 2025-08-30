// Test script for Cloud Functions
// Run this after starting the Firebase emulator

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to emulator
connectFunctionsEmulator(functions, 'localhost', 5001);

console.log('🧪 Testing Cloud Functions...\n');

// Test 1: Hello World Function
async function testHelloWorld() {
  console.log('1️⃣ Testing helloWorld function...');
  try {
    const helloWorld = httpsCallable(functions, 'helloWorld');
    const result = await helloWorld({ test: 'Hello from test script!' });
    console.log('✅ helloWorld success:', result.data);
  } catch (error) {
    console.log('❌ helloWorld error:', error.message);
  }
  console.log('');
}

// Test 2: Submit RSVP Function
async function testSubmitRSVP() {
  console.log('2️⃣ Testing submitRSVP function...');
  try {
    const submitRSVP = httpsCallable(functions, 'submitRSVP');
    const testData = {
      eventId: 'test-event-001',
      familyName: 'Test Family',
      email: 'test@example.com',
      phone: '555-123-4567',
      attendees: [
        {
          name: 'John Doe',
          age: 35,
          den: 'Adult',
          isAdult: true
        },
        {
          name: 'Jane Doe',
          age: 8,
          den: 'Wolves',
          isAdult: false
        }
      ],
      dietaryRestrictions: 'None',
      specialNeeds: 'None',
      notes: 'Test RSVP submission',
      ipHash: 'test-ip-hash-123',
      userAgent: 'Test User Agent'
    };
    
    const result = await submitRSVP(testData);
    console.log('✅ submitRSVP success:', result.data);
  } catch (error) {
    console.log('❌ submitRSVP error:', error.message);
  }
  console.log('');
}

// Test 3: Submit Feedback Function
async function testSubmitFeedback() {
  console.log('3️⃣ Testing submitFeedback function...');
  try {
    const submitFeedback = httpsCallable(functions, 'submitFeedback');
    const testData = {
      category: 'general',
      rating: 5,
      title: 'Great Portal!',
      message: 'This is a test feedback submission. The portal looks amazing!',
      contactEmail: 'feedback@example.com',
      contactName: 'Test User',
      ipHash: 'test-ip-hash-456',
      userAgent: 'Test User Agent'
    };
    
    const result = await submitFeedback(testData);
    console.log('✅ submitFeedback success:', result.data);
  } catch (error) {
    console.log('❌ submitFeedback error:', error.message);
  }
  console.log('');
}

// Test 4: Claim Volunteer Role Function
async function testClaimVolunteerRole() {
  console.log('4️⃣ Testing claimVolunteerRole function...');
  try {
    const claimVolunteerRole = httpsCallable(functions, 'claimVolunteerRole');
    const testData = {
      volunteerNeedId: 'test-volunteer-001',
      volunteerName: 'Test Volunteer',
      email: 'volunteer@example.com',
      phone: '555-987-6543',
      age: 25,
      skills: ['Leadership', 'First Aid'],
      availability: 'Weekends and evenings',
      experience: '5 years of scouting experience',
      specialNeeds: 'None',
      emergencyContact: 'Emergency Contact: 555-000-0000',
      ipHash: 'test-ip-hash-789',
      userAgent: 'Test User Agent'
    };
    
    const result = await claimVolunteerRole(testData);
    console.log('✅ claimVolunteerRole success:', result.data);
  } catch (error) {
    console.log('❌ claimVolunteerRole error:', error.message);
  }
  console.log('');
}

// Test 5: ICS Feed Function
async function testICSFeed() {
  console.log('5️⃣ Testing icsFeed function...');
  try {
    const icsFeed = httpsCallable(functions, 'icsFeed');
    const testData = {
      season: 'Fall 2024',
      categories: ['campout', 'meeting'],
      denTags: ['Wolves', 'Bears'],
      startDate: '2024-10-01',
      endDate: '2024-12-31'
    };
    
    const result = await icsFeed(testData);
    console.log('✅ icsFeed success:', result.data);
    console.log('📅 ICS Content Preview:', result.data.icsContent.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ icsFeed error:', error.message);
  }
  console.log('');
}

// Test 6: Weather Proxy Function
async function testWeatherProxy() {
  console.log('6️⃣ Testing weatherProxy function...');
  try {
    const weatherProxy = httpsCallable(functions, 'weatherProxy');
    const testData = {
      latitude: 40.7128,
      longitude: -74.0060
    };
    
    const result = await weatherProxy(testData);
    console.log('✅ weatherProxy success:', result.data);
    console.log('🌤️ Weather data received:', Object.keys(result.data.weather));
  } catch (error) {
    console.log('❌ weatherProxy error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Cloud Functions tests...\n');
  
  await testHelloWorld();
  await testSubmitRSVP();
  await testSubmitFeedback();
  await testClaimVolunteerRole();
  await testICSFeed();
  await testWeatherProxy();
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check the Firebase emulator console for logs');
  console.log('2. Verify data appears in Firestore emulator');
  console.log('3. Check for any error messages');
  console.log('4. Test rate limiting by running the same function multiple times');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHelloWorld,
  testSubmitRSVP,
  testSubmitFeedback,
  testClaimVolunteerRole,
  testICSFeed,
  testWeatherProxy,
  runAllTests
};
