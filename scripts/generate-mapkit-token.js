const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

// Helper function to convert PEM private key
function formatPrivateKey(key) {
  return key.replace(/\\n/g, '\n').trim();
}

/**
 * Generate Apple MapKit JS JWT Token
 * 
 * Usage: node scripts/generate-mapkit-token.js
 * 
 * You'll need:
 * - APPLE_KEY_ID: Your 10-digit Key ID from Apple Developer
 * - APPLE_TEAM_ID: Your 10-digit Team ID from Apple Developer  
 * - APPLE_PRIVATE_KEY: Contents of your .p8 file downloaded from Apple Developer
 * - APPLE_ORIGIN: Your website domain (e.g., http://localhost:3000)
 */

// These values you'll need to replace with your actual Apple Developer values
const APPLE_KEY_ID = '68G2A722TT';           // Your Key ID
const APPLE_TEAM_ID = '992Y5HL9UQ';       // Your Team ID
const APPLE_ORIGIN = 'http://localhost:3000'; // Development domain
const PRIVATE_KEY_PATH = './AuthKey_68G2A722TT.p8';   // Path to your private key

// Read the private key from the file
let APPLE_PRIVATE_KEY;
try {
  APPLE_PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  console.log('✅ Successfully read private key from:', PRIVATE_KEY_PATH);
} catch (error) {
  console.error('❌ Error reading private key file:', error.message);
  // Fallback to embedded key
  APPLE_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg0DnOtx5lQEH5BHbW
dFBGorLpvw9yEzsd6dmuxeK/z5mgCgYIKoZIzj0DAQehRANCAASN4bg2Ui0FlePV
FsxnY3owwkPw3uJp4unKqdihnZaO63B/hLUUv5UE3IwFMHdfbOF69SzOUy0iz1OT
syuaQ3uGC
-----END PRIVATE KEY-----
`;
}

function generateMapKitToken() {
  try {
    // Validate required fields
    if (APPLE_KEY_ID === 'YOUR_10_DIGIT_KEY_ID') {
      console.error('❌ Error: Please replace APPLE_KEY_ID with your actual Key ID');
      return null;
    }
    
    if (APPLE_TEAM_ID === 'YOUR_10_DIGIT_TEAM_ID') {
      console.error('❌ Error: Please replace APPLE_TEAM_ID with your actual Team ID');
      return null;
    }
    
    if (APPLE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_CONTENT_FROM_P8_FILE')) {
      console.error('❌ Error: Please replace APPLE_PRIVATE_KEY with your actual private key');
      return null;
    }

    // JWT payload for MapKit JS
    const payload = {
      iss: APPLE_TEAM_ID,           // Issuer: Your Team ID
      iat: Math.floor(Date.now() / 1000),                    // Issued at
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),   // Expires in 24 hours
      origin: APPLE_ORIGIN          // Your website domain
    };

    // JWT header for MapKit JS
    const header = {
      alg: 'ES256',                 // Algorithm
      kid: APPLE_KEY_ID             // Key ID
    };

    // Format the private key properly
    const formattedPrivateKey = formatPrivateKey(APPLE_PRIVATE_KEY);

    // Generate the token
    const token = jwt.sign(payload, formattedPrivateKey, {
      algorithm: 'ES256',
      header: header
    });

    console.log('✅ Apple MapKit JS Token Generated Successfully!');
    console.log('🔑 Your Token:', token);
    console.log('🌐 Origin:', APPLE_ORIGIN);
    console.log('⏰ Expires:', new Date(Date.now() + (60 * 60 * 24 * 1000)).toISOString());
    console.log('\n📝 Copy this token to your AppleLocationMap component');
    
    return token;
  } catch (error) {
    console.error('❌ Error generating MapKit token:', error.message);
    return null;
  }
}

if (require.main === module) {
  generateMapKitToken();
}

module.exports = { generateMapKitToken };
