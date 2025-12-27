/**
 * Script to check user's home data in Firestore
 * Verifies rooms, bedrooms, bathrooms, and other home information
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkHomeData() {
  try {
    console.log('🔍 Checking home data in Firestore...\n');
    
    // Get current user email from command line or use default
    const userEmail = process.argv[2];
    
    let userId;
    
    if (userEmail) {
      console.log(`📧 Checking for user: ${userEmail}\n`);
      // First, find the user by email
      const auth = admin.auth();
      let user;
      try {
        user = await auth.getUserByEmail(userEmail);
        console.log(`✅ Found user: ${user.uid}`);
        console.log(`   Display Name: ${user.displayName || 'N/A'}`);
        userId = user.uid;
      } catch (error) {
        console.error('❌ User not found:', error.message);
        console.log('\n📋 Listing all household profiles instead...\n');
        // List all household profiles
        const profilesSnapshot = await db.collection('householdProfiles').limit(10).get();
        if (profilesSnapshot.empty) {
          console.log('❌ No household profiles found');
        } else {
          console.log(`✅ Found ${profilesSnapshot.size} household profile(s):\n`);
          for (const doc of profilesSnapshot.docs) {
            const data = doc.data();
            console.log(`   User ID: ${doc.id}`);
            console.log(`   Household Name: ${data.householdName || 'N/A'}`);
            console.log(`   Rooms: ${data.rooms?.length || 0}`);
            if (data.rooms && data.rooms.length > 0) {
              console.log(`   Room Types: ${data.rooms.map(r => r.type || r.name).join(', ')}`);
            }
            console.log('');
          }
        }
        return;
      }
    } else {
      // List all household profiles
      console.log('📋 Listing all household profiles...\n');
      const profilesSnapshot = await db.collection('householdProfiles').limit(10).get();
      if (profilesSnapshot.empty) {
        console.log('❌ No household profiles found');
      } else {
        console.log(`✅ Found ${profilesSnapshot.size} household profile(s):\n`);
        for (const doc of profilesSnapshot.docs) {
          const data = doc.data();
          console.log(`   User ID: ${doc.id}`);
          console.log(`   Household Name: ${data.householdName || 'N/A'}`);
          console.log(`   Address: ${data.address || 'N/A'}`);
          console.log(`   Setup Completed: ${data.setupCompleted || false}`);
          console.log(`   Rooms Count: ${data.rooms?.length || 0}`);
          if (data.rooms && data.rooms.length > 0) {
            console.log(`   Rooms:`);
            data.rooms.forEach((room, index) => {
              const roomName = room.name || 'Unnamed';
              const roomType = room.type || 'unknown';
              console.log(`     ${index + 1}. ${roomName} (${roomType})`);
            });
          }
          console.log('');
        }
      }
      return;
    }
    
    // Check legacy householdProfiles collection
    console.log('\n📋 Checking legacy householdProfiles collection...');
    const householdProfileRef = db.collection('householdProfiles').doc(userId);
    const householdProfileDoc = await householdProfileRef.get();
    
    if (householdProfileDoc.exists) {
      const data = householdProfileDoc.data();
      console.log('✅ Found legacy household profile!');
      console.log(`   Household Name: ${data.householdName || 'N/A'}`);
      console.log(`   Address: ${data.address || 'N/A'}`);
      console.log(`   Setup Completed: ${data.setupCompleted || false}`);
      console.log(`   Rooms Count: ${data.rooms?.length || 0}`);
      
      if (data.rooms && data.rooms.length > 0) {
        console.log('\n   📦 Rooms:');
        data.rooms.forEach((room, index) => {
          console.log(`   ${index + 1}. ${room.name || 'Unnamed'} (${room.type || 'unknown'})`);
          if (room.notes) console.log(`      Notes: ${room.notes}`);
        });
      }
      
      if (data.members && data.members.length > 0) {
        console.log(`\n   👥 Members: ${data.members.length}`);
        data.members.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.name || 'Unnamed'} (${member.role || 'N/A'})`);
        });
      }
      
      if (data.propertyDetails) {
        console.log('\n   🏠 Property Details:');
        console.log(`      Square Footage: ${data.propertyDetails.squareFootage || 'N/A'}`);
        console.log(`      Year Built: ${data.propertyDetails.yearBuilt || 'N/A'}`);
        console.log(`      Property Type: ${data.propertyDetails.propertyType || 'N/A'}`);
      }
    } else {
      console.log('❌ No legacy household profile found');
    }
    
    // Check new sharedHouseholds system
    console.log('\n📋 Checking new sharedHouseholds system...');
    const userHouseholdsRef = db.collection('userHouseholds').doc(userId);
    const userHouseholdsDoc = await userHouseholdsRef.get();
    
    if (userHouseholdsDoc.exists) {
      const data = userHouseholdsDoc.data();
      console.log('✅ Found user households reference!');
      console.log(`   Primary Household ID: ${data.primaryHouseholdId || 'N/A'}`);
      console.log(`   Households Count: ${data.households?.length || 0}`);
      
      if (data.households && data.households.length > 0) {
        for (const householdRef of data.households) {
          const householdId = householdRef.householdId;
          console.log(`\n   📦 Loading household: ${householdId}`);
          
          const householdRef = db.collection('sharedHouseholds').doc(householdId);
          const householdDoc = await householdRef.get();
          
          if (householdDoc.exists) {
            const householdData = householdDoc.data();
            console.log(`   ✅ Household Name: ${householdData.name || 'N/A'}`);
            console.log(`      Address: ${householdData.address || 'N/A'}`);
            console.log(`      Rooms Count: ${householdData.rooms?.length || 0}`);
            
            if (householdData.rooms && householdData.rooms.length > 0) {
              console.log('\n      📦 Rooms:');
              householdData.rooms.forEach((room, index) => {
                const roomName = typeof room === 'object' ? room.name : room;
                const roomType = typeof room === 'object' ? room.type : 'unknown';
                console.log(`      ${index + 1}. ${roomName || 'Unnamed'} (${roomType || 'unknown'})`);
              });
            }
            
            if (householdData.children && householdData.children.length > 0) {
              console.log(`\n      👶 Children: ${householdData.children.length}`);
            }
            
            if (householdData.pets && householdData.pets.length > 0) {
              console.log(`      🐾 Pets: ${householdData.pets.length}`);
            }
            
            if (householdData.vehicles && householdData.vehicles.length > 0) {
              console.log(`      🚗 Vehicles: ${householdData.vehicles.length}`);
            }
          } else {
            console.log(`   ❌ Household document not found`);
          }
        }
      }
    } else {
      console.log('❌ No user households reference found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const hasLegacy = householdProfileDoc.exists;
    const hasNew = userHouseholdsDoc.exists;
    
    if (hasLegacy || hasNew) {
      console.log('✅ Home data found!');
      if (hasLegacy) {
        const legacyData = householdProfileDoc.data();
        const roomCount = legacyData.rooms?.length || 0;
        console.log(`   Legacy Profile: ${roomCount} rooms`);
      }
      if (hasNew) {
        const newData = userHouseholdsDoc.data();
        console.log(`   Shared Households: ${newData.households?.length || 0} household(s)`);
      }
    } else {
      console.log('❌ No home data found');
      console.log('   User needs to complete home setup');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHomeData();

