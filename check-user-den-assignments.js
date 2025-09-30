/**
 * Script to check current user den assignments
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkUserDenAssignments() {
  try {
    console.log('🔍 Checking current user den assignments...\n');

    // Step 1: Sign in as admin user
    console.log('1️⃣ Signing in as admin user...');
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@example.com', 'password');
    console.log('✅ Signed in as:', userCredential.user.email);

    // Step 2: Get all users
    console.log('\n2️⃣ Fetching all users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Total users found: ${usersSnapshot.docs.length}\n`);

    // Step 3: Analyze user den assignments
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

    // Step 4: Summary by den
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

    // Step 5: Users needing den assignments
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

    // Step 6: Multi-den families
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

    // Step 7: Recommendations
    console.log('\n\n💡 Recommendations:');
    console.log('=' .repeat(25));
    
    if (usersWithoutDens.length > 0) {
      console.log('🔧 ACTION NEEDED:');
      console.log('   1. Set up den assignments for users without dens');
      console.log('   2. Consider creating a script to bulk-assign dens');
    }
    
    const totalUsers = usersSnapshot.docs.length;
    const usersWithDens = totalUsers - usersWithoutDens.length;
    
    console.log(`\n📈 Current Status:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Users with Den Assignments: ${usersWithDens}`);
    console.log(`   Users without Den Assignments: ${usersWithoutDens.length}`);
    console.log(`   Completion Rate: ${Math.round((usersWithDens / totalUsers) * 100)}%`);

    return {
      totalUsers,
      usersWithDens,
      usersWithoutDens,
      usersWithMultipleDens,
      usersByDen
    };

  } catch (error) {
    console.error('❌ Error checking user den assignments:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Run the check
checkUserDenAssignments()
  .then((result) => {
    if (result) {
      console.log('\n✅ User den assignment check completed successfully!');
    } else {
      console.log('\n❌ User den assignment check failed.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
