# 🔐 User Approval System Documentation

## Overview

The Pack 1703 Portal now includes a comprehensive user approval system that ensures only authorized users can access the application. This system implements a complete workflow from user signup to admin approval, with role-based access control and audit logging.

## 🎯 Key Features

### **Approval Workflow**
- Users sign up and automatically get `status: "pending"`
- Admins review and approve/deny users through a web interface
- Approved users receive custom claims for role-based access
- All actions are logged in an immutable audit trail

### **Security Features**
- **Firestore Security Rules**: Enforce approval-based access control
- **Custom Claims**: Firebase Admin SDK sets approval and role claims
- **Role Hierarchy**: Parent → Leader → Admin → Root
- **Audit Logging**: Complete record of all admin actions
- **Real-time Updates**: Live status updates and notifications

## 📁 File Structure

```
functions/src/userApproval.ts          # Cloud Functions for approval workflow
firestore.rules.approval               # Security rules for approval system
src/services/userApprovalService.ts    # Client-side services
src/services/authServiceWithApproval.ts # Updated auth service
src/components/UserApproval/            # React components
├── UserApprovalComponents.tsx         # Signup, status, admin components
USER_APPROVAL_IMPLEMENTATION_GUIDE.md  # Complete implementation guide
```

## 🚀 Quick Start

### 1. Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### 2. Update Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Integrate Components
```typescript
import { UserSignupForm, UserStatusDisplay, AdminUserManagement } from './components/UserApproval/UserApprovalComponents';
import { authService } from './services/authServiceWithApproval';
```

## 🔧 Usage Examples

### User Signup
```typescript
const result = await authService.signUp('user@example.com', 'password123', 'John Doe');
if (result.success) {
  // User created with pending status
  console.log('Account pending approval');
}
```

### Check User Status
```typescript
if (authService.isApproved()) {
  // User can access app features
  return <MainApp />;
} else if (authService.isPending()) {
  // Show pending approval message
  return <PendingApprovalPage />;
}
```

### Admin Approval
```typescript
const result = await adminService.approveUser('userId', UserRole.PARENT, 'Welcome to Pack 1703!');
if (result.success) {
  // User approved successfully
}
```

## 🗄️ Database Schema

### Users Collection
```typescript
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
```typescript
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

## 🔒 Security Rules

The system enforces access control through Firestore security rules:

- **Only approved users** can access app data
- **Admin-only actions** are gated by role claims
- **Pending/denied users** can only access their own user document
- **Audit logs** are immutable and admin-only readable

## 🎨 UI Components

### UserSignupForm
- Clean signup form with approval messaging
- Email, password, and display name fields
- Success/error feedback

### UserStatusDisplay
- Shows current user's approval status
- Different states: pending, approved, denied
- Role information for approved users

### AdminUserManagement
- Complete admin interface for user approvals
- List of pending users
- Approve/deny actions with role selection
- Reason field for audit trail

## 🔄 Cloud Functions

### onUserCreate
- Triggered when new users sign up
- Creates user document with pending status
- Sets default role as "parent"

### approveUser
- Callable function for admin approval/denial
- Updates user document and sets custom claims
- Creates audit log entry
- Validates admin permissions

### getPendingUsers
- Returns list of users awaiting approval
- Admin-only access
- Real-time updates

### getAuditLogs
- Retrieves admin audit logs
- Admin-only access
- Configurable limit

## 🧪 Testing

### Test User Signup
```typescript
const result = await authService.signUp('test@example.com', 'password123', 'Test User');
expect(result.success).toBe(true);
expect(result.message).toContain('pending approval');
```

### Test Admin Approval
```typescript
const result = await adminService.approveUser('userId', UserRole.PARENT, 'Welcome!');
expect(result.success).toBe(true);
```

### Test Access Control
```typescript
// This should fail for non-approved users
const events = await getDocs(collection(db, 'events'));
```

## 🚨 Troubleshooting

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

## 📈 Performance

- **Real-time Updates**: Live status changes without page refresh
- **Efficient Queries**: Optimized Firestore queries with proper indexing
- **Caching**: Client-side caching of user status and permissions
- **Batch Operations**: Efficient approval of multiple users

## 🔮 Future Enhancements

- **Email Notifications**: Notify users of approval status changes
- **Bulk Approval**: Approve multiple users at once
- **Role Templates**: Predefined role configurations
- **Advanced Analytics**: User approval metrics and trends
- **Integration**: Connect with existing user management systems

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Ready
