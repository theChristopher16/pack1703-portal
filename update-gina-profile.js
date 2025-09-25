// Script to check and update Gina's profile
// Run this in your browser console

async function checkAndUpdateGinaProfile() {
  try {
    console.log('🔍 Checking Gina Messa\'s profile...');
    
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
    
    // First, let's find Gina's user ID by searching for her email
    console.log('🔍 Searching for Gina\'s user ID...');
    
    // We'll need to get all users and find Gina
    // For now, let's try to update her profile directly
    // You'll need to get her user ID from the admin panel first
    
    console.log('💡 To update Gina\'s profile:');
    console.log('1. Go to Admin → Users');
    console.log('2. Find Gina Messa in the list');
    console.log('3. Click the edit (pencil) icon');
    console.log('4. Update her profile information');
    console.log('');
    console.log('Or run this script with her user ID:');
    console.log('updateGinaProfile("USER_ID_HERE")');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function updateGinaProfile(userId) {
  try {
    console.log('🔄 Updating Gina\'s profile...');
    
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
    
    // Update Gina's profile with complete information
    const updates = {
      profile: {
        firstName: 'Gina',
        lastName: 'Messa',
        phone: '7133762589',
        address: '5122 Rutherglenn Dr',
        city: 'Houston',
        state: 'TX',
        zipCode: '77025',
        emergencyContact: '',
        emergencyPhone: '',
        medicalInfo: '',
        dietaryRestrictions: '',
        specialNeeds: '',
        den: 'Arrow of Light Den',
        rank: 'Adult',
        patrol: '',
        parentGuardian: '',
        parentPhone: '',
        parentEmail: ''
      }
    };
    
    console.log('📝 Updating profile with:', updates);
    
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
      console.log('🎉 SUCCESS! Gina\'s profile updated!');
      console.log('✅ Her profile information should now be complete');
    } else {
      console.error('❌ Failed to update profile:', result.result?.error || result.error);
    }
    
  } catch (error) {
    console.error('❌ Error updating Gina\'s profile:', error);
  }
}

// Run the check function
checkAndUpdateGinaProfile();

// Export the update function for manual use
window.updateGinaProfile = updateGinaProfile;
