# AI Authentication Quick Reference

## 🔑 Current AI Account
- **Email**: `ai-assistant@sfpack1703.com`
- **Account ID**: `A2h5xPN30P28hGyPEKXn`
- **Secret Token**: `54fbb4f56ae67850454e2f7c358aaf16798e92f0905c09462a3dd66e88535a00`

## 🚀 Quick Start

### 1. Add Environment Variables
Add to your `.env` file:
```bash
AI_SECRET_TOKEN=54fbb4f56ae67850454e2f7c358aaf16798e92f0905c09462a3dd66e88535a00
AI_ACCOUNT_ID=A2h5xPN30P28hGyPEKXn
AI_EMAIL=ai-assistant@sfpack1703.com
```

### 2. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 3. Test AI Authentication
```bash
node test-ai-auth.js
```

## 📝 Usage Examples

### Frontend Usage
```javascript
import { aiService } from './services/aiAuthService';

// Initialize
await aiService.initialize();

// Check availability
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
  prompt: 'Create a fun camping event',
  _aiContext: {
    token: '54fbb4f56ae67850454e2f7c358aaf16798e92f0905c09462a3dd66e88535a00',
    requestId: crypto.randomUUID(),
    accountId: 'A2h5xPN30P28hGyPEKXn',
    email: 'ai-assistant@sfpack1703.com'
  }
});
```

## 🔧 Available AI Functions

| Function | Purpose | Access |
|----------|---------|---------|
| `aiGenerateContent` | Generate content | AI, Admin, Root |
| `testAIConnection` | Test AI connectivity | AI, Admin, Root |
| `systemCommand` | Execute system commands | AI, Root |
| `adminCreateEvent` | Create events | AI, Admin, Root |
| `adminUpdateEvent` | Update events | AI, Admin, Root |
| `adminDeleteEvent` | Delete events | AI, Admin, Root |

## 🛡️ Security Notes

- **Token Security**: Keep the secret token secure and never commit it to version control
- **Access Control**: Only AI, admins, and root users can access AI functions
- **Audit Trail**: All AI actions are logged in `adminActions` and `aiUsage` collections
- **Monitoring**: Monitor AI usage for unusual activity

## 🔍 Troubleshooting

### Common Issues
1. **Authentication Failed**: Check `AI_SECRET_TOKEN` environment variable
2. **Permission Denied**: Verify AI account role is `ai-assistant`
3. **Function Not Found**: Deploy updated cloud functions
4. **Token Invalid**: Regenerate token with `node setup-ai-account.js`

### Debug Commands
```bash
# Test AI authentication
node test-ai-auth.js

# Check AI account
node -e "
const admin = require('firebase-admin');
admin.initializeApp({credential: admin.credential.cert(require('./service-account-key.json'))});
admin.firestore().collection('users').where('role', '==', 'ai-assistant').get().then(snap => {
  if (!snap.empty) {
    const ai = snap.docs[0];
    console.log('AI Account:', ai.data());
  } else {
    console.log('No AI account found');
  }
});
"
```

## 📊 Monitoring

### Check AI Usage
```javascript
// In Firebase Console or admin dashboard
// Collection: aiUsage
// Filter by: userId == 'ai-assistant'
```

### Check Admin Actions
```javascript
// In Firebase Console or admin dashboard  
// Collection: adminActions
// Filter by: userId == 'ai-assistant'
```

---

**The AI authentication system is now ready to use! The AI can securely interact with all endpoints while maintaining proper security and audit trails.**