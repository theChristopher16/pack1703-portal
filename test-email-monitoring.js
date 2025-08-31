const { getFunctions, httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6QerA4QW2KKrBqgDJvFwhvAHc6WobKX0",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.firebasestorage.app",
  messagingSenderId: "1090892022787",
  appId: "1:1090892022787:web:a04a0ad22006b26f557a36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testEmailConnection() {
  console.log('🧪 Testing Email Connection...');
  
  try {
    const testEmailConnection = httpsCallable(functions, 'testEmailConnection');
    const result = await testEmailConnection({
      emailAddress: 'cubmaster@sfpack1703.com',
      password: 'Double_Lake_Wolf33',
      imapServer: 'imappro.zoho.com',
      imapPort: 993
    });

    console.log('✅ Email Connection Test Result:', result.data);
    return result.data.success;
  } catch (error) {
    console.error('❌ Email Connection Test Failed:', error.message);
    return false;
  }
}

async function testFetchEmails() {
  console.log('📧 Testing Email Fetching...');
  
  try {
    const fetchNewEmails = httpsCallable(functions, 'fetchNewEmails');
    const result = await fetchNewEmails({
      emailAddress: 'cubmaster@sfpack1703.com',
      password: 'Double_Lake_Wolf33',
      imapServer: 'imappro.zoho.com',
      imapPort: 993,
      lastChecked: null
    });

    console.log('✅ Email Fetch Test Result:', result.data);
    return result.data.success;
  } catch (error) {
    console.error('❌ Email Fetch Test Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Email Monitoring Tests...\n');
  
  const connectionTest = await testEmailConnection();
  console.log('');
  
  const fetchTest = await testFetchEmails();
  console.log('');
  
  console.log('📊 Test Results:');
  console.log(`Email Connection: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Fetching: ${fetchTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectionTest && fetchTest) {
    console.log('\n🎉 All tests passed! Email monitoring is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
}

// Run the tests
runTests().catch(console.error);
