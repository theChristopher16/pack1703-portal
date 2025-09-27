// Minimal test to reproduce the Firestore access error
// Run this in your browser console

async function reproduceError() {
  try {
    console.log('🔍 Reproducing Firestore access error...');
    
    // Check if we have Firebase available
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not available');
      return;
    }
    
    // Check authentication
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Get ID token and decode it
    const idToken = await user.getIdToken();
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    console.log('🔑 ID Token claims:');
    console.log('  Role:', payload.role);
    console.log('  Approved:', payload.approved);
    console.log('  UID:', payload.user_id);
    
    // Test 1: Try to read users collection
    console.log('📊 Test 1: Reading users collection...');
    try {
      const db = firebase.firestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.limit(1).get();
      console.log('✅ Users collection read successful');
      console.log('  Document count:', snapshot.size);
    } catch (error) {
      console.log('❌ Users collection read failed:', error.message);
      console.log('  Error code:', error.code);
    }
    
    // Test 2: Try to read a specific user document
    console.log('📊 Test 2: Reading specific user document...');
    try {
      const db = firebase.firestore();
      const userDoc = db.collection('users').doc(user.uid);
      const doc = await userDoc.get();
      console.log('✅ User document read successful');
      console.log('  Document exists:', doc.exists);
      if (doc.exists) {
        console.log('  Document data:', doc.data());
      }
    } catch (error) {
      console.log('❌ User document read failed:', error.message);
      console.log('  Error code:', error.code);
    }
    
    // Test 3: Try to read chat messages (since you're on chat page)
    console.log('📊 Test 3: Reading chat messages...');
    try {
      const db = firebase.firestore();
      const messagesRef = db.collection('chat-messages');
      const snapshot = await messagesRef.limit(1).get();
      console.log('✅ Chat messages read successful');
      console.log('  Document count:', snapshot.size);
    } catch (error) {
      console.log('❌ Chat messages read failed:', error.message);
      console.log('  Error code:', error.code);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the reproduction test
reproduceError();
