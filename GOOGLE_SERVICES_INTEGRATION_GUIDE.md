# Google Services Integration Guide for Pack1703 Portal

This guide will help you set up proper Google services integration for user management, authentication, and data handling in your Pack1703 portal.

## Overview

We're implementing a comprehensive user management system with:
- **Role-Based Access Control (RBAC)** with intuitive roles: Root, Admin, Den Leader, Parent, Scout, Guest
- **Social Login Integration** with Google, Apple, and other providers
- **Enhanced User Profiles** with scouting information, family data, and preferences
- **Secure Username Management** with validation and uniqueness checks
- **Human-Only Role Management** (AI cannot modify permissions)

## 1. Google Cloud Platform Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `pack1703-portal`
4. Click "Create"

### Step 2: Enable Required APIs
```bash
# Enable these APIs in your Google Cloud Console:
- Google Identity and Access Management (IAM) API
- Google Cloud Identity API
- Google Admin SDK API
- Google People API
- Google Drive API (for file storage)
- Google Calendar API (for event integration)
```

### Step 3: Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `pack1703-portal-service`
4. Description: "Service account for Pack1703 portal backend operations"
5. Click "Create and Continue"
6. Grant these roles:
   - **Cloud Datastore User**
   - **Firebase Admin**
   - **Identity and Access Management (IAM) Admin**
   - **Service Account User**
7. Click "Done"
8. Create and download the JSON key file

## 2. Firebase Configuration

### Step 1: Enable Authentication Providers
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Authentication" → "Sign-in method"
4. Enable these providers:

#### Google Sign-In
- Enable Google sign-in
- Add authorized domains: `sfpack1703.com`, `pack-1703-portal.firebaseapp.com`
- Configure OAuth consent screen
- Add scopes: `email`, `profile`, `openid`

#### Apple Sign-In
- Enable Apple sign-in
- Add your Apple Developer Team ID
- Configure Service ID: `com.sfpack1703.portal.applesignin`
- Add return URL: `https://sfpack1703.com/__/auth/handler`

### Step 2: Configure Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId || 
        hasRole(['root', 'admin']) ||
        (hasRole(['den_leader']) && resource.data.profile.den == getCurrentUserDen())
      );
      allow write: if request.auth != null && (
        request.auth.uid == userId || 
        hasRole(['root', 'admin']) ||
        (hasRole(['den_leader']) && resource.data.profile.den == getCurrentUserDen())
      );
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && hasRole(['root', 'admin', 'den_leader']);
    }
    
    // Helper functions
    function hasRole(roles) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in roles;
    }
    
    function getCurrentUserDen() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.profile.den;
    }
  }
}
```

## 3. Environment Variables Setup

### Step 1: Google Cloud Environment Variables
Add these to your Firebase Functions environment:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=pack1703-portal
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Google APIs
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# Firebase Configuration
FIREBASE_PROJECT_ID=pack-1703-portal
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
```

### Step 2: Set Environment Variables
```bash
# Using Firebase CLI
firebase functions:config:set google.cloud_project="pack1703-portal"
firebase functions:config:set google.api_key="your_google_api_key"
firebase functions:config:set google.cse_id="your_custom_search_engine_id"
firebase functions:config:set security.jwt_secret="your_jwt_secret"
```

## 4. Google Services Integration

### Step 1: Google People API Integration
```typescript
// src/services/googlePeopleService.ts
import { google } from 'googleapis';

export class GooglePeopleService {
  private people = google.people('v1');
  
  async getUserProfile(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const response = await this.people.people.get({
      auth,
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos,phoneNumbers,addresses'
    });
    
    return response.data;
  }
  
  async updateUserProfile(accessToken: string, profileData: any) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const response = await this.people.people.updateContact({
      auth,
      resourceName: 'people/me',
      requestBody: profileData
    });
    
    return response.data;
  }
}
```

### Step 2: Google Admin SDK Integration
```typescript
// src/services/googleAdminService.ts
import { google } from 'googleapis';

export class GoogleAdminService {
  private admin = google.admin('directory_v1');
  
  async createUser(userData: any) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user']
    });
    
    const response = await this.admin.users.insert({
      auth,
      requestBody: userData
    });
    
    return response.data;
  }
  
  async updateUser(userId: string, userData: any) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user']
    });
    
    const response = await this.admin.users.update({
      auth,
      userId,
      requestBody: userData
    });
    
    return response.data;
  }
}
```

## 5. Enhanced User Management Features

### Step 1: Social Login Data Extraction
```typescript
// Enhanced social login data extraction
private extractSocialLoginData(firebaseUser: FirebaseUser) {
  const socialData: any = {};
  
  // Extract Google data with enhanced profile
  if (firebaseUser.providerData.some(provider => provider.providerId === 'google.com')) {
    const googleProvider = firebaseUser.providerData.find(provider => provider.providerId === 'google.com');
    if (googleProvider) {
      socialData.google = {
        id: googleProvider.uid,
        email: googleProvider.email,
        name: googleProvider.displayName,
        picture: googleProvider.photoURL,
        locale: (googleProvider as any).locale,
        verifiedEmail: (googleProvider as any).verifiedEmail,
        // Additional Google profile data
        givenName: (googleProvider as any).givenName,
        familyName: (googleProvider as any).familyName,
        hd: (googleProvider as any).hd // hosted domain
      };
    }
  }
  
  return socialData;
}
```

### Step 2: Username Validation and Management
```typescript
// Secure username validation
async validateUsername(username: string): Promise<{ isValid: boolean; error?: string }> {
  // Length check
  if (username.length < 3 || username.length > 20) {
    return { isValid: false, error: 'Username must be between 3 and 20 characters' };
  }
  
  // Character validation
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  // Reserved words check
  const reservedWords = ['admin', 'root', 'system', 'user', 'test', 'demo', 'guest', 'pack1703'];
  if (reservedWords.includes(username.toLowerCase())) {
    return { isValid: false, error: 'Username is reserved and cannot be used' };
  }
  
  // Uniqueness check
  const usernameQuery = query(
    collection(db, 'users'),
    where('profile.username', '==', username)
  );
  
  const usernameSnapshot = await getDocs(usernameQuery);
  
  if (!usernameSnapshot.empty) {
    return { isValid: false, error: 'Username is already taken' };
  }
  
  return { isValid: true };
}
```

## 6. Role-Based Access Control (RBAC)

### Step 1: Role Definitions
```typescript
// Simplified and intuitive roles
export enum UserRole {
  ROOT = 'root',           // You - Full system control
  ADMIN = 'admin',         // Pack leadership - Full pack management
  DEN_LEADER = 'den_leader', // Den leaders - Den-specific management
  PARENT = 'parent',       // Parents - Family management
  SCOUT = 'scout',         // Scouts - Basic access
  GUEST = 'guest'          // Visitors - Limited access
}
```

### Step 2: Permission System
```typescript
// Comprehensive permission system
export enum Permission {
  // Root permissions (full system access)
  SYSTEM_ADMIN = 'system_admin',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  SYSTEM_CONFIG = 'system_config',
  
  // Admin permissions (pack-level management)
  PACK_MANAGEMENT = 'pack_management',
  EVENT_MANAGEMENT = 'event_management',
  LOCATION_MANAGEMENT = 'location_management',
  ANNOUNCEMENT_MANAGEMENT = 'announcement_management',
  FINANCIAL_MANAGEMENT = 'financial_management',
  FUNDRAISING_MANAGEMENT = 'fundraising_management',
  ALL_DEN_ACCESS = 'all_den_access',
  
  // Den leader permissions (den-specific)
  DEN_CONTENT = 'den_content',
  DEN_EVENTS = 'den_events',
  DEN_MEMBERS = 'den_members',
  DEN_CHAT_MANAGEMENT = 'den_chat_management',
  DEN_ANNOUNCEMENTS = 'den_announcements',
  
  // Parent permissions (family management)
  FAMILY_MANAGEMENT = 'family_management',
  FAMILY_EVENTS = 'family_events',
  FAMILY_RSVP = 'family_rsvp',
  FAMILY_VOLUNTEER = 'family_volunteer',
  
  // Scout permissions (basic access)
  SCOUT_CONTENT = 'scout_content',
  SCOUT_EVENTS = 'scout_events',
  SCOUT_CHAT = 'scout_chat',
  
  // Chat permissions
  CHAT_READ = 'chat_read',
  CHAT_WRITE = 'chat_write',
  CHAT_MANAGEMENT = 'chat_management',
  
  // General permissions
  READ_CONTENT = 'read_content',
  CREATE_CONTENT = 'create_content',
  UPDATE_CONTENT = 'update_content',
  DELETE_CONTENT = 'delete_content'
}
```

## 7. Security Considerations

### Step 1: AI Restriction on Role Management
```typescript
// Ensure AI cannot modify user roles or permissions
export class AIService {
  // AI is explicitly forbidden from role management
  private forbiddenOperations = [
    'updateUserRole',
    'updateUserPermissions',
    'createUserWithRole',
    'deleteUser',
    'bulkUpdateUsers'
  ];
  
  async processUserRequest(request: string) {
    // Check if request involves role management
    const roleManagementKeywords = ['role', 'permission', 'admin', 'root', 'den leader'];
    const hasRoleManagement = roleManagementKeywords.some(keyword => 
      request.toLowerCase().includes(keyword)
    );
    
    if (hasRoleManagement) {
      throw new Error('AI cannot modify user roles or permissions. This must be done by a human administrator.');
    }
    
    // Process other requests normally
    return this.processRequest(request);
  }
}
```

### Step 2: Audit Logging
```typescript
// Comprehensive audit logging
export class AuditService {
  async logUserAction(action: string, userId: string, details: any) {
    const auditEntry = {
      timestamp: serverTimestamp(),
      action,
      userId,
      performedBy: getCurrentUser()?.uid,
      details,
      ipAddress: getClientIP(),
      userAgent: getClientUserAgent()
    };
    
    await addDoc(collection(db, 'audit_logs'), auditEntry);
  }
}
```

## 8. Deployment and Testing

### Step 1: Deploy Firebase Functions
```bash
# Deploy with environment variables
firebase deploy --only functions

# Verify deployment
firebase functions:config:get
```

### Step 2: Test Social Login Integration
```bash
# Test Google Sign-In
1. Go to your app
2. Click "Sign in with Google"
3. Verify profile data is extracted correctly
4. Check that user is created with proper role

# Test Apple Sign-In
1. Click "Sign in with Apple"
2. Verify Apple profile data extraction
3. Check user creation and role assignment
```

### Step 3: Test Role Management
```bash
# Test admin role assignment
1. Login as root user
2. Go to User Management
3. Create a new admin user
4. Verify permissions are assigned correctly

# Test den leader permissions
1. Login as den leader
2. Verify can only manage users in their den
3. Test event creation for their den
4. Verify cannot access other dens
```

## 9. Monitoring and Maintenance

### Step 1: Set up Google Cloud Monitoring
```bash
# Enable monitoring APIs
- Cloud Monitoring API
- Cloud Logging API
- Error Reporting API

# Set up alerts for:
- Failed authentication attempts
- Role modification events
- User creation/deletion
- API quota usage
```

### Step 2: Regular Security Audits
```bash
# Monthly security checklist:
1. Review user roles and permissions
2. Check for unauthorized access attempts
3. Verify AI restrictions are working
4. Review audit logs for suspicious activity
5. Update security rules as needed
```

## 10. Best Practices

### Security Best Practices
1. **Never store sensitive data in client-side code**
2. **Always validate user permissions server-side**
3. **Use HTTPS for all communications**
4. **Implement rate limiting for authentication**
5. **Regular security updates and patches**
6. **Monitor for suspicious activity**

### User Experience Best Practices
1. **Clear role descriptions and permissions**
2. **Intuitive navigation based on user role**
3. **Helpful error messages for permission issues**
4. **Smooth social login experience**
5. **Profile completion guidance**
6. **Mobile-responsive design**

### Development Best Practices
1. **Comprehensive testing for all role combinations**
2. **Documentation for all API endpoints**
3. **Version control for all configuration changes**
4. **Backup and recovery procedures**
5. **Performance monitoring and optimization**

This comprehensive setup ensures your Pack1703 portal has enterprise-grade user management with proper Google services integration, secure role-based access control, and protection against unauthorized AI modifications.
