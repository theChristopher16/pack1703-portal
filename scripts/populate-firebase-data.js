const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, updateDoc } = require('firebase/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Real Scout Pack Data
const events = [
  {
    id: 'event-001',
    title: 'Pack 1703 Fall Campout',
    description: 'Join us for our annual fall campout at Double Lake Recreation Area. This is a family camping event with activities for all ages.',
    startDate: '2024-10-15T16:00:00',
    endDate: '2024-10-17T12:00:00',
    locationId: 'location-001',
    locationName: 'Double Lake Recreation Area',
    locationAddress: '3100 Double Lake Rd, Coldspring, TX 77331',
    locationCoordinates: { lat: 30.5918, lng: -95.1295 },
    category: 'camping',
    priority: 'high',
    isActive: true,
    maxParticipants: 50,
    currentParticipants: 32,
    requirements: ['Tent', 'Sleeping bag', 'Personal items', 'Food for family'],
    notes: 'Setup begins Friday at 4pm. Contact John Smith for carpooling arrangements.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-15T00:00:00'),
    updatedAt: new Date('2024-01-15T00:00:00')
  },
  {
    id: 'event-002',
    title: 'Pinewood Derby',
    description: 'Annual Pinewood Derby race where scouts race their handcrafted wooden cars. Awards for speed and design.',
    startDate: '2024-02-10T14:00:00',
    endDate: '2024-02-10T17:00:00',
    locationId: 'location-002',
    locationName: 'St. Luke\'s United Methodist Church',
    locationAddress: '3471 Westheimer Rd, Houston, TX 77027',
    locationCoordinates: { lat: 29.7377, lng: -95.4434 },
    category: 'competition',
    priority: 'high',
    isActive: true,
    maxParticipants: 100,
    currentParticipants: 85,
    requirements: ['Pinewood Derby car', 'Scout uniform'],
    notes: 'Cars must be checked in by 1:30pm. Racing begins at 2:00pm sharp.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-20T00:00:00'),
    updatedAt: new Date('2024-01-20T00:00:00')
  },
  {
    id: 'event-003',
    title: 'Community Service Project',
    description: 'Help clean up our local park and plant trees. Earn service hours while making our community better.',
    startDate: '2024-03-15T09:00:00',
    endDate: '2024-03-15T12:00:00',
    locationId: 'location-003',
    locationName: 'Memorial Park',
    locationAddress: '6501 Memorial Dr, Houston, TX 77007',
    locationCoordinates: { lat: 29.7604, lng: -95.3698 },
    category: 'service',
    priority: 'medium',
    isActive: true,
    maxParticipants: 30,
    currentParticipants: 18,
    requirements: ['Work gloves', 'Closed-toe shoes', 'Water bottle'],
    notes: 'Meet at the main pavilion. Tools and supplies provided.',
    createdBy: 'admin',
    createdAt: new Date('2024-02-01T00:00:00'),
    updatedAt: new Date('2024-02-01T00:00:00')
  },
  {
    id: 'event-004',
    title: 'Blue & Gold Banquet',
    description: 'Celebrate the founding of Scouting with our annual Blue & Gold Banquet. Special awards and recognition ceremony.',
    startDate: '2024-02-22T18:00:00',
    endDate: '2024-02-22T21:00:00',
    locationId: 'location-002',
    locationName: 'St. Luke\'s United Methodist Church',
    locationAddress: '3471 Westheimer Rd, Houston, TX 77027',
    locationCoordinates: { lat: 29.7377, lng: -95.4434 },
    category: 'celebration',
    priority: 'high',
    isActive: true,
    maxParticipants: 150,
    currentParticipants: 120,
    requirements: ['Scout uniform', 'Family RSVP'],
    notes: 'Dinner provided. Please RSVP by February 15th.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-25T00:00:00'),
    updatedAt: new Date('2024-01-25T00:00:00')
  },
  {
    id: 'event-005',
    title: 'Spring Hiking Trip',
    description: 'Explore the trails at Sam Houston National Forest. Learn about local wildlife and earn hiking badges.',
    startDate: '2024-04-20T08:00:00',
    endDate: '2024-04-20T16:00:00',
    locationId: 'location-004',
    locationName: 'Sam Houston National Forest',
    locationAddress: '394 FM 1375, New Waverly, TX 77358',
    locationCoordinates: { lat: 30.5377, lng: -95.4434 },
    category: 'outdoor',
    priority: 'medium',
    isActive: true,
    maxParticipants: 25,
    currentParticipants: 15,
    requirements: ['Hiking boots', 'Water bottle', 'Snacks', 'Weather-appropriate clothing'],
    notes: 'Meet at the trailhead parking lot. Carpooling available.',
    createdBy: 'admin',
    createdAt: new Date('2024-02-15T00:00:00'),
    updatedAt: new Date('2024-02-15T00:00:00')
  }
];

const locations = [
  {
    id: 'location-001',
    name: 'Double Lake Recreation Area',
    address: '3100 Double Lake Rd, Coldspring, TX 77331',
    coordinates: { lat: 30.5918, lng: -95.1295 },
    phone: '(936) 653-3448',
    website: 'https://www.fs.usda.gov/recarea/texas/recarea/?recid=30325',
    hours: '24/7',
    description: 'Beautiful forest recreation area with camping, hiking, and fishing opportunities.',
    amenities: ['Camping sites', 'Hiking trails', 'Fishing', 'Picnic areas', 'Restrooms'],
    parking: 'Free parking available',
    notes: 'Popular destination for Scout camping trips. Reservations recommended.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'location-002',
    name: 'St. Luke\'s United Methodist Church',
    address: '3471 Westheimer Rd, Houston, TX 77027',
    coordinates: { lat: 29.7377, lng: -95.4434 },
    phone: '(713) 622-5710',
    website: 'https://www.stlukesmethodist.org',
    hours: 'Varies by event',
    description: 'Our charter organization and primary meeting location for Pack events.',
    amenities: ['Meeting rooms', 'Kitchen', 'Parking', 'Restrooms', 'Gymnasium'],
    parking: 'Free parking in church lot',
    notes: 'Main location for Pack meetings and special events.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'location-003',
    name: 'Memorial Park',
    address: '6501 Memorial Dr, Houston, TX 77007',
    coordinates: { lat: 29.7604, lng: -95.3698 },
    phone: '(713) 845-1000',
    website: 'https://www.houstonparks.org/memorial-park',
    hours: '6:00 AM - 11:00 PM',
    description: 'Large urban park with trails, sports fields, and natural areas.',
    amenities: ['Hiking trails', 'Sports fields', 'Picnic areas', 'Restrooms', 'Parking'],
    parking: 'Free parking available',
    notes: 'Great location for community service projects and outdoor activities.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'location-004',
    name: 'Sam Houston National Forest',
    address: '394 FM 1375, New Waverly, TX 77358',
    coordinates: { lat: 30.5377, lng: -95.4434 },
    phone: '(936) 344-6205',
    website: 'https://www.fs.usda.gov/texas',
    hours: '24/7',
    description: 'National forest with extensive hiking trails and outdoor recreation opportunities.',
    amenities: ['Hiking trails', 'Camping', 'Fishing', 'Wildlife viewing', 'Restrooms'],
    parking: 'Free parking at trailheads',
    notes: 'Excellent location for hiking and outdoor education.',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  }
];

const announcements = [
  {
    id: 'announcement-001',
    title: 'Welcome to Pack 1703!',
    body: 'Welcome to all new families joining Pack 1703! We\'re excited to have you as part of our Scouting family. Please check the calendar for upcoming events and don\'t hesitate to reach out with any questions.',
    category: 'general',
    priority: 'medium',
    pinned: true,
    eventId: null,
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'announcement-002',
    title: 'Fall Campout Registration Open',
    body: 'Registration is now open for our Fall Campout at Double Lake Recreation Area. This family camping event will be held October 15-17. Please RSVP by October 1st to secure your spot.',
    category: 'event',
    priority: 'high',
    pinned: true,
    eventId: 'event-001',
    createdBy: 'admin',
    createdAt: new Date('2024-01-15T00:00:00'),
    updatedAt: new Date('2024-01-15T00:00:00')
  },
  {
    id: 'announcement-003',
    title: 'Pinewood Derby Car Kits Available',
    body: 'Pinewood Derby car kits are now available for pickup at the Scout Shop. The race will be held on February 10th. Cars must be checked in by 1:30pm on race day.',
    category: 'event',
    priority: 'high',
    pinned: false,
    eventId: 'event-002',
    createdBy: 'admin',
    createdAt: new Date('2024-01-20T00:00:00'),
    updatedAt: new Date('2024-01-20T00:00:00')
  },
  {
    id: 'announcement-004',
    title: 'Volunteer Opportunities',
    body: 'We need volunteers for several upcoming events. Please check the volunteer page for opportunities to help with setup, cleanup, and activity coordination.',
    category: 'volunteer',
    priority: 'medium',
    pinned: false,
    eventId: null,
    createdBy: 'admin',
    createdAt: new Date('2024-01-25T00:00:00'),
    updatedAt: new Date('2024-01-25T00:00:00')
  },
  {
    id: 'announcement-005',
    title: 'Blue & Gold Banquet RSVP Deadline',
    body: 'The deadline to RSVP for the Blue & Gold Banquet is February 15th. This is our annual celebration of Scouting and includes special awards. Please respond with your family count.',
    category: 'event',
    priority: 'high',
    pinned: true,
    eventId: 'event-004',
    createdBy: 'admin',
    createdAt: new Date('2024-02-01T00:00:00'),
    updatedAt: new Date('2024-02-01T00:00:00')
  }
];

const volunteerNeeds = [
  {
    id: 'need-001',
    eventId: 'event-001',
    eventTitle: 'Pack 1703 Fall Campout',
    eventDate: '2024-10-15',
    role: 'Check-in Coordinator',
    description: 'Help families check in upon arrival, distribute materials, and answer questions.',
    needed: 2,
    claimed: 1,
    category: 'setup',
    priority: 'high',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'need-002',
    eventId: 'event-001',
    eventTitle: 'Pack 1703 Fall Campout',
    eventDate: '2024-10-15',
    role: 'Food Coordinator',
    description: 'Organize meal preparation, coordinate with families bringing food, and ensure dietary needs are met.',
    needed: 1,
    claimed: 0,
    category: 'food',
    priority: 'high',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'need-003',
    eventId: 'event-002',
    eventTitle: 'Pinewood Derby',
    eventDate: '2024-02-10',
    role: 'Race Official',
    description: 'Help run the race, record times, and ensure fair competition.',
    needed: 4,
    claimed: 3,
    category: 'supervision',
    priority: 'high',
    isActive: true,
    createdAt: new Date('2024-01-15T00:00:00'),
    updatedAt: new Date('2024-01-15T00:00:00')
  },
  {
    id: 'need-004',
    eventId: 'event-003',
    eventTitle: 'Community Service Project',
    eventDate: '2024-03-15',
    role: 'Project Coordinator',
    description: 'Lead the service project, coordinate with community partners, and ensure safety.',
    needed: 1,
    claimed: 0,
    category: 'supervision',
    priority: 'urgent',
    isActive: true,
    createdAt: new Date('2024-02-01T00:00:00'),
    updatedAt: new Date('2024-02-01T00:00:00')
  }
];

const volunteerSignups = [
  {
    id: 'signup-001',
    needId: 'need-001',
    familyName: 'Smith Family',
    email: 'smith@example.com',
    count: 1,
    status: 'confirmed',
    createdAt: new Date('2024-01-05T00:00:00')
  },
  {
    id: 'signup-002',
    needId: 'need-003',
    familyName: 'Johnson Family',
    email: 'johnson@example.com',
    count: 1,
    status: 'confirmed',
    createdAt: new Date('2024-01-10T00:00:00')
  }
];

const feedbackSubmissions = [
  {
    id: 'feedback-001',
    category: 'suggestion',
    priority: 'medium',
    title: 'Add more camping opportunities',
    message: 'Our family really enjoyed the fall campout and would love to see more camping events throughout the year. Maybe we could add a spring camping trip as well?',
    familyName: 'Smith Family',
    email: 'smith@example.com',
    status: 'in-progress',
    adminResponse: 'Great suggestion! We\'re already planning a spring camping trip for April. We\'ll announce the details soon.',
    adminResponseDate: new Date('2024-01-20T00:00:00'),
    createdAt: new Date('2024-01-15T00:00:00'),
    updatedAt: new Date('2024-01-20T00:00:00')
  },
  {
    id: 'feedback-002',
    category: 'question',
    priority: 'low',
    title: 'Uniform requirements for new scouts',
    message: 'My son just joined Pack 1703. What are the uniform requirements for new scouts? Do we need to buy everything at once?',
    familyName: 'Johnson Family',
    email: 'johnson@example.com',
    status: 'resolved',
    adminResponse: 'Welcome to Pack 1703! For new scouts, we recommend starting with the basic uniform (shirt, neckerchief, and slide). You can find the complete uniform guide in our Resources section.',
    adminResponseDate: new Date('2024-01-10T00:00:00'),
    createdAt: new Date('2024-01-08T00:00:00'),
    updatedAt: new Date('2024-01-10T00:00:00')
  },
  {
    id: 'feedback-003',
    category: 'praise',
    priority: 'low',
    title: 'Amazing Pinewood Derby experience',
    message: 'The Pinewood Derby was absolutely fantastic! The organization, the excitement, and the way all the scouts were included made it a memorable experience. Thank you to all the volunteers!',
    familyName: 'Davis Family',
    email: 'davis@example.com',
    status: 'closed',
    adminResponse: 'Thank you for the kind words! We\'re so glad your family enjoyed the Pinewood Derby. Our volunteers work hard to make these events special.',
    adminResponseDate: new Date('2024-02-15T00:00:00'),
    createdAt: new Date('2024-02-12T00:00:00'),
    updatedAt: new Date('2024-02-15T00:00:00')
  }
];

const packLists = [
  {
    id: 'list-001',
    title: 'Camping Essentials',
    description: 'Essential items for any camping trip with Pack 1703',
    category: 'camping',
    items: [
      'Tent',
      'Sleeping bag',
      'Sleeping pad',
      'Flashlight/headlamp',
      'Extra batteries',
      'Water bottle',
      'Personal hygiene items',
      'Weather-appropriate clothing',
      'First aid kit',
      'Sunscreen and bug spray'
    ],
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'list-002',
    title: 'Pinewood Derby Kit',
    description: 'Everything needed to build a Pinewood Derby car',
    category: 'competition',
    items: [
      'Official Pinewood Derby kit',
      'Sandpaper (various grits)',
      'Paint and brushes',
      'Graphite lubricant',
      'Decals or decorations',
      'Safety goggles',
      'Work gloves'
    ],
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'list-003',
    title: 'Hiking Gear',
    description: 'Essential items for hiking and outdoor activities',
    category: 'outdoor',
    items: [
      'Hiking boots',
      'Comfortable socks',
      'Water bottle',
      'Snacks',
      'Weather-appropriate clothing',
      'Hat and sunglasses',
      'Sunscreen',
      'First aid kit',
      'Whistle',
      'Map and compass'
    ],
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  }
];

const resources = [
  {
    id: 'resource-001',
    title: 'Uniform Guide',
    description: 'Complete guide to Cub Scout uniforms and insignia placement',
    category: 'uniform',
    url: 'https://www.scouting.org/programs/cub-scouts/resources/uniform-guide/',
    fileType: 'link',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'resource-002',
    title: 'Advancement Guide',
    description: 'Guide to Cub Scout advancement and requirements',
    category: 'advancement',
    url: 'https://www.scouting.org/programs/cub-scouts/advancement-and-awards/',
    fileType: 'link',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'resource-003',
    title: 'Safety Guidelines',
    description: 'Important safety guidelines for all Pack activities',
    category: 'safety',
    url: 'https://www.scouting.org/health-and-safety/',
    fileType: 'link',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  }
];

const fundraisingCampaigns = [
  {
    id: 'campaign-001',
    title: 'Popcorn Fundraiser',
    description: 'Annual popcorn sale to support Pack activities and equipment',
    goal: 5000,
    current: 3200,
    startDate: '2024-09-01',
    endDate: '2024-10-31',
    status: 'active',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'campaign-002',
    title: 'Camping Equipment Fund',
    description: 'Fundraiser to purchase new camping equipment for the Pack',
    goal: 2000,
    current: 1500,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  }
];

const financialTransactions = [
  {
    id: 'transaction-001',
    type: 'income',
    amount: 500,
    description: 'Popcorn fundraiser proceeds',
    category: 'fundraising',
    date: new Date('2024-01-15T00:00:00'),
    status: 'completed',
    createdBy: 'admin',
    createdAt: new Date('2024-01-15T00:00:00'),
    updatedAt: new Date('2024-01-15T00:00:00')
  },
  {
    id: 'transaction-002',
    type: 'expense',
    amount: 150,
    description: 'Camping equipment purchase',
    category: 'equipment',
    date: new Date('2024-01-20T00:00:00'),
    status: 'completed',
    createdBy: 'admin',
    createdAt: new Date('2024-01-20T00:00:00'),
    updatedAt: new Date('2024-01-20T00:00:00')
  }
];

// Function to populate Firestore collections
async function populateFirestore() {
  console.log('🚀 Starting Firebase data population...');

  try {
    // Populate Events
    console.log('📅 Populating events...');
    for (const event of events) {
      await db.collection('events').doc(event.id).set(event);
    }
    console.log(`✅ Added ${events.length} events`);

    // Populate Locations
    console.log('📍 Populating locations...');
    for (const location of locations) {
      await db.collection('locations').doc(location.id).set(location);
    }
    console.log(`✅ Added ${locations.length} locations`);

    // Populate Announcements
    console.log('📢 Populating announcements...');
    for (const announcement of announcements) {
      await db.collection('announcements').doc(announcement.id).set(announcement);
    }
    console.log(`✅ Added ${announcements.length} announcements`);

    // Populate Volunteer Needs
    console.log('🤝 Populating volunteer needs...');
    for (const need of volunteerNeeds) {
      await db.collection('volunteer-needs').doc(need.id).set(need);
    }
    console.log(`✅ Added ${volunteerNeeds.length} volunteer needs`);

    // Populate Volunteer Signups
    console.log('📝 Populating volunteer signups...');
    for (const signup of volunteerSignups) {
      await db.collection('volunteer-signups').doc(signup.id).set(signup);
    }
    console.log(`✅ Added ${volunteerSignups.length} volunteer signups`);

    // Populate Feedback
    console.log('💬 Populating feedback submissions...');
    for (const feedback of feedbackSubmissions) {
      await db.collection('feedback').doc(feedback.id).set(feedback);
    }
    console.log(`✅ Added ${feedbackSubmissions.length} feedback submissions`);

    // Populate Pack Lists
    console.log('📋 Populating pack lists...');
    for (const list of packLists) {
      await db.collection('lists').doc(list.id).set(list);
    }
    console.log(`✅ Added ${packLists.length} pack lists`);

    // Populate Resources
    console.log('📚 Populating resources...');
    for (const resource of resources) {
      await db.collection('resources').doc(resource.id).set(resource);
    }
    console.log(`✅ Added ${resources.length} resources`);

    // Populate Fundraising Campaigns
    console.log('🎯 Populating fundraising campaigns...');
    for (const campaign of fundraisingCampaigns) {
      await db.collection('fundraising-campaigns').doc(campaign.id).set(campaign);
    }
    console.log(`✅ Added ${fundraisingCampaigns.length} fundraising campaigns`);

    // Populate Financial Transactions
    console.log('💰 Populating financial transactions...');
    for (const transaction of financialTransactions) {
      await db.collection('financial-transactions').doc(transaction.id).set(transaction);
    }
    console.log(`✅ Added ${financialTransactions.length} financial transactions`);

    console.log('🎉 Firebase data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Events: ${events.length}`);
    console.log(`- Locations: ${locations.length}`);
    console.log(`- Announcements: ${announcements.length}`);
    console.log(`- Volunteer Needs: ${volunteerNeeds.length}`);
    console.log(`- Volunteer Signups: ${volunteerSignups.length}`);
    console.log(`- Feedback Submissions: ${feedbackSubmissions.length}`);
    console.log(`- Pack Lists: ${packLists.length}`);
    console.log(`- Resources: ${resources.length}`);
    console.log(`- Fundraising Campaigns: ${fundraisingCampaigns.length}`);
    console.log(`- Financial Transactions: ${financialTransactions.length}`);

  } catch (error) {
    console.error('❌ Error populating Firebase data:', error);
    process.exit(1);
  }
}

// Run the population script
populateFirestore();
