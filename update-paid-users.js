/**
 * Manual Payment Update Script
 * Updates payment status for users who have already paid via Square
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  // Your Firebase config will be loaded from environment
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

// Event details (you'll need to update this with your actual event)
const EVENT_ID = 'your-event-id-here'; // Replace with actual event ID
const PAYMENT_AMOUNT = 6000; // $60.00 in cents
const PAYMENT_CURRENCY = 'USD';

async function updatePaymentStatus() {
  try {
    console.log('🔍 Starting payment status update...');
    console.log(`📋 Processing ${paidUsers.length} paid users`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyPaidCount = 0;
    
    for (const fullName of paidUsers) {
      console.log(`\n👤 Processing: ${fullName}`);
      
      try {
        // Split name into parts for flexible matching
        const nameParts = fullName.toLowerCase().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Search for users by name (flexible matching)
        const usersQuery = query(
          collection(db, 'users'),
          where('profile.firstName', '>=', firstName),
          where('profile.firstName', '<=', firstName + '\uf8ff')
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        let matchingUser = null;
        
        // Find the best match
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userFirstName = userData.profile?.firstName?.toLowerCase() || '';
          const userLastName = userData.profile?.lastName?.toLowerCase() || '';
          const userDisplayName = userData.displayName?.toLowerCase() || '';
          
          // Check various name combinations
          if (
            (userFirstName === firstName && userLastName === lastName) ||
            userDisplayName.includes(firstName) ||
            userDisplayName.includes(lastName) ||
            (userFirstName === firstName && userLastName.includes(lastName)) ||
            (userFirstName.includes(firstName) && userLastName === lastName)
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
          amount: PAYMENT_AMOUNT,
          currency: PAYMENT_CURRENCY,
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



