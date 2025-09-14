# User Approval System Implementation Guide

This guide shows how to implement and use the user approval gating system for your Cub Scout Firebase app.

## Overview

The system implements a complete user approval workflow where:
1. Users sign up and get Firebase Auth accounts
2. Firestore documents are created with `status: "pending"`
3. Admins approve/deny users through a web interface
4. Custom claims are set for approved users
5. Security rules enforce access based on approval status

## Files Created

### 1. Cloud Functions (`functions/src/userApproval.ts`)
- `onUserCreate`: Triggered when new users sign up
- `approveUser`: Callable function for admin approval/denial
- `getPendingUsers`: Get list of pending users
- `getAuditLogs`: Get admin audit logs

### 2. Firestore Rules (`firestore.rules.approval`)
- Enforces access based on custom claims
- Only approved users can access app data
- Admin-only actions gated by role claims

### 3. Client Services (`src/services/userApprovalService.ts`)
- `UserApprovalService`: Handles user authentication and status
- `AdminService`: Manages user approvals and audit logs

### 4. React Components (`src/components/UserApproval/UserApprovalComponents.tsx`)
- `UserSignupForm`: User registration form
- `UserStatusDisplay`: Shows current user's approval status
- `AdminUserManagement`: Admin interface for user approvals

### 5. Updated Auth Service (`src/services/authServiceWithApproval.ts`)
- Integrates approval system with existing auth
- Maintains compatibility with existing features

## Setup Instructions

### 1. Deploy Cloud Functions

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions
```

### 2. Update Firestore Rules

```bash
# Deploy new rules
firebase deploy --only firestore:rules
```

### 3. Update Client Code

Replace your existing auth service with the new one:

```typescript
// In your main App.tsx or index.tsx
import { authService } from './services/authServiceWithApproval';

// Use the service
const user = authService.getCurrentUser();
const userDoc = authService.getCurrentUserDoc();
const isApproved = authService.isApproved();
```

## Usage Examples

### 1. User Signup Flow

```typescript
import { UserSignupForm } from './components/UserApproval/UserApprovalComponents';

function SignupPage() {
  return (
    <div>
      <h1>Join Pack 1703</h1>
      <UserSignupForm />
    </div>
  );
}
```

### 2. Check User Status

```typescript
import { authService } from './services/authServiceWithApproval';

function App() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user, userDoc) => {
      setUser(user);
      setUserDoc(userDoc);
    });

    return unsubscribe;
  }, []);

  if (!user) {
    return <SignupPage />;
  }

  if (userDoc?.status === 'pending') {
    return <PendingApprovalPage />;
  }

  if (userDoc?.status === 'denied') {
    return <AccountDeniedPage />;
  }

  if (userDoc?.status === 'approved') {
    return <MainApp />;
  }

  return <LoadingPage />;
}
```

### 3. Admin User Management

```typescript
import { AdminUserManagement } from './components/UserApproval/UserApprovalComponents';

function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <AdminUserManagement />
    </div>
  );
}
```

### 4. Protected Routes

```typescript
import { authService } from './services/authServiceWithApproval';

function ProtectedRoute({ children }) {
  if (!authService.isAuthenticatedAndApproved()) {
    return <AccessDeniedPage />;
  }

  return children;
}

// Usage
<ProtectedRoute>
  <EventsPage />
</ProtectedRoute>
```

### 5. Role-Based Access

```typescript
import { authService, UserRole } from './services/authServiceWithApproval';

function AdminOnlyComponent() {
  if (!authService.hasRole(UserRole.ADMIN)) {
    return <AccessDeniedPage />;
  }

  return <AdminContent />;
}

function LeaderOrAboveComponent() {
  if (!authService.hasRole(UserRole.LEADER)) {
    return <AccessDeniedPage />;
  }

  return <LeaderContent />;
}
```

## Security Rules Explanation

The Firestore rules enforce:

1. **User Documents**: Users can only read/update their own documents
2. **Admin Access**: Only admins can read all user documents
3. **Approved Users**: Only approved users can access app data
4. **Role-Based Access**: Different roles have different permissions
5. **Audit Logs**: Only admins can read audit logs, immutable records

## Custom Claims

The system sets custom claims for approved users:
- `approved: true` - User is approved
- `role: "parent" | "leader" | "admin"` - User's role

## Database Structure

### Users Collection
```
users/{uid} {
  email: string,
  displayName: string,
  status: "pending" | "approved" | "denied",
  role: "parent" | "leader" | "admin",
  createdAt: timestamp,
  approvedAt: timestamp | null,
  approvedBy: string | null
}
```

### Admin Audit Logs Collection
```
adminAuditLogs/{autoId} {
  action: "approve" | "deny",
  targetUserId: string,
  targetUserEmail: string,
  adminUserId: string,
  adminEmail: string,
  role?: string,
  timestamp: timestamp,
  reason?: string
}
```

## Testing

### 1. Test User Signup
```typescript
const result = await authService.signUp('test@example.com', 'password123', 'Test User');
console.log(result); // { success: true, message: 'Account created successfully!...' }
```

### 2. Test Admin Approval
```typescript
const result = await adminService.approveUser('userId', UserRole.PARENT, 'Welcome to Pack 1703!');
console.log(result); // { success: true, message: 'User approved successfully' }
```

### 3. Test Access Control
```typescript
// This should fail for non-approved users
const events = await getDocs(collection(db, 'events'));
```

## Troubleshooting

### Common Issues

1. **Custom Claims Not Working**
   - Ensure Firebase Admin SDK is properly configured
   - Check that Cloud Functions have admin privileges
   - Verify custom claims are set after approval

2. **Security Rules Not Enforcing**
   - Check that rules are deployed correctly
   - Verify custom claims are being read properly
   - Test rules in Firebase Console

3. **User Document Not Created**
   - Ensure Cloud Function is deployed
   - Check function logs for errors
   - Verify Firestore permissions

### Debugging

```typescript
// Check user's custom claims
const user = authService.getCurrentUser();
if (user) {
  const idToken = await user.getIdTokenResult();
  console.log('Custom claims:', idToken.claims);
}

// Check user document
const userDoc = await authService.getUserDocument(user.uid);
console.log('User document:', userDoc);
```

## Migration from Existing System

If you have an existing auth system:

1. **Backup existing user data**
2. **Update user documents** with new approval fields
3. **Set custom claims** for existing approved users
4. **Update client code** to use new auth service
5. **Test thoroughly** before deploying

## Best Practices

1. **Always check approval status** before allowing access
2. **Use role-based access control** for different features
3. **Log all admin actions** for audit purposes
4. **Handle edge cases** like denied users trying to access
5. **Provide clear feedback** to users about their status
6. **Regular security audits** of user permissions

## Next Steps

1. **Deploy the system** following setup instructions
2. **Test with real users** to ensure everything works
3. **Customize the UI** to match your app's design
4. **Add email notifications** for approval status changes
5. **Implement additional features** like bulk approval
6. **Add analytics** to track approval metrics
