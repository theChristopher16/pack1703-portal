#!/usr/bin/env node

/**
 * Add AI Role to Existing User Script
 * 
 * This script adds AI permissions to an existing admin user account
 * instead of creating a separate AI account.
 * 
 * Usage: node add-ai-role.js [email]
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAIRoleToUser(userEmail) {
  try {
    console.log(`🤖 Adding AI role to user: ${userEmail}`);

    // Find the user by email
    const userQuery = await db.collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log(`❌ User with email ${userEmail} not found`);
      return false;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log(`✅ Found user: ${userData.displayName || userEmail}`);
    console.log(`   Current role: ${userData.role}`);
    console.log(`   Current permissions: ${userData.permissions?.length || 0} permissions`);

    // Check if user already has AI permissions
    if (userData.permissions?.includes('ai_system_integration')) {
      console.log('✅ User already has AI permissions');
      return true;
    }

    // Add AI permissions to the user
    const updatedPermissions = [
      ...(userData.permissions || []),
      'ai_content_generation',
      'ai_data_analysis',
      'ai_automation',
      'ai_system_integration',
      'ai_event_creation',
      'ai_announcement_creation',
      'ai_email_monitoring',
      'ai_system_commands'
    ];

    // Update the user document
    await db.collection('users').doc(userId).update({
      permissions: updatedPermissions,
      updatedAt: admin.firestore.Timestamp.now(),
      profile: {
        ...userData.profile,
        isAI: true
      }
    });

    console.log('✅ AI permissions added successfully!');
    console.log(`   New permissions count: ${updatedPermissions.length}`);
    console.log(`   AI flag set: true`);

    // Log the admin action
    await db.collection('adminActions').add({
      userId: 'system',
      userEmail: 'system@sfpack1703.com',
      action: 'update',
      entityType: 'user',
      entityId: userId,
      entityName: userData.displayName || userEmail,
      details: {
        addedPermissions: [
          'ai_content_generation',
          'ai_data_analysis',
          'ai_automation',
          'ai_system_integration',
          'ai_event_creation',
          'ai_announcement_creation',
          'ai_email_monitoring',
          'ai_system_commands'
        ],
        reason: 'AI role assignment'
      },
      timestamp: admin.firestore.Timestamp.now(),
      ipAddress: '127.0.0.1',
      userAgent: 'AI-Role-Script/1.0',
      success: true,
      isAI: false
    });

    return true;

  } catch (error) {
    console.error('❌ Error adding AI role:', error);
    return false;
  }
}

async function listUsersWithAIRole() {
  try {
    console.log('\n🔍 Users with AI permissions:');
    
    const aiUsersQuery = await db.collection('users')
      .where('permissions', 'array-contains', 'ai_system_integration')
      .get();

    if (aiUsersQuery.empty) {
      console.log('   No users found with AI permissions');
      return;
    }

    aiUsersQuery.docs.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`   ${index + 1}. ${userData.displayName || userData.email}`);
      console.log(`      Email: ${userData.email}`);
      console.log(`      Role: ${userData.role}`);
      console.log(`      AI Permissions: ${userData.permissions?.filter(p => p.startsWith('ai_')).length || 0}`);
      console.log(`      Is AI Flag: ${userData.profile?.isAI || false}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing AI users:', error);
  }
}

async function removeAIRoleFromUser(userEmail) {
  try {
    console.log(`🗑️ Removing AI role from user: ${userEmail}`);

    // Find the user by email
    const userQuery = await db.collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log(`❌ User with email ${userEmail} not found`);
      return false;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Remove AI permissions
    const updatedPermissions = (userData.permissions || []).filter(
      perm => !perm.startsWith('ai_')
    );

    // Update the user document
    await db.collection('users').doc(userId).update({
      permissions: updatedPermissions,
      updatedAt: admin.firestore.Timestamp.now(),
      profile: {
        ...userData.profile,
        isAI: false
      }
    });

    console.log('✅ AI permissions removed successfully!');
    console.log(`   Remaining permissions: ${updatedPermissions.length}`);

    return true;

  } catch (error) {
    console.error('❌ Error removing AI role:', error);
    return false;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    const email = args[1];

    console.log('🚀 AI Role Management Script');
    console.log('============================\n');

    switch (command) {
      case 'add':
        if (!email) {
          console.log('❌ Please provide an email address');
          console.log('Usage: node add-ai-role.js add user@example.com');
          return;
        }
        await addAIRoleToUser(email);
        break;

      case 'remove':
        if (!email) {
          console.log('❌ Please provide an email address');
          console.log('Usage: node add-ai-role.js remove user@example.com');
          return;
        }
        await removeAIRoleFromUser(email);
        break;

      case 'list':
        await listUsersWithAIRole();
        break;

      default:
        console.log('Available commands:');
        console.log('  add <email>    - Add AI role to user');
        console.log('  remove <email>  - Remove AI role from user');
        console.log('  list           - List users with AI role');
        console.log('');
        console.log('Examples:');
        console.log('  node add-ai-role.js add admin@sfpack1703.com');
        console.log('  node add-ai-role.js remove admin@sfpack1703.com');
        console.log('  node add-ai-role.js list');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addAIRoleToUser, removeAIRoleFromUser, listUsersWithAIRole };