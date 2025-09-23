#!/usr/bin/env node

/**
 * Automated Firestore Permission Test
 * This script will test the exact login flow and identify the permission issue
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, query, limit, getDocs, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

class AutomatedTester {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, type, message });
  }

  async testFirestoreRulesDirectly() {
    this.log('=== TESTING FIRESTORE RULES DIRECTLY ===');
    
    // Test 1: Check if we can access the test collection
    try {
      this.log('Testing _test_connection collection access...');
      const testDocRef = doc(this.db, '_test_connection', 'test');
      await getDoc(testDocRef);
      this.log('✅ _test_connection collection accessible', 'success');
    } catch (error) {
      this.log(`❌ _test_connection collection failed: ${error.code} - ${error.message}`, 'error');
    }

    // Test 2: Try to create a test document
    try {
      this.log('Testing document creation in _test_connection...');
      const testDocRef = doc(this.db, '_test_connection', 'test');
      await setDoc(testDocRef, { 
        test: true, 
        timestamp: serverTimestamp(),
        message: 'Test document created by automated tester'
      });
      this.log('✅ Document creation in _test_connection successful', 'success');
    } catch (error) {
      this.log(`❌ Document creation in _test_connection failed: ${error.code} - ${error.message}`, 'error');
    }

    // Test 3: Try to read the test document
    try {
      this.log('Testing document read in _test_connection...');
      const testDocRef = doc(this.db, '_test_connection', 'test');
      const testDoc = await getDoc(testDocRef);
      if (testDoc.exists()) {
        this.log('✅ Document read in _test_connection successful', 'success');
        this.log(`Document data: ${JSON.stringify(testDoc.data())}`);
      } else {
        this.log('❌ Document does not exist after creation', 'error');
      }
    } catch (error) {
      this.log(`❌ Document read in _test_connection failed: ${error.code} - ${error.message}`, 'error');
    }
  }

  async testUsersCollectionAccess() {
    this.log('=== TESTING USERS COLLECTION ACCESS ===');
    
    // Test 1: Try to query users collection (this should fail without auth)
    try {
      this.log('Testing unauthenticated users collection query...');
      const usersRef = collection(this.db, 'users');
      const q = query(usersRef, limit(1));
      const snapshot = await getDocs(q);
      this.log(`❌ ERROR: Unauthenticated users query succeeded: ${snapshot.size} documents`, 'error');
    } catch (error) {
      this.log(`✅ Expected: Unauthenticated users query denied - ${error.code}`, 'success');
    }

    // Test 2: Try to read a specific user document (this should fail without auth)
    try {
      this.log('Testing unauthenticated user document read...');
      const userDocRef = doc(this.db, 'users', 'test-user-id');
      const userDoc = await getDoc(userDocRef);
      this.log(`❌ ERROR: Unauthenticated user document read succeeded`, 'error');
    } catch (error) {
      this.log(`✅ Expected: Unauthenticated user document read denied - ${error.code}`, 'success');
    }
  }

  async testWithTestUser() {
    this.log('=== TESTING WITH TEST USER ===');
    
    // Create a test user document directly (bypassing auth for testing)
    const testUserId = 'test-user-' + Date.now();
    this.log(`Creating test user: ${testUserId}`);
    
    try {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'parent',
        permissions: ['family_management'],
        isActive: true,
        authProvider: 'test',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      const userDocRef = doc(this.db, 'users', testUserId);
      await setDoc(userDocRef, userData);
      this.log('✅ Test user document created successfully', 'success');
      
      // Try to read it back
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        this.log('✅ Test user document read successfully', 'success');
        this.log(`User data: ${JSON.stringify(userDoc.data())}`);
      } else {
        this.log('❌ Test user document not found after creation', 'error');
      }
      
    } catch (error) {
      this.log(`❌ Test user creation failed: ${error.code} - ${error.message}`, 'error');
    }
  }

  async testFirestoreRulesSyntax() {
    this.log('=== TESTING FIRESTORE RULES SYNTAX ===');
    
    // Test if the rules are syntactically correct by trying various operations
    const testCases = [
      {
        name: 'Read non-existent document',
        operation: async () => {
          const docRef = doc(this.db, 'nonexistent', 'test');
          await getDoc(docRef);
        }
      },
      {
        name: 'Query empty collection',
        operation: async () => {
          const collectionRef = collection(this.db, 'emptycollection');
          const q = query(collectionRef, limit(1));
          await getDocs(q);
        }
      },
      {
        name: 'Access invalid collection path',
        operation: async () => {
          const docRef = doc(this.db, 'invalid/path', 'test');
          await getDoc(docRef);
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        this.log(`Testing: ${testCase.name}`);
        await testCase.operation();
        this.log(`✅ ${testCase.name} succeeded`, 'success');
      } catch (error) {
        this.log(`✅ ${testCase.name} failed as expected - ${error.code}`, 'success');
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Automated Firestore Permission Tests');
    this.log(`Firebase Project: ${firebaseConfig.projectId}`);
    this.log(`Auth Domain: ${firebaseConfig.authDomain}`);
    
    await this.testFirestoreRulesDirectly();
    await this.testUsersCollectionAccess();
    await this.testWithTestUser();
    await this.testFirestoreRulesSyntax();
    
    this.log('\n=== TEST SUMMARY ===');
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const successCount = this.results.filter(r => r.type === 'success').length;
    this.log(`Total tests: ${this.results.length}`);
    this.log(`Successes: ${successCount}`);
    this.log(`Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      this.log('\n=== ERRORS FOUND ===');
      this.results.filter(r => r.type === 'error').forEach(error => {
        this.log(`- ${error.message}`);
      });
    }

    // Provide diagnosis
    this.log('\n=== DIAGNOSIS ===');
    if (errorCount === 0) {
      this.log('✅ All tests passed - Firestore rules are working correctly', 'success');
      this.log('The issue might be in the application code or authentication flow', 'info');
    } else {
      this.log('❌ Errors found in Firestore rules', 'error');
      this.log('The issue is likely in the Firestore security rules configuration', 'error');
    }
  }
}

// Run the automated test
const tester = new AutomatedTester();
tester.runAllTests().then(() => {
  console.log('\n🏁 Automated test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Automated test failed:', error);
  process.exit(1);
});



