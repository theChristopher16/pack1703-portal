const { SignJWT } = require('jose');

/**
 * Generate Apple MapKit JS JWT Token - Working Version with JOSE
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

async function generateMapKitToken() {
  try {
    console.log('🍎 Generating Apple MapKit JS Token...');
    console.log('- Key ID:', APPLE_KEY_ID);
    console.log('- Team ID:', APPLE_TEAM_ID);
    console.log('- Origin:', APPLE_ORIGIN);
    console.log('');

    // Import the private key
    const privateKey = await globalThis.crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(APPLE_PRIVATE_KEY_PEM.replace(/\\n/g, '\n'), 'utf-8'),
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );

    // Create the JWT token
    const token = await new SignJWT({
      origin: APPLE_ORIGIN,
    })
      .setProtectedHeader({
        alg: 'ES256',
        kid: APPLE_KEY_ID,
      })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setIssuer(APPLE_TEAM_ID)
      .sign(privateKey);

    console.log('✅ Apple MapKit JS Token Generated Successfully!');
    console.log('');
    console.log('🔑 Your Token:');
    console.log(token);
    console.log('');
    console.log('⏰ Expires:', new Date(Date.now() + (60 * 60 * 24 * 1000)).toISOString());
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
    console.log('💡 Troubleshooting:');
    console.log('- Make sure your .p8 file content is correct');
    console.log('- Check that your Key ID and Team ID are accurate');
    console.log('- Verify your private key format');
    return null;
  }
}

if (require.main === module) {
  generateMapKitToken();
}

module.exports = { generateMapKitToken };


