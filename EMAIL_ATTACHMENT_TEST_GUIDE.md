# Email Attachment Pipeline Test Guide

## Overview

This guide explains how to test the email attachment processing pipeline that allows the AI to automatically extract event information from email attachments and create events in the system.

## 🧪 Test Pipeline Components

### 1. Email Monitoring Service (`src/services/emailMonitorService.ts`)
- Monitors email inbox for new messages
- Detects emails with attachments
- Processes attachments for event information
- Integrates with AI service for content analysis

### 2. AI Service (`src/services/aiService.ts`)
- Extracts event data from email attachments
- Parses flyers, PDFs, and other documents
- Creates structured event data
- Generates creative event titles with emojis

### 3. Test Suite (`test/email-attachment-pipeline.test.ts`)
- Comprehensive unit tests for attachment processing
- Tests multiple attachment types and scenarios
- Verifies error handling and edge cases
- Integration tests for full pipeline

## 🚀 How to Test

### Quick Test (Recommended)
```bash
node scripts/quick-email-test.js
```

This runs a quick verification that:
- ✅ Creates a test flyer in Downloads folder
- ✅ Simulates email processing
- ✅ Verifies all pipeline components exist
- ✅ Generates a test report

### Full Test Suite
```bash
npm test -- test/email-attachment-pipeline.test.ts
```

This runs comprehensive tests including:
- Email with single attachment processing
- Multiple attachment handling
- Non-event attachment handling
- Contact information extraction
- Error handling for corrupted files
- Full pipeline integration test

### Manual Testing

1. **Create a Test Flyer**
   - Place a PDF flyer in your Downloads folder named "Flyer.pdf"
   - Or use the test flyer created by the quick test

2. **Send Test Email**
   ```bash
   node scripts/send-test-email.js
   ```

3. **Monitor Results**
   - Check the email monitoring system logs
   - Verify event creation in the database
   - Look for confirmation notifications

## 📧 Test Email Format

The system expects emails with the following characteristics:

### Email Structure
```javascript
{
  id: 'unique-email-id',
  from: 'cubmaster@sfpack1703.com',
  to: 'pack1703@example.com',
  subject: 'Event Information - [Event Name]',
  body: 'Email body with event details...',
  date: new Date(),
  attachments: [
    {
      name: 'Event_Flyer.pdf',
      type: 'application/pdf',
      size: 1024,
      content: 'PDF content...'
    }
  ]
}
```

### Supported Attachment Types
- **PDF files** (`.pdf`) - Primary format for flyers
- **Text files** (`.txt`) - Simple event information
- **Calendar files** (`.ics`, `.ical`) - Event scheduling

### Expected Event Data
The AI extracts the following information:
- **Title**: Event name with emoji (e.g., "🏕️ Fall Camping Adventure")
- **Date**: Start and end dates
- **Location**: Event venue or location
- **Time**: Event timing details
- **Description**: Event description and activities
- **Cost**: Registration fees
- **Requirements**: Packing lists and equipment needed
- **Contact**: Organizer contact information

## 🔍 What the AI Does

1. **Email Detection**: Identifies emails containing event information
2. **Attachment Processing**: Extracts and reads attachment content
3. **Content Analysis**: Parses text to identify event details
4. **Data Extraction**: Creates structured event data
5. **Validation**: Checks data quality and confidence
6. **Event Creation**: Adds event to the database
7. **Notification**: Sends confirmation messages

## 📊 Test Scenarios

### Scenario 1: Standard Event Flyer
- **Input**: PDF flyer with camping event details
- **Expected**: Event created with full details
- **Test**: `npm test -- test/email-attachment-pipeline.test.ts`

### Scenario 2: Multiple Attachments
- **Input**: Email with flyer + registration form
- **Expected**: Event created with additional details
- **Test**: Multiple attachment processing test

### Scenario 3: Non-Event Content
- **Input**: Newsletter or general announcement
- **Expected**: No event created, marked as announcement
- **Test**: Non-event attachment handling test

### Scenario 4: Error Handling
- **Input**: Corrupted or unsupported file
- **Expected**: Graceful error handling, no event created
- **Test**: Error handling tests

## 🛠️ Troubleshooting

### Common Issues

1. **Test Flyer Not Found**
   ```bash
   # Create test flyer manually
   echo "Test flyer content" > ~/Downloads/Flyer.pdf
   ```

2. **Email Service Not Responding**
   - Check Firebase Cloud Functions status
   - Verify email monitoring configuration
   - Check network connectivity

3. **AI Processing Fails**
   - Verify AI service configuration
   - Check attachment format compatibility
   - Review error logs for specific issues

### Debug Commands

```bash
# Run quick test
node scripts/quick-email-test.js

# Check service status
npm run build

# View logs
firebase functions:log

# Test specific component
npm test -- test/email-attachment-pipeline.test.ts --grep "should process email"
```

## 📈 Success Metrics

A successful test should show:
- ✅ **100% Success Rate** in quick test
- ✅ **All pipeline components** verified
- ✅ **Test flyer created** and processed
- ✅ **Email simulation** completed
- ✅ **No errors** in test report

## 🎯 Next Steps After Testing

1. **Send Real Test Email**: Use the cubmaster email to send a real test
2. **Monitor System**: Watch for event creation in the admin panel
3. **Verify Data**: Check that extracted data is accurate
4. **Test Edge Cases**: Try different flyer formats and content
5. **Production Deployment**: Deploy to production when satisfied

## 📝 Test Report Example

```
📊 Quick Test Report
===================
Flyer Created: ✅
Email Simulated: ✅
Pipeline Verified: ✅

📈 Success Rate: 100.0%
🎉 Quick test PASSED!

📋 Next Steps:
   1. Send a real email with the flyer attachment
   2. Check the email monitoring system
   3. Verify the AI processes the attachment
   4. Confirm event creation in the system
```

This test pipeline ensures that the email attachment processing system works correctly and can automatically create events from email attachments containing scout event information.

