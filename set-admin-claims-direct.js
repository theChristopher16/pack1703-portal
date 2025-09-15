// Direct script to set admin claims for the current user
// Run this in the browser console while logged in

// Get the current user's UID
const currentUser = firebase.auth().currentUser;
if (!currentUser) {
  console.error('No user logged in');
} else {
  console.log('Current user:', currentUser.email, 'UID:', currentUser.uid);
  
  // Call the setAdminClaims Cloud Function
  const setAdminClaims = firebase.functions().httpsCallable('setAdminClaims');
  
  setAdminClaims({ userId: currentUser.uid })
    .then((result) => {
      console.log('✅ Admin claims set successfully:', result.data);
      console.log('🔄 Please refresh the page to apply new permissions');
      alert('Admin claims set successfully! Please refresh the page.');
    })
    .catch((error) => {
      console.error('❌ Error setting admin claims:', error);
      alert('Error setting admin claims: ' + error.message);
    });
}

