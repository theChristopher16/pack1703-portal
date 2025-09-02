# AI Service Architecture - Admin and User Separation

This document describes the new AI service architecture that separates admin and user LLMs to ensure proper access control and security.

## Overview

The AI service has been refactored to use a factory pattern that routes requests to the appropriate service based on user role:

- **UserAIService**: Limited functionality for regular users (read-only access)
- **AdminAIService**: Full functionality including all administrative operations
- **AIServiceFactory**: Factory that determines which service to use based on user role

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AIService     │───▶│ AIServiceFactory │───▶│  UserAIService   │
│   (Facade)      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ AdminAIService   │
                       │                 │
                       └─────────────────┘
```

## Service Capabilities

### UserAIService
- **Access Level**: Limited (read-only)
- **Capabilities**:
  - View system status (limited)
  - View content (events, announcements, locations)
  - View limited analytics
  - View limited user activity
  - View limited cost information
  - View limited security status
  - View limited configuration
  - View limited chat system data
- **Restrictions**:
  - Cannot create or modify content
  - Cannot access detailed system metrics
  - Cannot perform administrative tasks
  - Cannot access sensitive data

### AdminAIService
- **Access Level**: Full administrative access
- **Capabilities**:
  - All user capabilities plus:
  - Create, edit, and delete events
  - Create, edit, and delete announcements
  - Create, edit, and delete locations
  - Create, edit, and delete resources
  - Full system monitoring and health checks
  - Detailed cost analysis and optimization
  - Comprehensive user activity tracking
  - Full security monitoring and management
  - Complete configuration management
  - Advanced analytics and reporting
  - Bulk operations and data management
  - Export and import data
  - System optimization recommendations

## User Role Determination

User roles are determined based on the user's den:

### Admin Roles
- `pack-leader`
- `cubmaster`
- `lion`
- `tiger`
- `wolf`
- `bear`
- `webelos`
- `arrow-of-light`

### User Roles
- All other den values (e.g., `parent`, `scout`, etc.)
- Users without a den are treated as regular users

## Usage

### Basic Usage (Backward Compatible)
```typescript
import aiService from './services/aiService';

// The service automatically routes to the appropriate implementation
const response = await aiService.processQuery(userQuery, context);
```

### Advanced Usage (Direct Factory Access)
```typescript
import aiServiceFactory from './services/aiServiceFactory';

// Get the appropriate service based on user role
const service = aiServiceFactory.getAIService(userRole);

// Process query with the specific service
const response = await service.processQuery(userQuery, context);
```

### Chat Integration
```typescript
// Process chat mentions with automatic role detection
await aiServiceFactory.processChatMention(
  message, 
  channelId, 
  userId, 
  userName, 
  userDen
);
```

## Security Benefits

1. **Access Control**: Users cannot access admin functions even if they try to manipulate the frontend
2. **Data Protection**: Sensitive system data is not exposed to regular users
3. **Audit Trail**: All interactions are logged with the service type used
4. **Role-Based Responses**: Different responses and capabilities based on user role
5. **Fail-Safe**: Unknown roles default to user service for safety

## Migration Notes

### Breaking Changes
- None - the main `aiService` export maintains backward compatibility
- All existing code will continue to work without changes

### New Features
- Automatic role-based service selection
- Enhanced security through service separation
- Better audit logging with service type identification
- Improved error handling and fallback mechanisms

### Testing
- New tests verify service separation works correctly
- Role determination logic is tested
- Service capabilities are validated

## File Structure

```
src/services/
├── aiService.ts              # Main facade (backward compatible)
├── aiServiceFactory.ts       # Factory for service selection
├── userAIService.ts          # User service (limited access)
├── adminAIService.ts         # Admin service (full access)
└── __tests__/
    └── aiServiceSeparation.test.ts  # Tests for new architecture
```

## Monitoring and Logging

All AI interactions are logged with additional metadata:

```typescript
{
  userQuery: string,
  response: string,
  responseType: 'info' | 'warning' | 'error' | 'success',
  timestamp: Timestamp,
  userRole: 'admin' | 'user',
  currentPage: string,
  availableData: object,
  requiresConfirmation: boolean,
  confirmationData: object,
  serviceType: 'user' | 'admin'  // NEW: identifies which service was used
}
```

## Future Enhancements

1. **Fine-Grained Permissions**: More granular permission levels beyond just admin/user
2. **Service-Specific Features**: Additional capabilities for each service type
3. **Performance Optimization**: Service-specific caching and optimization
4. **Analytics**: Detailed analytics on service usage patterns
5. **Configuration**: Runtime configuration of service capabilities