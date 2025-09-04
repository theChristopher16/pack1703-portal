# AI Authentication System

## Overview

The AI Authentication System provides a secure way for AI assistants to interact with the Pack 1703 application while maintaining proper access control and audit trails. This system allows the AI to perform administrative tasks, generate content, and manage events without requiring traditional user authentication.

## Architecture

### 1. AI Account
- **Email**: `ai-assistant@sfpack1703.com`
- **Role**: `ai-assistant` (highest level access)
- **Permissions**: Full system access with AI-specific permissions
- **Authentication**: Token-based authentication

### 2. Authentication Methods

#### Method 1: Environment Variable Token
The AI can authenticate using a secret token stored in environment variables:
```bash
AI_SECRET_TOKEN=your-secret-token-here
```

#### Method 2: Request Headers
The AI can include authentication headers in requests:
```
x-ai-token: your-secret-token-here
x-ai-request-id: unique-request-id
x-ai-account-id: ai-account-id
```

#### Method 3: Request Body Context
The AI can pass authentication context in the request body:
```javascript
{
  "data": { ... },
  "_aiContext": {
    "token": "your-secret-token-here",
    "requestId": "unique-request-id",
    "accountId": "ai-account-id",
    "email": "ai-assistant@sfpack1703.com"
  }
}
```

## Setup Instructions

### 1. Create AI Account
Run the setup script to create the AI account and generate the secret token:

```bash
node setup-ai-account.js
```

This script will:
- Create a dedicated AI account in Firestore
- Generate a secure secret token
- Create configuration files
- Output environment variables to add to your `.env` file

### 2. Configure Environment Variables
Add the following variables to your `.env` file:

```bash
AI_SECRET_TOKEN=your-generated-secret-token
AI_ACCOUNT_ID=your-generated-account-id
AI_EMAIL=ai-assistant@sfpack1703.com
```

### 3. Deploy Cloud Functions
Deploy the updated cloud functions that include AI authentication:

```bash
firebase deploy --only functions
```

### 4. Test the System
Run the test script to verify everything is working:

```bash
node test-ai-auth.js
```

## Available AI Functions

### Content Generation
- `aiGenerateContent` - Generate various types of content
- `testAIConnection` - Test AI service connectivity

### Event Management
- `adminCreateEvent` - Create new events
- `adminUpdateEvent` - Update existing events
- `adminDeleteEvent` - Delete events

### System Commands
- `systemCommand` - Execute system-level commands

## Security Features

### 1. Token-Based Authentication
- Secure random token generation
- Token validation on every request
- Token rotation capability

### 2. Request Tracking
- Unique request IDs for each AI request
- IP address logging
- User agent tracking

### 3. Audit Trail
- All AI actions logged in `adminActions` collection
- AI usage tracked in `aiUsage` collection
- Detailed metadata for each action

### 4. Permission System
- AI-specific permissions (`ai_*`)
- Role-based access control
- Granular permission checking

## Usage Examples

### Frontend Integration
```javascript
import { aiService } from './services/aiAuthService';

// Initialize AI service
await aiService.initialize();

// Check if AI is available
if (aiService.isAvailable()) {
  // Generate content
  const content = await aiService.generateContent(
    'event_description',
    'Create a fun camping event description'
  );
  
  // Create an event
  const event = await aiService.createEvent({
    title: 'AI Generated Event',
    description: content.result,
    // ... other event data
  });
}
```

### Direct Cloud Function Calls
```javascript
import { httpsCallable } from 'firebase/functions';

const aiGenerateContent = httpsCallable(functions, 'aiGenerateContent');

const result = await aiGenerateContent({
  type: 'event_description',
  prompt: 'Create a fun camping event',
  _aiContext: {
    token: 'your-secret-token',
    requestId: crypto.randomUUID(),
    accountId: 'ai-account-id',
    email: 'ai-assistant@sfpack1703.com'
  }
});
```

## Monitoring and Analytics

### AI Usage Dashboard
Monitor AI usage in the admin dashboard:
- Total AI requests
- Content generation statistics
- System command usage
- Error rates and performance

### Audit Logs
All AI actions are logged with:
- Timestamp
- User ID (ai-assistant)
- Action type
- Entity affected
- Success/failure status
- IP address and user agent

## Troubleshooting

### Common Issues

1. **AI Account Not Found**
   - Run `node setup-ai-account.js` to create the account
   - Check if the account exists in Firestore

2. **Authentication Failed**
   - Verify the `AI_SECRET_TOKEN` environment variable
   - Check that the token matches the one in the AI account
   - Ensure the cloud functions are deployed

3. **Permission Denied**
   - Verify the AI account has the correct role (`ai-assistant`)
   - Check that all required permissions are present
   - Ensure the account is active

4. **Function Not Found**
   - Deploy the updated cloud functions
   - Check function names and parameters
   - Verify the function is exported correctly

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_AI_AUTH=true
```

This will log detailed authentication information to help troubleshoot issues.

## Best Practices

1. **Token Security**
   - Keep the AI secret token secure
   - Rotate tokens regularly
   - Never commit tokens to version control

2. **Request Limits**
   - Implement rate limiting for AI requests
   - Monitor usage to prevent abuse
   - Set appropriate quotas

3. **Error Handling**
   - Always handle authentication errors gracefully
   - Log failed attempts for security monitoring
   - Provide meaningful error messages

4. **Monitoring**
   - Monitor AI usage patterns
   - Set up alerts for unusual activity
   - Regular security audits

## Future Enhancements

1. **Multi-AI Support**
   - Support for multiple AI assistants
   - Different permission levels for different AIs
   - AI-specific configurations

2. **Advanced Security**
   - IP whitelisting
   - Time-based token expiration
   - Multi-factor authentication for AI

3. **Performance Optimization**
   - Request caching
   - Batch processing
   - Async processing for long-running tasks

## Support

For issues with the AI authentication system:
1. Check the troubleshooting section above
2. Review the logs in Firebase Console
3. Run the test script to verify configuration
4. Contact the system administrator

---

*This system ensures that AI assistants can securely and efficiently interact with the Pack 1703 application while maintaining proper security, audit trails, and access control.*