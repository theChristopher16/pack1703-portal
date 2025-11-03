/**
 * Configuration file for payment update script
 * Copy this to config.js and update with your actual values
 */

module.exports = {
  // Firebase Configuration
  // Get these from your Firebase project settings
  firebase: {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "pack1703-portal.firebaseapp.com",
    projectId: "pack1703-portal",
    storageBucket: "pack1703-portal.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
  },

  // Event Configuration
  event: {
    id: "lu6kyov2tFPWdFhpcgaj", // Replace with your actual event ID
    paymentAmount: 6000, // $60.00 in cents
    currency: "USD"
  },

  // Users who have paid (from Square dashboard)
  paidUsers: [
    'Megan Williams',
    'Eric Bucknam', 
    'Sarah Cotting',
    'Vanessa Gerard',
    'Christopher Smith',
    'Jocelyn Bacon',
    'Edgar Folmar',
    'Ramya Kantheti',
    'Wei Gao',
    'Nidhi Aggarwal',
    'Caitlin Seo',
    'James Morley',
    'Stephen Tadlock',
    'Shana Johnson'
  ]
};





