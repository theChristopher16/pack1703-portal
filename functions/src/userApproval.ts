import { onCall } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// User roles enum - Updated to match AuthService
export enum UserRole {
  ANONYMOUS = 'anonymous',
  PARENT = 'parent',
  VOLUNTEER = 'volunteer',
  ADMIN = 'admin',
  ROOT = 'root',
  AI_ASSISTANT = 'ai_assistant'
}

// User status enum
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied'
}

// Interface for user document
export interface UserDocument {
  email: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
  permissions: string[];
  createdAt: FieldValue;
  approvedAt: FieldValue | null;
  approvedBy: string | null;
}

// Interface for audit log
export interface AdminAuditLog {
  action: 'approve' | 'deny';
  targetUserId: string;
  targetUserEmail: string;
  adminUserId: string;
  adminEmail: string;
  role?: UserRole;
  timestamp: FieldValue;
  reason?: string;
}

// Role permissions mapping - matches AuthService
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ANONYMOUS]: [
    'read_content',
    'scout_content',
    'scout_events'
  ],
  [UserRole.PARENT]: [
    'read_content',
    'create_content',
    'update_content',
    'family_management',
    'family_events',
    'family_rsvp',
    'family_volunteer',
    'scout_content',
    'scout_events',
    'scout_chat',
    'chat_read',
    'chat_write'
  ],
  [UserRole.VOLUNTEER]: [
    'read_content',
    'create_content',
    'update_content',
    'family_management',
    'family_events',
    'family_rsvp',
    'family_volunteer',
    'den_content',
    'den_events',
    'den_members',
    'den_chat_management',
    'den_announcements',
    'scout_content',
    'scout_events',
    'scout_chat',
    'chat_read',
    'chat_write'
  ],
  [UserRole.ADMIN]: [
    'read_content',
    'create_content',
    'update_content',
    'delete_content',
    'family_management',
    'family_events',
    'family_rsvp',
    'family_volunteer',
    'den_content',
    'den_events',
    'den_members',
    'den_chat_management',
    'den_announcements',
    'pack_management',
    'event_management',
    'location_management',
    'announcement_management',
    'financial_management',
    'fundraising_management',
    'all_den_access',
    'scout_content',
    'scout_events',
    'scout_chat',
    'chat_read',
    'chat_write',
    'chat_management',
    'user_management',
    'role_management',
    'system_config',
    'cost_management',
    'cost_analytics',
    'cost_alerts'
  ],
  [UserRole.ROOT]: [
    'read_content',
    'create_content',
    'update_content',
    'delete_content',
    'family_management',
    'family_events',
    'family_rsvp',
    'family_volunteer',
    'den_content',
    'den_events',
    'den_members',
    'den_chat_management',
    'den_announcements',
    'pack_management',
    'event_management',
    'location_management',
    'announcement_management',
    'financial_management',
    'fundraising_management',
    'all_den_access',
    'scout_content',
    'scout_events',
    'scout_chat',
    'chat_read',
    'chat_write',
    'chat_management',
    'user_management',
    'role_management',
    'system_config',
    'system_admin',
    'cost_management',
    'cost_analytics',
    'cost_alerts'
  ],
  [UserRole.AI_ASSISTANT]: [
    'read_content',
    'create_content',
    'update_content',
    'family_management',
    'family_events',
    'family_rsvp',
    'family_volunteer',
    'den_content',
    'den_events',
    'den_members',
    'den_chat_management',
    'den_announcements',
    'scout_content',
    'scout_events',
    'scout_chat',
    'chat_read',
    'chat_write'
  ]
};

// Helper function to get permissions for a role
function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Callable function to create a pending user document
 * This should be called after Firebase Auth user creation
 */
export const createPendingUser = onCall(async (request: any) => {
  const { userId, email, displayName } = request.data;

  if (!userId || !email) {
    throw new Error('Missing required parameters: userId and email');
  }

  try {
    const db = getFirestore();
    
    // Check if user document already exists
    const existingDoc = await db.collection('users').doc(userId).get();
    if (existingDoc.exists) {
      logger.info('User document already exists:', userId);
      return { success: true, message: 'User document already exists' };
    }

    // Create user document with pending status
    const userDoc: UserDocument = {
      email: email,
      displayName: displayName || '',
      status: UserStatus.PENDING,
      role: UserRole.PARENT,
      permissions: getRolePermissions(UserRole.PARENT), // Set default permissions
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: null,
      approvedBy: null
    };

    // Create the user document in Firestore
    await db.collection('users').doc(userId).set(userDoc);
    
    logger.info('User document created with pending status:', userId);
    
    return {
      success: true,
      message: 'User document created successfully',
      userId
    };
  } catch (error) {
    logger.error('Error creating user document:', error);
    throw error;
  }
});

/**
 * Callable function for admins to approve or deny users
 */
export const approveUser = onCall(async (request: any) => {
  const { userId, action, role, reason } = request.data;
  const callerUid = request.auth?.uid;

  // Validate input
  if (!userId || !action || !callerUid) {
    throw new Error('Missing required parameters');
  }

  if (!['approve', 'deny'].includes(action)) {
    throw new Error('Invalid action. Must be "approve" or "deny"');
  }

  if (action === 'approve' && !role) {
    throw new Error('Role is required when approving a user');
  }

  if (!Object.values(UserRole).includes(role)) {
    throw new Error('Invalid role');
  }

  try {
    const db = getFirestore();
    const auth = getAuth();
    
    // Verify caller is admin
    const callerToken = await auth.getUser(callerUid);
    const callerCustomClaims = callerToken.customClaims;
    
    if (!callerCustomClaims?.approved || callerCustomClaims?.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get target user info
    const targetUser = await auth.getUser(userId);
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() as UserDocument;

    // Check if user is already processed
    if (userData.status !== UserStatus.PENDING) {
      throw new Error('User has already been processed');
    }

    const newStatus = action === 'approve' ? UserStatus.APPROVED : UserStatus.DENIED;
    const timestamp = FieldValue.serverTimestamp();

    // Update user document
    const updateData: Partial<UserDocument> = {
      status: newStatus,
      approvedAt: timestamp,
      approvedBy: callerUid
    };

    if (action === 'approve') {
      updateData.role = role;
      // Set permissions based on role
      updateData.permissions = getRolePermissions(role);
    }

    await db.collection('users').doc(userId).update(updateData);

    // Set custom claims for approved users
    if (action === 'approve') {
      await auth.setCustomUserClaims(userId, {
        approved: true,
        role: role
      });
    } else {
      // For denied users, delete their Firebase Auth account entirely
      // This prevents them from accessing the system at all
      await auth.deleteUser(userId);
      logger.info(`Firebase Auth user deleted for denied user: ${userId}`);
    }

    // Create audit log
    const auditLog: AdminAuditLog = {
      action: action as 'approve' | 'deny',
      targetUserId: userId,
      targetUserEmail: targetUser.email || userData.email,
      adminUserId: callerUid,
      adminEmail: callerToken.email || '',
      role: action === 'approve' ? role : undefined,
      timestamp: timestamp,
      reason: reason || null
    };

    await db.collection('adminAuditLogs').add(auditLog);

    logger.info(`User ${action}d:`, {
      userId,
      action,
      role: action === 'approve' ? role : undefined,
      adminId: callerUid
    });

    return {
      success: true,
      message: `User ${action}d successfully`,
      userId,
      status: newStatus,
      role: action === 'approve' ? role : undefined
    };

  } catch (error) {
    logger.error('Error in approveUser function:', error);
    throw error;
  }
});

/**
 * Callable function to get pending users (admin only)
 */
export const getPendingUsers = onCall(async (request: any) => {
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new Error('Authentication required');
  }

  try {
    const db = getFirestore();
    const auth = getAuth();
    
    logger.info('getPendingUsers called by:', callerUid);
    
    // Verify caller is admin
    const callerToken = await auth.getUser(callerUid);
    const callerCustomClaims = callerToken.customClaims;
    
    if (!callerCustomClaims?.approved || callerCustomClaims?.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }

    logger.info('Admin verified, getting pending users...');

    // Get pending users
    const pendingUsersSnapshot = await db
      .collection('users')
      .where('status', '==', UserStatus.PENDING)
      .get();

    logger.info(`Found ${pendingUsersSnapshot.docs.length} pending users`);

    const pendingUsers = pendingUsersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to JavaScript Dates
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate() : data.approvedAt
      };
    });

    logger.info('Pending users:', pendingUsers);

    return {
      success: true,
      users: pendingUsers
    };

  } catch (error) {
    logger.error('Error in getPendingUsers function:', error);
    throw error;
  }
});

/**
 * Callable function to get audit logs (admin only)
 */
export const getAuditLogs = onCall(async (request: any) => {
  const callerUid = request.auth?.uid;
  const { limit = 50 } = request.data || {};

  if (!callerUid) {
    throw new Error('Authentication required');
  }

  try {
    const db = getFirestore();
    const auth = getAuth();
    
    // Verify caller is admin
    const callerToken = await auth.getUser(callerUid);
    const callerCustomClaims = callerToken.customClaims;
    
    if (!callerCustomClaims?.approved || callerCustomClaims?.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get audit logs
    const auditLogsSnapshot = await db
      .collection('adminAuditLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const auditLogs = auditLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      logs: auditLogs
    };

  } catch (error) {
    logger.error('Error in getAuditLogs function:', error);
    throw error;
  }
});
