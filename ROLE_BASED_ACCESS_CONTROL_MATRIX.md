# Role-Based Access Control Matrix

## Overview

This document provides a comprehensive overview of role-based access control (RBAC) for the Pack 1703 Portal system. It details what each user role can and cannot access across all API endpoints and data collections.

## User Roles

### 1. **Parent** (`parent`)
- **Description**: Default role for family accounts
- **Access Level**: Basic user access
- **Permissions**: Family management, RSVP, chat, basic content access

### 2. **Volunteer** (`volunteer`) 
- **Description**: Den leaders and active volunteers
- **Access Level**: Den-level management
- **Permissions**: All parent permissions + den-specific management

### 3. **Admin** (`admin`)
- **Description**: Pack administrators
- **Access Level**: Pack-level management
- **Permissions**: All volunteer permissions + pack management, event management, user management

### 4. **Super Admin** (`super_admin`)
- **Description**: Highest level administrators
- **Access Level**: System-wide access
- **Permissions**: All admin permissions + system configuration, root-level functions

### 5. **Root** (`root`)
- **Description**: System root users
- **Access Level**: Complete system access
- **Permissions**: All permissions including system-level functions

## Cloud Functions Access Matrix

| Function | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|----------|--------|-----------|-------|-------------|------|--------------|
| `disableAppCheckEnforcement` | ❌ | ❌ | ❌ | ✅ | ✅ | Root Only |
| `updateUserRole` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `adminUpdateEvent` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `adminDeleteEvent` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `adminCreateEvent` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `submitRSVP` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `deleteRSVP` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `getRSVPCount` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `getBatchRSVPCounts` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `getRSVPData` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `adminUpdateUser` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `updateUserClaims` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `getChatChannels` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `getChatMessages` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `sendChatMessage` | ✅ | ✅ | ✅ | ✅ | ✅ | Authenticated |
| `testEmailConnection` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `submitAccountRequest` | ✅ | ✅ | ✅ | ✅ | ✅ | Public |
| `getPendingAccountRequests` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `approveAccountRequest` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `createUserManually` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `rejectAccountRequest` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `testAIConnection` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `getSystemMetrics` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `generateThreatIntelligence` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `getBatchDashboardData` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `adminDeleteUser` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `helloWorld` | ✅ | ✅ | ✅ | ✅ | ✅ | Public |
| `createTestAnnouncement` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |
| `sendAnnouncementEmails` | ❌ | ❌ | ✅ | ✅ | ✅ | Admin+ |

## Firestore Collections Access Matrix

### User Data Collections

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `users/{userId}` (own) | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Owner |
| `users/{userId}` (others) | ❌ | ❌ | ✅ Read | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `users` (aggregation) | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |

### Event Management

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `events/{eventId}` | ✅ Read | ✅ Read | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Public Read, Admin Write |
| `events` (aggregation) | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ✅ Read | Authenticated |

### RSVP System

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `rsvps/{rsvpId}` (own) | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Owner |
| `rsvps/{rsvpId}` (others) | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |
| `rsvps` (aggregation) | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |

### Chat System

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `chat-channels/{channelId}` | ✅ Read | ✅ Read | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Authenticated Read, Admin Write |
| `chat-messages/{messageId}` | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Authenticated |
| `chat-users/{userId}` (own) | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Owner |
| `chat-users/{userId}` (others) | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |

### Announcements

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `announcements/{announcementId}` | ✅ Read* | ✅ Read* | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Den-based Read, Admin Write |
| `announcements` (aggregation) | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |

*Read access based on den targeting

### Admin-Only Collections

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `adminActions` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `auditLogs` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `systemMetrics` | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |
| `securityAlerts` | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |
| `aiUsage` | ❌ | ❌ | ✅ Read | ✅ Read | ✅ Read | Admin+ |
| `accountRequests` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |

### Financial Management (Admin Only)

| Collection | Parent | Volunteer | Admin | Super Admin | Root | Access Level |
|------------|--------|-----------|-------|-------------|------|--------------|
| `financial-transactions` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `financial-accounts` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `budget-categories` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `financial-reports` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `cost-tracking` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |
| `cost-alerts` | ❌ | ❌ | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | Admin+ |

## Permission Logic

### Role Hierarchy
1. **Root** - Highest level, complete system access
2. **Super Admin** - System-wide management, all admin functions
3. **Admin** - Pack-level management, user management, event management
4. **Volunteer** - Den-level management, content creation
5. **Parent** - Basic user access, family management

### Permission Checks
The system uses a three-tier permission check:

1. **Role-based**: Check if user has admin role (`root`, `admin`, `super-admin`, `super_admin`, `leader`)
2. **Legacy flags**: Check legacy boolean fields (`isAdmin`, `isDenLeader`, `isCubmaster`)
3. **Specific permissions**: Check for specific permission strings (e.g., `event_management`, `user_management`)

### Access Grant Logic
```typescript
const hasAccess = hasAdminRole || hasLegacyPermissions || hasSpecificPermission;
```

## Current User Status

### Admin Users (3)
- **Jocelyn Bacon** (jocieh@gmail.com) - `admin` role, full permissions
- **Gina Messa** (gina_daigle@yahoo.com) - `admin` role, full permissions  
- **Christopher Smith** (christophersmithm16@gmail.com) - `super_admin` role, full permissions

### Parent Users (3)
- **Alison Meyer** (alisonwmeyer@gmail.com) - `parent` role, basic permissions
- **Christopher Smith** (christopher@smithstation.io) - `parent` role, basic permissions
- **Eric Bucknam** (ebucknam06@gmail.com) - `parent` role, basic permissions

## Security Considerations

### 1. **Authentication Required**
- All API endpoints require valid Firebase authentication
- Unauthenticated users have no access to protected resources

### 2. **Role Validation**
- Roles are validated both in Cloud Functions and Firestore rules
- Legacy permission flags provide backward compatibility

### 3. **Data Isolation**
- Users can only access their own personal data
- Admin users can access aggregated data for management purposes
- Den-based access controls for announcements and content

### 4. **Audit Trail**
- All admin actions are logged in `adminActions` collection
- Security events are tracked in `securityAlerts` collection
- User activity is monitored through `usageTracking` collection

## Recent Fixes Applied

### 1. **Super Admin Role Recognition**
- **Issue**: `super_admin` role was not recognized in Cloud Functions
- **Fix**: Updated role checks to include both `super-admin` and `super_admin`
- **Impact**: Christopher (super_admin) now has proper access to all admin functions

### 2. **Legacy Permission Flags**
- **Issue**: Jocelyn and Gina had admin roles but missing legacy flags
- **Fix**: Added `isAdmin`, `isDenLeader`, `isCubmaster` flags to their user records
- **Impact**: Both admins can now create events and access admin functions

### 3. **Permission Consistency**
- **Issue**: Inconsistent permission checks across Cloud Functions
- **Fix**: Standardized permission logic across all functions
- **Impact**: Consistent access control behavior across the system

## Recommendations

### 1. **Role Standardization**
- Consider standardizing on either `super-admin` or `super_admin` format
- Update all role references to use consistent naming

### 2. **Permission Migration**
- Gradually migrate from legacy boolean flags to permission strings
- Update `updateUserRole` function to set legacy flags automatically

### 3. **Access Monitoring**
- Implement regular access audits
- Monitor for unauthorized access attempts
- Review permission changes in admin logs

### 4. **Documentation Updates**
- Keep this matrix updated as new functions are added
- Document any changes to permission logic
- Provide clear guidance for developers on access control

---

*Last Updated: January 2025*
*Version: 1.0*
