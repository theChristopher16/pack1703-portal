/**
 * Simple script to create Gina Messa's account
 * Run this in the browser console on the Pack 1703 Portal
 */

// Simple function to create Gina's account
async function createGinaAccount() {
  try {
    console.log('Creating Gina Messa account...');
    
    // Try to find the Firebase app instance
    let functions;
    
    // Method 1: Try to access from window
    if (window.firebase) {
      functions = window.firebase.functions();
    }
    // Method 2: Try to access from React app
    else if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      // Try to find Firebase in React context
      console.log('Trying to access Firebase from React context...');
    }
    // Method 3: Try to import Firebase modules
    else {
      try {
        console.log('Importing Firebase modules...');
        const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
        const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        
        const app = getApp();
        functions = getFunctions(app, 'us-central1');
        console.log('✅ Firebase modules imported successfully');
      } catch (importError) {
        console.error('❌ Failed to import Firebase modules:', importError);
        return;
      }
    }
    
    if (!functions) {
      console.log('❌ Could not access Firebase functions');
      return;
    }
    
    // Create Gina's account using the createUserManually function
    const createUser = functions.httpsCallable ? functions.httpsCallable('createUserManually') : functions.httpsCallable('createUserManually');
    
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
    
    console.log('Calling createUserManually function...');
    const result = await createUser(userData);
    
    console.log('✅ Success!', result.data);
    console.log('Gina Messa has been created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    console.log('Error details:', error.message);
  }
}

// Export the function
window.createGinaAccount = createGinaAccount;

console.log(`
To create Gina Messa's account:

1. Make sure you're logged in as an admin user
2. Run: createGinaAccount()

This will create Gina's user account directly in the users collection.
`);
