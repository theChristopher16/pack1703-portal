#!/usr/bin/env node

/**
 * Simple Payment Update Script
 * Uses your existing Firebase configuration
 * 
 * Usage: node update-payments-simple.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, addDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

// Your Firebase configuration (update these values)
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your API key
  authDomain: "pack1703-portal.firebaseapp.com",     // Replace with your domain  
  projectId: "pack1703-portal",                      // Replace with your project ID
  storageBucket: "pack1703-portal.appspot.com",     // Replace with your storage bucket
  messagingSenderId: "123456789012",                // Replace with your sender ID
  appId: "1:123456789012:web:abcdef1234567890"      // Replace with your app ID
};

// Configuration - UPDATE THESE VALUES
const EVENT_ID = 'lu6kyov2tFPWdFhpcgaj'; // Replace with your actual event ID
const PAYMENT_AMOUNT = 6000; // $60.00 in cents

// Users who have paid $60 (from your Square dashboard)
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function findUserByName(db, fullName) {
  const nameParts = fullName.toLowerCase().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  const usersSnapshot = await getDocs(collection(db, 'users'));
  
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
      return { id: userDoc.id, ...userData };
    }
  }
  
  return null;
}

async function updatePaymentStatus() {
  try {
    console.log('🚀 Payment Status Update Script');
    console.log('================================');
    console.log(`📋 Processing ${paidUsers.length} users`);
    console.log(`🎯 Event ID: ${EVENT_ID}`);
    console.log(`💰 Payment Amount: $${PAYMENT_AMOUNT / 100}`);
    console.log('');

    // Get admin credentials
    const adminEmail = await askQuestion('Enter your admin email: ');
    const adminPassword = await askQuestion('Enter your admin password: ');
    
    console.log('\n🔐 Connecting to Firebase...');
    
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
    
    console.log('\n🔄 Processing users...');
    
    for (const fullName of paidUsers) {
      console.log(`\n👤 Processing: ${fullName}`);
      
      try {
        // Find user
        const user = await findUserByName(db, fullName);
        
        if (!user) {
          console.log(`  ❌ User not found: ${fullName}`);
          notFoundCount++;
          continue;
        }
        
        console.log(`  ✅ Found user: ${user.displayName || user.email}`);
        
        // Find RSVP
        const rsvpQuery = query(
          collection(db, 'rsvps'),
          where('eventId', '==', EVENT_ID),
          where('userId', '==', user.id)
        );
        
        const rsvpSnapshot = await getDocs(rsvpQuery);
        
        if (rsvpSnapshot.empty) {
          console.log(`  ⚠️  No RSVP found for ${fullName}`);
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
        
        // Update RSVP
        await updateDoc(rsvpDoc.ref, {
          paymentStatus: 'completed',
          paymentMethod: 'square',
          paymentNotes: 'Updated from Square dashboard',
          paidAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Create payment record
        await addDoc(collection(db, 'payments'), {
          eventId: EVENT_ID,
          rsvpId: rsvpDoc.id,
          userId: user.id,
          amount: PAYMENT_AMOUNT,
          currency: 'USD',
          status: 'completed',
          description: `Payment for ${fullName}`,
          paymentMethod: 'square',
          notes: 'Updated from Square dashboard',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          processedAt: Timestamp.now()
        });
        
        console.log(`  ✅ Updated: ${fullName}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⚠️  Already paid: ${alreadyPaidCount}`);
    console.log(`❌ Not found: ${notFoundCount}`);
    console.log(`📋 Total: ${paidUsers.length}`);
    
    console.log('\n🎉 Complete!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    rl.close();
  }
}

updatePaymentStatus();






