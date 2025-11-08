import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { AdminOnly, RootOnly, AuthenticatedOnly, SuperUserOnly } from '../components/Auth/RoleGuard';
import { OrganizationProvider } from '../contexts/OrganizationContext';

// Pages
import HomePage from '../pages/HomePage';
import EventsPage from '../pages/EventsPage';
import ArchivedEventsPage from '../pages/ArchivedEventsPage';
import LocationsPage from '../pages/LocationsPage';
import UnifiedAnnouncementsPage from '../pages/UnifiedAnnouncementsPage';
import ResourcesPage from '../pages/ResourcesPage';
import InventoryPage from '../pages/InventoryPage';
import VolunteerPage from '../pages/VolunteerPage';
import GalleryPage from '../pages/GalleryPage';
import EcologyPage from '../pages/EcologyPage';
import FeedbackPage from '../pages/FeedbackPage';
import DataAuditPage from '../pages/DataAuditPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import DuesInformation from '../pages/DuesInformation';
import FundraisingPage from '../pages/FundraisingPage';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';
import AnalyticsTest from '../components/Analytics/AnalyticsTest';
import UserInteractionDashboard from '../components/Analytics/UserInteractionDashboard';
import FormsDemoPage from '../pages/FormsDemoPage';
import CloudFunctionsTestPage from '../pages/CloudFunctionsTestPage';
import NotFoundPage from '../pages/NotFoundPage';
import EventDetailPage from '../pages/EventDetailPage';
import TestNavigation from '../pages/TestNavigation';
import AuthDebugPage from '../pages/AuthDebugPage';
import UnifiedChat from '../components/Chat/UnifiedChat';

// Admin Pages
import AdminLists from '../pages/AdminLists';
import AdminSeasons from '../pages/AdminSeasons';
import AdminFundraising from '../pages/AdminFundraising';
import AdminFinances from '../pages/AdminFinances';
import AdminCostManagement from '../pages/AdminCostManagement';
import HackerTab from '../pages/HackerTab';
import AdminSettings from '../pages/AdminSettings';
import UserProfile from '../pages/UserProfile';
import AdminReminders from '../pages/AdminReminders';
import AdminUsers from '../pages/AdminUsers';
import SystemMonitor from '../components/Admin/SystemMonitor';
import DebugAccountRequests from '../pages/DebugAccountRequests';

import { OrganizationType } from '../types/organization';

const PackRouter: React.FC = () => {
  return (
    <OrganizationProvider 
      orgSlug="pack1703" 
      organizationId="pack1703" 
      organizationName="Cub Scout Pack 1703"
      orgType={OrganizationType.PACK}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="" element={<Layout><HomePage /></Layout>} />
        <Route path="events" element={<Layout><AuthenticatedOnly><EventsPage /></AuthenticatedOnly></Layout>} />
        <Route path="events/archived" element={<Layout><AuthenticatedOnly><ArchivedEventsPage /></AuthenticatedOnly></Layout>} />
        <Route path="events/:eventId" element={<Layout><AuthenticatedOnly><EventDetailPage /></AuthenticatedOnly></Layout>} />
        <Route path="test-navigation" element={<TestNavigation />} />
        <Route path="auth-debug" element={<AuthDebugPage />} />
        <Route path="locations" element={<Layout><AuthenticatedOnly><LocationsPage /></AuthenticatedOnly></Layout>} />
        <Route path="announcements" element={<Layout><AuthenticatedOnly><UnifiedAnnouncementsPage /></AuthenticatedOnly></Layout>} />
        <Route path="resources" element={<Layout><AuthenticatedOnly><ResourcesPage /></AuthenticatedOnly></Layout>} />
        <Route path="resources/inventory" element={<Layout><AuthenticatedOnly><InventoryPage /></AuthenticatedOnly></Layout>} />
        <Route path="gallery" element={<Layout><AuthenticatedOnly><GalleryPage /></AuthenticatedOnly></Layout>} />
        <Route path="dues" element={<Layout><AuthenticatedOnly><DuesInformation /></AuthenticatedOnly></Layout>} />
        <Route path="volunteer" element={<Layout><AuthenticatedOnly><VolunteerPage /></AuthenticatedOnly></Layout>} />
        <Route path="ecology" element={<Layout><EcologyPage /></Layout>} />
        <Route path="fundraising" element={<Layout><AuthenticatedOnly><FundraisingPage /></AuthenticatedOnly></Layout>} />
        <Route path="privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="terms" element={<Layout><TermsOfServicePage /></Layout>} />
        
        {/* Authenticated Routes */}
        <Route path="chat" element={<Layout><AuthenticatedOnly><UnifiedChat /></AuthenticatedOnly></Layout>} />
        <Route path="feedback" element={<Layout><AuthenticatedOnly><FeedbackPage /></AuthenticatedOnly></Layout>} />
        <Route path="data-audit" element={<Layout><AuthenticatedOnly><DataAuditPage /></AuthenticatedOnly></Layout>} />
        
        {/* Admin Routes */}
        <Route path="analytics" element={<Layout><AdminOnly><AnalyticsDashboard /></AdminOnly></Layout>} />
        <Route path="analytics/test" element={<Layout><AdminOnly><AnalyticsTest /></AdminOnly></Layout>} />
        <Route path="user-interactions" element={<Layout><SuperUserOnly><UserInteractionDashboard /></SuperUserOnly></Layout>} />
        <Route path="users" element={<Layout><AdminOnly><AdminUsers /></AdminOnly></Layout>} />
        <Route path="finances" element={<Layout><AdminOnly><AdminFinances /></AdminOnly></Layout>} />
        <Route path="seasons" element={<Layout><AdminOnly><AdminSeasons /></AdminOnly></Layout>} />
        <Route path="lists" element={<Layout><AdminOnly><AdminLists /></AdminOnly></Layout>} />
        <Route path="reminders" element={<Layout><AdminOnly><AdminReminders /></AdminOnly></Layout>} />
        <Route path="cost-management" element={<Layout><AdminOnly><AdminCostManagement /></AdminOnly></Layout>} />
        
        {/* Root-only Routes */}
        <Route path="settings" element={<Layout><RootOnly><AdminSettings /></RootOnly></Layout>} />
        <Route path="soc" element={<Layout><RootOnly><HackerTab /></RootOnly></Layout>} />
        <Route path="system" element={<Layout><RootOnly><SystemMonitor /></RootOnly></Layout>} />
        <Route path="debug-account-requests" element={<Layout><RootOnly><DebugAccountRequests /></RootOnly></Layout>} />
        
        {/* User Profile Route */}
        <Route path="profile" element={<Layout><AuthenticatedOnly><UserProfile /></AuthenticatedOnly></Layout>} />
        
        {/* Development/Test Routes */}
        <Route path="forms-demo" element={<Layout><FormsDemoPage /></Layout>} />
        <Route path="cloud-functions-test" element={<Layout><CloudFunctionsTestPage /></Layout>} />
        
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </OrganizationProvider>
  );
};

export default PackRouter;

