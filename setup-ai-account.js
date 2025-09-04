#!/usr/bin/env node

/**
 * Setup AI Account Script
 * 
 * This script creates a dedicated AI account in the system and configures
 * the necessary environment variables for AI authentication.
 * 
 * Usage: node setup-ai-account.js
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupAIAccount() {
  try {
    console.log('🤖 Setting up AI Assistant account...');

    // Check if AI account already exists
    const aiAccountQuery = await db.collection('users')
      .where('role', '==', 'ai-assistant')
      .limit(1)
      .get();

    if (!aiAccountQuery.empty) {
      console.log('✅ AI account already exists');
      const existingAccount = aiAccountQuery.docs[0];
      console.log(`   Account ID: ${existingAccount.id}`);
      console.log(`   Email: ${existingAccount.data().email}`);
      return existingAccount.id;
    }

    // Generate AI secret token
    const aiSecretToken = crypto.randomBytes(32).toString('hex');
    
    // Create AI account data
    const aiAccountData = {
      email: 'ai-assistant@sfpack1703.com',
      displayName: 'AI Assistant',
      role: 'ai-assistant',
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      profile: {
        firstName: 'AI',
        lastName: 'Assistant',
        phone: null,
        address: null,
        emergencyContact: null,
        medicalInfo: null,
        den: null,
        rank: null,
        isAdult: true,
        isScout: false,
        isDenLeader: false,
        isCubmaster: false,
        isAdmin: true,
        isRoot: false,
        isAI: true
      },
      permissions: [
        'ai_content_generation',
        'ai_data_analysis',
        'ai_automation',
        'ai_system_integration',
        'ai_event_creation',
        'ai_announcement_creation',
        'ai_email_monitoring',
        'ai_system_commands',
        'read_content',
        'create_content',
        'update_content',
        'delete_content',
        'event_management',
        'announcement_management',
        'system_admin'
      ],
      lastLogin: admin.firestore.Timestamp.now(),
      isEmailVerified: true,
      isPhoneVerified: false,
      linkedAccounts: [],
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'private',
          contactVisibility: 'private'
        }
      },
      aiSecretToken: aiSecretToken // Store the token securely
    };

    // Add AI account to Firestore
    const aiAccountRef = await db.collection('users').add(aiAccountData);
    const aiAccountId = aiAccountRef.id;

    console.log('✅ AI Assistant account created successfully!');
    console.log(`   Account ID: ${aiAccountId}`);
    console.log(`   Email: ${aiAccountData.email}`);
    console.log(`   Role: ${aiAccountData.role}`);
    console.log(`   Secret Token: ${aiSecretToken}`);

    // Create environment configuration
    const envConfig = {
      AI_SECRET_TOKEN: aiSecretToken,
      AI_ACCOUNT_ID: aiAccountId,
      AI_EMAIL: aiAccountData.email
    };

    console.log('\n📋 Environment Variables to add to your .env file:');
    console.log('==================================================');
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    // Create a secure config file for the AI
    const aiConfig = {
      accountId: aiAccountId,
      email: aiAccountData.email,
      secretToken: aiSecretToken,
      permissions: aiAccountData.permissions,
      createdAt: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync('ai-config.json', JSON.stringify(aiConfig, null, 2));
    console.log('\n✅ AI configuration saved to ai-config.json');

    // Create a sample AI request helper
    const aiRequestHelper = `
// AI Request Helper
// Use this to make authenticated AI requests to cloud functions

const AI_CONFIG = ${JSON.stringify(aiConfig, null, 2)};

function makeAIRequest(functionName, data) {
  return fetch(\`/api/\${functionName}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ai-token': AI_CONFIG.secretToken,
      'x-ai-request-id': crypto.randomUUID()
    },
    body: JSON.stringify(data)
  });
}

// Example usage:
// makeAIRequest('aiGenerateContent', { type: 'event_description', prompt: 'Create a fun camping event' });
`;

    fs.writeFileSync('ai-request-helper.js', aiRequestHelper);
    console.log('✅ AI request helper saved to ai-request-helper.js');

    return aiAccountId;

  } catch (error) {
    console.error('❌ Error setting up AI account:', error);
    throw error;
  }
}

async function testAIAuthentication() {
  try {
    console.log('\n🧪 Testing AI authentication...');

    // Get the AI account
    const aiAccountQuery = await db.collection('users')
      .where('role', '==', 'ai-assistant')
      .limit(1)
      .get();

    if (aiAccountQuery.empty) {
      console.log('❌ No AI account found');
      return false;
    }

    const aiAccount = aiAccountQuery.docs[0];
    const aiData = aiAccount.data();

    console.log('✅ AI account found:');
    console.log(`   ID: ${aiAccount.id}`);
    console.log(`   Email: ${aiData.email}`);
    console.log(`   Role: ${aiData.role}`);
    console.log(`   Permissions: ${aiData.permissions?.length || 0} permissions`);
    console.log(`   Active: ${aiData.isActive}`);

    return true;

  } catch (error) {
    console.error('❌ Error testing AI authentication:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 AI Account Setup Script');
    console.log('==========================\n');

    // Setup AI account
    await setupAIAccount();

    // Test authentication
    await testAIAuthentication();

    console.log('\n🎉 AI setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add the environment variables to your .env file');
    console.log('2. Deploy the updated cloud functions');
    console.log('3. Test AI functionality with the provided helper functions');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { setupAIAccount, testAIAuthentication };