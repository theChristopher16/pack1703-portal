/**
 * Test script to approve Gina Messa's account request
 * This script will call the approveAccountRequest Cloud Function
 */

// This is a simple test script that you can run from the browser console
// when you're logged in as an admin user

async function approveGinaMessa() {
  try {
    console.log('Starting Gina Messa approval process...');
    
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

// Instructions for running this script:
console.log(`
To approve Gina Messa's account request:

1. Open the Pack 1703 Portal in your browser
2. Make sure you're logged in as an admin user
3. Open the browser console (F12)
4. Copy and paste this entire script
5. Run: approveGinaMessa()

This will:
- Find Gina's pending account request
- Approve it using the fixed approveAccountRequest function
- Create her user account in the users collection
- Verify she appears in the approved users list
`);

// Export the function for use
window.approveGinaMessa = approveGinaMessa;
