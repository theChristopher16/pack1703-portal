// Setup test data for Firestore emulator
// Run this after starting the emulator: firebase emulators:start --only functions,firestore

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { connectFirestoreEmulator } = require('firebase/firestore');

// Test Firebase config
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
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8080);

console.log('🚀 Setting up test data for Firestore emulator...\n');

async function setupTestData() {
  try {
    // 1. Create test event
    console.log('1️⃣ Creating test event...');
    const eventData = {
      id: 'test-event-001',
      title: 'Test Campout',
      description: 'A test camping event for the pack',
      startDate: new Date('2024-10-15T18:00:00Z'),
      endDate: new Date('2024-10-17T12:00:00Z'),
      location: 'Test Campground',
      maxCapacity: 50,
      currentRSVPs: 0,
      category: 'campout',
      denTags: ['Wolves', 'Bears', 'Webelos'],
      season: 'Fall 2024'
    };
    
    await setDoc(doc(db, 'events', 'test-event-001'), eventData);
    console.log('✅ Test event created');

    // 2. Create test volunteer need
    console.log('\n2️⃣ Creating test volunteer need...');
    const volunteerNeedData = {
      id: 'test-volunteer-001',
      title: 'Test Camp Leader',
      description: 'Need a leader for the test campout',
      eventId: 'test-event-001',
      requiredSkills: ['Leadership', 'First Aid'],
      maxVolunteers: 3,
      currentVolunteers: 0,
      status: 'open'
    };
    
    await setDoc(doc(db, 'volunteer-needs', 'test-volunteer-001'), volunteerNeedData);
    console.log('✅ Test volunteer need created');

    // 3. Create test season
    console.log('\n3️⃣ Creating test season...');
    const seasonData = {
      id: 'fall-2024',
      name: 'Fall 2024',
      startDate: new Date('2024-09-01T00:00:00Z'),
      endDate: new Date('2024-12-31T23:59:59Z'),
      isActive: true
    };
    
    await setDoc(doc(db, 'seasons', 'fall-2024'), seasonData);
    console.log('✅ Test season created');

    // 4. Create test location
    console.log('\n4️⃣ Creating test location...');
    const locationData = {
      id: 'test-campground',
      name: 'Test Campground',
      address: '123 Test Road, Test City, TC 12345',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      description: 'A beautiful test campground for scouting activities',
      category: 'campground',
      notesPrivate: 'This is a test location only'
    };
    
    await setDoc(doc(db, 'locations', 'test-campground'), locationData);
    console.log('✅ Test location created');

    console.log('\n🎉 All test data created successfully!');
    console.log('\n�� Test data includes:');
    console.log('   • Event: test-event-001 (Test Campout)');
    console.log('   • Volunteer Need: test-volunteer-001 (Test Camp Leader)');
    console.log('   • Season: fall-2024 (Fall 2024)');
    console.log('   • Location: test-campground (Test Campground)');
    console.log('\n🧪 Now you can test the Cloud Functions!');

    // Exit cleanly
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run setup with timeout protection
const timeout = setTimeout(() => {
  console.log('⏰ Setup timed out after 10 seconds');
  process.exit(1);
}, 10000);

setupTestData().finally(() => {
  clearTimeout(timeout);
});
