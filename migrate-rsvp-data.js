#!/usr/bin/env node

/**
 * RSVP Data Migration Script
 * 
 * This script migrates existing RSVP data to the new authenticated system.
 * It will:
 * 1. Export existing RSVP data
 * 2. Associate unauthenticated RSVPs with placeholder users
 * 3. Update RSVP counts to be accurate
 * 4. Preserve all existing data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
let app;
try {
  app = admin.initializeApp({
    projectId: 'pack1703-portal' // Use production project
  });
  console.log('✅ Connected to production Firebase project');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  console.log('Please ensure you have proper Firebase credentials');
  process.exit(1);
}

const db = admin.firestore();

class RSVPMigration {
  constructor() {
    this.migrationLog = [];
    this.stats = {
      totalRSVPs: 0,
      unauthenticatedRSVPs: 0,
      migratedRSVPs: 0,
      errors: 0
    };
  }

  async runMigration() {
    console.log('🚀 Starting RSVP Data Migration...\n');
    
    try {
      // Step 1: Export existing data
      const existingData = await this.exportExistingRSVPs();
      
      // Step 2: Create placeholder users for unauthenticated RSVPs
      const placeholderUsers = await this.createPlaceholderUsers(existingData.unauthenticatedRSVPs);
      
      // Step 3: Migrate RSVP data
      await this.migrateRSVPData(existingData.rsvps, placeholderUsers);
      
      // Step 4: Update event counts
      await this.updateEventCounts();
      
      // Step 5: Generate migration report
      this.generateMigrationReport();
      
      console.log('\n✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.logError('Migration failed', error.message);
      process.exit(1);
    }
  }

  async exportExistingRSVPs() {
    console.log('📤 Exporting existing RSVP data...');
    
    try {
      const rsvpsSnapshot = await db.collection('rsvps').get();
      console.log(`Found ${rsvpsSnapshot.size} existing RSVP records`);
      
      const rsvps = [];
      const unauthenticatedRSVPs = [];
      
      rsvpsSnapshot.forEach(doc => {
        const rsvpData = {
          id: doc.id,
          ...doc.data(),
          // Convert timestamps to ISO strings
          submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt,
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
        };
        
        rsvps.push(rsvpData);
        
        // Check if RSVP is unauthenticated
        if (!rsvpData.userId) {
          unauthenticatedRSVPs.push(rsvpData);
        }
      });
      
      this.stats.totalRSVPs = rsvps.length;
      this.stats.unauthenticatedRSVPs = unauthenticatedRSVPs.length;
      
      // Save backup
      const backupData = {
        timestamp: new Date().toISOString(),
        stats: this.stats,
        rsvps: rsvps,
        unauthenticatedRSVPs: unauthenticatedRSVPs
      };
      
      const backupFilename = `rsvp-migration-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const backupPath = path.join(__dirname, backupFilename);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Exported ${rsvps.length} RSVPs (${unauthenticatedRSVPs.length} unauthenticated)`);
      console.log(`📁 Backup saved to: ${backupFilename}`);
      
      return { rsvps, unauthenticatedRSVPs };
      
    } catch (error) {
      this.logError('Export failed', error.message);
      throw error;
    }
  }

  async createPlaceholderUsers(unauthenticatedRSVPs) {
    console.log('👤 Creating placeholder users for unauthenticated RSVPs...');
    
    const placeholderUsers = new Map();
    
    for (const rsvp of unauthenticatedRSVPs) {
      try {
        // Create a unique placeholder user for each unauthenticated RSVP
        const placeholderId = `placeholder_${rsvp.id}`;
        
        const placeholderUser = {
          uid: placeholderId,
          email: rsvp.contactEmail || rsvp.email || `placeholder_${rsvp.id}@migrated.com`,
          displayName: rsvp.contactName || rsvp.familyName || 'Migrated User',
          role: 'parent',
          isMigrated: true,
          originalRSVPId: rsvp.id,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now()
        };
        
        // Store in users collection
        await db.collection('users').doc(placeholderId).set(placeholderUser);
        
        placeholderUsers.set(rsvp.id, placeholderId);
        
        this.logMigration('Created placeholder user', `User ID: ${placeholderId} for RSVP: ${rsvp.id}`);
        
      } catch (error) {
        this.logError(`Failed to create placeholder for RSVP ${rsvp.id}`, error.message);
        this.stats.errors++;
      }
    }
    
    console.log(`✅ Created ${placeholderUsers.size} placeholder users`);
    return placeholderUsers;
  }

  async migrateRSVPData(rsvps, placeholderUsers) {
    console.log('🔄 Migrating RSVP data...');
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const rsvp of rsvps) {
      try {
        const rsvpRef = db.collection('rsvps').doc(rsvp.id);
        
        // Determine user ID
        let userId = rsvp.userId;
        if (!userId && placeholderUsers.has(rsvp.id)) {
          userId = placeholderUsers.get(rsvp.id);
        }
        
        // Update RSVP with new structure
        const updatedRSVP = {
          ...rsvp,
          userId: userId,
          userEmail: rsvp.contactEmail || rsvp.email,
          familyName: rsvp.contactName || rsvp.familyName,
          email: rsvp.contactEmail || rsvp.email,
          phone: rsvp.phone || '',
          dietaryRestrictions: rsvp.dietaryRestrictions || '',
          specialNeeds: rsvp.specialNeeds || '',
          notes: rsvp.notes || '',
          migratedAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now()
        };
        
        // Remove old fields
        delete updatedRSVP.contactName;
        delete updatedRSVP.contactEmail;
        
        // Add to batch
        batch.update(rsvpRef, updatedRSVP);
        batchCount++;
        
        // Commit batch every 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} RSVPs`);
          batchCount = 0;
        }
        
        this.stats.migratedRSVPs++;
        
      } catch (error) {
        this.logError(`Failed to migrate RSVP ${rsvp.id}`, error.message);
        this.stats.errors++;
      }
    }
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} RSVPs`);
    }
    
    console.log(`✅ Migrated ${this.stats.migratedRSVPs} RSVPs`);
  }

  async updateEventCounts() {
    console.log('📊 Updating event RSVP counts...');
    
    try {
      // Get all events
      const eventsSnapshot = await db.collection('events').get();
      
      for (const eventDoc of eventsSnapshot.docs) {
        try {
          const eventId = eventDoc.id;
          
          // Get actual RSVP count
          const rsvpsQuery = await db.collection('rsvps').where('eventId', '==', eventId).get();
          
          let totalAttendees = 0;
          rsvpsQuery.docs.forEach(doc => {
            const rsvpData = doc.data();
            totalAttendees += rsvpData.attendees?.length || 1;
          });
          
          // Update event document
          await eventDoc.ref.update({
            currentRSVPs: totalAttendees,
            updatedAt: admin.firestore.Timestamp.now()
          });
          
          this.logMigration('Updated event count', `Event ${eventId}: ${totalAttendees} attendees`);
          
        } catch (error) {
          this.logError(`Failed to update count for event ${eventDoc.id}`, error.message);
        }
      }
      
      console.log(`✅ Updated counts for ${eventsSnapshot.size} events`);
      
    } catch (error) {
      this.logError('Failed to update event counts', error.message);
    }
  }

  generateMigrationReport() {
    console.log('\n📋 Migration Report');
    console.log('==================');
    console.log(`Total RSVPs: ${this.stats.totalRSVPs}`);
    console.log(`Unauthenticated RSVPs: ${this.stats.unauthenticatedRSVPs}`);
    console.log(`Migrated RSVPs: ${this.stats.migratedRSVPs}`);
    console.log(`Errors: ${this.stats.errors}`);
    
    const successRate = this.stats.totalRSVPs > 0 ? 
      ((this.stats.migratedRSVPs / this.stats.totalRSVPs) * 100).toFixed(1) : 0;
    console.log(`Success Rate: ${successRate}%`);
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      migrationLog: this.migrationLog
    };
    
    const reportFilename = `rsvp-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(__dirname, reportFilename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Detailed report saved to: ${reportFilename}`);
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️ Some errors occurred during migration. Check the detailed report.');
    } else {
      console.log('\n🎉 Migration completed without errors!');
    }
  }

  logMigration(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
      type: 'migration'
    };
    this.migrationLog.push(logEntry);
  }

  logError(action, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      error: error,
      type: 'error'
    };
    this.migrationLog.push(logEntry);
    console.error(`❌ ${action}: ${error}`);
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new RSVPMigration();
  migration.runMigration().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { RSVPMigration };
