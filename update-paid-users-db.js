#!/usr/bin/env node

/**
 * Direct Database Payment Update Script
 * Updates payment status for users who have already paid $60 via Square
 * 
 * Usage: node update-paid-users-db.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, addDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

// Firebase configuration - you'll need to update these values
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your API key
  authDomain: "pack1703-portal.firebaseapp.com",     // Replace with your domain
  projectId: "pack1703-portal",                      // Replace with your project ID
  storageBucket: "pack1703-portal.appspot.com",     // Replace with your storage bucket
  messagingSenderId: "123456789012",                // Replace with your sender ID
  appId: "1:123456789012:web:abcdef1234567890"      // Replace with your app ID
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

// Event details - UPDATE THESE VALUES
const EVENT_ID = 'lu6kyov2tFPWdFhpcgaj'; // Replace with your actual event ID
const PAYMENT_AMOUNT = 6000; // $60.00 in cents
const PAYMENT_CURRENCY = 'USD';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function updatePaymentStatus() {
  try {
    console.log('🔍 Starting payment status update...');
    console.log(`📋 Processing ${paidUsers.length} paid users`);
    console.log(`🎯 Event ID: ${EVENT_ID}`);
    console.log(`💰 Payment Amount: $${PAYMENT_AMOUNT / 100} ${PAYMENT_CURRENCY}`);
    console.log('');

    // Get admin credentials
    const adminEmail = await askQuestion('Enter your admin email: ');
    const adminPassword = await askQuestion('Enter your admin password: ');
    
    console.log('\n🔐 Signing in as admin...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Sign in as admin
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ Signed in successfully');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyPaidCount = 0;
    let errors = [];
    
    console.log('\n🔄 Processing users...');
    
    for (const fullName of paidUsers) {
      console.log(`\n👤 Processing: ${fullName}`);
      
      try {
        // Split name for flexible matching
        const nameParts = fullName.toLowerCase().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Get all users to search through
        console.log('  🔍 Searching for user...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let matchingUser = null;
        
        // Find matching user with flexible name matching
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
            userEmail.includes(lastName) ||
            (userFirstName.includes(firstName) && userLastName.includes(lastName))
          ) {
            matchingUser = { id: userDoc.id, ...userData };
            break;
          }
        }
        
        if (!matchingUser) {
          console.log(`  ❌ User not found: ${fullName}`);
          notFoundCount++;
          continue;
        }
        
        console.log(`  ✅ Found user: ${matchingUser.displayName || matchingUser.email}`);
        
        // Find RSVP for this user and event
        console.log('  🔍 Searching for RSVP...');
        const rsvpQuery = query(
          collection(db, 'rsvps'),
          where('eventId', '==', EVENT_ID),
          where('userId', '==', matchingUser.id)
        );
        
        const rsvpSnapshot = await getDocs(rsvpQuery);
        
        if (rsvpSnapshot.empty) {
          console.log(`  ⚠️  No RSVP found for ${fullName} in event ${EVENT_ID}`);
          notFoundCount++;
          continue;
        }
        
        const rsvpDoc = rsvpSnapshot.docs[0];
        const rsvpData = rsvpDoc.data();
        
        // Check if already paid
        if (rsvpData.paymentStatus === 'completed') {
          console.log(`  ✅ Already paid: ${fullName}`);
          alreadyPaidCount++;
          continue;
        }
        
        // Update RSVP payment status
        console.log('  💳 Updating RSVP payment status...');
        await updateDoc(rsvpDoc.ref, {
          paymentStatus: 'completed',
          paymentMethod: 'square',
          paymentNotes: 'Manually updated from Square dashboard',
          paidAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Create payment record
        console.log('  📝 Creating payment record...');
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
        
        console.log(`  ✅ Successfully updated payment status for: ${fullName}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`  ❌ Error processing ${fullName}:`, error.message);
        errors.push({ userName: fullName, error: error.message });
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⚠️  Already paid: ${alreadyPaidCount}`);
    console.log(`❌ Not found: ${notFoundCount}`);
    console.log(`📋 Total processed: ${paidUsers.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => {
        console.log(`  - ${error.userName}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Payment update complete!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    rl.close();
  }
}

// Run the script
console.log('🚀 Payment Status Update Script');
console.log('================================');
console.log('This script will update payment status for users who have already paid $60.');
console.log('Make sure you have the correct Firebase configuration and event ID.');
console.log('');

updatePaymentStatus();







