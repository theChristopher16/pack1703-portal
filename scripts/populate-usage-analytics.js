const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample usage data to populate for testing
const sampleUsageData = [
  // Events - most popular
  {
    componentId: 'events',
    componentName: 'Events',
    componentPath: '/events',
    totalUsage: 150,
    uniqueUsers: 25,
    averageUsagePerUser: 6.0,
    lastUsed: serverTimestamp()
  },
  // Locations - second most popular
  {
    componentId: 'locations',
    componentName: 'Locations',
    componentPath: '/locations',
    totalUsage: 120,
    uniqueUsers: 20,
    averageUsagePerUser: 6.0,
    lastUsed: serverTimestamp()
  },
  // Announcements - third most popular
  {
    componentId: 'announcements',
    componentName: 'Announcements',
    componentPath: '/announcements',
    totalUsage: 100,
    uniqueUsers: 18,
    averageUsagePerUser: 5.6,
    lastUsed: serverTimestamp()
  },
  // Chat - fourth most popular
  {
    componentId: 'chat',
    componentName: 'Chat',
    componentPath: '/chat',
    totalUsage: 80,
    uniqueUsers: 15,
    averageUsagePerUser: 5.3,
    lastUsed: serverTimestamp()
  },
  // Volunteer - fifth most popular
  {
    componentId: 'volunteer',
    componentName: 'Volunteer',
    componentPath: '/volunteer',
    totalUsage: 60,
    uniqueUsers: 12,
    averageUsagePerUser: 5.0,
    lastUsed: serverTimestamp()
  },
  // Resources - sixth most popular
  {
    componentId: 'resources',
    componentName: 'Resources',
    componentPath: '/resources',
    totalUsage: 45,
    uniqueUsers: 10,
    averageUsagePerUser: 4.5,
    lastUsed: serverTimestamp()
  },
  // Feedback - seventh most popular
  {
    componentId: 'feedback',
    componentName: 'Feedback',
    componentPath: '/feedback',
    totalUsage: 30,
    uniqueUsers: 8,
    averageUsagePerUser: 3.8,
    lastUsed: serverTimestamp()
  },
  // Analytics - eighth most popular (admin only)
  {
    componentId: 'analytics',
    componentName: 'Analytics',
    componentPath: '/analytics',
    totalUsage: 20,
    uniqueUsers: 3,
    averageUsagePerUser: 6.7,
    lastUsed: serverTimestamp()
  },
  // Data Audit - ninth most popular
  {
    componentId: 'dataAudit',
    componentName: 'Data Audit',
    componentPath: '/data-audit',
    totalUsage: 15,
    uniqueUsers: 5,
    averageUsagePerUser: 3.0,
    lastUsed: serverTimestamp()
  }
];

async function populateUsageData() {
  try {
    console.log('🚀 Starting to populate usage analytics data...');

    for (const data of sampleUsageData) {
      const docRef = doc(db, 'componentAnalytics', data.componentId);
      await setDoc(docRef, data);
      console.log(`✅ Added analytics for ${data.componentName}: ${data.totalUsage} total uses by ${data.uniqueUsers} users`);
    }

    console.log('🎉 Successfully populated usage analytics data!');
    console.log('\n📊 Expected hero button behavior:');
    console.log('   • Anonymous users: Events, Locations');
    console.log('   • Parents: Events, Locations (same as anonymous)');
    console.log('   • Volunteers: Events, Locations (same as anonymous)');
    console.log('   • Admins: Events, Locations (same as anonymous)');
    console.log('   • Root: Events, Locations (same as anonymous)');
    console.log('\n💡 Note: All roles see the same system-wide most popular components!');

  } catch (error) {
    console.error('❌ Error populating usage data:', error);
  }
}

// Run the script
populateUsageData();
