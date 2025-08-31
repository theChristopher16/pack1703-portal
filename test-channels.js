const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config (you'll need to replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkChannels() {
  try {
    console.log('Checking for duplicate channels...');
    
    const channelsRef = collection(db, 'chat-channels');
    const q = query(channelsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    const channels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${channels.length} channels`);
    
    // Check for duplicates by ID
    const channelIds = channels.map(c => c.id);
    const uniqueIds = new Set(channelIds);
    
    if (channelIds.length !== uniqueIds.size) {
      console.warn('Duplicate channel IDs found!');
      const duplicates = channelIds.filter((id, index) => channelIds.indexOf(id) !== index);
      console.log('Duplicate IDs:', duplicates);
    } else {
      console.log('No duplicate channel IDs found');
    }
    
    // Check for duplicates by name
    const channelNames = channels.map(c => c.name);
    const uniqueNames = new Set(channelNames);
    
    if (channelNames.length !== uniqueNames.size) {
      console.warn('Duplicate channel names found!');
      const duplicateNames = channelNames.filter((name, index) => channelNames.indexOf(name) !== index);
      console.log('Duplicate names:', duplicateNames);
    } else {
      console.log('No duplicate channel names found');
    }
    
    // Log all channels
    console.log('\nAll channels:');
    channels.forEach(channel => {
      console.log(`- ${channel.name} (ID: ${channel.id})`);
    });
    
  } catch (error) {
    console.error('Error checking channels:', error);
  }
}

checkChannels();
