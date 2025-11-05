/**
 * Quick Payment Status Update for Christopher Smith
 * This will update your payment status to "completed" for the USS Stewart event
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your API key
  authDomain: "pack1703-portal.firebaseapp.com",     // Replace with your domain  
  projectId: "pack1703-portal",                      // Replace with your project ID
  storageBucket: "pack1703-portal.appspot.com",     // Replace with your storage bucket
  messagingSenderId: "123456789012",                // Replace with your sender ID
  appId: "1:123456789012:web:abcdef1234567890"      // Replace with your app ID
};

const EVENT_ID = 'lu6kyov2tFPWdFhpcgaj'; // USS Stewart event
const USER_EMAIL = 'christophersmithm16@gmail.com'; // Your email

async function updateChristopherPayment() {
  try {
    console.log('🔍 Updating Christopher Smith payment status...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Sign in as you
    console.log('🔐 Signing in...');
    await signInWithEmailAndPassword(auth, USER_EMAIL, 'your-password-here'); // You'll need to enter your password
    console.log('✅ Signed in successfully');
    
    // Find your RSVP for the USS Stewart event
    console.log('🔍 Finding your RSVP...');
    const rsvpQuery = query(
      collection(db, 'rsvps'),
      where('eventId', '==', EVENT_ID),
      where('userEmail', '==', USER_EMAIL)
    );
    
    const rsvpSnapshot = await getDocs(rsvpQuery);
    
    if (rsvpSnapshot.empty) {
      console.log('❌ No RSVP found for Christopher Smith');
      return;
    }
    
    const rsvpDoc = rsvpSnapshot.docs[0];
    const rsvpData = rsvpDoc.data();
    
    console.log('✅ Found RSVP:', rsvpData.familyName || 'Christopher Smith');
    
    // Update payment status to completed
    console.log('💳 Updating payment status to completed...');
    await updateDoc(rsvpDoc.ref, {
      paymentStatus: 'completed',
      paymentMethod: 'square',
      paymentNotes: 'Manually updated - Christopher Smith paid via Square',
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Payment status updated successfully!');
    console.log('🎉 You should now see "Payment Complete" on the event card');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateChristopherPayment();







