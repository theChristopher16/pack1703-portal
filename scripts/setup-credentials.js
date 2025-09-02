#!/usr/bin/env node

/**
 * Quick Credential Setup
 * 
 * This script helps you quickly set up test credentials for the admin event API test.
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Quick Credential Setup');
console.log('=========================\n');

console.log('To set up test credentials for the admin event API test, you have several options:\n');

console.log('📋 Option 1: Set Environment Variables (Recommended)');
console.log('===================================================');
console.log('Run these commands in your terminal:');
console.log('');
console.log('export TEST_ADMIN_EMAIL="your-admin-email@sfpack1703.com"');
console.log('export TEST_ADMIN_PASSWORD="your-admin-password"');
console.log('');

console.log('📋 Option 2: Create .env File');
console.log('=============================');
console.log('Create a .env file in the project root with:');
console.log('');
console.log('TEST_ADMIN_EMAIL=your-admin-email@sfpack1703.com');
console.log('TEST_ADMIN_PASSWORD=your-admin-password');
console.log('');

console.log('📋 Option 3: Use Your Existing Admin Account');
console.log('=============================================');
console.log('If you already have an admin account, use those credentials:');
console.log('');
console.log('export TEST_ADMIN_EMAIL="cubmaster@sfpack1703.com"');
console.log('export TEST_ADMIN_PASSWORD="your-actual-password"');
console.log('');

console.log('🔍 What Credentials Do You Need?');
console.log('================================');
console.log('- Email: Your admin user email address');
console.log('- Password: Your admin user password');
console.log('- User must have admin privileges (isAdmin, isDenLeader, or isCubmaster)');
console.log('');

console.log('🚀 After Setting Credentials');
console.log('============================');
console.log('1. Run the setup script:');
console.log('   node scripts/setup-admin-event-api-test.js');
console.log('');
console.log('2. Run the comprehensive test:');
console.log('   node scripts/test-admin-event-api-comprehensive.js');
console.log('');

console.log('❓ Need Help?');
console.log('==============');
console.log('- Check ADMIN_EVENT_API_TEST_GUIDE.md for detailed instructions');
console.log('- Verify your Firebase configuration in src/firebase/config.ts');
console.log('- Ensure your user has admin privileges in the users collection');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 Found existing .env file');
  console.log('You can add the test credentials to this file.');
} else {
  console.log('📁 No .env file found');
  console.log('You can create one in the project root directory.');
}

console.log('\n🏁 Ready to set up credentials!');
console.log('Run the commands above and then try the setup script again.');
