const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'pack1703-portal'
});

async function fixUserRole() {
  try {
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2';
    
    console.log('🔧 Updating user custom claims...');
    
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
    
    console.log('🎉 User role fix complete!');
    console.log('📝 Next steps:');
    console.log('1. Refresh your browser page');
    console.log('2. The AdminUsers page should now work');
    
  } catch (error) {
    console.error('❌ Error updating user claims:', error.message);
  }
  
  process.exit(0);
}

fixUserRole();
