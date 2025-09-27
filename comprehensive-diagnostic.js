// Comprehensive diagnostic script
// Run this in your browser console

async function comprehensiveDiagnostic() {
  try {
    console.log('🔍 Comprehensive Firestore Diagnostic...');
    
    // Check Firebase availability
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not available');
      return;
    }
    
    console.log('✅ Firebase available');
    
    // Check authentication
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('✅ User UID:', user.uid);
    
    // Get fresh ID token
    const idToken = await user.getIdToken(true);
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    console.log('🔑 ID Token Analysis:');
    console.log('  Role:', payload.role);
    console.log('  Approved:', payload.approved);
    console.log('  UID:', payload.user_id);
    console.log('  Issuer:', payload.iss);
    console.log('  Audience:', payload.aud);
    console.log('  Expires:', new Date(payload.exp * 1000));
    
    // Check Firebase app configuration
    const app = firebase.app();
    console.log('📱 Firebase App Configuration:');
    console.log('  Project ID:', app.options.projectId);
    console.log('  Auth Domain:', app.options.authDomain);
    console.log('  API Key:', app.options.apiKey?.substring(0, 10) + '...');
    
    // Test Firestore with detailed error handling
    console.log('📊 Firestore Tests:');
    
    const db = firebase.firestore();
    
    // Test 1: Check if we can access Firestore at all
    try {
      console.log('  Test 1: Basic Firestore access...');
      const testRef = db.collection('_test_connection');
      const snapshot = await testRef.limit(1).get();
      console.log('  ✅ Basic Firestore access successful');
    } catch (error) {
      console.log('  ❌ Basic Firestore access failed:', error.message);
      console.log('    Error code:', error.code);
      console.log('    Full error:', error);
    }
    
    // Test 2: Check users collection
    try {
      console.log('  Test 2: Users collection access...');
      const usersRef = db.collection('users');
      const snapshot = await usersRef.limit(1).get();
      console.log('  ✅ Users collection access successful');
      console.log('    Document count:', snapshot.size);
    } catch (error) {
      console.log('  ❌ Users collection access failed:', error.message);
      console.log('    Error code:', error.code);
    }
    
    // Test 3: Check chat messages
    try {
      console.log('  Test 3: Chat messages access...');
      const messagesRef = db.collection('chat-messages');
      const snapshot = await messagesRef.limit(1).get();
      console.log('  ✅ Chat messages access successful');
      console.log('    Document count:', snapshot.size);
    } catch (error) {
      console.log('  ❌ Chat messages access failed:', error.message);
      console.log('    Error code:', error.code);
    }
    
    // Test 4: Check if it's a specific query issue
    try {
      console.log('  Test 4: Specific user query...');
      const userDoc = db.collection('users').doc(user.uid);
      const doc = await userDoc.get();
      console.log('  ✅ Specific user query successful');
      console.log('    Document exists:', doc.exists);
    } catch (error) {
      console.log('  ❌ Specific user query failed:', error.message);
      console.log('    Error code:', error.code);
    }
    
    // Check for App Check issues
    console.log('🔒 App Check Analysis:');
    console.log('  App Check disabled in config:', true);
    console.log('  Check console for App Check warnings');
    
    // Check network requests
    console.log('🌐 Network Analysis:');
    console.log('  Check Network tab for failed requests to firestore.googleapis.com');
    console.log('  Look for 403 Forbidden errors');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
comprehensiveDiagnostic();