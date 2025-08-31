// Simple Firestore test script
import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase/config';

async function testFirestoreAccess() {
  try {
    console.log('Testing Firestore access...');
    
    // Test events collection
    console.log('Testing events collection...');
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    console.log(`Events found: ${eventsSnapshot.size}`);
    
    // Test announcements collection
    console.log('Testing announcements collection...');
    const announcementsRef = collection(db, 'announcements');
    const announcementsSnapshot = await getDocs(announcementsRef);
    console.log(`Announcements found: ${announcementsSnapshot.size}`);
    
    // Test chat-channels collection
    console.log('Testing chat-channels collection...');
    const channelsRef = collection(db, 'chat-channels');
    const channelsSnapshot = await getDocs(channelsRef);
    console.log(`Chat channels found: ${channelsSnapshot.size}`);
    
    console.log('Firestore access test completed successfully!');
  } catch (error) {
    console.error('Firestore access test failed:', error);
  }
}

testFirestoreAccess();
