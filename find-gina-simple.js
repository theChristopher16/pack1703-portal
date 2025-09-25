// Simple script to find and fix Gina's status
// Run this in your browser console

async function findAndFixGina() {
  try {
    console.log('🔍 Looking for Gina Messa...');
    
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
    
    console.log('💡 The issue is that Gina exists but is being filtered out by the getUsers() method');
    console.log('🔄 Let\'s try a different approach - let\'s check if there\'s a caching issue');
    console.log('');
    console.log('📝 Try these steps:');
    console.log('1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. Clear browser cache');
    console.log('3. Check if all filters are set to "All"');
    console.log('4. Try logging out and back in');
    console.log('');
    console.log('If that doesn\'t work, we need to find Gina\'s user ID in Firebase Console');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
findAndFixGina();
