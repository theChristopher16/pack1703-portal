const crypto = require('crypto');

/**
 * Generate Apple MapKit JS JWT Token - Simplified Version
 * This version creates the token manually without external JWT libraries
 */

// Apple MapKit JS credentials - configured for Pack 1703 Portal
const APPLE_KEY_ID = '68G2A722TT';           // Your Key ID
const APPLE_TEAM_ID = '992Y5HL9UQ';       // Your Team ID
const APPLE_ORIGIN = 'http://localhost:3000';         // Development domain
const APPLE_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg0DnOtx5lQEH5BHbW
dFBGorLpvw9yEzsd6dmuxeK/z5mgCgYIKoZIzj0DAQehRARCAASN4bg2Ui0FlePV
FsxnY3owwkPw3uJp4unKqdihnZaO63B/hLUUv5UE3IwFMHdfbOF69SzOUy0iz1OT
syuaQ3uGC
-----END PRIVATE KEY-----`;

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateMapKitToken() {
  try {
    // Create header
    const header = {
      alg: 'ES256',
      kid: APPLE_KEY_ID,
      typ: 'JWT'
    };

    // Create payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: now,
      exp: now + (60 * 60 * 24), // 24 hours
      origin: APPLE_ORIGIN
    };

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    // Create the data to sign
    const data = `${encodedHeader}.${encodedPayload}`;

    console.log('📋 Token Details:');
    console.log('- Key ID:', APPLE_KEY_ID);
    console.log('- Team ID:', APPLE_TEAM_ID);
    console.log('- Origin:', APPLE_ORIGIN);
    console.log('- Expires:', new Date((now + (60 * 60 * 24)) * 1000).toISOString());
    console.log('- Header:', encodedHeader);
    console.log('- Payload:', encodedPayload);
    console.log('');

    console.log('⚠️  Note: This simplified version shows the structure.');
    console.log('🔑 For production use, you need to sign the token with your private key.');
    console.log('📖 See Apple\'s documentation for ES256 signing implementation.');
    console.log('');

    // For demonstration, we'll create the unsigned token structure
    const unsignedToken = `${encodedHeader}.${encodedPayload}.`;
    
    console.log('✅ Token Structure Generated:');
    console.log('Unsigned token:', unsignedToken);
    console.log('');
    console.log('📝 To complete the token, you need to:');
    console.log('1. Sign the "' + data + '" string with ES256 algorithm');
    console.log('2. Use your .p8 private key file');
    console.log('3. Encode the signature as base64url');
    console.log('4. Append it to: ' + unsignedToken);
    console.log('');
    console.log('🛠️  For now, you can test by manually adding any signature.');
    console.log('🔄 The Apple Maps component will show helpful error messages.');

    return unsignedToken;

  } catch (error) {
    console.error('❌ Error generating MapKit token:', error.message);
    return null;
  }
}

if (require.main === module) {
  generateMapKitToken();
}

module.exports = { generateMapKitToken };


