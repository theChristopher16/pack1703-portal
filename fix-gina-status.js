// Script to check Gina's actual data and fix the status issue
// Run this in your browser console

async function checkAndFixGinaStatus() {
  try {
    console.log('🔍 Checking Gina\'s actual data in Firestore...');
    
    // Get auth token
    let authToken = null;
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (key.includes('firebase') || key.includes('auth') || key.includes('token')) {
          try {
            const value = JSON.parse(window.localStorage.getItem(key));
            if (value && value.stsTokenManager && value.stsTokenManager.accessToken) {
              authToken = value.stsTokenManager.accessToken;
              console.log('✅ Found auth token');
              break;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
    
    if (!authToken) {
      console.log('❌ Could not find auth token');
      return;
    }
    
    // Let's try to find Gina by searching all users
    console.log('🔍 Searching for Gina in all users...');
    
    // We'll use a direct Firestore query to find Gina
    // First, let's try to get all users and see what's happening
    console.log('💡 The issue might be:');
    console.log('1. Gina\'s status field is not set correctly');
    console.log('2. The getUsers() method is filtering her out');
    console.log('3. There\'s a caching issue');
    console.log('');
    console.log('🔄 Let\'s try to update Gina\'s status to ensure it\'s correct...');
    
    // We need Gina's user ID first - let's try to find it
    // Since we can't easily search by email, let's try a different approach
    
    console.log('📝 To fix this issue:');
    console.log('1. Go to Firebase Console → Firestore Database');
    console.log('2. Go to the "users" collection');
    console.log('3. Search for "gina_daigle@yahoo.com"');
    console.log('4. Check if the "status" field is set to "approved"');
    console.log('5. If not, set it to "approved"');
    console.log('');
    console.log('Or run this script with Gina\'s user ID:');
    console.log('fixGinaStatus("USER_ID_HERE")');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function fixGinaStatus(userId) {
  try {
    console.log('🔄 Fixing Gina\'s status...');
    
    // Get auth token
    let authToken = null;
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (key.includes('firebase') || key.includes('auth') || key.includes('token')) {
          try {
            const value = JSON.parse(window.localStorage.getItem(key));
            if (value && value.stsTokenManager && value.stsTokenManager.accessToken) {
              authToken = value.stsTokenManager.accessToken;
              break;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
    
    if (!authToken) {
      console.log('❌ Could not find auth token');
      return;
    }
    
    // Update Gina's status to ensure it's correct
    const updates = {
      status: 'approved',
      isActive: true
    };
    
    console.log('📝 Updating Gina\'s status:', updates);
    
    const response = await fetch('https://us-central1-pack1703-portal.cloudfunctions.net/adminUpdateUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Firebase-App-Check': 'true'
      },
      body: JSON.stringify({
        data: {
          userId: userId,
          updates: updates
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('❌ Error details:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.result && result.result.success) {
      console.log('🎉 SUCCESS! Gina\'s status updated!');
      console.log('✅ She should now appear in the users list');
      console.log('🔄 Please refresh the Users page');
    } else {
      console.error('❌ Failed to update status:', result.result?.error || result.error);
    }
    
  } catch (error) {
    console.error('❌ Error updating Gina\'s status:', error);
  }
}

// Run the check function
checkAndFixGinaStatus();

// Export the fix function for manual use
window.fixGinaStatus = fixGinaStatus;
