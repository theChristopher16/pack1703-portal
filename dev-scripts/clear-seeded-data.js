#!/usr/bin/env node

/**
 * Clear Seeded Data Script for Pack 1703 Portal
 * 
 * This script removes all seeded/fake data from Firestore before production deployment.
 * 
 * ⚠️ USE WITH CAUTION ⚠️
 * 
 * What this script does:
 * - Removes all events, locations, announcements, lists that match seeded IDs/patterns
 * - Removes all analytics data (optionally)
 * - Removes all volunteer needs and signups created by seed scripts
 * - Preserves real user accounts and authentication data
 * - Preserves real user-created content
 * 
 * What this script does NOT remove:
 * - User accounts
 * - Real data entered through the portal UI
 * - Payment records
 * - Chat messages
 * - Ecology sensor data
 * 
 * Prerequisites:
 * 1. Firebase Admin SDK credentials (service-account-key.json)
 * 2. Backup your database before running (just in case)
 * 
 * Usage:
 * node dev-scripts/clear-seeded-data.js [--dry-run] [--clear-analytics]
 * 
 * Options:
 * --dry-run: Show what would be deleted without actually deleting
 * --clear-analytics: Also remove analytics data (default: false)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'pack-1703-portal'
});

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clearAnalytics = args.includes('--clear-analytics');

// Seeded document IDs and patterns to remove
const SEEDED_IDS = {
  seasons: ['season-2025-2026'],
  locations: ['location-camp-wokanda', 'location-st-marks', 'location-peoria-riverfront'],
  events: ['event-fall-campout-2025', 'event-wolves-den-meeting', 'event-community-service', 'event-001', 'event-002', 'event-003'],
  lists: ['tent-sleeping', 'warm-clothing', 'flashlight', 'water-bottle', 'work-gloves', 'sun-hat'],
  announcements: ['announcement-fall-campout', 'announcement-welcome-back'],
  volunteerNeeds: ['volunteer-fall-campout', 'volunteer-fall-campout-2', 'volunteer-fall-campout-3']
};

// Statistics
const stats = {
  seasons: 0,
  locations: 0,
  events: 0,
  lists: 0,
  announcements: 0,
  volunteerNeeds: 0,
  volunteerSignups: 0,
  analytics: 0
};

/**
 * Delete documents from a collection by ID
 */
async function deleteDocuments(collectionName, ids) {
  if (!ids || ids.length === 0) return 0;
  
  let count = 0;
  const batch = db.batch();
  
  for (const id of ids) {
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      if (dryRun) {
        console.log(`  [DRY RUN] Would delete ${collectionName}/${id}`);
      } else {
        batch.delete(docRef);
      }
      count++;
    }
  }
  
  if (!dryRun && count > 0) {
    await batch.commit();
  }
  
  return count;
}

/**
 * Delete volunteer signups for seeded events
 */
async function deleteVolunteerSignups() {
  const signupsRef = db.collection('volunteer-signups');
  
  // Find signups for seeded events
  const seededEventIds = SEEDED_IDS.events;
  let count = 0;
  
  for (const eventId of seededEventIds) {
    const querySnapshot = await signupsRef.where('eventId', '==', eventId).get();
    
    if (!querySnapshot.empty) {
      const batch = db.batch();
      querySnapshot.forEach((doc) => {
        if (dryRun) {
          console.log(`  [DRY RUN] Would delete volunteer-signups/${doc.id}`);
        } else {
          batch.delete(doc.ref);
        }
        count++;
      });
      
      if (!dryRun && count > 0) {
        await batch.commit();
      }
    }
  }
  
  return count;
}

/**
 * Delete all analytics data
 */
async function deleteAnalytics() {
  if (!clearAnalytics) {
    console.log('  Skipping analytics (use --clear-analytics to remove)');
    return 0;
  }
  
  const analyticsRef = db.collection('analytics');
  const querySnapshot = await analyticsRef.get();
  
  let count = 0;
  const batchSize = 500;
  let batch = db.batch();
  
  querySnapshot.forEach((doc) => {
    if (dryRun) {
      console.log(`  [DRY RUN] Would delete analytics/${doc.id}`);
    } else {
      batch.delete(doc.ref);
    }
    count++;
    
    // Commit batch every 500 operations
    if (!dryRun && count % batchSize === 0) {
      batch.commit();
      batch = db.batch();
    }
  });
  
  // Commit remaining deletes
  if (!dryRun && count % batchSize !== 0) {
    await batch.commit();
  }
  
  return count;
}

/**
 * Main execution
 */
async function clearSeededData() {
  console.log('🧹 Clear Seeded Data Script');
  console.log('============================\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be deleted\n');
  } else {
    console.log('⚠️  LIVE MODE - Data will be permanently deleted\n');
  }
  
  try {
    // Delete seeded seasons
    console.log('📅 Removing seeded seasons...');
    stats.seasons = await deleteDocuments('seasons', SEEDED_IDS.seasons);
    console.log(`  ✅ Removed ${stats.seasons} season(s)\n`);
    
    // Delete seeded locations
    console.log('📍 Removing seeded locations...');
    stats.locations = await deleteDocuments('locations', SEEDED_IDS.locations);
    console.log(`  ✅ Removed ${stats.locations} location(s)\n`);
    
    // Delete seeded lists
    console.log('📋 Removing seeded lists...');
    stats.lists = await deleteDocuments('lists', SEEDED_IDS.lists);
    console.log(`  ✅ Removed ${stats.lists} list(s)\n`);
    
    // Delete seeded events
    console.log('🎯 Removing seeded events...');
    stats.events = await deleteDocuments('events', SEEDED_IDS.events);
    console.log(`  ✅ Removed ${stats.events} event(s)\n`);
    
    // Delete seeded announcements
    console.log('📢 Removing seeded announcements...');
    stats.announcements = await deleteDocuments('announcements', SEEDED_IDS.announcements);
    console.log(`  ✅ Removed ${stats.announcements} announcement(s)\n`);
    
    // Delete seeded volunteer needs
    console.log('🤝 Removing seeded volunteer needs...');
    stats.volunteerNeeds = await deleteDocuments('volunteer-needs', SEEDED_IDS.volunteerNeeds);
    console.log(`  ✅ Removed ${stats.volunteerNeeds} volunteer need(s)\n`);
    
    // Delete volunteer signups for seeded events
    console.log('📝 Removing volunteer signups for seeded events...');
    stats.volunteerSignups = await deleteVolunteerSignups();
    console.log(`  ✅ Removed ${stats.volunteerSignups} volunteer signup(s)\n`);
    
    // Delete analytics data (optional)
    console.log('📊 Removing analytics data...');
    stats.analytics = await deleteAnalytics();
    if (clearAnalytics) {
      console.log(`  ✅ Removed ${stats.analytics} analytics record(s)\n`);
    } else {
      console.log(`  ⏭️  Skipped\n`);
    }
    
    // Print summary
    console.log('============================');
    console.log('📊 Summary');
    console.log('============================');
    console.log(`Seasons:           ${stats.seasons}`);
    console.log(`Locations:         ${stats.locations}`);
    console.log(`Events:            ${stats.events}`);
    console.log(`Lists:             ${stats.lists}`);
    console.log(`Announcements:     ${stats.announcements}`);
    console.log(`Volunteer Needs:   ${stats.volunteerNeeds}`);
    console.log(`Volunteer Signups: ${stats.volunteerSignups}`);
    if (clearAnalytics) {
      console.log(`Analytics:         ${stats.analytics}`);
    }
    console.log('============================\n');
    
    if (dryRun) {
      console.log('✨ Dry run complete! No data was deleted.');
      console.log('   Run without --dry-run to actually delete the data.\n');
    } else {
      console.log('✅ Seeded data cleared successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Use the portal UI to create real events, locations, and announcements');
      console.log('   2. Encourage pack leaders to add volunteer needs through the portal');
      console.log('   3. Real analytics will be collected from actual user interactions\n');
    }
    
  } catch (error) {
    console.error('❌ Error clearing seeded data:', error);
    process.exit(1);
  }
}

// Run the script
clearSeededData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });



