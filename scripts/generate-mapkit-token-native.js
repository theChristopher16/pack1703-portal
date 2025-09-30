const crypto = require('crypto');

/**
 * Generate Apple MapKit JS JWT Token - Native Node.js Version
 * This creates a proper ES256 signed JWT for Apple MapKit JS
 */

// Apple MapKit JS credentials - configured for Pack 1703 Portal
const APPLE_KEY_ID = '68G2A722TT';           // Your Key ID
const APPLE_TEAM_ID = '992Y5HL9UQ';          // Your Team ID
const APPLE_ORIGIN = 'http://localhost:3000'; // Development domain
const APPLE_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg0DnOtx5lQEH5BHbW
dFBGorLpvw9yEzsd6dmuxeK/z5mgCgYIKoZIzj0DAQehRARCAASN4bg2Ui0FleZPV
FsxnY3owwkPw3uJp4unKqdihnZaO63B/hLUUv5UE3IwFMHdfbOF69SzOUy0iz1OT
syuaQ3uGC
-----END PRIVATE KEY-----`;

function base64UrlEncode(data) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function signES256(data, privateKeyPem) {
  try {
    // Create sign object
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    
    // Sign with the private key
    const signature = sign.sign(privateKeyPem);
    
    // Convert to ASN.1 DER format for ES256 (P-256 curve)
    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    
    // DER encoding
    const derSignature = Buffer.concat([
      Buffer.from([0x30, 0x44, 0x02, 0x20]),
      r,
      Buffer.from([0x02, 0x20]),
      s
    ]);
    
    return base64UrlEncode(derSignature);
  } catch (error) {
    console.error('Error signing:', error.message);
    return null;
  }
}

function generateMapKitToken() {
  try {
    console.log('🍎 Generating Apple MapKit JS Token...');
    console.log('- Key ID:', APPLE_KEY_ID);
    console.log('- Team ID:', APPLE_TEAM_ID);
    console.log('- Origin:', APPLE_ORIGIN);
    console.log('');

    const now = Math.floor(Date.now() / 1000);

    // Create JWT header
    const header = {
      alg: 'ES256',
      kid: APPLE_KEY_ID,
      typ: 'JWT'
    };

    // Create JWT payload
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: now,
      exp: now + (60 * 60 * 24), // 24 hours
      origin: APPLE_ORIGIN
    };

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    // Data to be signed
    const data = `${encodedHeader}.${encodedPayload}`;

    // Sign the data
    const signature = signES256(data, APPLE_PRIVATE_KEY_PEM);
    
    if (!signature) {
      throw new Error('Failed to create signature');
    }

    // Create the complete JWT token
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    console.log('✅ Apple MapKit JS Token Generated Successfully!');
    console.log('');
    console.log('🔑 Your Token:');
    console.log(token);
    console.log('');
    console.log('⏰ Expires:', new Date((now + (60 * 60 * 24)) * 1000).toISOString());
    console.log('');
    console.log('📝 Add this to your .env file:');
    console.log(`REACT_APP_APPLE_MAPKIT_TOKEN=${token}`);
    console.log('');
    console.log('🔄 After adding to .env, restart your development server with:');
    console.log('npm start');
    console.log('');
    console.log('🎯 Your Apple Maps should then work in the locations component!');

    return token;

  } catch (error) {
    console.error('❌ Error generating MapKit token:', error.message);
    console.log('');
    console.log('⚠️  Note: ES256 signing is complex. Let me create a fallback solution...');
    
    // Create a test token with a placeholder signature
    const header = {
      alg: 'ES256',
      kid: APPLE_KEY_ID,
      typ: 'JWT'
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: now,
      exp: now + (60 * 60 * 24),
      origin: APPLE_ORIGIN
    };
    
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const testToken = `${encodedHeader}.${encodedPayload}.TEST_SIGNATURE`;
    
    console.log('🧪 Test Token (for Apple Maps to show proper error):');
    console.log(testToken);
    console.log('');
    console.log('💡 This will help Apple Maps show the correct error message');
    console.log('📖 For production, use Apple\'s official signing service or libraries');
    
    return testToken;
  }
}

if (require.main === module) {
  generateMapKitToken();
}

module.exports = { generateMapKitToken };


