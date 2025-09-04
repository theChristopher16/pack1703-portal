# AI Role-Based Authentication Quick Reference

## 🔑 Current AI User
- **User**: Christopher Smith
- **Email**: `christophersmithm16@gmail.com`
- **Role**: `root` (with AI capabilities)
- **AI Permissions**: 8 AI-specific permissions
- **Profile Flag**: `isAI: true`

## 🚀 Quick Start

### 1. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 2. Test AI Authentication
```bash
node test-ai-auth.js
```

### 3. Verify AI Permissions
```bash
node add-ai-role.js list
```

## 📝 Usage Examples

### Frontend Usage
```javascript
import { aiService } from './services/aiAuthService';

// Initialize
await aiService.initialize();

// Check if AI is available
if (aiService.isAvailable()) {
  // Generate content
  const content = await aiService.generateContent(
    'event_description',
    'Create a fun camping event'
  );
  
  // Create event
  const event = await aiService.createEvent({
    title: 'AI Generated Event',
    description: content.result,
    // ... other data
  });
}
```

### Direct Cloud Function Calls
```javascript
import { httpsCallable } from 'firebase/functions';

const aiGenerateContent = httpsCallable(functions, 'aiGenerateContent');

const result = await aiGenerateContent({
  type: 'event_description',
  prompt: 'Create a fun camping event'
});
```

## 🔧 Available AI Functions

| Function | Purpose | Access |
|----------|---------|---------|
| `aiGenerateContent` | Generate content | AI-enabled users, Admin, Root |
| `testAIConnection` | Test AI connectivity | AI-enabled users, Admin, Root |
| `systemCommand` | Execute system commands | AI-enabled users, Root |
| `adminCreateEvent` | Create events | AI-enabled users, Admin, Root |
| `adminUpdateEvent` | Update events | AI-enabled users, Admin, Root |
| `adminDeleteEvent` | Delete events | AI-enabled users, Admin, Root |

## 🛡️ Security Notes

- **Permission-Based**: AI access requires `ai_system_integration` permission
- **Role-Based**: Only users with AI permissions can access AI functions
- **Audit Trail**: All AI actions are logged under your user account
- **Monitoring**: Monitor AI usage for unusual activity

## 🔍 Troubleshooting

### Common Issues
1. **Permission Denied**: Verify your account has `ai_system_integration` permission
2. **Function Not Found**: Deploy updated cloud functions
3. **Authentication Failed**: Check if you're logged in with the correct account
4. **AI Not Available**: Ensure AI service is initialized

### Debug Commands
```bash
# Test AI authentication
node test-ai-auth.js

# List users with AI permissions
node add-ai-role.js list

# Add AI permissions to another user
node add-ai-role.js add user@example.com

# Remove AI permissions from user
node add-ai-role.js remove user@example.com
```

## 📊 Monitoring

### Check AI Usage
```javascript
// In Firebase Console or admin dashboard
// Collection: aiUsage
// Filter by: userId == 'your-user-id'
```

### Check Admin Actions
```javascript
// In Firebase Console or admin dashboard  
// Collection: adminActions
// Filter by: userId == 'your-user-id' AND isAI == true
```

## 🔧 Management Commands

### Add AI Role to User
```bash
node add-ai-role.js add user@example.com
```

### Remove AI Role from User
```bash
node add-ai-role.js remove user@example.com
```

### List Users with AI Role
```bash
node add-ai-role.js list
```

### List All Admin Users
```bash
node list-admin-users.js
```

## 🎯 Key Benefits

1. **No Separate Account**: AI uses your existing admin account
2. **Unified Authentication**: Same login for admin and AI functions
3. **Complete Audit Trail**: All AI actions logged under your account
4. **Easy Management**: Simple commands to add/remove AI permissions
5. **Secure Access**: Only authorized users can access AI functions

---

**The AI authentication system is now ready to use! Your account has AI permissions and can securely interact with all AI endpoints while maintaining proper security and audit trails.**