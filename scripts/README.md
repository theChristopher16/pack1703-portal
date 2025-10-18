# Scripts Directory

This directory contains utility scripts for maintaining and managing the Pack 1703 Portal.

## Available Scripts

### fix-unapproved-users.js

**Purpose:** Identifies and fixes users who bypassed the approval system through social login.

**When to use:**
- After discovering users in the database who never received approval
- When auditing user access and permissions
- After deploying approval system fixes

**Usage:**
```bash
# From project root
node scripts/fix-unapproved-users.js
```

**Prerequisites:**
- Firebase Admin SDK service account key (`service-account-key.json` in project root)
- Node.js installed
- Admin access to Firebase project

**Features:**
- **Interactive Mode**: Review each user individually
- **Batch Mode**: Apply action to all users at once
- **Actions Available**:
  - Approve: Properly approve user with metadata
  - Pending: Set to pending status for admin approval
  - Remove: Delete user from system
  - Skip: Leave user as-is

**Safety:**
- Automatically skips root/super admin users
- Requires confirmation for destructive actions
- Provides detailed user information before action

**Output:**
- Detailed report of all problematic users
- Action confirmation for each change
- Summary of operations performed

---

## Adding New Scripts

When creating new utility scripts:

1. Add comprehensive documentation in this README
2. Include error handling and safety checks
3. Provide interactive and batch modes when appropriate
4. Log all operations for audit purposes
5. Test thoroughly before use in production

---

**Last Updated:** October 17, 2025

