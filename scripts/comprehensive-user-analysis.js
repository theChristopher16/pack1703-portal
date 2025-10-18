#!/usr/bin/env node

/**
 * Comprehensive User Analysis Script
 * 
 * This script analyzes ALL user-related data to find:
 * 1. Users who tried Google sign-in without accounts
 * 2. Users who bypassed approval system
 * 3. Deleted users or users in different states
 * 4. Firebase Auth users vs Firestore users
 * 
 * Usage: node scripts/comprehensive-user-analysis.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../service-account-key.json');
} catch (error) {
  console.log('❌ Service account key not found.');
  console.log('📋 Please download it from Firebase Console:');
  console.log('   1. Go to: https://console.firebase.google.com/project/pack1703-portal/settings/serviceaccounts/adminsdk');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Save as: service-account-key.json in project root');
  console.log('   4. Run this script again');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function comprehensiveAnalysis() {
  console.log('🔍 Comprehensive User Analysis...\n');
  
  try {
    // Get Firebase Auth users
    console.log('📊 Checking Firebase Authentication users...');
    const authUsers = await auth.listUsers();
    console.log(`   Found ${authUsers.users.length} Firebase Auth users\n`);
    
    // Get Firestore users
    console.log('📊 Checking Firestore users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Found ${usersSnapshot.size} Firestore users\n`);
    
    // Get account requests
    console.log('📊 Checking account requests...');
    const requestsSnapshot = await db.collection('accountRequests').get();
    console.log(`   Found ${requestsSnapshot.size} account requests\n`);
    
    // Get admin actions (audit log)
    console.log('📊 Checking admin actions (audit log)...');
    const adminActionsSnapshot = await db.collection('adminActions').get();
    console.log(`   Found ${adminActionsSnapshot.size} admin actions\n`);
    
    const allUsers = [];
    const problematicUsers = [];
    const okUsers = [];
    const accountRequests = [];
    const orphanedAuthUsers = [];
    const auditLog = [];
    
    // Process Firebase Auth users
    console.log('🔍 Analyzing Firebase Auth users...');
    authUsers.users.forEach((authUser) => {
      const user = {
        uid: authUser.uid,
        email: authUser.email || 'No email',
        displayName: authUser.displayName || 'Unknown',
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        createdAt: authUser.metadata.creationTime,
        lastSignIn: authUser.metadata.lastSignInTime,
        providers: authUser.providerData.map(p => p.providerId),
        customClaims: authUser.customClaims || {}
      };
      
      allUsers.push(user);
      
      // Check if this auth user has a corresponding Firestore user
      const hasFirestoreUser = usersSnapshot.docs.some(doc => doc.id === authUser.uid);
      
      if (!hasFirestoreUser && authUser.uid !== 'ai_solyn' && authUser.uid !== 'ai_nova') {
        orphanedAuthUsers.push(user);
      }
    });
    
    // Process Firestore users
    console.log('🔍 Analyzing Firestore users...');
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Skip AI accounts
      if (userId === 'ai_solyn' || userId === 'ai_nova') {
        return;
      }
      
      const user = {
        uid: userId,
        email: userData.email || 'No email',
        displayName: userData.displayName || 'Unknown',
        role: userData.role || 'parent',
        status: userData.status || 'unknown',
        approvedBy: userData.approvedBy,
        approvedAt: userData.approvedAt?.toDate?.() || userData.approvedAt,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        authProvider: userData.authProvider || 'unknown'
      };
      
      // Check if user has approval metadata
      const hasApprovalMetadata = user.approvedBy || user.approvedAt;
      const isApproved = user.status === 'approved' || !user.status;
      
      // Skip super admins (root users)
      if (user.role === 'super_admin') {
        okUsers.push(user);
        return;
      }
      
      if (isApproved && !hasApprovalMetadata) {
        problematicUsers.push(user);
      } else {
        okUsers.push(user);
      }
    });
    
    // Process account requests
    requestsSnapshot.forEach((doc) => {
      const requestData = doc.data();
      accountRequests.push({
        id: doc.id,
        email: requestData.email,
        displayName: requestData.displayName,
        status: requestData.status,
        createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
        phone: requestData.phone,
        den: requestData.den,
        scoutRank: requestData.scoutRank,
        linkedUserId: requestData.linkedUserId
      });
    });
    
    // Process admin actions (audit log)
    adminActionsSnapshot.forEach((doc) => {
      const actionData = doc.data();
      auditLog.push({
        id: doc.id,
        action: actionData.action,
        entityType: actionData.entityType,
        entityName: actionData.entityName,
        details: actionData.details,
        timestamp: actionData.timestamp?.toDate?.() || actionData.timestamp,
        userId: actionData.userId,
        userEmail: actionData.userEmail
      });
    });
    
    // Display comprehensive summary
    console.log('📊 COMPREHENSIVE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Firebase Auth Users:     ${authUsers.users.length}`);
    console.log(`Firestore Users:         ${usersSnapshot.size}`);
    console.log(`Account Requests:        ${requestsSnapshot.size}`);
    console.log(`Admin Actions:           ${adminActionsSnapshot.size}`);
    console.log(`Orphaned Auth Users:     ${orphanedAuthUsers.length}`);
    console.log(`Users Needing Fix:       ${problematicUsers.length}`);
    console.log(`Properly Set Up:         ${okUsers.length}`);
    console.log('');
    
    // Show orphaned Firebase Auth users
    if (orphanedAuthUsers.length > 0) {
      console.log('🚨 ORPHANED FIREBASE AUTH USERS');
      console.log('='.repeat(60));
      console.log('These users exist in Firebase Auth but NOT in Firestore.');
      console.log('They may have tried to sign in but were never properly created.\n');
      
      orphanedAuthUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Providers: ${user.providers.join(', ')}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Disabled: ${user.disabled}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Last Sign In: ${user.lastSignIn || 'Never'}`);
        console.log(`   Custom Claims: ${JSON.stringify(user.customClaims)}`);
        console.log('');
      });
    }
    
    // Show problematic users
    if (problematicUsers.length > 0) {
      console.log('🔴 USERS THAT NEED APPROVAL FIX');
      console.log('='.repeat(60));
      console.log('These users are approved but missing approval metadata.\n');
      
      problematicUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Auth Provider: ${user.authProvider}`);
        console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Approved By: ${user.approvedBy || '❌ Missing'}`);
        console.log('');
      });
    }
    
    // Show recent admin actions related to user management
    const userRelatedActions = auditLog
      .filter(action => 
        action.action?.includes('user') || 
        action.action?.includes('account') ||
        action.entityType === 'user' ||
        action.entityType === 'account_request'
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
    
    if (userRelatedActions.length > 0) {
      console.log('📋 RECENT USER-RELATED ADMIN ACTIONS');
      console.log('='.repeat(60));
      console.log('Recent actions related to user management:\n');
      
      userRelatedActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action.action} - ${action.entityName}`);
        console.log(`   Type: ${action.entityType}`);
        console.log(`   Time: ${action.timestamp ? action.timestamp.toLocaleString() : 'Unknown'}`);
        console.log(`   User: ${action.userEmail || 'System'}`);
        if (action.details) {
          console.log(`   Details: ${JSON.stringify(action.details, null, 2)}`);
        }
        console.log('');
      });
    }
    
    // Show Google sign-in attempts
    const googleSignIns = auditLog.filter(action => 
      action.details?.authProvider === 'google' ||
      action.action?.includes('google') ||
      action.details?.providers?.includes('google.com')
    );
    
    if (googleSignIns.length > 0) {
      console.log('🔍 GOOGLE SIGN-IN ATTEMPTS');
      console.log('='.repeat(60));
      console.log('Recent Google sign-in attempts:\n');
      
      googleSignIns.forEach((action, index) => {
        console.log(`${index + 1}. ${action.entityName} (${action.details?.email || 'Unknown'})`);
        console.log(`   Action: ${action.action}`);
        console.log(`   Time: ${action.timestamp ? action.timestamp.toLocaleString() : 'Unknown'}`);
        console.log(`   Details: ${JSON.stringify(action.details, null, 2)}`);
        console.log('');
      });
    }
    
    // Show recommendations
    console.log('🔧 RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (orphanedAuthUsers.length > 0) {
      console.log('1. For Orphaned Firebase Auth Users:');
      console.log('   - These users tried to sign in but were never properly created');
      console.log('   - You may want to delete them from Firebase Auth');
      console.log('   - Or create proper Firestore user documents for them');
      console.log('');
    }
    
    if (problematicUsers.length > 0) {
      console.log('2. For Users Needing Approval Fix:');
      console.log('   - Go to Admin Panel > User Management');
      console.log('   - Add proper approval metadata (approvedBy, approvedAt)');
      console.log('');
    }
    
    console.log('3. Check Firebase Console:');
    console.log('   - Go to Authentication > Users');
    console.log('   - Look for users with Google providers');
    console.log('   - Check creation dates to identify recent sign-ins');
    console.log('');
    
    console.log('4. Monitor Future Sign-ins:');
    console.log('   - The fix should now prevent unauthorized Google sign-ins');
    console.log('   - Users without requests will be redirected');
    console.log('   - Users with requests will be linked properly');
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
  }
}

// Run the analysis
comprehensiveAnalysis().then(() => {
  console.log('\n✅ Comprehensive analysis complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});

