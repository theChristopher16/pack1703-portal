# 🌲 Copse Test Login Page

## Overview

A test login page showcasing multi-tenant branding capabilities with custom Copse organization branding. This page demonstrates how the portal can be customized for different scout organizations.

## What is Copse?

**Copse** demonstrates the platform's multi-tenant capabilities by showcasing:
- How any organization can have their own branded portal
- Custom branding and theming without code
- Platform positioning: member coordination, events, payments, AI
- Flexibility to serve scout packs, school clubs, and small teams

## Features

### 🎨 Custom Branding
- **Organization Name**: Copse
- **Tagline**: "Your organization, powered"
- **Value Proposition**: Everything your organization needs—member coordination, events, payments, and AI assistance—without the spreadsheets and email chaos
- **Color Palette**:
  - Primary: Deep Forest Green (#2D5016)
  - Secondary: Saddle Brown (#8B4513)
  - Accent: Forest Green (#4A7C59)
  - Light: Light Sage (#A8D5BA)

### 🖼️ Design Elements
- Split-screen layout with branding showcase on left
- Emerald/green gradient background with animated nature icons
- Floating leaf and tree animations
- Custom form styling with Copse color scheme
- Feature highlights emphasizing platform capabilities:
  - **Member Coordination**: Manage members, families, permissions
  - **Events & Payments**: Create events, track RSVPs, collect payments
  - **AI Assistant**: Help with announcements, event planning, more
- Target segments listed: Scout packs • School clubs • Community groups • Small teams
- Footer note: "Already live with scout packs • Launching to school clubs next month"

### 🔒 Access Control
- **Super Admin Only**: Protected by `SuperUserOnly` guard
- Requires `super-admin` or `root` role to access
- Regular users will be redirected to home page

## File Structure

```
src/
├── pages/
│   └── CopseTestLogin.tsx          # Main test login page
└── App.tsx                         # Route configuration
```

## Route Configuration

**URL**: `/test-copse-login`

**Protection**: Super Admin only via `SuperUserOnly` component

```tsx
<Route path="/test-copse-login" element={<SuperUserOnly><CopseTestLogin /></SuperUserOnly>} />
```

## How to Access

1. **Ensure you have super-admin privileges**
   - Your user role must be `super-admin` or `root`
   - Contact system administrator if needed

2. **Navigate to the test page**
   ```
   http://localhost:3000/test-copse-login         (Development)
   https://pack1703portal.com/test-copse-login    (Production)
   ```

3. **View the branding showcase**
   - Left side: Copse branding and mission statement
   - Right side: Functional login form

## Testing Checklist

- [ ] Page loads successfully for super-admin users
- [ ] Non-super-admin users are redirected
- [ ] All branding elements display correctly
- [ ] Animations work smoothly (floating icons)
- [ ] Login form functions properly
- [ ] Social login buttons work
- [ ] Password reset flow works
- [ ] Responsive design on mobile/tablet
- [ ] "Back to home" button works

## Integration with Multi-Tenant System

This page demonstrates the branding capabilities that will be used in the full multi-tenant system:

```typescript
interface OrganizationBranding {
  displayName: string;      // "Copse Scout Collective"
  shortName: string;        // "Copse"
  primaryColor: string;     // "#2D5016"
  secondaryColor: string;   // "#8B4513"
  accentColor: string;      // "#4A7C59"
  lightColor: string;       // "#A8D5BA"
  description: string;      // Mission statement
}
```

## Future Integration Steps

1. **Database Integration**
   - Store Copse branding in Firestore organizations collection
   - Load branding dynamically from organization configuration

2. **Route Integration**
   - Move from test endpoint to production `/copse/` route
   - Integrate with OrganizationRouter

3. **Authentication Flow**
   - Connect to organization-specific authentication
   - Handle organization-scoped user sessions

4. **Component Library**
   - Extract reusable branded components
   - Create brand theme provider

## Development Notes

### Component Structure
- Self-contained page component
- No external dependencies on organization context (for testing)
- Uses existing SocialLogin component
- Follows existing auth patterns

### Styling Approach
- Inline styles for animations
- Tailwind CSS for layout and colors
- Custom gradient backgrounds
- Lucide React icons

### Authentication
- Uses existing `authService` for login
- Supports email/password and social auth
- Password reset functionality included

## Visual Hierarchy

```
┌─────────────────────────────────────────────────┐
│  🧪 Test Environment Banner (Super Admin Only)  │
└─────────────────────────────────────────────────┘
┌──────────────────────┬─────────────────────────┐
│                      │                         │
│  🌲 Copse Branding   │   🔐 Login Form        │
│                      │                         │
│  • Logo & Name       │   • Social Login       │
│  • Mission           │   • Email Login        │
│  • Feature Cards     │   • Password Reset     │
│  • Nature Icons      │                         │
│                      │                         │
└──────────────────────┴─────────────────────────┘
```

## Next Steps

Once this test page is approved:

1. **Create Copse organization in Firestore**
   ```javascript
   {
     id: "copse",
     slug: "copse",
     name: "Copse Scout Collective",
     type: "pack",
     branding: { /* from test page */ },
     status: "active"
   }
   ```

2. **Integrate with organization routing**
   - Update OrganizationRouter to load branding
   - Apply branding to all org-scoped pages

3. **Test full multi-tenant flow**
   - Access via `/copse/` route
   - Verify branding persists across pages
   - Test cross-organization navigation

## Screenshots

_To be added after visual review_

## Feedback

Please provide feedback on:
- ✨ Visual design and branding
- 🎨 Color palette choices
- 📱 Mobile responsiveness
- 🔄 Animation smoothness
- 📝 Copy and messaging
- 🚀 Overall user experience

---

**Created**: November 2025  
**Status**: Testing / Review  
**Access Level**: Super Admin Only  
**Purpose**: Multi-tenant branding demonstration

