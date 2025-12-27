# Copse Platform - System Overview

## 🎯 Purpose

**Copse** is a multi-tenant SaaS platform designed to provide organizational management tools for scout packs, school clubs, community groups, and small teams. The platform offers member coordination, event management, communication, payments, and AI-powered assistance through both web and iOS applications.

**Pack 1703 Portal** is one organization/tenant within the Copse platform, serving Scout Pack 1703 with customized branding and feature set.

---

## 🏗️ High-Level Architecture

### Multi-Tenant Platform Architecture
- **Platform Name**: Copse
- **Web Application**: React-based web portal hosted on Firebase Hosting
- **iOS Application**: Native Swift/SwiftUI app for mobile access
- **Shared Backend**: Firebase services (Firestore, Authentication, Cloud Functions, Storage)
- **Multi-Tenancy**: Each organization gets its own branded portal with customizable components

### Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Copse Platform                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Multi-Organization Layer                │  │
│  │  • Pack 1703 Portal (tenant)                     │  │
│  │  • Storefronts (tenants)                         │  │
│  │  • School Clubs (tenants)                        │  │
│  │  • Community Groups (tenants)                    │  │
│  │  • Custom Branding per Organization              │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                  │
│  ┌───────────────────▼────────────────────────────────┐ │
│  │              User Interfaces                       │ │
│  ├─────────────────────┬──────────────────────────────┤ │
│  │   Web Portal        │      iOS App (Copse)         │ │
│  │   (React + TS)      │      (Swift + SwiftUI)       │ │
│  └──────────┬──────────┴────────────┬─────────────────┘ │
│             │                       │                    │
│             └───────────┬───────────┘                    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │          Firebase Backend Services                  │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  • Firestore (Multi-tenant Database)               │ │
│  │  • Firebase Authentication                         │ │
│  │  • Cloud Functions (Serverless Logic)              │ │
│  │  • Firebase Storage (File Storage)                 │ │
│  │  • Firebase App Check (Security)                   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

### Platform-Level Features

#### Multi-Tenant Organization Management
- **Organization Types**: Supports Pack, Troop, Crew, Post, Council, District, Storefront, School, Club
- **Custom Branding**: Each organization can have custom colors, logos, and branding
- **Component System**: Enable/disable features per organization (chat, calendar, finances, etc.)
- **Billing Tiers**: Free, Basic, Pro, Enterprise tiers
- **Network Administration**: Copse-admin role for platform-wide management
- **Organization Isolation**: Data segregation between organizations with shared infrastructure

#### Platform Infrastructure
- **Scalable Architecture**: Multi-tenant design supporting unlimited organizations
- **White-Label Capability**: Custom branding per organization
- **Component Marketplace**: Modular features that can be enabled per organization
- **Cross-Organization Tools**: Admin tools for managing multiple organizations

### Organization-Level Features

### 1. Event Management System
- **Event Creation & Management**: Create, edit, and manage pack events
- **RSVP System**: Event registration with meal preferences, attendee counts
- **Calendar Integration**: Full calendar view with ICS export capability
- **Location Services**: Maps integration with Leaflet/OpenStreetMap
- **Packing Lists**: Event-specific packing lists

### 2. Communication & Chat
- **Stream Chat Integration**: Real-time chat functionality organized by dens
- **Announcements**: Organization-wide and den-specific announcements
- **Notifications**: Push notifications via Firebase Cloud Messaging
- **Email Integration**: Automated email notifications (Zoho Mail)

### 3. User Management & Authentication
- **Firebase Authentication**: Multiple sign-in methods (Email/Password, Google, Apple)
- **User Approval System**: Admin-controlled user approval workflow
- **Role-Based Access Control**: Hierarchical roles (Parent → Leader → Admin → Root)
- **Custom Claims**: Fine-grained permissions via Firebase custom claims

### 4. AI-Powered Features
- **Solyn**: Primary AI assistant for pack management and user interactions
  - Natural language event creation
  - Content generation (announcements, descriptions)
  - Packing list generation
  - Location validation via web search
- **Nova**: Administrative AI assistant for system management
  - System monitoring and analytics
  - Cost optimization recommendations
  - Security analysis

### 5. Administrative Tools
- **Admin Dashboard**: Comprehensive admin interface
- **User Management**: Approve, manage, and assign roles to users
- **Event Management**: Full CRUD operations for events
- **Analytics**: Usage tracking and system insights
- **Financial Tracking**: Dues, payments, and financial management
- **Audit Logging**: Immutable records of all admin actions

### 6. Platform Administration
- **Copse Admin Panel**: Network-wide administration interface
- **Organization Management**: Create, configure, and manage organizations
- **User Management**: Cross-organization user and role management
- **Billing Management**: Organization billing and subscription management
- **Analytics & Reporting**: Platform-wide usage and performance metrics

### 7. Additional Features
- **Ecology Monitoring**: BME680 sensor integration for environmental data
- **Volunteer Management**: Volunteer opportunity tracking
- **Fundraising**: Campaign management and tracking
- **Lists & Inventories**: Pack inventory management
- **Season Management**: Scouting season organization
- **PWA Support**: Progressive Web App capabilities

---

## 🛠️ Technology Stack

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: React Scripts (Create React App)
- **UI Framework**: Material-UI (MUI) v6, Bootstrap 5, Tailwind CSS
- **State Management**: React Context API, React Router
- **Icons**: Lucide React, React Icons
- **Maps**: Leaflet with OpenStreetMap
- **Calendar**: FullCalendar
- **Charts**: Recharts

### Frontend (iOS)
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Architecture**: MVVM pattern
- **Package Manager**: Swift Package Manager (SPM)

### Backend & Infrastructure
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication
- **Serverless Functions**: Firebase Cloud Functions (Node.js)
- **File Storage**: Firebase Storage
- **Security**: Firebase App Check (reCAPTCHA v3)
- **Hosting**: Firebase Hosting (Web App)
- **API Integration**: OpenAI (GPT-4), Google AI (Gemini), Stream Chat API

### Development & DevOps
- **Version Control**: Git/GitHub
- **CI/CD**: Firebase deployment pipelines
- **Infrastructure as Code**: OpenTofu (Terraform alternative)
- **Configuration Management**: Ansible
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint
- **Type Safety**: TypeScript

### External Services
- **Stream Chat**: Real-time chat infrastructure
- **OpenAI**: AI content generation
- **Google Cloud**: Billing, Maps, Sign-In
- **Zoho Mail**: Email service
- **Apple Services**: Sign In, MapKit, TestFlight

---

## 📱 Platform Support

### Web Application
- **Platform URL**: Deployed via Firebase Hosting
- **Organization URLs**: Each organization can have custom domain/subdomain (e.g., pack1703.copse.network)
- **Browsers**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Responsive**: Mobile-first design
- **PWA**: Progressive Web App support
- **Multi-Tenant Routing**: Organization-scoped routes and navigation

### iOS Application
- **Platform**: iOS (native app)
- **App Name**: Copse
- **Multi-Tenant Support**: Users can access multiple organizations within the app
- **Distribution**: TestFlight (beta) → App Store (planned)
- **Minimum iOS Version**: Compatible with modern iOS versions

---

## 🔐 Security Features

### Authentication & Authorization
- **Multi-factor Authentication Support**: Via Firebase Auth
- **Role-Based Access Control**: Custom claims with hierarchical permissions
- **User Approval Workflow**: Gated access requiring admin approval
- **Session Management**: Secure token-based authentication

### Data Protection
- **Firestore Security Rules**: Fine-grained database access control
- **Input Validation**: Zod schema validation, DOMPurify sanitization
- **Rate Limiting**: Protection against abuse
- **App Check**: Bot protection via reCAPTCHA v3
- **Audit Logging**: Comprehensive activity tracking

### Privacy & Compliance
- **Privacy Policy Integration**: Required privacy disclosures
- **Data Minimization**: Minimal PII collection
- **IP Hashing**: Anonymized tracking data
- **Export Compliance**: ITAR compliance settings configured

---

## 📊 Data Model

### Core Collections
- **Organizations**: Multi-tenant organization records with branding and configuration
- **Users**: User profiles, roles, approval status, cross-organization membership
- **Events**: Organization-scoped event details, RSVPs, locations, dates
- **Announcements**: Organization and den-specific announcements
- **Messages**: Chat messages via Stream Chat (organization-scoped channels)
- **RSVPs**: Event registration and attendance (organization-scoped)
- **Payments**: Financial transactions and dues (organization-scoped)
- **Audit Logs**: System activity and admin actions (platform and organization level)

### Relationships
- **Platform Level**: Organizations are top-level tenants in Copse
- **Organization Level**: Users belong to Organizations (can belong to multiple)
- **User Roles**: Users have Roles within each Organization
- **Data Scoping**: Events, RSVPs, Messages, etc. are scoped to Organizations
- **Component Access**: Features are enabled per Organization via component system

---

## 🔄 System Workflows

### User Onboarding
1. User registers with email/password or OAuth (Google/Apple)
2. Account created in pending approval state
3. Organization admin reviews and approves/rejects user
4. Upon approval, user receives access to the specific organization
5. User can access organization-specific features based on role and enabled components
6. Users can belong to multiple organizations with different roles in each

### Event Lifecycle
1. Admin/Leader creates event (manually or via AI assistant Solyn)
2. Event appears in calendar and event list
3. Users RSVP with preferences
4. Real-time updates to RSVP counts
5. Event notifications sent
6. Post-event: Attendance tracking and feedback

### Content Creation (AI-Assisted)
1. Admin requests content (event description, announcement, etc.)
2. Solyn AI processes request with context
3. Optional web search for additional information
4. Content generated and presented for review
5. Admin approves and publishes

---

## 🚀 Deployment Architecture

### Web Application
- **Build Process**: `npm run build` → React production build
- **Deployment**: `firebase deploy --only hosting`
- **CDN**: Firebase Hosting with global CDN
- **Cache Strategy**: Static asset caching with versioning

### iOS Application
- **Build**: Xcode archive process
- **Distribution**: 
  - Development: Direct install via Xcode
  - Beta: TestFlight
  - Production: App Store (planned)

### Cloud Functions
- **Runtime**: Node.js
- **Deployment**: `firebase deploy --only functions`
- **Scaling**: Automatic scaling based on demand
- **Region**: Configurable (default: us-central1)

---

## 📈 Scalability & Performance

### Current Capacity
- **Users**: Supports hundreds to thousands of users
- **Events**: Unlimited events per organization
- **Real-time Updates**: Firestore real-time listeners for live data
- **Storage**: Firebase Storage for file uploads

### Performance Optimizations
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: Compressed storage formats
- **Caching**: Browser caching for static assets
- **Database Indexing**: Firestore composite indexes for queries
- **Offline Support**: PWA offline capabilities

---

## 🔮 Future Considerations

### Planned Enhancements
- **Android Application**: Native Android app support
- **React Native Migration**: Potential code sharing between web and mobile
- **GCP Migration**: Migration to fully serverless GCP architecture (cost optimization)
- **Advanced Analytics**: Enhanced reporting and insights
- **Internationalization**: Multi-language support

### Architecture Evolution
- **Microservices**: Potential service decomposition
- **API Gateway**: Centralized API management
- **Event Sourcing**: Advanced event tracking
- **Machine Learning**: Enhanced AI capabilities

---

## 📝 Key Documentation Files

- `README.md` - Main project documentation
- `AGENTS.md` - AI agents (Solyn & Nova) documentation
- `DEPLOYMENT-GUIDE.md` - Deployment procedures
- `SECURITY-SUMMARY.md` - Security considerations
- `USER_APPROVAL_SYSTEM.md` - User management system
- `TESTFLIGHT_SETUP.md` - iOS app distribution guide

---

---

## 🏢 Platform Positioning

### Value Proposition
**"Your organization, powered"** - Everything your organization needs—member coordination, events, payments, and AI assistance—without the spreadsheets and email chaos.

### Target Segments
- **Scout Packs**: Currently live (Pack 1703 is the primary tenant)
- **School Clubs**: Launching soon
- **Community Groups**: Future expansion
- **Small Teams**: Future expansion
- **Storefronts/Spirit Stores**: E-commerce capabilities for merchandise sales

### Platform Capabilities
- **Member Coordination**: Manage members, families, permissions
- **Events & Payments**: Create events, track RSVPs, collect payments
- **AI Assistant**: Help with announcements, event planning, content generation
- **Real-time Communication**: Chat, announcements, notifications
- **Custom Branding**: Each organization gets its own branded experience
- **Flexible Components**: Enable only the features each organization needs

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Platform Name**: Copse  
**Legal Entity**: Copse LLC  
**Status**: Production Active

