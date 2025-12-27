# Copse Platform - High-Level Summary

**Prepared for Legal Review**  
**Date**: December 2024

---

## Executive Summary

**Copse** is a multi-tenant Software-as-a-Service (SaaS) platform that provides organizational management tools for scout packs, school clubs, community groups, and small teams. The platform enables organizations to manage members, coordinate events, process payments, communicate via chat, and utilize AI-powered content generation—all through customizable, branded web and mobile applications.

**Legal Entity**: Copse LLC

---

## Platform Overview

### Core Business Model
Copse operates as a multi-tenant SaaS platform where:
- Multiple organizations operate as independent tenants on shared infrastructure
- Each organization receives a customized, branded portal with selectable features
- The platform supports various organization types: scout packs, troops, school clubs, community groups, and storefronts
- Organizations can belong to different billing tiers (Free, Basic, Pro, Enterprise)

### Primary Use Cases
- **Scout Organizations**: Pack 1703 Portal (current primary tenant) - event management, RSVPs, member coordination
- **School Clubs**: Member management, event coordination, fundraising
- **Community Groups**: Organization management, communication, payments
- **Storefronts/Spirit Stores**: E-commerce capabilities for merchandise sales

---

## Key Platform Capabilities

### 1. Organization Management
- Custom branding (colors, logos, names) per organization
- Feature selection (enable/disable specific capabilities per organization)
- Multi-organization membership (users can belong to multiple organizations)
- Role-based access control within each organization

### 2. Core Features (Available to Organizations)
- **Event Management**: Create, manage, and track events with RSVP functionality
- **Communication**: Real-time chat, announcements, email notifications
- **Member Management**: User accounts, roles, permissions, approval workflows
- **Payments**: Payment processing for dues, events, and merchandise
- **AI Assistant**: Content generation, event planning assistance, announcements
- **Analytics**: Usage tracking and reporting
- **Administrative Tools**: Comprehensive admin dashboards and controls

### 3. Technical Infrastructure
- **Web Application**: React-based web portal
- **Mobile Application**: Native iOS application (Swift/SwiftUI)
- **Cloud Infrastructure**: Firebase (Google Cloud Platform)
  - Database: Firestore (NoSQL)
  - Authentication: Firebase Authentication
  - Serverless Functions: Cloud Functions
  - File Storage: Firebase Storage
  - Hosting: Firebase Hosting

---

## Data Architecture & Privacy

### Data Model
- **Organizations**: Top-level tenant records with configuration and branding
- **Users**: User accounts that can belong to multiple organizations
- **Organization Data**: Events, RSVPs, messages, payments scoped to specific organizations
- **Data Isolation**: Organization data is segregated within shared infrastructure

### User Data Handling
- User authentication via email/password, Google Sign-In, or Apple Sign-In
- User approval workflow: accounts require organization admin approval
- Role-based permissions within each organization
- Audit logging of administrative actions

### Privacy & Security
- Firebase security rules enforce data access controls
- Input validation and sanitization
- Rate limiting and bot protection
- App Check security (reCAPTCHA v3)
- Privacy policy integration required for organizations

---

## Business Structure

### Platform Administration
- **Copse Admin Role**: Platform-level administrators who manage multiple organizations
- **Organization Admins**: Administrators within each organization
- **Network Management**: Tools for managing the platform-wide network of organizations
- **Billing Management**: Organization-level subscription and billing management

### Current Status
- **Production Status**: Platform is live and operational
- **Primary Tenant**: Pack 1703 Portal (scout pack organization)
- **Expansion Plans**: Additional organization types and segments (school clubs, community groups)

---

## Technology Stack Summary

### Frontend
- React 18 with TypeScript (Web)
- Swift/SwiftUI (iOS Mobile)

### Backend & Infrastructure
- Google Firebase (Firestore, Authentication, Cloud Functions, Storage, Hosting)
- Firebase App Check (security)

### External Services
- Stream Chat (real-time messaging infrastructure)
- OpenAI (AI content generation)
- Google Cloud services (Maps, Sign-In, Billing)
- Zoho Mail (email services)

---

## Key Differentiators

1. **Multi-Tenancy**: True multi-tenant architecture supporting unlimited organizations
2. **Custom Branding**: Each organization receives white-label customization
3. **Component System**: Organizations select only the features they need
4. **AI Integration**: Built-in AI assistant for content generation and assistance
5. **Cross-Platform**: Web and native iOS applications
6. **Flexible Use Cases**: Serves multiple organization types with one platform

---

## Data & User Relationships

### Organization Structure
- Organizations are independent tenants on the platform
- Each organization has its own branding, configuration, and enabled features
- Organizations can have multiple administrators and members

### User Structure
- Users can belong to multiple organizations simultaneously
- Users have different roles within each organization
- User data is linked to organizations for access control and data scoping

### Data Scoping
- Events, RSVPs, messages, and payments are scoped to specific organizations
- Users can only access data for organizations they belong to
- Platform administrators have elevated access across organizations

---

## Platform Components

### Base Components (Available to All)
- Chat, Calendar, Announcements, Locations, Resources, Gallery, Profile, Notes

### Pack-Specific Components (Scout Organizations)
- Analytics, User Management, Finances, Seasons, Lists, Volunteer Management, Ecology, Fundraising, Dues

### Storefront Components (E-commerce)
- Products, Orders, Shopping Cart, Checkout

### Organization Type Support
- Pack (Cub Scouts), Troop (Boy Scouts), Crew (Venturing), Post (Sea Scouts), Council, District, Storefront, School, Club

---

## Business Considerations

### Revenue Model
- Subscription-based billing tiers (Free, Basic, Pro, Enterprise)
- Organization-level subscriptions
- Platform manages billing and subscriptions

### Scalability
- Multi-tenant architecture designed for unlimited organizations
- Cloud-based infrastructure for automatic scaling
- Shared infrastructure with data isolation

### Compliance & Legal
- Privacy policy integration required
- Data access controls and audit logging
- User approval workflows
- Export compliance configurations (ITAR)
- Terms of service and user agreements per organization

---

## Contact Information

**Legal Entity**: Copse LLC

*Note: Additional legal entity details (address, phone, registered agent, member information) to be provided separately for conflicts checks.*

---

**Document Purpose**: High-level overview for legal review and conflicts checking  
**Confidentiality**: Business-sensitive information - internal use only  
**Last Updated**: December 2024

