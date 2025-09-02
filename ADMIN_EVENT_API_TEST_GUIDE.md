# Admin Event API Test Setup Guide

## Overview

This guide will help you set up the necessary credentials and test data to run a full end-to-end test of the admin event API.

## 🔐 Step 1: Set Up Test Credentials

You have several options for setting up test credentials:

### Option A: Environment Variables (Recommended)
```bash
export TEST_ADMIN_EMAIL="your-admin-email@sfpack1703.com"
export TEST_ADMIN_PASSWORD="your-admin-password"
```

### Option B: .env File
Create a `.env` file in the project root with:
```env
TEST_ADMIN_EMAIL=your-admin-email@sfpack1703.com
TEST_ADMIN_PASSWORD=your-admin-password
```

### Option C: Direct in Terminal
```bash
# Set credentials for current session
export TEST_ADMIN_EMAIL="cubmaster@sfpack1703.com"
export TEST_ADMIN_PASSWORD="your-actual-password"
```

## 🚀 Step 2: Run the Setup Script

The setup script will:
1. Verify Firebase connection
2. Check your credentials
3. Create test location and season
4. Verify admin user privileges
5. Generate test configuration

```bash
node scripts/setup-admin-event-api-test.js
```

## 📋 Step 3: Run the Comprehensive Test

After setup is complete, run the full test:

```bash
node scripts/test-admin-event-api-comprehensive.js
```

## 🔍 What the Setup Creates

### Test Location
- **Name**: 🧪 Test API Location
- **Address**: 123 Test Street, Test City, TX 12345
- **Category**: test
- **Coordinates**: Houston area (29.7604, -95.3698)

### Test Season
- **Name**: 🧪 Test API Season
- **Period**: January 1, 2025 - December 31, 2025
- **Status**: Active

### Test Configuration File
- **Location**: `scripts/test-config.json`
- **Contains**: Test data IDs, user info, setup timestamp

## 🧪 What the Test Will Do

### Authentication Test
- Sign in with your admin credentials
- Verify user has admin privileges
- Test authentication token generation

### Validation Tests
- Test missing required fields
- Test invalid date formats
- Test invalid time formats
- Test non-existent references

### Error Handling Tests
- Test non-existent location
- Test non-existent season
- Verify proper error responses

### CRUD Operation Tests
- **Create**: Create a test event with all fields
- **Update**: Modify the event title, description, fees
- **Delete**: Remove the test event with reason

## 📊 Expected Results

### Successful Test Output
```
📊 Comprehensive Admin Event API Test Report
============================================
Authentication: ✅
Validation Tests: ✅
Error Handling: ✅
Event Creation: ✅
Event Update: ✅
Event Deletion: ✅

📈 Success Rate: 100.0% (6/6)
🎉 Comprehensive test PASSED!
```

### Partial Success
```
📈 Success Rate: 57.1% (4/7)
⚠️  Partial success - some features need attention
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "No test credentials found"
**Solution**: Set the environment variables as shown in Step 1

#### 2. "Authentication failed"
**Solution**: 
- Verify your email and password are correct
- Ensure the user exists in Firebase Auth
- Check if the user has admin privileges

#### 3. "Firebase connection failed"
**Solution**:
- Check your Firebase configuration
- Verify the project ID is correct
- Ensure you have proper Firebase permissions

#### 4. "User does not have admin privileges"
**Solution**:
- The user needs `isAdmin`, `isDenLeader`, or `isCubmaster` set to `true`
- Check the user document in the `users` collection

### Debug Commands

```bash
# Check if credentials are set
echo $TEST_ADMIN_EMAIL
echo $TEST_ADMIN_PASSWORD

# Check Firebase config
cat src/firebase/config.ts

# View test configuration
cat scripts/test-config.json

# Run setup with verbose output
DEBUG=true node scripts/setup-admin-event-api-test.js
```

## 🧹 Cleanup

After testing, you may want to clean up the test data:

```bash
# The test automatically deletes the test event
# You can manually delete test location and season if needed
# Check scripts/test-config.json for the IDs
```

## 📝 Test Data Reference

### Required Fields for Event Creation
```typescript
{
  title: string,           // Required
  description: string,     // Required
  startDate: string,       // Required (YYYY-MM-DD)
  endDate: string,         // Required (YYYY-MM-DD)
  startTime: string,       // Required (HH:MM)
  endTime: string,         // Required (HH:MM)
  locationId: string,      // Required (must exist)
  category: string,        // Required
  seasonId: string         // Required (must exist)
}
```

### Optional Fields
```typescript
{
  denTags: string[],       // Array of den names
  maxCapacity: number,     // Maximum participants
  fees: number,           // Registration fee
  contactEmail: string,    // Contact email
  isOvernight: boolean,    // Overnight event
  requiresPermission: boolean, // Requires parent permission
  packingList: string[],   // Items to bring
  visibility: string,      // 'public', 'link-only', 'private'
  sendNotification: boolean // Send chat notification
}
```

## 🎯 Success Criteria

A successful test means:
- ✅ All Cloud Functions are accessible
- ✅ Authentication works correctly
- ✅ Validation prevents invalid data
- ✅ Events can be created, updated, and deleted
- ✅ Error handling works properly
- ✅ Admin actions are logged
- ✅ Chat notifications are sent (if enabled)

This confirms the admin event API is fully functional and ready for production use.
