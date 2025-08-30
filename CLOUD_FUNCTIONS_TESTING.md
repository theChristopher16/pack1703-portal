# 🧪 Cloud Functions Testing Guide

This guide will help you test all the Cloud Functions to ensure they're working correctly before moving to production.

## 🚀 Quick Start

### 1. Start Firebase Emulator
```bash
# From the app/sfpack1703app directory
firebase emulators:start --only functions,firestore
```

This will start:
- **Functions Emulator** on port 5001
- **Firestore Emulator** on port 8080
- **Emulator UI** on port 4000

### 2. Test via React App
Navigate to: `http://localhost:3000/cloud-functions-test`

Click "Run All Tests" to test all functions automatically.

### 3. Test via Command Line
```bash
# From the app/sfpack1703app directory
node test-cloud-functions.js
```

## 📋 Functions Being Tested

### 1. `helloWorld` ✅
- **Purpose**: Basic connectivity test
- **Input**: Simple test data
- **Expected**: Success response with timestamp

### 2. `submitRSVP` ✅
- **Purpose**: Handle event RSVPs
- **Input**: Family info, attendees, dietary needs
- **Expected**: RSVP stored, event capacity updated
- **Rate Limit**: 5 per hour per IP

### 3. `submitFeedback` ✅
- **Purpose**: Handle feedback and questions
- **Input**: Category, rating, title, message
- **Expected**: Feedback stored in submissions
- **Rate Limit**: 3 per hour per IP

### 4. `claimVolunteerRole` ✅
- **Purpose**: Handle volunteer signups
- **Input**: Volunteer info, skills, availability
- **Expected**: Signup stored, role capacity updated
- **Rate Limit**: 2 per hour per IP

### 5. `icsFeed` ✅
- **Purpose**: Generate calendar feeds
- **Input**: Season, categories, den tags, date range
- **Expected**: ICS format calendar data
- **Note**: Requires events in Firestore

### 6. `weatherProxy` ✅
- **Purpose**: Fetch weather data
- **Input**: Latitude, longitude coordinates
- **Expected**: Current and hourly weather data
- **Cache**: 10 minutes

## 🔍 What to Look For

### ✅ Success Indicators
- All functions return success responses
- Data appears in Firestore emulator
- No error messages in console
- Rate limiting works correctly

### ❌ Common Issues
- **Connection Error**: Emulator not running
- **Function Not Found**: Functions not deployed to emulator
- **Validation Error**: Test data format issues
- **Rate Limit Error**: Too many requests too quickly

## 📊 Monitoring & Debugging

### 1. Emulator Console
- **Functions Logs**: Real-time function execution logs
- **Firestore Data**: View stored data and collections
- **Error Details**: Full error stack traces

### 2. Browser Console
- **Network Requests**: See function calls
- **Error Messages**: Client-side error details
- **Response Data**: Function return values

### 3. Test Results Page
- **Function Status**: Success/error for each function
- **Response Data**: Preview of returned data
- **Error Messages**: Clear error descriptions

## 🧪 Testing Scenarios

### Basic Functionality
- [ ] All functions execute without errors
- [ ] Data is properly stored in Firestore
- [ ] Validation works correctly
- [ ] Rate limiting prevents abuse

### Edge Cases
- [ ] Invalid input data handling
- [ ] Missing required fields
- [ ] Rate limit exceeded
- [ ] Network timeouts

### Data Integrity
- [ ] Input sanitization works
- [ ] HTML tags are stripped
- [ ] Length limits enforced
- [ ] Timestamps are accurate

## 🚨 Troubleshooting

### Emulator Won't Start
```bash
# Check if ports are in use
lsof -i :5001
lsof -i :8080

# Kill processes if needed
kill -9 <PID>
```

### Functions Not Found
```bash
# Deploy functions to emulator
firebase deploy --only functions --project demo
```

### Connection Errors
- Verify emulator is running on correct ports
- Check firewall settings
- Ensure no VPN interference

### Validation Errors
- Review test data format
- Check required field requirements
- Verify data types match interfaces

## 📈 Performance Testing

### Load Testing
```bash
# Test rate limiting
for i in {1..10}; do
  node test-cloud-functions.js
  sleep 1
done
```

### Response Times
- Monitor function execution times
- Check for timeouts
- Verify caching works

## 🔒 Security Testing

### Input Validation
- Test with malicious input
- Verify HTML injection prevention
- Check SQL injection protection

### Rate Limiting
- Verify limits are enforced
- Test different IP hashes
- Check window reset behavior

### App Check
- Test without App Check
- Verify authentication requirements
- Check permission enforcement

## 📝 Test Data

### Sample RSVP Data
```json
{
  "eventId": "test-event-001",
  "familyName": "Test Family",
  "email": "test@example.com",
  "attendees": [
    {
      "name": "John Doe",
      "age": 35,
      "den": "Adult",
      "isAdult": true
    }
  ],
  "ipHash": "test-ip-hash-123",
  "userAgent": "Test User Agent"
}
```

### Sample Feedback Data
```json
{
  "category": "general",
  "rating": 5,
  "title": "Great Portal!",
  "message": "This is a test feedback submission.",
  "ipHash": "test-ip-hash-456",
  "userAgent": "Test User Agent"
}
```

## 🎯 Next Steps After Testing

1. **Fix Any Issues** found during testing
2. **Deploy to Production** when all tests pass
3. **Monitor Performance** in production environment
4. **Set Up Alerts** for function failures
5. **Document Known Issues** and workarounds

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review emulator console logs
3. Verify test data format
4. Check Firebase documentation
5. Review function source code

---

**Happy Testing! 🚀**
