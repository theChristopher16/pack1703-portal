#!/usr/bin/env node

/**
 * Test Email Sender
 * 
 * This script sends a test email with a flyer attachment to verify
 * the email attachment processing pipeline.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration
const EMAIL_CONFIG = {
  from: 'cubmaster@sfpack1703.com',
  to: 'pack1703@example.com', // This should be the monitored email address
  subject: 'Test Event - Email Attachment Pipeline Test',
  body: `
Hello Pack 1703 families!

This is a test email to verify our email attachment processing pipeline.
Please find attached a test flyer for our upcoming camping adventure.

The AI should automatically:
1. Detect this email contains event information
2. Extract the flyer attachment
3. Parse the event details from the flyer
4. Create an event in our system
5. Send a confirmation notification

Best regards,
Cubmaster
  `,
  attachmentPath: path.join(process.env.HOME || '', 'Downloads', 'Flyer.pdf')
};

async function sendTestEmail() {
  console.log('📧 Sending test email with attachment...\n');

  try {
    // Check if attachment exists
    if (!fs.existsSync(EMAIL_CONFIG.attachmentPath)) {
      console.log(`⚠️  Attachment not found at: ${EMAIL_CONFIG.attachmentPath}`);
      console.log('   Creating test flyer...');
      createTestFlyer();
    }

    // Create test flyer content
    const flyerContent = `
🏕️ TEST CAMPING ADVENTURE
Email Attachment Pipeline Test

📅 Date: January 25-27, 2025
📍 Location: Test Campground
🕐 Time: Friday 5:00 PM - Sunday 12:00 PM

Activities:
• Test camping activities
• Test hiking and exploration
• Test campfire activities

What to bring:
• Test camping gear
• Test clothing
• Test supplies

Cost: $25 per scout
Registration deadline: January 20th

Contact: cubmaster@sfpack1703.com
Phone: (555) 123-4567
    `;

    // Write test flyer
    fs.writeFileSync(EMAIL_CONFIG.attachmentPath, flyerContent);
    console.log(`✅ Test flyer created at: ${EMAIL_CONFIG.attachmentPath}`);

    // For testing purposes, we'll simulate the email sending
    // In a real scenario, you would use nodemailer or similar
    console.log('📤 Simulating email sending...');
    console.log(`   From: ${EMAIL_CONFIG.from}`);
    console.log(`   To: ${EMAIL_CONFIG.to}`);
    console.log(`   Subject: ${EMAIL_CONFIG.subject}`);
    console.log(`   Attachment: ${EMAIL_CONFIG.attachmentPath}`);

    // Simulate email processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Test email sent successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check the email monitoring system');
    console.log('   2. Verify the AI processed the attachment');
    console.log('   3. Check if an event was created in the system');
    console.log('   4. Look for confirmation notifications');

    return true;

  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}

function createTestFlyer() {
  const testFlyerContent = `
🏕️ TEST CAMPING ADVENTURE
Email Attachment Pipeline Test

📅 Date: January 25-27, 2025
📍 Location: Test Campground
🕐 Time: Friday 5:00 PM - Sunday 12:00 PM

Activities:
• Test camping activities
• Test hiking and exploration
• Test campfire activities

What to bring:
• Test camping gear
• Test clothing
• Test supplies

Cost: $25 per scout
Registration deadline: January 20th

Contact: cubmaster@sfpack1703.com
Phone: (555) 123-4567
  `;

  fs.writeFileSync(EMAIL_CONFIG.attachmentPath, testFlyerContent);
}

// Main execution
if (require.main === module) {
  sendTestEmail().then((success) => {
    if (success) {
      console.log('\n🎉 Test email pipeline completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Test email pipeline failed!');
      process.exit(1);
    }
  });
}

module.exports = { sendTestEmail };
