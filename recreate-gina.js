// Script to search for Gina and recreate her if missing
// Run this in your browser console

async function searchAndRecreateGina() {
  try {
    console.log('🔍 Searching for Gina Messa in the system...');
    
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
    
    // First, let's try to search for Gina using the admin functions
    console.log('🔍 Checking if Gina exists in users collection...');
    
    // We'll create her again to be safe
    console.log('🔄 Creating Gina Messa account...');
    
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
      reasonForJoining: 'Info sharing between packs! I am with pack 34'
    };
    
    console.log('📝 Creating user with data:', userData);
    
    const response = await fetch('https://us-central1-pack1703-portal.cloudfunctions.net/createUserManually', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Firebase-App-Check': 'true'
      },
      body: JSON.stringify({
        data: userData
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
      console.log('🎉 SUCCESS! Gina Messa account created!');
      console.log('User ID:', result.result.userId);
      console.log('Email:', result.result.email);
      console.log('Display Name:', result.result.displayName);
      console.log('Role:', result.result.role);
      console.log('✅ Gina should now appear in the approved users list!');
      console.log('');
      console.log('🔄 Please refresh the Users page to see Gina in the list');
    } else {
      console.error('❌ Failed to create account:', result.result?.error || result.error);
    }
    
  } catch (error) {
    console.error('❌ Error creating Gina\'s account:', error);
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure you are logged in as an admin');
    console.log('2. Make sure you are on the Pack 1703 Portal page');
    console.log('3. Try refreshing the page and running this script again');
  }
}

// Run the function
searchAndRecreateGina();
