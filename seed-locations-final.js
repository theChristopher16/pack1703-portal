// Run this in the browser console on the locations page
// Go to: https://pack1703-portal.web.app/locations
// Open browser console (F12) and paste this code

const locations = [
  {
    name: 'St. Francis Episcopal School',
    address: '335 Piney Point Dr, Richmond, TX 77469',
    category: 'school',
    geo: { lat: 29.5625, lng: -95.7257 },
    notesPublic: 'Kickoff event location for Pack 1703',
    notesPrivate: 'Contact: School administration',
    parking: {
      text: 'School parking lot available'
    },
    amenities: ['Classrooms', 'Gymnasium', 'Cafeteria'],
    isImportant: true
  },
  {
    name: 'USS Stewart',
    address: 'USS Lone Star Battleship, Houston, TX',
    category: 'other',
    geo: { lat: 29.7604, lng: -95.3698 },
    notesPublic: 'Sleepover adventure aboard historic battleship',
    notesPrivate: 'Check-in at 5:00 PM, contact coordinator',
    parking: {
      text: 'Museum parking available'
    },
    amenities: ['Historic tour', 'Movie viewing', 'Sleeping quarters'],
    isImportant: true
  },
  {
    name: 'Double Lake Recreation Area',
    address: 'Double Lake, TX',
    category: 'campground',
    geo: { lat: 30.7754, lng: -95.2151 },
    notesPublic: 'Nature campout with canoeing and stargazing',
    notesPrivate: 'Campfire programs and skit activities',
    parking: {
      text: 'Campground parking available'
    },
    amenities: ['Lake access', 'Canoeing', 'Campfire rings', 'Bunkhouses'],
    isImportant: true
  },
  {
    name: 'Tia-Piah Powwow Grounds',
    address: 'Powwow Grounds, TX',
    category: 'community center',
    geo: { lat: 29.7604, lng: -95.3698 },
    notesPublic: 'Cultural exchange and traditional dance celebrations',
    notesPrivate: 'Cultural exchange activities',
    parking: {
      text: 'On-site parking available'
    },
    amenities: ['Dance grounds', 'Cultural displays', 'Sun-Art banners'],
    isImportant: true
  },
  {
    name: 'Bovay Scout Ranch',
    address: '15052 FM1774, Navasota, TX 77868',
    category: 'campground',
    geo: { lat: 30.3769, lng: -95.9522 },
    notesPublic: 'Overnight camping with archery, fishing, and solar cooking',
    notesPrivate: 'Archery range and solar oven activities',
    amenities: ['Archery range', 'Fishing pond', 'Camping sites', 'Solar cooking stations'],
    parking: {
      text: 'Scout ranch parking available'
    },
    isImportant: true
  }
];

async function seedLocations() {
  console.log('🌱 Starting to seed locations...');
  
  try {
    // Use the existing Firebase app from the page
    const { getFirestore, collection, addDoc, Timestamp } = window.firebase || {};
    
    if (!getFirestore) {
      throw new Error('Firebase not available. Make sure you are on the locations page.');
    }
    
    // Get the existing Firebase app instance
    const db = getFirestore();
    
    for (const location of locations) {
      const locationData = {
        ...location,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      };
      
      const docRef = await addDoc(collection(db, 'locations'), locationData);
      console.log(`✅ Added location: ${location.name} (ID: ${docRef.id})`);
    }
    
    console.log(`🎉 Successfully seeded ${locations.length} locations to Firestore!`);
    console.log('🔄 Refresh the page to see the new locations.');
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    console.log('💡 Try using the "Add Location" button on the page instead.');
  }
}

// Run the seeding
seedLocations();


