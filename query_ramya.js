const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function queryRamyaData() {
  try {
    console.log('🔍 Searching for users with "Ramya" in their data...');
    
    // Query users collection for Ramya
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${usersSnapshot.docs.length} total users`);
    
    const ramyaUsers = [];
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const displayName = userData.displayName || '';
      const email = userData.email || '';
      
      if (displayName.toLowerCase().includes('ramya') || 
          email.toLowerCase().includes('ramya')) {
        ramyaUsers.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`👤 Found ${ramyaUsers.length} users matching "Ramya":`);
    ramyaUsers.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Display Name: ${user.displayName}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status || 'undefined'}`);
      console.log(`Is Active: ${user.isActive}`);
      console.log(`Created At: ${user.createdAt}`);
      console.log(`Updated At: ${user.updatedAt}`);
    });
    
    // If we found Ramya, look for her RSVPs
    if (ramyaUsers.length > 0) {
      console.log('\n🔍 Searching for RSVPs for Ramya...');
      
      const rsvpsRef = collection(db, 'rsvps');
      const rsvpsSnapshot = await getDocs(rsvpsRef);
      
      console.log(`📊 Found ${rsvpsSnapshot.docs.length} total RSVPs`);
      
      const ramyaRSVPs = [];
      rsvpsSnapshot.docs.forEach(doc => {
        const rsvpData = doc.data();
        const userId = rsvpData.userId;
        const email = rsvpData.email || '';
        const familyName = rsvpData.familyName || '';
        
        // Check if this RSVP belongs to any of the Ramya users
        const belongsToRamya = ramyaUsers.some(user => 
          user.id === userId || 
          email.toLowerCase().includes('ramya') ||
          familyName.toLowerCase().includes('ramya')
        );
        
        if (belongsToRamya) {
          ramyaRSVPs.push({
            id: doc.id,
            ...rsvpData
          });
        }
      });
      
      console.log(`🎫 Found ${ramyaRSVPs.length} RSVPs for Ramya:`);
      ramyaRSVPs.forEach((rsvp, index) => {
        console.log(`\n--- RSVP ${index + 1} ---`);
        console.log(`ID: ${rsvp.id}`);
        console.log(`Event ID: ${rsvp.eventId}`);
        console.log(`User ID: ${rsvp.userId}`);
        console.log(`Email: ${rsvp.email}`);
        console.log(`Family Name: ${rsvp.familyName}`);
        console.log(`Attendees: ${rsvp.attendees?.length || 0}`);
        console.log(`Submitted At: ${rsvp.submittedAt}`);
        console.log(`Created At: ${rsvp.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

queryRamyaData();