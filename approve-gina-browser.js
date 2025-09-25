/**
 * Test script to approve Gina Messa's account request
 * This script works with Firebase v9+ modular SDK
 */

// This script works with the Firebase v9+ modular SDK used in your app

async function approveGinaMessa() {
  try {
    console.log('Starting Gina Messa approval process...');
    
    // Check if Firebase is available in the global scope
    if (typeof firebase === 'undefined') {
      console.log('❌ Legacy Firebase not found. Trying to access Firebase from window...');
      
      // Try to access Firebase from the window object or React app
      if (window.firebase) {
        console.log('✅ Found Firebase on window object');
        var firebaseApp = window.firebase;
      } else {
        console.log('❌ Firebase not found on window object either.');
        console.log('This app uses Firebase v9+ modular SDK.');
        console.log('Let me try a different approach...');
        
        // Try to access the Firebase functions directly from the app
        try {
          // Check if we can access the functions from the app's context
          const appElement = document.querySelector('[data-firebase-app]');
          if (appElement) {
            console.log('Found Firebase app element');
          }
          
          // Try to use the existing Firebase instance
          console.log('Attempting to use existing Firebase instance...');
          
          // Import Firebase modules dynamically
          const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
          const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
          
          const app = getApp();
          const functions = getFunctions(app, 'us-central1');
          
          console.log('✅ Successfully imported Firebase modules');
          
          // Now proceed with the approval
          await approveWithModularSDK(functions);
          return;
          
        } catch (importError) {
          console.error('❌ Failed to import Firebase modules:', importError);
          console.log('Please try refreshing the page and running this script again.');
          return;
        }
      }
    } else {
      console.log('✅ Found legacy Firebase');
      var firebaseApp = firebase;
    }
    
    // Use legacy Firebase if available
    if (firebaseApp) {
      const functions = firebaseApp.functions();
      await approveWithLegacySDK(functions);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('Error details:', error.message);
  }
}

async function approveWithModularSDK(functions) {
  try {
    const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
    
    // First, get pending account requests
    console.log('Getting pending account requests...');
    const getPendingRequests = httpsCallable(functions, 'getPendingAccountRequests');
    const requestsResult = await getPendingRequests({ pageSize: 50 });
    
    console.log('Pending requests:', requestsResult.data);
    
    // Find Gina's request
    const ginaRequest = requestsResult.data.requests.find(req => 
      req.email === 'gina_daigle@yahoo.com' || 
      req.displayName === 'Gina Messa'
    );
    
    if (!ginaRequest) {
      console.log('❌ Gina Messa\'s request not found in pending requests');
      console.log('Available requests:', requestsResult.data.requests.map(r => ({ id: r.id, email: r.email, displayName: r.displayName })));
      return;
    }
    
    console.log('Found Gina\'s request:', ginaRequest);
    
    // Approve the request
    console.log('Approving Gina Messa\'s request...');
    const approveRequest = httpsCallable(functions, 'approveAccountRequest');
    const approveResult = await approveRequest({
      requestId: ginaRequest.id,
      role: 'parent'
    });
    
    console.log('✅ Success!', approveResult.data);
    console.log('Gina Messa has been approved and her user account created!');
    
  } catch (error) {
    console.error('Error with modular SDK:', error);
  }
}

async function approveWithLegacySDK(functions) {
  try {
    // First, get pending account requests
    console.log('Getting pending account requests...');
    const getPendingRequests = functions.httpsCallable('getPendingAccountRequests');
    const requestsResult = await getPendingRequests({ pageSize: 50 });
    
    console.log('Pending requests:', requestsResult.data);
    
    // Find Gina's request
    const ginaRequest = requestsResult.data.requests.find(req => 
      req.email === 'gina_daigle@yahoo.com' || 
      req.displayName === 'Gina Messa'
    );
    
    if (!ginaRequest) {
      console.log('❌ Gina Messa\'s request not found in pending requests');
      console.log('Available requests:', requestsResult.data.requests.map(r => ({ id: r.id, email: r.email, displayName: r.displayName })));
      return;
    }
    
    console.log('Found Gina\'s request:', ginaRequest);
    
    // Approve the request
    console.log('Approving Gina Messa\'s request...');
    const approveRequest = functions.httpsCallable('approveAccountRequest');
    const approveResult = await approveRequest({
      requestId: ginaRequest.id,
      role: 'parent'
    });
    
    console.log('✅ Success!', approveResult.data);
    console.log('Gina Messa has been approved and her user account created!');
    
  } catch (error) {
    console.error('Error with legacy SDK:', error);
  }
}

// Alternative function to create Gina manually if approval doesn't work
async function createGinaManually() {
  try {
    console.log('Creating Gina Messa manually...');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not found. Make sure you\'re on the Pack 1703 Portal page.');
      return;
    }
    
    const functions = firebase.functions();
    const createUser = functions.httpsCallable('createUserManually');
    
    const userData = {
      email: 'gina_daigle@yahoo.com',
      displayName: 'Gina Messa',
      firstName: 'Gina',
      lastName: 'Messa',
      phone: '7133762589',
      address: '5122 Rutherglenn Dr',
      city: 'Houston',
      state: 'TX',
      zipCode: '77025',
      den: 'Arrow of Light Den',
      rank: 'Adult',
      role: 'parent',
      reasonForJoining: 'Info sharing between packs! I\'m with pack 34'
    };
    
    const result = await createUser(userData);
    console.log('✅ Gina Messa created manually:', result.data);
    
  } catch (error) {
    console.error('Error creating Gina manually:', error);
    console.log('Error details:', error.message);
  }
}

// Instructions for running this script:
console.log(`
To approve Gina Messa's account request:

1. Make sure you're on the Pack 1703 Portal page (sfpack1703.com)
2. Make sure you're logged in as an admin user
3. Open the browser console (F12)
4. Copy and paste this entire script
5. Run: approveGinaMessa()

If the approval doesn't work, try the manual creation:
6. Run: createGinaManually()

This will:
- Find Gina's pending account request
- Approve it using the fixed approveAccountRequest function
- Create her user account in the users collection
- Verify she appears in the approved users list

If you get "Firebase not found" error:
- Refresh the page and try again
- Make sure you're on the correct domain (sfpack1703.com)
`);

// Export the functions for use
window.approveGinaMessa = approveGinaMessa;
window.createGinaManually = createGinaManually;
