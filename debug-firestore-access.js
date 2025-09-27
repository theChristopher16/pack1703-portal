// Test script to check what's happening with Firestore access
// Run this in your browser console

async function debugFirestoreAccess() {
  try {
    console.log('🔍 Debugging Firestore access...');
    
    // Check current user
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Get the ID token to see custom claims
    const idToken = await user.getIdToken();
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    console.log('🔑 ID Token payload:');
    console.log('  Role:', payload.role);
    console.log('  Approved:', payload.approved);
    console.log('  All claims:', payload);
    
    // Try to access Firestore directly
    console.log('📊 Testing Firestore access...');
    
    try {
      const db = firebase.firestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.limit(1).get();
      
      console.log('✅ Firestore access successful');
      console.log('  Document count:', snapshot.size);
      
      if (snapshot.size > 0) {
        const doc = snapshot.docs[0];
        console.log('  Sample document:', doc.id, doc.data());
      }
      
    } catch (firestoreError) {
      console.log('❌ Firestore access failed:', firestoreError.message);
      console.log('  Error code:', firestoreError.code);
    }
    
    // Check if we can access the users collection with a specific query
    try {
      const db = firebase.firestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', 'christophersmithm16@gmail.com').get();
      
      console.log('✅ User query successful');
      console.log('  Found documents:', snapshot.size);
      
      if (snapshot.size > 0) {
        const doc = snapshot.docs[0];
        console.log('  User document:', doc.id, doc.data());
      }
      
    } catch (queryError) {
      console.log('❌ User query failed:', queryError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugFirestoreAccess();
