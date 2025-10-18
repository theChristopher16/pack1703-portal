/**
 * Diagnose Email Issue
 * 
 * This script checks all the components involved in sending welcome emails
 * when a user is approved.
 */

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin using default credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function diagnoseEmailIssue(email) {
  console.log('🔍 Diagnosing Email Issue for:', email);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Step 1: Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('❌ User not found with email:', email);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log('✅ User found!');
    console.log('   User ID:', userId);
    console.log('   Display Name:', userData.displayName || 'Not set');
    console.log('   Status:', userData.status || 'Unknown');
    console.log('   Approved At:', userData.approvedAt?.toDate?.()?.toLocaleString() || 'Not set');
    console.log('');
    
    // Step 2: Check for password setup tokens
    console.log('2️⃣ Checking for password setup tokens...');
    const tokensSnapshot = await db.collection('passwordSetupTokens')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (tokensSnapshot.empty) {
      console.warn('⚠️ No password setup tokens found');
      console.log('   This suggests the approval process may not have created a token.');
    } else {
      console.log(`✅ Found ${tokensSnapshot.size} token(s):`);
      tokensSnapshot.docs.forEach((doc, idx) => {
        const data = doc.data();
        const expiresDate = data.expires?.toDate?.();
        const createdDate = data.createdAt?.toDate?.();
        const isExpired = expiresDate && expiresDate < new Date();
        
        console.log(`\n   Token ${idx + 1}:`);
        console.log('   - ID:', doc.id);
        console.log('   - Created:', createdDate?.toLocaleString() || 'Unknown');
        console.log('   - Expires:', expiresDate?.toLocaleString() || 'Unknown');
        console.log('   - Used:', data.used || false);
        console.log('   - Status:', isExpired ? '❌ Expired' : '✅ Valid');
        console.log('   - Link: https://sfpack1703.web.app/password-setup?token=' + doc.id);
      });
    }
    console.log('');
    
    // Step 3: Check admin actions log
    console.log('3️⃣ Checking admin actions log for approval...');
    const adminActionsSnapshot = await db.collection('adminActions')
      .where('action', '==', 'approve_account_request')
      .where('details.email', '==', email)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (adminActionsSnapshot.empty) {
      console.warn('⚠️ No approval action found in admin logs');
    } else {
      const actionDoc = adminActionsSnapshot.docs[0];
      const actionData = actionDoc.data();
      console.log('✅ Approval action found:');
      console.log('   - Date:', actionData.timestamp?.toDate?.()?.toLocaleString() || 'Unknown');
      console.log('   - Approved by:', actionData.userEmail || 'Unknown');
      console.log('   - Success:', actionData.success ? '✅ Yes' : '❌ No');
      console.log('   - Role assigned:', actionData.details?.approvedRole || 'Unknown');
    }
    console.log('');
    
    // Step 4: Test email sending with actual credentials
    console.log('4️⃣ Testing email sending capability...');
    
    // Get Firebase Functions config (this won't work locally, but we can simulate)
    const emailConfig = {
      service: 'gmail',
      auth: {
        user: 'cubmaster@sfpack1703.com',
        pass: 'tvzu cxni edcg edqw'
      }
    };
    
    try {
      const transporter = nodemailer.createTransport(emailConfig);
      await transporter.verify();
      console.log('✅ SMTP connection verified');
      console.log('   Service: Gmail (Google Workspace)');
      console.log('   From: cubmaster@sfpack1703.com');
    } catch (emailError) {
      console.error('❌ SMTP connection failed:', emailError.message);
    }
    console.log('');
    
    // Step 5: Provide solutions
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DIAGNOSIS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    if (tokensSnapshot.empty) {
      console.log('🔴 ISSUE: No password setup token was created');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   The new resendPasswordSetupLink function can create a new token');
      console.log('   and attempt to send the email.');
      console.log('');
      console.log('   Run this in browser console (while logged in as admin):');
      console.log('');
      console.log('   const script = document.createElement("script");');
      console.log('   script.src = "https://sfpack1703.web.app/resend-password-setup-link.js";');
      console.log('   document.head.appendChild(script);');
      console.log('   setTimeout(() => resendPasswordSetupLink("' + email + '"), 1000);');
    } else {
      // Find a valid, unused token
      const validToken = tokensSnapshot.docs.find(doc => {
        const data = doc.data();
        const expiresDate = data.expires?.toDate?.();
        const isExpired = expiresDate && expiresDate < new Date();
        return !data.used && !isExpired;
      });
      
      if (validToken) {
        console.log('✅ GOOD NEWS: A valid password setup token exists!');
        console.log('');
        console.log('💡 SOLUTION:');
        console.log('   Send this link to the user:');
        console.log('');
        console.log('   https://sfpack1703.web.app/password-setup?token=' + validToken.id);
        console.log('');
        console.log('   You can copy this link and send it via:');
        console.log('   - Email (manually)');
        console.log('   - Text message');
        console.log('   - Phone call');
        console.log('   - Other communication method');
      } else {
        console.log('⚠️ ISSUE: Token exists but is expired or used');
        console.log('');
        console.log('💡 SOLUTION:');
        console.log('   Create a new token using resendPasswordSetupLink:');
        console.log('');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "https://sfpack1703.web.app/resend-password-setup-link.js";');
        console.log('   document.head.appendChild(script);');
        console.log('   setTimeout(() => resendPasswordSetupLink("' + email + '"), 1000);');
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('Error details:', error.message);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('');
  console.log('Usage:');
  console.log('  node diagnose-email-issue.js USER_EMAIL');
  console.log('');
  console.log('Example:');
  console.log('  node diagnose-email-issue.js christopher@smithstation.io');
  console.log('');
  process.exit(1);
}

// Run the diagnosis
diagnoseEmailIssue(email)
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });

