#!/usr/bin/env node

/**
 * RSVP Data Backup Script
 * 
 * This script creates a backup of all existing RSVP data before implementing
 * the new authentication-based RSVP system.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Try to use default credentials (Firebase CLI authentication)
let app;
try {
  // First try to use default credentials
  app = admin.initializeApp({
    projectId: 'sfpack1703app'
  });
  console.log('✅ Using default Firebase credentials');
} catch (error) {
  console.error('❌ Failed to initialize with default credentials:', error);
  console.log('Please ensure you are authenticated with Firebase CLI: firebase login');
  process.exit(1);
}

const db = admin.firestore();

async function backupRSVPData() {
  console.log('🔄 Starting RSVP data backup...');
  
  try {
    // Get all RSVPs
    const rsvpsSnapshot = await db.collection('rsvps').get();
    console.log(`📊 Found ${rsvpsSnapshot.size} RSVP records`);
    
    // Get all events to map event IDs to titles
    const eventsSnapshot = await db.collection('events').get();
    const eventsMap = {};
    eventsSnapshot.forEach(doc => {
      eventsMap[doc.id] = {
        title: doc.data().title || 'Unknown Event',
        startDate: doc.data().startDate?.toDate?.()?.toISOString() || doc.data().startDate
      };
    });
    
    // Prepare backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      totalRSVPs: rsvpsSnapshot.size,
      rsvps: [],
      events: eventsMap,
      summary: {
        byEvent: {},
        totalAttendees: 0,
        unauthenticatedRSVPs: 0
      }
    };
    
    // Process each RSVP
    rsvpsSnapshot.forEach(doc => {
      const rsvpData = doc.data();
      const eventInfo = eventsMap[rsvpData.eventId] || { title: 'Unknown Event', startDate: null };
      
      // Add to backup
      backupData.rsvps.push({
        id: doc.id,
        ...rsvpData,
        eventTitle: eventInfo.title,
        eventDate: eventInfo.startDate,
        // Convert Firestore timestamps to ISO strings
        submittedAt: rsvpData.submittedAt?.toDate?.()?.toISOString() || rsvpData.submittedAt,
        createdAt: rsvpData.createdAt?.toDate?.()?.toISOString() || rsvpData.createdAt
      });
      
      // Update summary
      if (!backupData.summary.byEvent[rsvpData.eventId]) {
        backupData.summary.byEvent[rsvpData.eventId] = {
          eventTitle: eventInfo.title,
          eventDate: eventInfo.startDate,
          rsvpCount: 0,
          attendeeCount: 0
        };
      }
      
      backupData.summary.byEvent[rsvpData.eventId].rsvpCount++;
      backupData.summary.byEvent[rsvpData.eventId].attendeeCount += rsvpData.attendees?.length || 1;
      backupData.summary.totalAttendees += rsvpData.attendees?.length || 1;
      
      // Check if RSVP was unauthenticated (no userId)
      if (!rsvpData.userId) {
        backupData.summary.unauthenticatedRSVPs++;
      }
    });
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `rsvp-backup-${timestamp}.json`;
    const backupPath = path.join(__dirname, backupFilename);
    
    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${backupFilename}`);
    console.log(`📊 Summary:`);
    console.log(`   - Total RSVPs: ${backupData.totalRSVPs}`);
    console.log(`   - Total Attendees: ${backupData.summary.totalAttendees}`);
    console.log(`   - Unauthenticated RSVPs: ${backupData.summary.unauthenticatedRSVPs}`);
    console.log(`   - Events with RSVPs: ${Object.keys(backupData.summary.byEvent).length}`);
    
    // Display event breakdown
    console.log(`\n📋 RSVP Breakdown by Event:`);
    Object.entries(backupData.summary.byEvent).forEach(([eventId, eventData]) => {
      console.log(`   - ${eventData.eventTitle} (${eventData.eventDate}): ${eventData.rsvpCount} RSVPs, ${eventData.attendeeCount} attendees`);
    });
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Error during backup:', error);
    throw error;
  }
}

async function main() {
  try {
    await backupRSVPData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { backupRSVPData };
