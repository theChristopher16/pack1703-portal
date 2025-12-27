/**
 * Script to fix room types in Firestore
 * Corrects rooms that are marked as "other" but should be "bedroom" or "bathroom"
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixRoomTypes() {
  try {
    console.log('🔧 Fixing room types in Firestore...\n');
    
    // Get the household profile
    const userId = 'biD4B9cWVWgOPxJlOZgGKifDJst2'; // From the check script
    const householdProfileRef = db.collection('householdProfiles').doc(userId);
    const doc = await householdProfileRef.get();
    
    if (!doc.exists) {
      console.log('❌ Household profile not found');
      return;
    }
    
    const data = doc.data();
    const rooms = data.rooms || [];
    
    console.log(`📋 Found ${rooms.length} rooms to check\n`);
    
    // Room type mapping based on name patterns
    const roomTypeMap = {
      'bedroom': ['bedroom', 'room'],
      'bathroom': ['bathroom', 'bath'],
      'living': ['living room', 'living'],
      'kitchen': ['kitchen'],
      'dining': ['dining room', 'dining'],
      'garage': ['garage'],
      'other': ['pool', 'backyard', 'yard']
    };
    
    let updated = false;
    const updatedRooms = rooms.map((room, index) => {
      const roomName = (room.name || '').toLowerCase();
      let roomType = room.type;
      
      // Check if room type needs fixing
      if (roomType === 'other') {
        // Try to determine correct type from name
        if (roomName.includes('bedroom') || roomName.includes("'s room") || 
            (roomName.includes('room') && !roomName.includes('bath') && !roomName.includes('living') && !roomName.includes('dining'))) {
          roomType = 'bedroom';
          console.log(`   ✅ Fixed: "${room.name}" → bedroom`);
          updated = true;
        } else if (roomName.includes('bathroom') || roomName.includes('bath')) {
          roomType = 'bathroom';
          console.log(`   ✅ Fixed: "${room.name}" → bathroom`);
          updated = true;
        } else if (roomName.includes('living')) {
          roomType = 'living';
          console.log(`   ✅ Fixed: "${room.name}" → living`);
          updated = true;
        } else if (roomName.includes('dining')) {
          roomType = 'dining';
          console.log(`   ✅ Fixed: "${room.name}" → dining`);
          updated = true;
        } else if (roomName.includes('kitchen')) {
          roomType = 'kitchen';
          console.log(`   ✅ Fixed: "${room.name}" → kitchen`);
          updated = true;
        } else if (roomName.includes('garage')) {
          roomType = 'garage';
          console.log(`   ✅ Fixed: "${room.name}" → garage`);
          updated = true;
        } else {
          console.log(`   ⏭️  Keeping "${room.name}" as other`);
        }
      } else {
        console.log(`   ✓ "${room.name}" already has correct type: ${roomType}`);
      }
      
      return {
        ...room,
        type: roomType
      };
    });
    
    if (updated) {
      // Update the document
      await householdProfileRef.update({
        rooms: updatedRooms,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('\n✅ Room types updated successfully!');
      console.log('\n📊 Updated Room Summary:');
      
      // Count by type
      const roomCounts = {};
      updatedRooms.forEach(room => {
        roomCounts[room.type] = (roomCounts[room.type] || 0) + 1;
      });
      
      Object.entries(roomCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      
    } else {
      console.log('\n✅ All room types are already correct!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixRoomTypes();

