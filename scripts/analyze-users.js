#!/usr/bin/env node

/**
 * User Account Analysis Script
 * 
 * This script analyzes users and account requests to identify:
 * 1. Users who bypassed the approval system
 * 2. Orphaned Google users (no account requests)
 * 3. Account requests waiting for approval
 * 
 * Usage: node scripts/analyze-users.js
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

async function analyzeUsers() {
  console.log('🔍 Analyzing users and account requests...\n');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users in database`);
    
    // Get all account requests
    const requestsSnapshot = await db.collection('accountRequests').get();
    console.log(`📋 Found ${requestsSnapshot.size} account requests\n`);
    
    const allUsers = [];
    const problematicUsers = [];
    const okUsers = [];
    const accountRequests = [];
    const orphanedUsers = [];
    
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
    
    // Process users
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
      
      allUsers.push(user);
      
      // Check if user has approval metadata
      const hasApprovalMetadata = user.approvedBy || user.approvedAt;
      const isApproved = user.status === 'approved' || !user.status;
      
      // Skip super admins (root users)
      if (user.role === 'super_admin') {
        okUsers.push(user);
        return;
      }
      
      // Check if user has a corresponding account request
      const hasRequest = accountRequests.some(req => req.email === user.email);
      
      if (isApproved && !hasApprovalMetadata) {
        problematicUsers.push({...user, hasRequest});
      } else if (!hasRequest && user.authProvider === 'google') {
        orphanedUsers.push(user); // Google users without requests
      } else {
        okUsers.push(user);
      }
    });
    
    // Display summary
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users:           ${allUsers.length}`);
    console.log(`Account Requests:      ${accountRequests.length}`);
    console.log(`Users Needing Fix:     ${problematicUsers.length}`);
    console.log(`Orphaned Google Users: ${orphanedUsers.length}`);
    console.log(`Properly Set Up:       ${okUsers.length}`);
    console.log('');
    
    // Show orphaned Google users
    if (orphanedUsers.length > 0) {
      console.log('🚨 ORPHANED GOOGLE USERS (No Account Requests)');
      console.log('='.repeat(50));
      console.log('These users signed in with Google but never submitted account requests.');
      console.log('They should be redirected back to login with message: "You don\'t have an account. Please request one first."\n');
      
      orphanedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Auth Provider: ${user.authProvider}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleString() : 'Unknown'}`);
        console.log('');
      });
    }
    
    // Show problematic users
    if (problematicUsers.length > 0) {
      console.log('🔴 USERS THAT NEED APPROVAL FIX');
      console.log('='.repeat(50));
      console.log('These users are approved but missing approval metadata.');
      console.log('They may have bypassed the approval system.\n');
      
      problematicUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.email})`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Auth Provider: ${user.authProvider}`);
        console.log(`   Has Request: ${user.hasRequest ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Approved By: ${user.approvedBy || '❌ Missing'}`);
        console.log('');
      });
    }
    
    // Show account requests
    if (accountRequests.length > 0) {
      console.log('📋 ACCOUNT REQUESTS');
      console.log('='.repeat(50));
      console.log('These are legitimate requests waiting for approval.\n');
      
      accountRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.displayName} (${request.email})`);
        console.log(`   Request ID: ${request.id}`);
        console.log(`   Phone: ${request.phone || 'Not provided'}`);
        console.log(`   Den: ${request.den || 'Not specified'}`);
        console.log(`   Scout Rank: ${request.scoutRank || 'Not specified'}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Linked User: ${request.linkedUserId || 'Not linked'}`);
        console.log(`   Requested: ${request.createdAt ? request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log('');
      });
    }
    
    // Show recommendations
    console.log('🔧 RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    if (orphanedUsers.length > 0) {
      console.log('1. For Orphaned Google Users:');
      console.log('   - These users should be redirected to login');
      console.log('   - Show message: "You don\'t have an account. Please request one first."');
      console.log('   - The fix in authService.ts should handle this automatically');
      console.log('');
    }
    
    if (problematicUsers.length > 0) {
      console.log('2. For Users Needing Approval Fix:');
      console.log('   - Go to Admin Panel > User Management');
      console.log('   - For each user, either:');
      console.log('     * Approve them properly (add approvedBy, approvedAt)');
      console.log('     * Set to pending for review');
      console.log('     * Remove them if they shouldn\'t have access');
      console.log('');
    }
    
    if (accountRequests.length > 0) {
      console.log('3. For Account Requests:');
      console.log('   - Review and approve legitimate requests');
      console.log('   - Link Google accounts when users sign in');
      console.log('');
    }
    
    console.log('4. Test the Fix:');
    console.log('   - Try signing in with Google using a test account');
    console.log('   - Verify proper behavior (redirect or link)');
    console.log('   - Check that you receive approval notifications');
    
  } catch (error) {
    console.error('❌ Error analyzing users:', error);
  }
}

// Run the analysis
analyzeUsers().then(() => {
  console.log('\n✅ Analysis complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});

