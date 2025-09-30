#!/usr/bin/env node

/**
 * Sync Firebase Auth Users to Account Request System
 * 
 * This script creates account request records for existing Firebase Auth users
 * who were created outside the normal approval flow.
 * 
 * Usage: node sync-auth-users-to-approval-system.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'pack1703-portal'
});

const db = admin.firestore();

// Users from your Firebase Auth screenshot
const authUsers = [
  {
    email: 'alisonwmeyer@gmail.com',
    displayName: 'Alison Meyer',
    role: 'parent',
    status: 'unverified'
  },
  {
    email: 'ebucknam06@gmail.com',
    displayName: 'Eric Bucknam',
    role: 'parent',
    status: 'verified'
  },
  {
    email: 'lizzie@gmail.com',
    displayName: 'Lizzie Smith',
    role: 'parent',
    status: 'unverified'
  },
  {
    email: 'testadmin@pack1703.org',
    displayName: 'Test Admin User',
    role: 'admin',
    status: 'unverified'
  },
  {
    email: 'christophersmithm16@gmail.com',
    displayName: 'Christopher Smith',
    role: 'super_admin',
    status: 'verified'
  }
];

async function syncUsersToApprovalSystem() {
  console.log('🔄 Starting sync of Firebase Auth users to account request system...\n');
  
  try {
    // Get existing account requests to avoid duplicates
    const existingRequests = await db.collection('accountRequests').get();
    const existingEmails = new Set();
    
    existingRequests.forEach(doc => {
      const data = doc.data();
      existingEmails.add(data.email);
    });
    
    console.log(`📊 Found ${existingEmails.size} existing account requests`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of authUsers) {
      try {
        // Skip if account request already exists
        if (existingEmails.has(user.email)) {
          console.log(`⏭️  Skipping ${user.email} - account request already exists`);
          skipped++;
          continue;
        }
        
        // Create account request record
        const accountRequest = {
          email: user.email,
          displayName: user.displayName,
          phone: '', // Will need to be filled in manually
          address: '', // Will need to be filled in manually
          status: 'approved', // Mark as approved since they already have access
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: 'system-sync', // Mark as system-synced
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedRole: user.role,
          syncReason: 'Created from existing Firebase Auth user',
          emailVerified: user.status === 'verified'
        };
        
        // Add to accountRequests collection
        const docRef = await db.collection('accountRequests').add(accountRequest);
        
        console.log(`✅ Created account request for ${user.email} (${user.role}) - ID: ${docRef.id}`);
        created++;
        
        // Also create/update user document in users collection if it doesn't exist
        const userQuery = await db.collection('users').where('email', '==', user.email).get();
        
        if (userQuery.empty) {
          const userDoc = {
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            status: 'approved',
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: null,
            profile: {
              firstName: user.displayName.split(' ')[0] || '',
              lastName: user.displayName.split(' ').slice(1).join(' ') || '',
              phone: '',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              emergencyContact: '',
              emergencyPhone: '',
              medicalInfo: '',
              dietaryRestrictions: '',
              specialNeeds: '',
              den: '',
              rank: '',
              patrol: '',
              parentGuardian: '',
              parentPhone: '',
              parentEmail: ''
            },
            preferences: {
              notifications: true,
              emailUpdates: true,
              smsUpdates: false,
              language: 'en',
              timezone: 'America/Los_Angeles'
            },
            authProvider: 'email',
            emailVerified: user.status === 'verified',
            approvedBy: 'system-sync',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            syncReason: 'Created from existing Firebase Auth user'
          };
          
          const userDocRef = await db.collection('users').add(userDoc);
          console.log(`   📝 Created user document - ID: ${userDocRef.id}`);
        } else {
          console.log(`   📝 User document already exists`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📈 Sync Summary:');
    console.log(`   ✅ Created: ${created} account requests`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`   ❌ Errors: ${errors}`);
    
    if (created > 0) {
      console.log('\n🎉 Sync completed! Users should now appear in the admin approval interface.');
      console.log('💡 Note: You may need to refresh the admin interface to see the new records.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during sync:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔐 Firebase Auth to Account Request System Sync');
  console.log('===============================================\n');
  
  // Confirm before proceeding
  console.log('This script will:');
  console.log('1. Create account request records for existing Firebase Auth users');
  console.log('2. Create corresponding user documents in the users collection');
  console.log('3. Mark all requests as "approved" since users already have access\n');
  
  console.log('Users to be synced:');
  authUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.displayName}) - ${user.role}`);
  });
  
  console.log('\n⚠️  WARNING: This will modify your Firestore database!');
  console.log('Make sure you have a backup before proceeding.\n');
  
  // In a real script, you'd want to add a confirmation prompt
  // For now, we'll proceed automatically
  console.log('🚀 Proceeding with sync...\n');
  
  await syncUsersToApprovalSystem();
  
  console.log('\n✨ Script completed successfully!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

