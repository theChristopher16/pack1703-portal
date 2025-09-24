/**
 * Force Token Refresh - Client Side Solution
 * 
 * This script can be run in the browser console to force a token refresh
 * and resolve the RSVP viewer permissions issue.
 */

// Run this in the browser console when logged in as an admin user

console.log('🔄 Forcing authentication token refresh...');

// Get the current user
const user = firebase.auth().currentUser;

if (user) {
  console.log('✅ Current user:', user.email);
  console.log('Current token claims:', user.getIdTokenResult().then(result => {
    console.log('Token claims:', result.claims);
    
    // Force refresh the token
    return user.getIdToken(true); // true forces refresh
  }).then(newToken => {
    console.log('✅ Token refreshed successfully');
    console.log('New token obtained, custom claims should now be updated');
    
    // Test RSVP access
    console.log('🧪 Testing RSVP access...');
    
    // Try to access RSVPs
    const db = firebase.firestore();
    db.collection('rsvps').limit(1).get().then(snapshot => {
      console.log('✅ RSVP access test successful! Found', snapshot.size, 'documents');
      console.log('🎉 The RSVP viewer should now work correctly!');
    }).catch(error => {
      console.error('❌ RSVP access test failed:', error);
    });
    
  }).catch(error => {
    console.error('❌ Token refresh failed:', error);
  }));
} else {
  console.log('❌ No user is currently signed in');
}

console.log('📋 Instructions:');
console.log('1. Run this script in the browser console');
console.log('2. The token will be refreshed automatically');
console.log('3. Try the RSVP viewer again');
console.log('4. If it still doesn\'t work, sign out and sign back in');
