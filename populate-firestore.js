#!/usr/bin/env node

/**
 * Populate Firestore with realistic data for Pack 1703
 * Run with: node populate-firestore.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc, Timestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6QerA4QW2KKrBqgDJvFwhvAHc6WobK0",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.firebasestorage.app",
  messagingSenderId: "1090892022787",
  appId: "1:1090892022787:web:a04a0ad22006b26f557a36",
  measurementId: "G-B7MG9074VL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to create timestamps
const createTimestamp = (dateString) => {
  return Timestamp.fromDate(new Date(dateString));
};

// Helper function to add document with custom ID
const addDocWithId = async (collectionName, id, data) => {
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      createdAt: createTimestamp(data.createdAt || new Date().toISOString()),
      updatedAt: createTimestamp(data.updatedAt || new Date().toISOString())
    });
    console.log(`✅ Added ${collectionName}/${id}`);
    return id;
  } catch (error) {
    console.error(`❌ Error adding ${collectionName}/${id}:`, error.message);
    return null;
  }
};

// Helper function to add document with auto-generated ID
const addDocAuto = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: createTimestamp(data.createdAt || new Date().toISOString()),
      updatedAt: createTimestamp(data.updatedAt || new Date().toISOString())
    });
    console.log(`✅ Added ${collectionName}/${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error adding ${collectionName}:`, error.message);
    return null;
  }
};

// Seasons data
const seasons = [
  {
    id: 'season-2025',
    name: '2025–2026',
    startDate: createTimestamp('2025-09-01T00:00:00'),
    endDate: createTimestamp('2026-08-31T00:00:00'),
    isActive: true
  }
];

// Locations data
const locations = [
  {
    id: 'location-st-marks',
    name: 'St. Mark\'s Church',
    address: '123 Main Street, Peoria, IL 61614',
    category: 'church',
    geo: { lat: 40.7103, lng: -89.6144 },
    notesPublic: 'Main meeting location for Pack 1703. Large parking lot available.',
    notesPrivate: 'Contact: Father John - 555-0123. Gate code: 1234',
    parking: { text: 'Free parking available' },
    isImportant: true
  },
  {
    id: 'location-camp-wokanda',
    name: 'Camp Wokanda',
    address: '456 Scout Road, Peoria, IL 61615',
    category: 'campground',
    geo: { lat: 40.7200, lng: -89.6200 },
    notesPublic: 'Primary camping location with hiking trails and lake access.',
    notesPrivate: 'Reservation contact: Camp Director - 555-0456. Check-in time: 2 PM',
    parking: { text: 'Free parking available' },
    isImportant: true
  },
  {
    id: 'location-riverfront',
    name: 'Peoria Riverfront',
    address: '789 River Drive, Peoria, IL 61602',
    category: 'park',
    geo: { lat: 40.7000, lng: -89.6000 },
    notesPublic: 'Scenic location for community service projects and outdoor activities.',
    notesPrivate: 'Parking validation available for groups. Contact: Parks Dept - 555-0789',
    parking: { text: 'Paid parking available' },
    isImportant: false
  },
  {
    id: 'location-peoria-zoo',
    name: 'Peoria Zoo',
    address: '2320 N Prospect Rd, Peoria, IL 61603',
    category: 'park',
    geo: { lat: 40.7150, lng: -89.6050 },
    notesPublic: 'Great location for family outings and educational activities.',
    notesPrivate: 'Group rates available. Contact: Education Director - 555-0124',
    parking: { text: 'Free parking available' },
    isImportant: false
  }
];

// Events data
const events = [
  {
    id: 'event-fall-campout-2025',
    seasonId: 'season-2025',
    title: 'Pack 1703 Fall Campout 2025',
    category: 'campout',
    start: createTimestamp('2025-10-15T14:00:00'),
    end: createTimestamp('2025-10-17T12:00:00'),
    locationId: 'location-camp-wokanda',
    description: 'Annual fall camping trip with activities, hiking, and campfire. Scouts will learn outdoor skills, participate in team building activities, and enjoy the beautiful fall colors.',
    packingList: ['Tent', 'Sleeping bag', 'Warm clothes', 'Flashlight', 'Water bottle', 'Snacks'],
    attachments: [],
    rsvpEnabled: true,
    capacity: 50,
    visibility: 'public',
    denTags: ['Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light']
  },
  {
    id: 'event-pinewood-derby-2026',
    seasonId: 'season-2025',
    title: 'Pinewood Derby 2026',
    category: 'pack',
    start: createTimestamp('2026-02-10T10:00:00'),
    end: createTimestamp('2026-02-10T16:00:00'),
    locationId: 'location-st-marks',
    description: 'Annual pinewood derby race for all scouts. Cars will be weighed and inspected before racing begins. Trophies for 1st, 2nd, and 3rd place in each den.',
    packingList: ['Pinewood derby car', 'Snacks', 'Water', 'Family members'],
    attachments: [],
    rsvpEnabled: true,
    capacity: 100,
    visibility: 'public',
    denTags: ['Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light']
  },
  {
    id: 'event-spring-campout-2026',
    seasonId: 'season-2025',
    title: 'Spring Campout 2026',
    category: 'campout',
    start: createTimestamp('2026-04-20T14:00:00'),
    end: createTimestamp('2026-04-22T12:00:00'),
    locationId: 'location-camp-wokanda',
    description: 'Spring camping adventure with nature hikes, bird watching, and outdoor cooking. Perfect weather for exploring the trails and learning about spring wildlife.',
    packingList: ['Tent', 'Sleeping bag', 'Rain gear', 'Hiking boots', 'Binoculars', 'Cooking supplies'],
    attachments: [],
    rsvpEnabled: true,
    capacity: 45,
    visibility: 'public',
    denTags: ['Wolf', 'Bear', 'Webelos', 'Arrow of Light']
  }
];

// Announcements data
const announcements = [
  {
    id: 'announcement-fall-campout-registration',
    title: 'Fall Campout Registration Open!',
    body: 'Registration for our annual Fall Campout is now open! This year we\'ll be heading to Camp Wokanda for a weekend of fun, adventure, and scouting activities.\n\n**What to expect:**\n- Hiking and nature exploration\n- Campfire with songs and stories\n- Outdoor cooking lessons\n- Team building activities\n- Beautiful fall colors\n\n**Cost:** $15 per person\n**Deadline:** October 1st, 2025\n\nPlease RSVP through the Events page or contact your den leader.',
    pinned: true,
    eventId: 'event-fall-campout-2025',
    attachments: [],
    category: 'event',
    priority: 'high'
  },
  {
    id: 'announcement-uniform-update',
    title: 'New Uniform Requirements for 2025-2026',
    body: 'We\'ve updated our uniform requirements for the new scouting year. All scouts should have the following items:\n\n**Required:**\n- Official BSA uniform shirt\n- Neckerchief and slide\n- Belt\n- Appropriate pants/shorts\n\n**Optional but recommended:**\n- Hat\n- Socks\n- Activity uniform for outdoor events\n\nUniforms can be purchased at the Scout Shop or online. Contact your den leader if you need assistance with sizing or purchasing.',
    pinned: true,
    attachments: [],
    category: 'policy',
    priority: 'medium'
  },
  {
    id: 'announcement-volunteer-needed',
    title: 'Volunteers Needed for Pinewood Derby',
    body: 'We need volunteers to help make the Pinewood Derby a success! We\'re looking for:\n\n- **Race Officials** (2 people)\n- **Registration Helpers** (3 people)\n- **Snack Bar Coordinators** (2 people)\n- **Cleanup Crew** (4 people)\n\nThis is a great opportunity to get involved and support our scouts. Please sign up through the Volunteer page or contact the pack committee.',
    pinned: false,
    eventId: 'event-pinewood-derby-2026',
    attachments: [],
    category: 'volunteer',
    priority: 'high'
  }
];

// Resources data
const resources = [
  {
    id: 'resource-camping-checklist',
    title: 'Camping Packing List',
    description: 'Complete checklist for overnight camping trips including tent, sleeping gear, clothing, and personal items.',
    category: 'packing-list',
    tags: ['camping', 'overnight', 'gear', 'checklist'],
    url: '/resources/camping-packing-list.pdf',
    fileType: 'pdf',
    lastUpdated: '2025-01-15',
    isActive: true
  },
  {
    id: 'resource-day-trip-checklist',
    title: 'Day Trip Packing List',
    description: 'Essential items for day trips and activities including water, snacks, first aid, and weather protection.',
    category: 'packing-list',
    tags: ['day-trip', 'essentials', 'weather', 'safety'],
    url: '/resources/day-trip-packing-list.pdf',
    fileType: 'pdf',
    lastUpdated: '2025-01-15',
    isActive: true
  },
  {
    id: 'resource-medical-form',
    title: 'Medical Form A',
    description: 'Required medical form for all scouts participating in activities. Must be completed annually.',
    category: 'medical',
    tags: ['medical', 'required', 'annual', 'health'],
    url: '/resources/medical-form-a.pdf',
    fileType: 'pdf',
    lastUpdated: '2025-01-01',
    isActive: true
  },
  {
    id: 'resource-photo-policy',
    title: 'Pack 1703 Photo Policy',
    description: 'Guidelines for taking and sharing photos during pack activities and events.',
    category: 'policy',
    tags: ['photo', 'policy', 'guidelines', 'safety'],
    url: '/resources/photo-policy.pdf',
    fileType: 'pdf',
    lastUpdated: '2025-01-01',
    isActive: true
  }
];

// Volunteer needs data
const volunteerNeeds = [
  {
    id: 'volunteer-fall-campout-checkin',
    eventId: 'event-fall-campout-2025',
    eventTitle: 'Pack 1703 Fall Campout 2025',
    role: 'Check-in Coordinator',
    description: 'Help families check in upon arrival, distribute materials, and answer questions.',
    needed: 2,
    claimed: 1,
    category: 'setup',
    priority: 'high',
    isActive: true
  },
  {
    id: 'volunteer-fall-campout-food',
    eventId: 'event-fall-campout-2025',
    eventTitle: 'Pack 1703 Fall Campout 2025',
    role: 'Food Coordinator',
    description: 'Organize meal preparation, coordinate with families bringing food, and ensure dietary needs are met.',
    needed: 1,
    claimed: 0,
    category: 'food',
    priority: 'high',
    isActive: true
  },
  {
    id: 'volunteer-fall-campout-activities',
    eventId: 'event-fall-campout-2025',
    eventTitle: 'Pack 1703 Fall Campout 2025',
    role: 'Activity Leader',
    description: 'Lead organized activities and games for scouts during free time.',
    needed: 3,
    claimed: 2,
    category: 'activity',
    priority: 'medium',
    isActive: true
  },
  {
    id: 'volunteer-pinewood-derby-race',
    eventId: 'event-pinewood-derby-2026',
    eventTitle: 'Pinewood Derby 2026',
    role: 'Race Official',
    description: 'Help run the races, record times, and ensure fair competition.',
    needed: 2,
    claimed: 0,
    category: 'supervision',
    priority: 'high',
    isActive: true
  }
];

// Lists data (packing lists, etc.)
const lists = [
  {
    id: 'list-tent-sleeping',
    name: 'Tent & Sleeping Gear',
    category: 'camping',
    items: ['Tent', 'Sleeping bag', 'Sleeping pad', 'Pillow', 'Ground cloth', 'Tent stakes', 'Mallet'],
    description: 'Essential items for comfortable camping',
    isActive: true
  },
  {
    id: 'list-warm-clothing',
    name: 'Warm Clothing',
    category: 'clothing',
    items: ['Warm jacket', 'Thermal underwear', 'Wool socks', 'Hat', 'Gloves', 'Scarf', 'Waterproof boots'],
    description: 'Clothing for cold weather camping',
    isActive: true
  },
  {
    id: 'list-first-aid',
    name: 'First Aid Kit',
    category: 'safety',
    items: ['Bandages', 'Antiseptic wipes', 'Pain relievers', 'Tweezers', 'Medical tape', 'Emergency contact info'],
    description: 'Basic first aid supplies for outdoor activities',
    isActive: true
  }
];

// Main population function
async function populateFirestore() {
  console.log('🚀 Starting Firestore population...\n');

  try {
    // Add seasons
    console.log('📅 Adding seasons...');
    for (const season of seasons) {
      await addDocWithId('seasons', season.id, season);
    }

    // Add locations
    console.log('\n📍 Adding locations...');
    for (const location of locations) {
      await addDocWithId('locations', location.id, location);
    }

    // Add events
    console.log('\n📅 Adding events...');
    for (const event of events) {
      await addDocWithId('events', event.id, event);
    }

    // Add announcements
    console.log('\n📢 Adding announcements...');
    for (const announcement of announcements) {
      await addDocWithId('announcements', announcement.id, announcement);
    }

    // Add resources
    console.log('\n📚 Adding resources...');
    for (const resource of resources) {
      await addDocWithId('resources', resource.id, resource);
    }

    // Add volunteer needs
    console.log('\n🤝 Adding volunteer needs...');
    for (const need of volunteerNeeds) {
      await addDocWithId('volunteer-needs', need.id, need);
    }

    // Add lists
    console.log('\n📋 Adding lists...');
    for (const list of lists) {
      await addDocWithId('lists', list.id, list);
    }

    console.log('\n🎉 Firestore population complete!');
    console.log('\n📊 Summary:');
    console.log(`- Seasons: ${seasons.length}`);
    console.log(`- Locations: ${locations.length}`);
    console.log(`- Events: ${events.length}`);
    console.log(`- Announcements: ${announcements.length}`);
    console.log(`- Resources: ${resources.length}`);
    console.log(`- Volunteer Needs: ${volunteerNeeds.length}`);
    console.log(`- Lists: ${lists.length}`);

  } catch (error) {
    console.error('❌ Error populating Firestore:', error);
  }
}

// Run the population
if (require.main === module) {
  populateFirestore()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateFirestore };
