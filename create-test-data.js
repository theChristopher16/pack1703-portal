// Simple test data creation script
// This will create the minimum data needed for Cloud Functions to work

const admin = require('firebase-admin');

// Initialize Firebase Admin (this works in Node.js environment)
const serviceAccount = {
  projectId: 'pack-1703-portal',
  // Use default credentials for emulator
};

admin.initializeApp({
  projectId: 'pack-1703-portal',
  // Connect to emulator
  databaseURL: 'http://localhost:8080?project=pack-1703-portal'
});

const db = admin.firestore();

console.log('🚀 Creating test data for Cloud Functions...\n');

async function createTestData() {
  try {
    // 1. Create test event
    console.log('1️⃣ Creating test event...');
    await db.collection('events').doc('test-event-001').set({
      id: 'test-event-001',
      title: 'Test Campout',
      description: 'A test camping event for the pack',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-10-15T18:00:00Z')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-10-17T12:00:00Z')),
      location: 'Test Campground',
      maxCapacity: 50,
      currentRSVPs: 0,
      category: 'campout',
      denTags: ['Wolves', 'Bears', 'Webelos'],
      season: 'Fall 2024'
    });
    console.log('✅ Test event created');

    // 2. Create test volunteer need
    console.log('\n2️⃣ Creating test volunteer need...');
    await db.collection('volunteer-needs').doc('test-volunteer-001').set({
      id: 'test-volunteer-001',
      title: 'Test Camp Leader',
      description: 'Need a leader for the test campout',
      eventId: 'test-event-001',
      requiredSkills: ['Leadership', 'First Aid'],
      maxVolunteers: 3,
      currentVolunteers: 0,
      status: 'open'
    });
    console.log('✅ Test volunteer need created');

    console.log('\n🎉 Test data created successfully!');
    console.log('\n🧪 Now test your Cloud Functions again!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    process.exit(1);
  }
}

// Run with timeout protection
const timeout = setTimeout(() => {
  console.log('⏰ Script timed out after 15 seconds');
  process.exit(1);
}, 15000);

createTestData().finally(() => {
  clearTimeout(timeout);
});
