#!/usr/bin/env node

/**
 * Check Account Requests Status Script
 * 
 * This script checks the current status of all account requests
 * to see what's actually pending for approval.
 * 
 * Usage: node scripts/check-account-requests.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../service-account-key.json');
} catch (error) {
  console.log('❌ Service account key not found.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAccountRequests() {
  console.log('🔍 Checking Account Requests Status\n');
  
  try {
    const requestsSnapshot = await db.collection('accountRequests').get();
    
    const requests = [];
    requestsSnapshot.forEach((doc) => {
      const requestData = doc.data();
      requests.push({
        id: doc.id,
        email: requestData.email,
        displayName: requestData.displayName,
        status: requestData.status,
        createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
        linkedUserId: requestData.linkedUserId,
        linkedAt: requestData.linkedAt?.toDate?.() || requestData.linkedAt,
        phone: requestData.phone,
        den: requestData.den,
        scoutRank: requestData.scoutRank,
        firstName: requestData.firstName,
        lastName: requestData.lastName
      });
    });
    
    // Sort by creation date (newest first)
    requests.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    
    console.log(`📊 Found ${requests.length} total account requests\n`);
    
    // Group by status
    const pendingRequests = requests.filter(req => req.status === 'pending');
    const approvedRequests = requests.filter(req => req.status === 'approved');
    const linkedRequests = requests.filter(req => req.status === 'linked');
    const rejectedRequests = requests.filter(req => req.status === 'rejected');
    
    console.log('📋 STATUS BREAKDOWN:');
    console.log(`   Pending: ${pendingRequests.length}`);
    console.log(`   Approved: ${approvedRequests.length}`);
    console.log(`   Linked: ${linkedRequests.length}`);
    console.log(`   Rejected: ${rejectedRequests.length}\n`);
    
    // Show pending requests
    if (pendingRequests.length > 0) {
      console.log('⏳ PENDING REQUESTS (Ready for Approval):');
      console.log('============================================================');
      pendingRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.displayName || 'Unknown'} (${request.email})`);
        console.log(`   Phone: ${request.phone || 'Not provided'}`);
        console.log(`   Den: ${request.den || 'Not specified'}`);
        console.log(`   Scout Rank: ${request.scoutRank || 'Not specified'}`);
        console.log(`   Created: ${request.createdAt ? request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Status: ${request.status}`);
        console.log('');
      });
    } else {
      console.log('✅ No pending requests found');
    }
    
    // Show linked requests (recently linked)
    if (linkedRequests.length > 0) {
      console.log('🔗 LINKED REQUESTS (Recently Linked to Google Accounts):');
      console.log('============================================================');
      linkedRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.displayName || 'Unknown'} (${request.email})`);
        console.log(`   Phone: ${request.phone || 'Not provided'}`);
        console.log(`   Den: ${request.den || 'Not specified'}`);
        console.log(`   Scout Rank: ${request.scoutRank || 'Not specified'}`);
        console.log(`   Created: ${request.createdAt ? request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Linked: ${request.linkedAt ? request.linkedAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Linked User ID: ${request.linkedUserId || 'Not linked'}`);
        console.log(`   Status: ${request.status}`);
        console.log('');
      });
    }
    
    // Show recent approved requests
    const recentApproved = approvedRequests
      .filter(req => {
        const createdDate = new Date(req.createdAt);
        const now = new Date();
        const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Last 7 days
      })
      .slice(0, 5); // Show only 5 most recent
    
    if (recentApproved.length > 0) {
      console.log('✅ RECENTLY APPROVED REQUESTS (Last 7 days):');
      console.log('============================================================');
      recentApproved.forEach((request, index) => {
        console.log(`${index + 1}. ${request.displayName || 'Unknown'} (${request.email})`);
        console.log(`   Phone: ${request.phone || 'Not provided'}`);
        console.log(`   Den: ${request.den || 'Not specified'}`);
        console.log(`   Scout Rank: ${request.scoutRank || 'Not specified'}`);
        console.log(`   Created: ${request.createdAt ? request.createdAt.toLocaleString() : 'Unknown'}`);
        console.log(`   Status: ${request.status}`);
        console.log('');
      });
    }
    
    console.log('📋 SUMMARY:');
    console.log('============================================================');
    console.log(`Total Requests: ${requests.length}`);
    console.log(`Pending Approval: ${pendingRequests.length}`);
    console.log(`Recently Linked: ${linkedRequests.length}`);
    console.log(`Recently Approved: ${recentApproved.length}`);
    
    if (pendingRequests.length === 0) {
      console.log('\n🎉 All account requests have been processed!');
      console.log('   No pending requests found in the system.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the check
checkAccountRequests().then(() => {
  console.log('\n✅ Account requests check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

