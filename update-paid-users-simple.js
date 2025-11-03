/**
 * Manual Payment Update Script - Simple Version
 * Run this to update payment status for users who have already paid $60
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, addDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// You'll need to replace these with your actual values
const EVENT_ID = 'lu6kyov2tFPWdFhpcgaj'; // Replace with your actual event ID
const ADMIN_EMAIL = 'your-admin-email@example.com'; // Replace with your admin email
const ADMIN_PASSWORD = 'your-admin-password'; // Replace with your admin password

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// List of people who have paid $60 (from your Square dashboard)
const paidUsers = [
  'Megan Williams',
  'Eric Bucknam', 
  'Sarah Cotting',
  'Vanessa Gerard',
  'Christopher Smith',
  'Jocelyn Bacon',
  'Edgar Folmar',
  'Ramya Kantheti',
  'Wei Gao',
  'Nidhi Aggarwal',
  'Caitlin Seo',
  'James Morley',
  'Stephen Tadlock',
  'Shana Johnson'
];

async function updatePaymentStatus() {
  try {
    console.log('🔍 Starting payment status update...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Sign in as admin
    console.log('🔐 Signing in as admin...');
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Signed in successfully');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyPaidCount = 0;
    
    for (const fullName of paidUsers) {
      console.log(`\n👤 Processing: ${fullName}`);
      
      try {
        // Split name for flexible matching
        const nameParts = fullName.toLowerCase().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Get all users to search through
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let matchingUser = null;
        
        // Find matching user
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userFirstName = userData.profile?.firstName?.toLowerCase() || '';
          const userLastName = userData.profile?.lastName?.toLowerCase() || '';
          const userDisplayName = userData.displayName?.toLowerCase() || '';
          const userEmail = userData.email?.toLowerCase() || '';
          
          // Flexible name matching
          if (
            (userFirstName === firstName && userLastName === lastName) ||
            userDisplayName.includes(firstName) ||
            userDisplayName.includes(lastName) ||
            userEmail.includes(firstName) ||
            userEmail.includes(lastName)
          ) {
            matchingUser = { id: userDoc.id, ...userData };
            break;
          }
        }
        
        if (!matchingUser) {
          console.log(`❌ User not found: ${fullName}`);
          notFoundCount++;
          continue;
        }
        
        console.log(`✅ Found user: ${matchingUser.displayName || matchingUser.email}`);
        
        // Find RSVP for this user and event
        const rsvpQuery = query(
          collection(db, 'rsvps'),
          where('eventId', '==', EVENT_ID),
          where('userId', '==', matchingUser.id)
        );
        
        const rsvpSnapshot = await getDocs(rsvpQuery);
        
        if (rsvpSnapshot.empty) {
          console.log(`⚠️  No RSVP found for ${fullName} in event ${EVENT_ID}`);
          notFoundCount++;
          continue;
        }
        
        const rsvpDoc = rsvpSnapshot.docs[0];
        const rsvpData = rsvpDoc.data();
        
        // Check if already paid
        if (rsvpData.paymentStatus === 'completed') {
          console.log(`✅ Already paid: ${fullName}`);
          alreadyPaidCount++;
          continue;
        }
        
        // Update RSVP payment status
        await updateDoc(rsvpDoc.ref, {
          paymentStatus: 'completed',
          paymentMethod: 'square',
          paymentNotes: 'Manually updated from Square dashboard',
          paidAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Create payment record
        const paymentData = {
          eventId: EVENT_ID,
          rsvpId: rsvpDoc.id,
          userId: matchingUser.id,
          amount: 6000, // $60.00 in cents
          currency: 'USD',
          status: 'completed',
          description: `Manual payment update for ${fullName}`,
          paymentMethod: 'square',
          notes: 'Updated from Square dashboard records',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          processedAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'payments'), paymentData);
        
        console.log(`✅ Updated payment status for: ${fullName}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${fullName}:`, error);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⚠️  Already paid: ${alreadyPaidCount}`);
    console.log(`❌ Not found: ${notFoundCount}`);
    console.log(`📋 Total processed: ${paidUsers.length}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
updatePaymentStatus();





