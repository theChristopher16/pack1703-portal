// Browser script to update user custom claims using Firebase v9+ modular SDK
// Run this in the browser console on the Pack 1703 Portal page

async function updateUserClaims() {
  try {
    console.log('🔧 Updating user custom claims...');
    
    // Try to find Firebase app and functions
    let functions, auth, currentUser;
    
    // Method 1: Try to get from existing Firebase app
    try {
      const { getFunctions, getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFunctions: getFunctionsAuth, getAuth: getAuthAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFunctions: getFunctionsFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
      
      // Get the default app
      const apps = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const app = apps.getApps()[0];
      
      if (app) {
        functions = getFunctionsFunctions(app);
        auth = getAuthAuth(app);
        currentUser = auth.currentUser;
        console.log('✅ Found Firebase app via modular SDK');
      }
    } catch (error) {
      console.log('❌ Could not find Firebase via modular SDK:', error.message);
    }
    
    // Method 2: Try legacy Firebase
    if (!currentUser && window.firebase) {
      auth = window.firebase.auth();
      currentUser = auth.currentUser;
      functions = window.firebase.functions();
      console.log('✅ Found Firebase via legacy SDK');
    }
    
    // Method 3: Try to find in React context
    if (!currentUser) {
      console.log('🔍 Searching for Firebase in React context...');
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactInternalFiber) {
        // This is a simplified approach - in reality, finding React context is complex
        console.log('❌ Could not access React context directly');
      }
    }
    
    if (!currentUser) {
      console.error('❌ No authenticated user found. Please make sure you are logged in.');
      return;
    }
    
    console.log('👤 Current user:', currentUser.email, currentUser.uid);
    
    // Get the updateUserClaims function
    let updateUserClaimsFunction;
    if (functions) {
      if (window.firebase) {
        // Legacy SDK
        updateUserClaimsFunction = functions.httpsCallable('updateUserClaims');
      } else {
        // Modular SDK
        const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
        updateUserClaimsFunction = httpsCallable(functions, 'updateUserClaims');
      }
    } else {
      console.error('❌ Could not access Firebase Functions');
      return;
    }
    
    // Update claims to super-admin
    console.log('🔄 Calling updateUserClaims Cloud Function...');
    const result = await updateUserClaimsFunction({
      targetUserId: currentUser.uid,
      role: 'super-admin'
    });
    
    console.log('✅ Claims updated successfully:', result.data);
    
    // Force token refresh
    console.log('🔄 Forcing token refresh...');
    const tokenResult = await currentUser.getIdToken(true);
    console.log('✅ Token refreshed');
    
    // Log out and back in to apply new claims
    console.log('🚪 Logging out to apply new claims...');
    await auth.signOut();
    
    console.log('✅ Please log back in to apply the new claims');
    console.log('💡 After logging back in, try the chat page again');
    
  } catch (error) {
    console.error('❌ Error updating user claims:', error);
    console.log('💡 Try refreshing the page and running this script again');
  }
}

// Export to window for easy access
window.updateUserClaims = updateUserClaims;

console.log('🔧 updateUserClaims function loaded');
console.log('💡 Run updateUserClaims() to update your custom claims');
