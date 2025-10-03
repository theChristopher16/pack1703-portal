const jwt = require('jsonwebtoken');
const fs = require('fs');

// Helper function to convert PEM private key
function formatPrivateKey(key) {
  return key.replace(/\\n/g, '\n').trim();
}

// Apple Developer credentials
const APPLE_KEY_ID = '68G2A722TT';
const APPLE_TEAM_ID = '992Y5HL9UQ';
const PRIVATE_KEY_PATH = './AuthKey_68G2A722TT.p8';

// Production origins
const PRODUCTION_ORIGINS = [
  'https://pack1703-portal.web.app',
  'https://sfpack1703.web.app'
];

function generateMapKitToken(origin) {
  try {
    // Read the private key
    const APPLE_PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

    // JWT payload for MapKit JS
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
      origin: origin
    };

    // JWT header for MapKit JS
    const header = {
      alg: 'ES256',
      kid: APPLE_KEY_ID
    };

    // Format the private key properly
    const formattedPrivateKey = formatPrivateKey(APPLE_PRIVATE_KEY);

    // Generate the token
    const token = jwt.sign(payload, formattedPrivateKey, {
      algorithm: 'ES256',
      header: header
    });

    return {
      token,
      origin,
      expires: new Date(Date.now() + (60 * 60 * 24 * 30 * 1000)).toISOString()
    };
  } catch (error) {
    console.error('❌ Error generating MapKit token:', error.message);
    return null;
  }
}

console.log('🍎 Generating Apple MapKit JS Tokens for Production...\n');

PRODUCTION_ORIGINS.forEach(origin => {
  const result = generateMapKitToken(origin);
  if (result) {
    console.log('✅ Token Generated Successfully!');
    console.log('🌐 Origin:', result.origin);
    console.log('🔑 Token:', result.token);
    console.log('⏰ Expires:', result.expires);
    console.log('---\n');
  }
});

console.log('📝 Copy the appropriate token to your AppleLocationMap component\n');

