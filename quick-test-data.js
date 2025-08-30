// Quick test data creation for Cloud Functions
// This creates the minimum data needed for functions to work

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Set environment variable to use emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize Firebase Admin (this will work in the emulator)
const app = initializeApp({
  projectId: 'pack-1703-portal'
});

const db = getFirestore(app);

async function createTestData() {
  try {
    console.log('🚀 Starting to create test data...');
    console.log('🔌 Connecting to Firestore emulator at localhost:8080...');

    // Test the connection first
    console.log('🧪 Testing connection...');
    const testDoc = await db.collection('_test_connection').doc('test').get();
    console.log('✅ Connection successful!');

    // Create a test event for submitRSVP
    const testEvent = {
      id: 'test-event-001',
      title: 'Test Pack Meeting',
      description: 'A test event for RSVP testing',
      startDate: new Date('2025-09-15T18:00:00Z'),
      endDate: new Date('2025-09-15T19:30:00Z'),
      location: 'Test Location',
      maxAttendees: 50,
      currentAttendees: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create a test volunteer need for claimVolunteerRole
    const testVolunteerNeed = {
      id: 'test-volunteer-001',
      eventId: 'test-event-001',
      title: 'Test Volunteer Role',
      description: 'A test volunteer position',
      requiredCount: 2,
      claimedCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the test event
    console.log('📅 Creating test event...');
    await db.collection('events').doc('test-event-001').set(testEvent);
    console.log('✅ Test event created successfully');

    // Add the test volunteer need
    console.log('🤝 Creating test volunteer need...');
    await db.collection('volunteer-needs').doc('test-volunteer-001').set(testVolunteerNeed);
    console.log('✅ Test volunteer need created successfully');

    // Create a test season (required for some functions)
    const testSeason = {
      id: 'test-season-2025',
      name: 'Test Season 2025',
      startDate: new Date('2025-09-01T00:00:00Z'),
      endDate: new Date('2025-12-31T23:59:59Z'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🌱 Creating test season...');
    await db.collection('seasons').doc('test-season-2025').set(testSeason);
    console.log('✅ Test season created successfully');

    console.log('🎉 All test data created successfully!');
    console.log('📊 Test data summary:');
    console.log('   - 1 test event (ID: test-event-001)');
    console.log('   - 1 test volunteer need (ID: test-volunteer-001)');
    console.log('   - 1 test season (ID: test-season-2025)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 The Firestore emulator is not running or not accessible.');
      console.error('   Please start the emulator first with:');
      console.error('   firebase emulators:start --only functions,firestore');
    }
    process.exit(1);
  }
}

// Add timeout protection
const timeout = setTimeout(() => {
  console.log('⏰ Script timed out after 30 seconds');
  console.log('💡 The emulator might not be fully started yet.');
  process.exit(1);
}, 30000);

createTestData().finally(() => {
  clearTimeout(timeout);
});
