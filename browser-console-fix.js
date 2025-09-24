// Run this in the browser console to fix the RSVP viewer permissions issue

console.log('🔧 RSVP Viewer Permissions Fix');
console.log('==============================');

// Check current authentication state
const user = firebase.auth().currentUser;
if (!user) {
  console.error('❌ No user is signed in');
  process.exit(1);
}

console.log('✅ User signed in:', user.email);
console.log('User UID:', user.uid);

// Check current token claims
user.getIdTokenResult().then(tokenResult => {
  console.log('🔍 Current token claims:');
  console.log('- Role:', tokenResult.claims.role || 'NOT SET');
  console.log('- isAdmin:', tokenResult.claims.isAdmin || 'NOT SET');
  console.log('- All claims:', tokenResult.claims);
  
  // Force refresh the token
  console.log('\n🔄 Forcing token refresh...');
  return user.getIdToken(true);
}).then(newToken => {
  console.log('✅ Token refreshed successfully');
  
  // Check new token claims
  return user.getIdTokenResult();
}).then(newTokenResult => {
  console.log('\n🔍 New token claims:');
  console.log('- Role:', newTokenResult.claims.role || 'NOT SET');
  console.log('- isAdmin:', newTokenResult.claims.isAdmin || 'NOT SET');
  
  // Test RSVP access
  console.log('\n🧪 Testing RSVP access...');
  const db = firebase.firestore();
  
  return db.collection('rsvps').limit(1).get();
}).then(snapshot => {
  console.log('✅ RSVP access test successful!');
  console.log('Found', snapshot.size, 'RSVP documents');
  console.log('\n🎉 The RSVP viewer should now work!');
  console.log('Try refreshing the RSVP modal or clicking the "Refresh" button.');
}).catch(error => {
  console.error('❌ Error:', error);
  console.log('\n🔧 If the error persists, try:');
  console.log('1. Sign out and sign back in');
  console.log('2. Clear browser cache and cookies');
  console.log('3. Check if Firestore rules are properly deployed');
});
