/**
 * Browser-based script to check user den assignments
 * Run this in your browser console while logged into the Pack 1703 Portal as admin
 */

async function checkUserDenAssignments() {
  try {
    console.log('🔍 Checking current user den assignments...\n');

    // Check if we have Firebase available
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not available');
      return;
    }
    
    // Check authentication
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user - please log in first');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('✅ User UID:', user.uid);
    
    // Check user role
    const idToken = await user.getIdToken(true);
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    console.log('👑 User role:', payload.role);
    
    if (!['admin', 'super-admin', 'root'].includes(payload.role)) {
      console.log('❌ Admin access required');
      return;
    }

    // Get Firestore instance
    const db = firebase.firestore();
    
    // Get all users
    console.log('\n2️⃣ Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📊 Total users found: ${usersSnapshot.docs.length}\n`);

    // Analyze user den assignments
    const usersByDen = {
      'lion': [],
      'tiger': [],
      'wolf': [],
      'bear': [],
      'webelos': [],
      'arrow-of-light': []
    };
    
    const usersWithoutDens = [];
    const usersWithMultipleDens = [];

    console.log('👥 User Den Assignment Summary:');
    console.log('=' .repeat(50));

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`\n👤 ${userData.displayName || userData.email}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🏠 Primary Den: ${userData.den || 'Not set'}`);
      console.log(`   🏕️ All Dens: [${(userData.dens || []).join(', ') || 'None'}]`);
      console.log(`   ✅ Status: ${userData.status || 'Unknown'}`);
      console.log(`   👑 Role: ${userData.role || 'Unknown'}`);

      // Categorize users
      if (!userData.dens || userData.dens.length === 0) {
        usersWithoutDens.push({
          id: userId,
          name: userData.displayName || userData.email,
          email: userData.email
        });
      } else if (userData.dens.length > 1) {
        usersWithMultipleDens.push({
          id: userId,
          name: userData.displayName || userData.email,
          email: userData.email,
          dens: userData.dens
        });
      }

      // Add to den-specific arrays
      if (userData.dens) {
        userData.dens.forEach(den => {
          if (usersByDen[den]) {
            usersByDen[den].push({
              id: userId,
              name: userData.displayName || userData.email,
              email: userData.email
            });
          }
        });
      }
    });

    // Summary by den
    console.log('\n\n📊 Summary by Den:');
    console.log('=' .repeat(30));
    
    Object.entries(usersByDen).forEach(([den, users]) => {
      const emoji = {
        'lion': '🦁',
        'tiger': '🐯', 
        'wolf': '🐺',
        'bear': '🐻',
        'webelos': '🏕️',
        'arrow-of-light': '🏹'
      }[den];
      
      console.log(`${emoji} ${den.toUpperCase()} DEN: ${users.length} users`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    });

    // Users needing den assignments
    console.log('\n\n⚠️  Users Without Den Assignments:');
    console.log('=' .repeat(40));
    if (usersWithoutDens.length === 0) {
      console.log('✅ All users have den assignments!');
    } else {
      console.log(`📋 ${usersWithoutDens.length} users need den assignments:`);
      usersWithoutDens.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }

    // Multi-den families
    console.log('\n\n👨‍👩‍👧‍👦 Multi-Den Families:');
    console.log('=' .repeat(30));
    if (usersWithMultipleDens.length === 0) {
      console.log('📝 No families with scouts in multiple dens found.');
    } else {
      console.log(`👨‍👩‍👧‍👦 ${usersWithMultipleDens.length} families with multiple scouts:`);
      usersWithMultipleDens.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
        console.log(`     Dens: [${user.dens.join(', ')}]`);
      });
    }

    // Recommendations
    console.log('\n\n💡 Recommendations:');
    console.log('=' .repeat(25));
    
    if (usersWithoutDens.length > 0) {
      console.log('🔧 ACTION NEEDED:');
      console.log('   1. Set up den assignments for users without dens');
      console.log('   2. Use the assignUserDens() function to bulk-assign dens');
    }
    
    const totalUsers = usersSnapshot.docs.length;
    const usersWithDens = totalUsers - usersWithoutDens.length;
    
    console.log(`\n📈 Current Status:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Users with Den Assignments: ${usersWithDens}`);
    console.log(`   Users without Den Assignments: ${usersWithoutDens.length}`);
    console.log(`   Completion Rate: ${Math.round((usersWithDens / totalUsers) * 100)}%`);

    // Store results globally for use by other functions
    window.userDenResults = {
      totalUsers,
      usersWithDens,
      usersWithoutDens,
      usersWithMultipleDens,
      usersByDen,
      usersSnapshot
    };

    console.log('\n✅ User den assignment check completed!');
    console.log('📋 Results stored in window.userDenResults');
    
    return window.userDenResults;

  } catch (error) {
    console.error('❌ Error checking user den assignments:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Function to assign dens to specific users
async function assignUserDens(userEmail, dens) {
  try {
    console.log(`🔧 Assigning dens [${dens.join(', ')}] to user: ${userEmail}`);
    
    const db = firebase.firestore();
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', userEmail)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`❌ User not found: ${userEmail}`);
      return false;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    // Update user with new den assignments
    await db.collection('users').doc(userId).update({
      dens: dens,
      den: dens[0] || null, // Set primary den to first in array
      updatedAt: new Date()
    });
    
    console.log(`✅ Successfully assigned dens [${dens.join(', ')}] to ${userEmail}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error assigning dens to ${userEmail}:`, error);
    return false;
  }
}

// Function to bulk assign dens to users without assignments
async function bulkAssignDens() {
  try {
    if (!window.userDenResults) {
      console.log('❌ No user results found. Run checkUserDenAssignments() first.');
      return;
    }
    
    const usersWithoutDens = window.userDenResults.usersWithoutDens;
    
    if (usersWithoutDens.length === 0) {
      console.log('✅ No users need den assignments!');
      return;
    }
    
    console.log(`🔧 Bulk assigning dens to ${usersWithoutDens.length} users...`);
    console.log('📝 Note: This will assign "lion" den as default. Update manually as needed.');
    
    let successCount = 0;
    
    for (const user of usersWithoutDens) {
      const success = await assignUserDens(user.email, ['lion']);
      if (success) {
        successCount++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Bulk assignment completed: ${successCount}/${usersWithoutDens.length} users updated`);
    
    // Refresh results
    await checkUserDenAssignments();
    
  } catch (error) {
    console.error('❌ Error in bulk assignment:', error);
  }
}

// Make functions available globally
window.checkUserDenAssignments = checkUserDenAssignments;
window.assignUserDens = assignUserDens;
window.bulkAssignDens = bulkAssignDens;

console.log('🚀 User Den Assignment Scripts Loaded!');
console.log('📋 Available functions:');
console.log('   - checkUserDenAssignments() - Check current den assignments');
console.log('   - assignUserDens(email, dens) - Assign dens to specific user');
console.log('   - bulkAssignDens() - Bulk assign "lion" den to users without assignments');
console.log('');
console.log('💡 Example usage:');
console.log('   checkUserDenAssignments()');
console.log('   assignUserDens("parent@example.com", ["lion", "wolf"])');
console.log('   bulkAssignDens()');
