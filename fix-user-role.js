// Fix user role in Firebase Auth custom claims
// Run this in Firebase Functions shell

const admin = require('firebase-admin');

async function fixUserRole() {
  try {
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    
    // Set the correct custom claims
    await admin.auth().setCustomUserClaims(userId, {
      approved: true,
      role: 'super-admin'  // This matches what AdminContext expects
    });
    
    console.log('✅ Successfully updated user custom claims');
    console.log('User ID:', userId);
    console.log('New role:', 'super-admin');
    
    // Verify the change
    const user = await admin.auth().getUser(userId);
    console.log('Verified custom claims:', user.customClaims);
    
  } catch (error) {
    console.error('❌ Error updating user claims:', error);
  }
}

fixUserRole();
