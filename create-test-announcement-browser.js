/**
 * Browser-based script to create a test announcement
 * Run this in your browser console while logged into the Pack 1703 Portal as admin
 */

async function createTestAnnouncement(targetDens = [], testMode = true) {
  try {
    console.log('🧪 Creating test announcement...\n');

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
    
    // Check user role
    const idToken = await user.getIdToken(true);
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    if (!['admin', 'super-admin', 'root'].includes(payload.role)) {
      console.log('❌ Admin access required');
      return;
    }

    // Get Firestore instance
    const db = firebase.firestore();
    
    // Create test announcement data
    const announcementData = {
      title: `Test Announcement - ${targetDens.length > 0 ? targetDens.join(', ') : 'All Dens'}`,
      content: `This is a test announcement to verify den-specific targeting works correctly.

**Target Dens:** ${targetDens.length > 0 ? targetDens.join(', ') : 'All Dens (Pack-wide)'}
**Test Mode:** ${testMode ? 'Enabled' : 'Disabled'}
**Created:** ${new Date().toLocaleString()}

This announcement should only be visible to users in the targeted dens. If you can see this announcement, the targeting is working correctly!`,
      // Only include targetDens if it has values, otherwise omit the field entirely
      ...(targetDens.length > 0 ? { targetDens } : {}),
      priority: 'medium',
      category: 'general',
      sendEmail: true,
      testMode: testMode,
      pinned: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid
    };

    console.log('📝 Announcement data:');
    console.log('   Title:', announcementData.title);
    console.log('   Target Dens:', announcementData.targetDens || 'All Dens');
    console.log('   Test Mode:', announcementData.testMode);
    console.log('   Send Email:', announcementData.sendEmail);

    // Create the announcement
    console.log('\n🔄 Creating announcement in Firestore...');
    const docRef = await db.collection('announcements').add(announcementData);
    
    console.log('✅ Announcement created successfully!');
    console.log('   ID:', docRef.id);
    console.log('   Title:', announcementData.title);

    // If email is enabled, trigger email sending
    if (announcementData.sendEmail) {
      console.log('\n📧 Sending emails...');
      
      try {
        // Call the Cloud Function to send emails
        const sendEmails = firebase.functions().httpsCallable('sendAnnouncementEmails');
        const result = await sendEmails({
          announcement: {
            id: docRef.id,
            ...announcementData
          },
          testMode: testMode
        });
        
        console.log('✅ Email sending completed!');
        console.log('   Result:', result.data);
        
      } catch (emailError) {
        console.log('⚠️  Email sending failed:', emailError.message);
        console.log('   This might be normal if no users are in the targeted dens');
      }
    }

    console.log('\n🎯 Testing Instructions:');
    console.log('1. Check if the announcement appears in the announcements list');
    console.log('2. Verify only users in targeted dens can see it');
    console.log('3. Check email delivery to test addresses (if test mode)');
    console.log('4. Test with different user accounts in different dens');

    return {
      id: docRef.id,
      data: announcementData,
      success: true
    };

  } catch (error) {
    console.error('❌ Error creating test announcement:', error);
    console.error('Error details:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to create multiple test announcements
async function createMultipleTestAnnouncements() {
  try {
    console.log('🧪 Creating multiple test announcements...\n');

    const testCases = [
      {
        name: 'Pack-wide (All Dens)',
        targetDens: [],
        description: 'Should be visible to all users'
      },
      {
        name: 'Lion Den Only',
        targetDens: ['lion'],
        description: 'Should only be visible to Lion Den families'
      },
      {
        name: 'Wolf & Bear Dens',
        targetDens: ['wolf', 'bear'],
        description: 'Should be visible to Wolf and Bear Den families'
      },
      {
        name: 'Webelos & Arrow of Light',
        targetDens: ['webelos', 'arrow-of-light'],
        description: 'Should be visible to Webelos and Arrow of Light families'
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`\n📝 Creating: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   Target Dens: ${testCase.targetDens.length > 0 ? testCase.targetDens.join(', ') : 'All Dens'}`);
      
      const result = await createTestAnnouncement(testCase.targetDens, true);
      results.push({
        testCase,
        result
      });
      
      // Small delay between announcements
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Multiple test announcements created!');
    console.log('📊 Summary:');
    results.forEach(({ testCase, result }) => {
      console.log(`   ${testCase.name}: ${result.success ? '✅ Success' : '❌ Failed'} (ID: ${result.id || 'N/A'})`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error creating multiple test announcements:', error);
    return null;
  }
}

// Function to test announcement visibility
async function testAnnouncementVisibility() {
  try {
    console.log('🔍 Testing announcement visibility...\n');

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
    
    console.log('✅ Current user:', user.email);
    
    // Get user's den assignments
    const db = firebase.firestore();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    console.log('🏕️ User den assignments:', userData.dens || 'None');
    
    // Get all announcements
    const announcementsSnapshot = await db.collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`\n📋 Recent announcements (${announcementsSnapshot.docs.length}):`);
    
    announcementsSnapshot.docs.forEach(doc => {
      const announcement = { id: doc.id, ...doc.data() };
      const userDens = userData.dens || [];
      
      // Check if user should see this announcement
      let shouldSee = true;
      if (announcement.targetDens && announcement.targetDens.length > 0) {
        shouldSee = userDens.some(userDen => announcement.targetDens.includes(userDen));
      }
      
      const visibility = shouldSee ? '✅ VISIBLE' : '❌ HIDDEN';
      const targeting = announcement.targetDens && announcement.targetDens.length > 0 
        ? announcement.targetDens.join(', ')
        : 'All Dens';
      
      console.log(`\n   ${visibility} "${announcement.title}"`);
      console.log(`      Target: ${targeting}`);
      console.log(`      Created: ${announcement.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}`);
    });

    return {
      userEmail: user.email,
      userDens: userData.dens || [],
      announcements: announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };

  } catch (error) {
    console.error('❌ Error testing announcement visibility:', error);
    return null;
  }
}

// Make functions available globally
window.createTestAnnouncement = createTestAnnouncement;
window.createMultipleTestAnnouncements = createMultipleTestAnnouncements;
window.testAnnouncementVisibility = testAnnouncementVisibility;

console.log('🚀 Test Announcement Scripts Loaded!');
console.log('📋 Available functions:');
console.log('   - createTestAnnouncement(targetDens, testMode) - Create single test announcement');
console.log('   - createMultipleTestAnnouncements() - Create multiple test announcements');
console.log('   - testAnnouncementVisibility() - Test which announcements are visible');
console.log('');
console.log('💡 Example usage:');
console.log('   createTestAnnouncement(["lion"]) // Lion Den only');
console.log('   createTestAnnouncement(["wolf", "bear"]) // Wolf & Bear dens');
console.log('   createTestAnnouncement([]) // All dens');
console.log('   createMultipleTestAnnouncements() // Create all test cases');
console.log('   testAnnouncementVisibility() // Check what you can see');
