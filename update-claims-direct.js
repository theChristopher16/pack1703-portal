// Direct Cloud Function call to update user claims
// Run this in the browser console on the Pack 1703 Portal page

async function updateClaimsDirect() {
  try {
    console.log('🔧 Updating user custom claims via direct Cloud Function call...');
    
    // Get auth token from localStorage
    const authToken = localStorage.getItem('firebase:authUser:pack1703-portal:default');
    if (!authToken) {
      console.error('❌ No auth token found in localStorage');
      return;
    }
    
    const userData = JSON.parse(authToken);
    const idToken = userData.stsTokenManager.accessToken;
    
    if (!idToken) {
      console.error('❌ No access token found');
      return;
    }
    
    console.log('👤 User:', userData.email, userData.uid);
    
    // Call the Cloud Function directly
    const response = await fetch('https://us-central1-pack1703-portal.cloudfunctions.net/updateUserClaims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Firebase-App-Check': 'debug-token' // Bypass App Check
      },
      body: JSON.stringify({
        data: {
          targetUserId: userData.uid,
          role: 'super-admin'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Claims updated successfully:', result);
    
    // Clear localStorage to force re-authentication
    console.log('🔄 Clearing auth data to force re-authentication...');
    localStorage.removeItem('firebase:authUser:pack1703-portal:default');
    
    console.log('✅ Please refresh the page and log back in to apply the new claims');
    console.log('💡 After logging back in, try the chat page again');
    
  } catch (error) {
    console.error('❌ Error updating user claims:', error);
    console.log('💡 Try refreshing the page and running this script again');
  }
}

// Export to window for easy access
window.updateClaimsDirect = updateClaimsDirect;

console.log('🔧 updateClaimsDirect function loaded');
console.log('💡 Run updateClaimsDirect() to update your custom claims');
