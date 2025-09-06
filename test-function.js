const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.firebasestorage.app",
  messagingSenderId: "1090892022787",
  appId: "1:1090892022787:web:a04a0ad22006b26f557a36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

// Test the submitRSVP function
const submitRSVP = httpsCallable(functions, 'submitRSVP');

console.log('Testing Cloud Function connection...');

// Test with minimal data
const testData = {
  eventId: 'event-fall-campout-2025', // Use a real event ID from the database
  familyName: 'Test Family',
  email: 'test@example.com',
  attendees: [{ name: 'Test Person', age: 25, den: 'Test', isAdult: true }],
  ipHash: 'test-hash',
  userAgent: 'test-agent',
  timestamp: new Date()
};

submitRSVP(testData)
  .then((result) => {
    console.log('✅ Function call successful:', result.data);
  })
  .catch((error) => {
    console.error('❌ Function call failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  });
