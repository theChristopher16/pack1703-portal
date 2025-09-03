# Role-Based Admin Panel Privileges

## 🎯 Overview

The admin panel provides different levels of access based on user roles, with each role seeing progressively more features and capabilities.

## 👥 Role Hierarchy

### 1. **ANONYMOUS** (No Admin Access)
- **Access**: None
- **Description**: Default state for users without accounts
- **Color**: Gray (`#6B7280`)
- **Icon**: 👤

### 2. **PARENT** (Family Management)
- **Access**: Basic family management
- **Description**: Family account (default after signup via invite)
- **Color**: Blue (`#3B82F6`)
- **Icon**: 👨‍👩‍👧‍👦

**Available Sections:**
- Dashboard
- Family Management
- Events
- Chat

**Quick Actions:**
- Family Profile updates
- Event RSVPs
- Chat communication

### 3. **VOLUNTEER** (Den-Level Management)
- **Access**: Den-level management + Parent features
- **Description**: Active volunteers with den coordination
- **Color**: Green (`#10B981`)
- **Icon**: 🤝

**Available Sections:**
- Dashboard
- Family Management
- Events
- Chat
- Den Management
- Volunteer Hub
- Announcements

**Quick Actions:**
- Den member management
- Volunteer activity coordination
- Den announcements

### 4. **ADMIN** (Pack-Level Management)
- **Access**: Pack-level management + Volunteer features
- **Description**: Pack administrators with full pack oversight
- **Color**: Purple (`#8B5CF6`)
- **Icon**: ⚡

**Available Sections:**
- Dashboard
- Family Management
- Events
- Chat
- Den Management
- Volunteer Hub
- Announcements
- User Management
- Locations
- Invitations
- Analytics
- Cost Management

**Quick Actions:**
- User management
- Cost monitoring
- Analytics insights

**System Status:**
- API Health monitoring
- Database status
- Cost tracking

### 5. **ROOT** (System Owner)
- **Access**: Complete system control + Admin features
- **Description**: System owner with full control (you)
- **Color**: Deep Heritage Yellow (`#D97706`)
- **Icon**: 👑

**Available Sections:**
- Dashboard
- Family Management
- Events
- Chat
- Den Management
- Volunteer Hub
- Announcements
- User Management
- Locations
- Invitations
- Analytics
- Cost Management
- System Settings
- Security
- Audit Logs
- Database

**Quick Actions:**
- System configuration
- Security management
- Audit log review

## 🔐 Permission System

### Cost Management Permissions
- `cost:read` - View cost data (Admin+)
- `cost:manage` - Manage cost settings (Admin+)
- `cost:analytics` - Access cost analytics (Admin+)

### Role-Based Access Control
Each role inherits permissions from lower roles and adds new capabilities:

```
ANONYMOUS → PARENT → VOLUNTEER → ADMIN → ROOT
```

## 🎨 Visual Design

### Color Coding
- **Anonymous**: Gray - Limited access
- **Parent**: Blue - Family focus
- **Volunteer**: Green - Den coordination
- **Admin**: Purple - Pack management
- **Root**: Deep Heritage Yellow - System control

### Icons
- Each role has a distinctive icon
- Quick action cards use role-appropriate icons
- Navigation uses consistent iconography

## 🚀 Implementation Details

### Component Structure
- `AdminPanel.tsx` - Main role-based interface
- `RoleBadge.tsx` - Role display component
- `AdminPage.tsx` - Page wrapper

### Access Control
- Role checking via `hasRole()` function
- Permission checking via `hasPermission()` function
- Progressive disclosure of features

### Navigation
- Sidebar shows only available sections
- Active section highlighting
- Role-specific welcome messages

## 📊 Quick Actions by Role

### Parent Quick Actions
1. **Family Profile** - Update family information
2. **Event RSVPs** - Manage event registrations
3. **Chat** - Communicate with den/pack

### Volunteer Quick Actions
1. **Den Management** - Manage den members
2. **Volunteer Hub** - Coordinate activities
3. **Announcements** - Create den announcements

### Admin Quick Actions
1. **User Management** - Manage pack members
2. **Cost Management** - Monitor API usage
3. **Analytics** - View pack insights

### Root Quick Actions
1. **System Settings** - Configure system
2. **Security** - Manage access controls
3. **Audit Logs** - Review activity logs

## 🔄 Role Progression

### Default Flow
1. **Anonymous** → Receive invite
2. **Parent** → Create account via invite
3. **Volunteer** → Promoted by admin
4. **Admin** → Promoted by root
5. **Root** → System owner (you)

### Promotion Process
- Only higher roles can promote users
- Role changes are logged in audit trail
- Permissions are automatically updated

## 🛡️ Security Features

### Access Denial
- Clear "Access Denied" messages
- Role-based section hiding
- Permission-based content filtering

### Audit Trail
- All role changes logged
- Admin actions tracked
- System access monitored

## 📱 Responsive Design

### Mobile Support
- Collapsible sidebar
- Touch-friendly navigation
- Responsive quick action cards

### Desktop Experience
- Full sidebar navigation
- Multi-column layouts
- Hover effects and animations
