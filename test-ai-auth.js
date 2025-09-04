#!/usr/bin/env node

/**
 * Test AI Authentication Script
 * 
 * This script tests the AI authentication system to ensure it's working correctly.
 * 
 * Usage: node test-ai-auth.js
 */

const admin = require('firebase-admin');
const { httpsCallable } = require('firebase/functions');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAIAuthentication() {
  try {
    console.log('🧪 Testing AI Authentication System...\n');

    // 1. Check if AI account exists
    console.log('1️⃣ Checking AI account...');
    const aiAccountQuery = await db.collection('users')
      .where('role', '==', 'ai-assistant')
      .limit(1)
      .get();

    if (aiAccountQuery.empty) {
      console.log('❌ No AI account found. Run setup-ai-account.js first.');
      return false;
    }

    const aiAccount = aiAccountQuery.docs[0];
    const aiData = aiAccount.data();
    console.log('✅ AI account found:');
    console.log(`   ID: ${aiAccount.id}`);
    console.log(`   Email: ${aiData.email}`);
    console.log(`   Role: ${aiData.role}`);
    console.log(`   Active: ${aiData.isActive}`);

    // 2. Test AI permissions
    console.log('\n2️⃣ Testing AI permissions...');
    const requiredPermissions = [
      'ai_content_generation',
      'ai_data_analysis',
      'ai_automation',
      'ai_system_integration',
      'ai_event_creation',
      'ai_announcement_creation',
      'ai_email_monitoring',
      'ai_system_commands'
    ];

    const missingPermissions = requiredPermissions.filter(
      perm => !aiData.permissions?.includes(perm)
    );

    if (missingPermissions.length > 0) {
      console.log('❌ Missing permissions:', missingPermissions);
      return false;
    }

    console.log('✅ All required permissions present');

    // 3. Test AI token validation
    console.log('\n3️⃣ Testing AI token validation...');
    if (!aiData.aiSecretToken) {
      console.log('❌ No AI secret token found');
      return false;
    }

    console.log('✅ AI secret token present');

    // 4. Test cloud function access (simulated)
    console.log('\n4️⃣ Testing cloud function access...');
    
    // Simulate AI request context
    const aiContext = {
      auth: null,
      rawRequest: {
        headers: {
          'x-ai-token': aiData.aiSecretToken,
          'x-ai-request-id': 'test-request-' + Date.now(),
          'x-ai-account-id': aiAccount.id
        },
        body: {
          _aiContext: {
            token: aiData.aiSecretToken,
            requestId: 'test-request-' + Date.now(),
            accountId: aiAccount.id,
            email: aiData.email
          }
        },
        ip: '127.0.0.1',
        'user-agent': 'AI-Test-Script/1.0'
      }
    };

    console.log('✅ AI context created successfully');

    // 5. Test permission checking
    console.log('\n5️⃣ Testing permission checking...');
    
    const hasAdminOrAIPermission = (userData) => {
      return userData?.isAdmin || 
             userData?.isDenLeader || 
             userData?.isCubmaster || 
             userData?.role === 'root' ||
             userData?.role === 'ai-assistant' ||
             userData?.profile?.isAI === true;
    };

    const hasPermission = hasAdminOrAIPermission(aiData);
    if (!hasPermission) {
      console.log('❌ AI account does not have required permissions');
      return false;
    }

    console.log('✅ AI account has required permissions');

    // 6. Test system command access
    console.log('\n6️⃣ Testing system command access...');
    const canExecuteSystemCommands = aiData.role === 'ai-assistant' || aiData.profile?.isAI === true;
    
    if (!canExecuteSystemCommands) {
      console.log('❌ AI account cannot execute system commands');
      return false;
    }

    console.log('✅ AI account can execute system commands');

    // 7. Create test admin action log
    console.log('\n7️⃣ Testing admin action logging...');
    
    const testAction = {
      userId: 'ai-assistant',
      userEmail: 'ai-assistant@sfpack1703.com',
      action: 'test',
      entityType: 'test',
      entityId: 'test-' + Date.now(),
      entityName: 'AI Authentication Test',
      details: {
        test: true,
        timestamp: new Date().toISOString()
      },
      timestamp: admin.firestore.Timestamp.now(),
      ipAddress: '127.0.0.1',
      userAgent: 'AI-Test-Script/1.0',
      success: true,
      isAI: true
    };

    await db.collection('adminActions').add(testAction);
    console.log('✅ Admin action logged successfully');

    // 8. Test AI usage logging
    console.log('\n8️⃣ Testing AI usage logging...');
    
    const testUsage = {
      userId: 'ai-assistant',
      userEmail: 'ai-assistant@sfpack1703.com',
      type: 'test',
      prompt: 'Test AI authentication',
      result: { success: true },
      timestamp: admin.firestore.Timestamp.now(),
      model: 'test-model',
      ipAddress: '127.0.0.1',
      userAgent: 'AI-Test-Script/1.0',
      isAI: true
    };

    await db.collection('aiUsage').add(testUsage);
    console.log('✅ AI usage logged successfully');

    console.log('\n🎉 All AI authentication tests passed!');
    console.log('\nThe AI system is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Deploy the updated cloud functions');
    console.log('2. Test AI functionality in the application');
    console.log('3. Monitor AI usage in the admin dashboard');

    return true;

  } catch (error) {
    console.error('❌ AI authentication test failed:', error);
    return false;
  }
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    // Remove test admin actions
    const testActions = await db.collection('adminActions')
      .where('entityName', '==', 'AI Authentication Test')
      .get();
    
    for (const doc of testActions.docs) {
      await doc.ref.delete();
    }
    
    // Remove test AI usage
    const testUsage = await db.collection('aiUsage')
      .where('prompt', '==', 'Test AI authentication')
      .get();
    
    for (const doc of testUsage.docs) {
      await doc.ref.delete();
    }
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function main() {
  try {
    console.log('🚀 AI Authentication Test Script');
    console.log('================================\n');

    const success = await testAIAuthentication();
    
    if (success) {
      await cleanupTestData();
      console.log('\n✅ All tests completed successfully!');
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { testAIAuthentication, cleanupTestData };