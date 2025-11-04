#!/usr/bin/env node

/**
 * Initialize Pack 1703 as an organization document in Firestore
 * This makes Pack 1703 manageable like any other organization
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.log('Make sure serviceAccountKey.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

async function initializePack1703() {
  try {
    console.log('🚀 Initializing Pack 1703 organization...\n');

    // Check if Pack 1703 already exists
    const orgsRef = db.collection('organizations');
    const existingQuery = await orgsRef.where('slug', '==', 'pack1703').get();

    if (!existingQuery.empty) {
      console.log('⚠️  Pack 1703 organization already exists!');
      const existingDoc = existingQuery.docs[0];
      console.log('📄 Current data:', existingDoc.data());
      console.log('\n❓ Do you want to update it? Run with --update flag to update.');
      
      if (!process.argv.includes('--update')) {
        process.exit(0);
      }
      
      console.log('\n🔄 Updating Pack 1703...');
    }

    // Define Pack 1703 organization
    const pack1703 = {
      name: 'Pack 1703',
      slug: 'pack1703',
      description: 'Cub Scout Pack 1703 - Main portal application',
      orgType: 'pack',
      isActive: true,
      
      // Enable all pack components by default
      enabledComponents: [
        // Base components
        'chat',
        'calendar',
        'announcements',
        'locations',
        'resources',
        'profile',
        
        // Pack-specific components
        'analytics',
        'userManagement',
        'finances',
        'seasons',
        'lists',
        'volunteer',
        'ecology',
        'fundraising',
        'dues'
      ],
      
      // Branding
      branding: {
        name: 'Pack 1703',
        displayName: 'Cub Scout Pack 1703',
        shortName: 'Pack 1703',
        email: 'cubmaster@sfpack1703.com',
        description: 'Peoria, IL - Cub Scout Pack Portal',
        primaryColor: '#0d9488', // teal-600
        secondaryColor: '#065f46'  // emerald-800
      },
      
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Metadata
      memberCount: 0,
      eventCount: 0,
      locationCount: 0
    };

    // Create or update the document
    if (existingQuery.empty) {
      const docRef = await orgsRef.add(pack1703);
      console.log('✅ Pack 1703 organization created successfully!');
      console.log('📝 Document ID:', docRef.id);
    } else {
      const docRef = existingQuery.docs[0].ref;
      await docRef.set(pack1703, { merge: true });
      console.log('✅ Pack 1703 organization updated successfully!');
      console.log('📝 Document ID:', docRef.id);
    }

    console.log('\n📊 Organization details:');
    console.log('  Name:', pack1703.name);
    console.log('  Slug:', pack1703.slug);
    console.log('  Type:', pack1703.orgType);
    console.log('  Enabled Components:', pack1703.enabledComponents.length);
    console.log('\n✨ Pack 1703 is now editable in the Organizations page!');

  } catch (error) {
    console.error('❌ Error initializing Pack 1703:', error);
    process.exit(1);
  }
}

// Run the initialization
initializePack1703()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

