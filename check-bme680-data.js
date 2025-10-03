const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkBME680Data() {
  try {
    console.log('🔍 Checking Firestore for BME680 data...\n');
    
    // Query the bme680_readings collection
    const snapshot = await db.collection('bme680_readings')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No BME680 readings found in Firestore');
      console.log('\n💡 This is expected because:');
      console.log('   - The ESP32 sketch has Firebase sending commented out');
      console.log('   - You need to configure a Firebase API key to enable automatic uploads');
      console.log('   - Currently, the sketch only outputs JSON to Serial Monitor\n');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} BME680 readings:\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📊 Reading ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Temperature: ${data.temperature}°C`);
      console.log(`   Humidity: ${data.humidity}%`);
      console.log(`   Pressure: ${data.pressure} hPa`);
      console.log(`   Gas Resistance: ${data.gasResistance} ohms`);
      console.log(`   Air Quality Index: ${data.airQualityIndex}`);
      console.log(`   Device ID: ${data.deviceId}`);
      console.log(`   Location: ${data.location}`);
      console.log(`   Timestamp: ${data.timestamp}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error checking Firestore:', error.message);
  }
  
  process.exit(0);
}

checkBME680Data();
