#!/usr/bin/env node

/**
 * ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION ⚠️
 * 
 * Import Seed Data Script for Pack 1703 Portal
 * 
 * This script imports SAMPLE/FAKE data into Firestore for development and testing ONLY.
 * 
 * ⚠️ WARNING: Running this script will populate your database with fake data!
 * - Events, locations, announcements, and volunteer needs will be FAKE
 * - Use only in development/testing environments
 * - Production portal should NEVER run this script
 * - All data should be entered through the portal UI in production
 * 
 * Prerequisites:
 * 1. Firebase project must be upgraded to Blaze plan
 * 2. Cloud Functions must be deployed
 * 3. Firebase CLI must be installed and authenticated
 * 4. Must be run from the project root directory
 * 
 * Usage:
 * node dev-scripts/import-seed-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (you'll need to download your service account key)
// Download from: https://console.firebase.google.com/project/pack-1703-portal/settings/serviceaccounts/adminsdk
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'pack-1703-portal'
});

const db = admin.firestore();

// Load seed data
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'));

async function importData() {
  console.log('🚀 Starting data import...');
  
  try {
    // Import seasons
    console.log('📅 Importing seasons...');
    for (const season of seedData.seasons) {
      await db.collection('seasons').doc(season.id).set({
        ...season,
        startDate: admin.firestore.Timestamp.fromDate(new Date(season.startDate)),
        endDate: admin.firestore.Timestamp.fromDate(new Date(season.endDate))
      });
      console.log(`  ✅ Imported season: ${season.name}`);
    }
    
    // Import locations
    console.log('📍 Importing locations...');
    for (const location of seedData.locations) {
      await db.collection('locations').doc(location.id).set({
        ...location,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      });
      console.log(`  ✅ Imported location: ${location.name}`);
    }
    
    // Import lists (packing lists)
    console.log('📋 Importing lists...');
    for (const list of seedData.lists) {
      await db.collection('lists').doc(list.id).set({
        ...list,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      });
      console.log(`  ✅ Imported list: ${list.title}`);
    }
    
    // Import events
    console.log('🎯 Importing events...');
    for (const event of seedData.events) {
      await db.collection('events').doc(event.id).set({
        ...event,
        startDate: admin.firestore.Timestamp.fromDate(new Date(event.startDate)),
        endDate: admin.firestore.Timestamp.fromDate(new Date(event.endDate)),
        createdAt: admin.firestore.Timestamp.fromDate(new Date(event.createdAt)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(event.updatedAt))
      });
      console.log(`  ✅ Imported event: ${event.title}`);
    }
    
    // Import announcements
    console.log('📢 Importing announcements...');
    for (const announcement of seedData.announcements) {
      await db.collection('announcements').doc(announcement.id).set({
        ...announcement,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(announcement.createdAt)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(announcement.updatedAt))
      });
      console.log(`  ✅ Imported announcement: ${announcement.title}`);
    }
    
    // Import volunteer needs
    console.log('🤝 Importing volunteer needs...');
    for (const need of seedData['volunteer-needs']) {
      await db.collection('volunteer-needs').doc(need.id).set({
        ...need,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date())
      });
      console.log(`  ✅ Imported volunteer need: ${need.role}`);
    }
    
    console.log('\n🎉 Data import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • Seasons: ${seedData.seasons.length}`);
    console.log(`  • Locations: ${seedData.locations.length}`);
    console.log(`  • Lists: ${seedData.lists.length}`);
    console.log(`  • Events: ${seedData.events.length}`);
    console.log(`  • Announcements: ${seedData.announcements.length}`);
    console.log(`  • Volunteer Needs: ${seedData['volunteer-needs'].length}`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importData().then(() => {
  console.log('\n✨ Your Pack 1703 Portal is now populated with sample data!');
  console.log('\n🔗 Next steps:');
  console.log('  1. Test the RSVP forms on your events');
  console.log('  2. Verify locations appear on the map');
  console.log('  3. Check that announcements are displaying');
  console.log('  4. Test volunteer signup forms');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
