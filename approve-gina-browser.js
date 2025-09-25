/**
 * Test script to approve Gina Messa's account request
 * This script will call the approveAccountRequest Cloud Function
 */

// This is a simple test script that you can run from the browser console
// when you're logged in as an admin user

async function approveGinaMessa() {
  try {
    console.log('Starting Gina Messa approval process...');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not found. Make sure you\'re on the Pack 1703 Portal page.');
      console.log('Try refreshing the page and running this script again.');
      return;
    }
    
    // Get the Firebase functions
    const functions = firebase.functions();
    
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
    
    // Verify she's now in the users collection
    console.log('Verifying user creation...');
    const getUsers = functions.httpsCallable('getBatchDashboardData');
    const usersResult = await getUsers({});
    
    const ginaUser = usersResult.data.users.find(user => 
      user.email === 'gina_daigle@yahoo.com'
    );
    
    if (ginaUser) {
      console.log('✅ Gina Messa found in users collection:', ginaUser);
    } else {
      console.log('❌ Gina Messa not found in users collection');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('Error details:', error.message);
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
