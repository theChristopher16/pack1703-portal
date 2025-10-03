// Quick script to add a test BME680 reading to Firestore
// This will let you test the Ecology Dashboard while ESP32 is getting set up

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestReading() {
  try {
    console.log('📤 Adding test BME680 reading to Firestore...');
    
    const testReading = {
      timestamp: Timestamp.now(),
      temperature: 22.5,
      humidity: 45.2,
      pressure: 1013.2,
      gasResistance: 52000,
      airQualityIndex: 50,
      deviceId: "esp32_garden_01",
      location: "Pack 1703 Scout Garden"
    };
    
    const docRef = await addDoc(collection(db, 'bme680_readings'), testReading);
    
    console.log('✅ Test BME680 reading added successfully!');
    console.log('📝 Document ID:', docRef.id);
    console.log('\n🌐 View it in:');
    console.log('   - Firebase Console: https://console.firebase.google.com/project/pack1703-portal/firestore');
    console.log('   - Ecology Dashboard: https://sfpack1703.web.app/ecology');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test reading:', error.message);
    process.exit(1);
  }
}

addTestReading();







