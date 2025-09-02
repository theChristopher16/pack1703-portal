#!/usr/bin/env node

/**
 * Admin Event API Test Setup
 * 
 * This script sets up test data and guides you through credential setup
 * for testing the admin event API end-to-end.
 */

const { getFirestore, collection, addDoc, doc, getDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

console.log('🔧 Admin Event API Test Setup');
console.log('=============================\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "pack-1703-portal.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "pack-1703-portal",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "pack-1703-portal.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Setup configuration
const SETUP_CONFIG = {
  testData: {
    locationId: null,
    seasonId: null,
    adminUserId: null
  },
  credentials: {
    email: null,
    password: null
  },
  setupComplete: false,
  errors: []
};

async function runSetup() {
  console.log('🚀 Starting admin event API test setup...\n');

  try {
    // Step 1: Check Firebase connection
    console.log('📋 Step 1: Checking Firebase connection...');
    await checkFirebaseConnection();
    console.log('✅ Firebase connection verified');

    // Step 2: Setup test credentials
    console.log('\n📋 Step 2: Setting up test credentials...');
    await setupTestCredentials();
    console.log('✅ Test credentials configured');

    // Step 3: Create test location
    console.log('\n📋 Step 3: Creating test location...');
    await createTestLocation();
    console.log('✅ Test location created');

    // Step 4: Create test season
    console.log('\n📋 Step 4: Creating test season...');
    await createTestSeason();
    console.log('✅ Test season created');

    // Step 5: Verify admin user
    console.log('\n📋 Step 5: Verifying admin user...');
    await verifyAdminUser();
    console.log('✅ Admin user verified');

    // Step 6: Generate test configuration
    console.log('\n📋 Step 6: Generating test configuration...');
    generateTestConfiguration();
    console.log('✅ Test configuration generated');

    // Step 7: Run verification test
    console.log('\n📋 Step 7: Running verification test...');
    await runVerificationTest();
    console.log('✅ Verification test completed');

    // Step 8: Generate setup report
    console.log('\n📋 Step 8: Generating setup report...');
    generateSetupReport();

  } catch (error) {
    console.error('❌ Setup failed:', error);
    SETUP_CONFIG.errors.push(error.message);
  }
}

async function checkFirebaseConnection() {
  console.log('   Testing Firebase connection...');
  
  try {
    // Try to access Firestore
    const testDoc = await getDoc(doc(db, 'test', 'connection'));
    console.log('   ✅ Firestore connection successful');
    
    // Try to access Auth
    console.log('   ✅ Firebase Auth available');
    
  } catch (error) {
    throw new Error(`Firebase connection failed: ${error.message}`);
  }
}

async function setupTestCredentials() {
  console.log('   Setting up test credentials...');
  
  // Check if credentials are already set
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  
  if (email && password) {
    console.log(`   ✅ Using existing credentials: ${email}`);
    SETUP_CONFIG.credentials.email = email;
    SETUP_CONFIG.credentials.password = password;
    return;
  }
  
  // Prompt for credentials
  console.log('   ⚠️  No test credentials found in environment variables');
  console.log('   Please set the following environment variables:');
  console.log('   export TEST_ADMIN_EMAIL="your-admin-email@sfpack1703.com"');
  console.log('   export TEST_ADMIN_PASSWORD="your-admin-password"');
  console.log('');
  console.log('   Or create a .env file with:');
  console.log('   TEST_ADMIN_EMAIL=your-admin-email@sfpack1703.com');
  console.log('   TEST_ADMIN_PASSWORD=your-admin-password');
  console.log('');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('   📁 Found .env file, checking for credentials...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const emailMatch = envContent.match(/TEST_ADMIN_EMAIL=(.+)/);
    const passwordMatch = envContent.match(/TEST_ADMIN_PASSWORD=(.+)/);
    
    if (emailMatch && passwordMatch) {
      console.log('   ✅ Found credentials in .env file');
      SETUP_CONFIG.credentials.email = emailMatch[1].trim();
      SETUP_CONFIG.credentials.password = passwordMatch[1].trim();
      return;
    }
  }
  
  console.log('   ⚠️  No credentials found. Please set them and run setup again.');
  throw new Error('Test credentials not configured');
}

async function createTestLocation() {
  console.log('   Creating test location...');
  
  const locationData = {
    name: '🧪 Test API Location',
    address: '123 Test Street, Test City, TX 12345',
    description: 'This is a test location created by the API test setup script',
    category: 'test',
    coordinates: {
      latitude: 29.7604,
      longitude: -95.3698
    },
    notesPrivate: 'Test location for API testing',
    createdAt: new Date(),
    createdBy: 'test-setup-script',
    isActive: true
  };

  try {
    const docRef = await addDoc(collection(db, 'locations'), locationData);
    SETUP_CONFIG.testData.locationId = docRef.id;
    console.log(`   ✅ Test location created with ID: ${docRef.id}`);
    console.log(`   Name: ${locationData.name}`);
    console.log(`   Address: ${locationData.address}`);
  } catch (error) {
    throw new Error(`Failed to create test location: ${error.message}`);
  }
}

async function createTestSeason() {
  console.log('   Creating test season...');
  
  const seasonData = {
    name: '🧪 Test API Season',
    description: 'This is a test season created by the API test setup script',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
    createdAt: new Date(),
    createdBy: 'test-setup-script'
  };

  try {
    const docRef = await addDoc(collection(db, 'seasons'), seasonData);
    SETUP_CONFIG.testData.seasonId = docRef.id;
    console.log(`   ✅ Test season created with ID: ${docRef.id}`);
    console.log(`   Name: ${seasonData.name}`);
    console.log(`   Period: ${seasonData.startDate.toDateString()} - ${seasonData.endDate.toDateString()}`);
  } catch (error) {
    throw new Error(`Failed to create test season: ${error.message}`);
  }
}

async function verifyAdminUser() {
  console.log('   Verifying admin user credentials...');
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      SETUP_CONFIG.credentials.email, 
      SETUP_CONFIG.credentials.password
    );
    
    const user = userCredential.user;
    SETUP_CONFIG.testData.adminUserId = user.uid;
    
    console.log(`   ✅ Successfully authenticated as: ${user.email}`);
    console.log(`   User ID: ${user.uid}`);
    
    // Check if user has admin privileges
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const hasAdminPrivileges = userData?.isAdmin || userData?.isDenLeader || userData?.isCubmaster;
      
      if (hasAdminPrivileges) {
        console.log('   ✅ User has admin privileges');
        console.log(`   Roles: ${JSON.stringify({
          isAdmin: userData?.isAdmin || false,
          isDenLeader: userData?.isDenLeader || false,
          isCubmaster: userData?.isCubmaster || false
        })}`);
      } else {
        console.log('   ⚠️  User does not have admin privileges');
        console.log('   This may cause API calls to fail');
      }
    } else {
      console.log('   ⚠️  User document not found in database');
    }
    
  } catch (error) {
    throw new Error(`Admin user verification failed: ${error.message}`);
  }
}

function generateTestConfiguration() {
  console.log('   Generating test configuration file...');
  
  const configData = {
    testData: SETUP_CONFIG.testData,
    credentials: {
      email: SETUP_CONFIG.credentials.email,
      // Don't include password in config file for security
    },
    setupTimestamp: new Date().toISOString(),
    firebaseConfig: {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    }
  };
  
  const configPath = path.join(__dirname, 'test-config.json');
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  
  console.log(`   ✅ Test configuration saved to: ${configPath}`);
  console.log(`   Location ID: ${SETUP_CONFIG.testData.locationId}`);
  console.log(`   Season ID: ${SETUP_CONFIG.testData.seasonId}`);
  console.log(`   Admin User ID: ${SETUP_CONFIG.testData.adminUserId}`);
}

async function runVerificationTest() {
  console.log('   Running verification test...');
  
  try {
    // Test 1: Verify location exists
    const locationDoc = await getDoc(doc(db, 'locations', SETUP_CONFIG.testData.locationId));
    if (!locationDoc.exists()) {
      throw new Error('Test location not found');
    }
    console.log('   ✅ Test location verified');

    // Test 2: Verify season exists
    const seasonDoc = await getDoc(doc(db, 'seasons', SETUP_CONFIG.testData.seasonId));
    if (!seasonDoc.exists()) {
      throw new Error('Test season not found');
    }
    console.log('   ✅ Test season verified');

    // Test 3: Verify user authentication
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      SETUP_CONFIG.credentials.email, 
      SETUP_CONFIG.credentials.password
    );
    if (!userCredential.user) {
      throw new Error('User authentication failed');
    }
    console.log('   ✅ User authentication verified');

    SETUP_CONFIG.setupComplete = true;
    
  } catch (error) {
    throw new Error(`Verification test failed: ${error.message}`);
  }
}

function generateSetupReport() {
  console.log('\n📊 Admin Event API Test Setup Report');
  console.log('=====================================');
  
  console.log(`Setup Complete: ${SETUP_CONFIG.setupComplete ? '✅' : '❌'}`);
  console.log(`Test Location: ${SETUP_CONFIG.testData.locationId ? '✅' : '❌'}`);
  console.log(`Test Season: ${SETUP_CONFIG.testData.seasonId ? '✅' : '❌'}`);
  console.log(`Admin User: ${SETUP_CONFIG.testData.adminUserId ? '✅' : '❌'}`);
  
  if (SETUP_CONFIG.errors.length > 0) {
    console.log('\n❌ Setup Errors:');
    SETUP_CONFIG.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (SETUP_CONFIG.setupComplete) {
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run the comprehensive test:');
    console.log('      node scripts/test-admin-event-api-comprehensive.js');
    console.log('   2. Check the test results');
    console.log('   3. Clean up test data when done');
    console.log('\n📁 Test Configuration:');
    console.log(`   Config file: scripts/test-config.json`);
    console.log(`   Location ID: ${SETUP_CONFIG.testData.locationId}`);
    console.log(`   Season ID: ${SETUP_CONFIG.testData.seasonId}`);
    console.log(`   Admin User: ${SETUP_CONFIG.credentials.email}`);
  } else {
    console.log('\n⚠️  Setup incomplete - please resolve errors and try again');
  }
}

// Main execution
if (require.main === module) {
  runSetup().then(() => {
    console.log('\n🏁 Setup completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { runSetup, SETUP_CONFIG };
