const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function searchForGinaMessa() {
  try {
    console.log('Searching for Gina Messa in Firebase...\n');

    // Search in accountRequests collection
    console.log('1. Searching accountRequests collection...');
    const accountRequestsSnapshot = await db.collection('accountRequests').get();
    
    let foundInRequests = false;
    accountRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase().includes('gina')) {
        console.log(`Found in accountRequests: ${doc.id}`);
        console.log(`Email: ${data.email}`);
        console.log(`Display Name: ${data.displayName}`);
        console.log(`Status: ${data.status}`);
        console.log(`Submitted At: ${data.submittedAt}`);
        foundInRequests = true;
      }
    });

    if (!foundInRequests) {
      console.log('No Gina found in accountRequests collection');
    }

    // Search in users collection
    console.log('\n2. Searching users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    let foundInUsers = false;
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase().includes('gina')) {
        console.log(`Found in users: ${doc.id}`);
        console.log(`Email: ${data.email}`);
        console.log(`Display Name: ${data.displayName}`);
        console.log(`Role: ${data.role}`);
        console.log(`Created At: ${data.createdAt}`);
        foundInUsers = true;
      }
    });

    if (!foundInUsers) {
      console.log('No Gina found in users collection');
    }

    // Search in adminActions collection for approval logs
    console.log('\n3. Searching adminActions collection for approval logs...');
    const adminActionsSnapshot = await db.collection('adminActions').get();
    
    let foundInActions = false;
    adminActionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.action === 'approve_account_request' && 
          data.details && data.details.toLowerCase().includes('gina')) {
        console.log(`Found approval action: ${doc.id}`);
        console.log(`Action: ${data.action}`);
        console.log(`Details: ${data.details}`);
        console.log(`Timestamp: ${data.timestamp}`);
        foundInActions = true;
      }
    });

    if (!foundInActions) {
      console.log('No Gina approval actions found');
    }

    console.log('\nSearch completed.');

  } catch (error) {
    console.error('Error searching for Gina Messa:', error);
  }
}

searchForGinaMessa();
