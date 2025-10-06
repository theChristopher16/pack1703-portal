import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import configService from './services/configService';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import ScrollToTop from './components/ScrollToTop';
import { versionCheckService } from './services/versionCheckService';

// Components
import Layout from './components/Layout/Layout';
import { AdminOnly, RootOnly, AuthenticatedOnly } from './components/Auth/RoleGuard';
import AuthGuard from './components/Auth/AuthGuard';
import TenantAccessGuard from './components/Auth/TenantAccessGuard';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import LocationsPage from './pages/LocationsPage';
import UnifiedAnnouncementsPage from './pages/UnifiedAnnouncementsPage';
import ResourcesPage from './pages/ResourcesPage';
import VolunteerPage from './pages/VolunteerPage';
import PasswordResetPage from './pages/PasswordResetPage';
import PasswordSetupPage from './pages/PasswordSetupPage';
import EcologyPage from './pages/EcologyPage';
import FeedbackPage from './pages/FeedbackPage';
import DataAuditPage from './pages/DataAuditPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import AnalyticsTest from './components/Analytics/AnalyticsTest';
import FormsDemoPage from './pages/FormsDemoPage';
import CloudFunctionsTestPage from './pages/CloudFunctionsTestPage';
import NotFoundPage from './pages/NotFoundPage';
import EventDetailPage from './pages/EventDetailPage';
import TestNavigation from './pages/TestNavigation';
import AuthDebugPage from './pages/AuthDebugPage';

// Admin Pages
import AdminLocations from './pages/AdminLocations';
import UnifiedChat from './components/Chat/UnifiedChat';
import AdminAI from './pages/AdminAI';
import AdminLists from './pages/AdminLists';
import AdminSeasons from './pages/AdminSeasons';
import AdminFundraising from './pages/AdminFundraising';
import AdminFinances from './pages/AdminFinances';
import AdminCostManagement from './pages/AdminCostManagement';
import MultiTenantManagement from './pages/MultiTenantManagement';
import JoinPage from './pages/JoinPage';
import RootAccountSetup from './pages/RootAccountSetup';
import HackerTab from './pages/HackerTab';
import AdminSettings from './pages/AdminSettings';
import UserProfile from './pages/UserProfile';
import AdminReminders from './pages/AdminReminders';
import AdminUsers from './pages/AdminUsers';
import SystemMonitor from './components/Admin/SystemMonitor';
import { AdminProvider } from './contexts/AdminContext';
import { MultiTenantProvider } from './contexts/MultiTenantContext';
import TenantProvider from './contexts/TenantContext';

// Legacy redirect component for event details
const LegacyEventRedirect: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  return <Navigate to={`/pack-1703/events/${eventId}`} replace />;
};

function App() {
  useEffect(() => {
    // Force cache invalidation on app load
    console.log('🚀 App: Starting with cache invalidation...');
    console.log('🚀 App: Current timestamp:', new Date().toISOString());
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is available
                    console.log('New service worker available');
                    versionCheckService.forceCheck();
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Listen for version update events
    const handleVersionUpdate = (event: CustomEvent) => {
      console.log('Version update detected:', event.detail);
    };

    window.addEventListener('versionUpdate', handleVersionUpdate as EventListener);

    // Initialize default configurations (non-blocking)
    const initializeConfigs = async () => {
      try {
        await configService.initializeDefaultConfigs('system');
        console.log('Default configurations initialized');
      } catch (error: any) {
        // Silently handle permission errors - this is expected when not authenticated
        if (error?.code === 'permission-denied') {
          console.log('Config initialization skipped - no authenticated user');
        } else {
          console.warn('Failed to initialize default configurations:', error);
        }
      }
    };

    // Run initialization in background without blocking app startup
    initializeConfigs();

    // Cleanup
    return () => {
      window.removeEventListener('versionUpdate', handleVersionUpdate as EventListener);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AdminProvider>
          <MultiTenantProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Redirect admin root to default tenant-scoped admin */}
                <Route path="/multi-tenant" element={<Navigate to="/pack-1703/multi-tenant" replace />} />
                {/* Public Routes (no authentication required) */}
                <Route path="/reset-password" element={<PasswordResetPage />} />
                <Route path="/password-setup" element={<PasswordSetupPage />} />
                <Route path="/join/:inviteId" element={<JoinPage />} />
                
                {/* Legacy Routes (redirect to tenant-scoped) */}
                <Route path="/events" element={<Navigate to="/pack-1703/events" replace />} />
                <Route path="/events/:eventId" element={<LegacyEventRedirect />} />
                <Route path="/home" element={<Navigate to="/pack-1703/home" replace />} />
                <Route path="/announcements" element={<Navigate to="/pack-1703/announcements" replace />} />
                <Route path="/locations" element={<Navigate to="/pack-1703/locations" replace />} />
                <Route path="/volunteer" element={<Navigate to="/pack-1703/volunteer" replace />} />
                <Route path="/resources" element={<Navigate to="/pack-1703/resources" replace />} />
                <Route path="/profile" element={<Navigate to="/pack-1703/profile" replace />} />
                <Route path="/admin" element={<Navigate to="/pack-1703/admin" replace />} />
                <Route path="/admin/users" element={<Navigate to="/pack-1703/admin/users" replace />} />
                <Route path="/admin/events" element={<Navigate to="/pack-1703/admin/events" replace />} />
                <Route path="/admin/locations" element={<Navigate to="/pack-1703/admin/locations" replace />} />
                <Route path="/admin/volunteer" element={<Navigate to="/pack-1703/admin/volunteer" replace />} />
                <Route path="/admin/analytics" element={<Navigate to="/pack-1703/admin/analytics" replace />} />
                <Route path="/admin/finances" element={<Navigate to="/pack-1703/admin/finances" replace />} />
                <Route path="/admin/fundraising" element={<Navigate to="/pack-1703/admin/fundraising" replace />} />
                <Route path="/admin/reminders" element={<Navigate to="/pack-1703/admin/reminders" replace />} />
                <Route path="/admin/seasons" element={<Navigate to="/pack-1703/admin/seasons" replace />} />
                <Route path="/admin/settings" element={<Navigate to="/pack-1703/admin/settings" replace />} />
                <Route path="/admin/ai" element={<Navigate to="/pack-1703/admin/ai" replace />} />
                <Route path="/admin/cost-management" element={<Navigate to="/pack-1703/admin/cost-management" replace />} />
                <Route path="/admin/system" element={<Navigate to="/pack-1703/admin/system" replace />} />
                <Route path="/admin/soc" element={<Navigate to="/pack-1703/admin/soc" replace />} />
                <Route path="/admin/root-setup" element={<Navigate to="/pack-1703/admin/root-setup" replace />} />
                <Route path="/forms-demo" element={<Navigate to="/pack-1703/forms-demo" replace />} />
                <Route path="/cloud-functions-test" element={<Navigate to="/pack-1703/cloud-functions-test" replace />} />
                
                {/* Root redirect to tenant-scoped home */}
                <Route path="/" element={<Navigate to="/pack-1703/home" replace />} />
                
                {/* Protected Tenant-Scoped Routes (authentication required) */}
                <Route path="/:tenantSlug/*" element={
                  <AuthGuard>
                    <TenantProvider>
                      <TenantAccessGuard>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Layout><HomePage /></Layout>} />
                        <Route path="/events" element={<Layout><EventsPage /></Layout>} />
                        <Route path="/events/:eventId" element={<Layout><EventDetailPage /></Layout>} />
                        <Route path="/test-navigation" element={<TestNavigation />} />
                        <Route path="/auth-debug" element={<AuthDebugPage />} />
                        <Route path="/locations" element={<Layout><LocationsPage /></Layout>} />
                        <Route path="/announcements" element={<Layout><UnifiedAnnouncementsPage /></Layout>} />
                        <Route path="/resources" element={<Layout><ResourcesPage /></Layout>} />
                        <Route path="/volunteer" element={<Layout><VolunteerPage /></Layout>} />
                        <Route path="/ecology" element={<Layout><EcologyPage /></Layout>} />
                        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
                        <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
                        
                        {/* Authenticated Routes */}
                        <Route path="/chat" element={<Layout><AuthenticatedOnly><UnifiedChat /></AuthenticatedOnly></Layout>} />
                        <Route path="/feedback" element={<Layout><AuthenticatedOnly><FeedbackPage /></AuthenticatedOnly></Layout>} />
                        <Route path="/data-audit" element={<Layout><AuthenticatedOnly><DataAuditPage /></AuthenticatedOnly></Layout>} />
                        
                        {/* Admin Routes */}
                        <Route path="/analytics" element={<Layout><AdminOnly><AnalyticsDashboard /></AdminOnly></Layout>} />
                        <Route path="/analytics/test" element={<Layout><AdminOnly><AnalyticsTest /></AdminOnly></Layout>} />
                        <Route path="/locations" element={<Layout><AdminOnly><AdminLocations /></AdminOnly></Layout>} />
                        <Route path="/lists" element={<Layout><AdminOnly><AdminLists /></AdminOnly></Layout>} />
                        <Route path="/seasons" element={<Layout><AdminOnly><AdminSeasons /></AdminOnly></Layout>} />
                        <Route path="/fundraising" element={<Layout><AdminOnly><AdminFundraising /></AdminOnly></Layout>} />
                        <Route path="/finances" element={<Layout><AdminOnly><AdminFinances /></AdminOnly></Layout>} />
                        <Route path="/users" element={<Layout><AdminOnly><AdminUsers /></AdminOnly></Layout>} />
                        <Route path="/reminders" element={<Layout><AdminOnly><AdminReminders /></AdminOnly></Layout>} />
                        
                        {/* Root-only Routes */}
                        <Route path="/ai" element={<Layout><RootOnly><AdminAI /></RootOnly></Layout>} />
                        <Route path="/cost-management" element={<Layout><AdminOnly><AdminCostManagement /></AdminOnly></Layout>} />
                        <Route path="/multi-tenant" element={<Layout><RootOnly><MultiTenantManagement /></RootOnly></Layout>} />
                        <Route path="/settings" element={<Layout><RootOnly><AdminSettings /></RootOnly></Layout>} />
                        
                        {/* User Profile Route */}
                        <Route path="/profile" element={<Layout><AuthenticatedOnly><UserProfile /></AuthenticatedOnly></Layout>} />
                        <Route path="/soc" element={<Layout><RootOnly><HackerTab /></RootOnly></Layout>} />
                        <Route path="/system" element={<Layout><RootOnly><SystemMonitor /></RootOnly></Layout>} />
                        <Route path="/root-setup" element={<RootAccountSetup />} />
                        
                        {/* Development/Test Routes */}
                        <Route path="/forms-demo" element={<Layout><FormsDemoPage /></Layout>} />
                        <Route path="/cloud-functions-test" element={<Layout><CloudFunctionsTestPage /></Layout>} />
                        
                        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                      </Routes>
                      </TenantAccessGuard>
                    </TenantProvider>
                  </AuthGuard>
                } />

                {/* Protected Routes (authentication required) */}
                <Route path="/*" element={
                  <AuthGuard>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Layout><HomePage /></Layout>} />
                      <Route path="/events" element={<Layout><EventsPage /></Layout>} />
                      <Route path="/events/:eventId" element={<Layout><EventDetailPage /></Layout>} />
                      <Route path="/test-navigation" element={<TestNavigation />} />
                      <Route path="/auth-debug" element={<AuthDebugPage />} />
                      <Route path="/locations" element={<Layout><LocationsPage /></Layout>} />
                      <Route path="/announcements" element={<Layout><UnifiedAnnouncementsPage /></Layout>} />
                      <Route path="/resources" element={<Layout><ResourcesPage /></Layout>} />
                      <Route path="/volunteer" element={<Layout><VolunteerPage /></Layout>} />
                      <Route path="/ecology" element={<Layout><EcologyPage /></Layout>} />
                      <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
                      <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
                      
                      {/* Authenticated Routes */}
                      <Route path="/chat" element={<Layout><AuthenticatedOnly><UnifiedChat /></AuthenticatedOnly></Layout>} />
                      <Route path="/feedback" element={<Layout><AuthenticatedOnly><FeedbackPage /></AuthenticatedOnly></Layout>} />
                      <Route path="/data-audit" element={<Layout><AuthenticatedOnly><DataAuditPage /></AuthenticatedOnly></Layout>} />
                      
                      {/* Admin Routes */}
                      <Route path="/analytics" element={<Layout><AdminOnly><AnalyticsDashboard /></AdminOnly></Layout>} />
                      <Route path="/analytics/test" element={<Layout><AdminOnly><AnalyticsTest /></AdminOnly></Layout>} />
                      <Route path="/locations" element={<Layout><AdminOnly><AdminLocations /></AdminOnly></Layout>} />
                      <Route path="/lists" element={<Layout><AdminOnly><AdminLists /></AdminOnly></Layout>} />
                      <Route path="/seasons" element={<Layout><AdminOnly><AdminSeasons /></AdminOnly></Layout>} />
                      <Route path="/fundraising" element={<Layout><AdminOnly><AdminFundraising /></AdminOnly></Layout>} />
                      <Route path="/finances" element={<Layout><AdminOnly><AdminFinances /></AdminOnly></Layout>} />
                      <Route path="/users" element={<Layout><AdminOnly><AdminUsers /></AdminOnly></Layout>} />
                      <Route path="/reminders" element={<Layout><AdminOnly><AdminReminders /></AdminOnly></Layout>} />
                      
                      {/* Root-only Routes */}
                      <Route path="/ai" element={<Layout><RootOnly><AdminAI /></RootOnly></Layout>} />
                      <Route path="/cost-management" element={<Layout><AdminOnly><AdminCostManagement /></AdminOnly></Layout>} />
                      <Route path="/multi-tenant" element={<Layout><RootOnly><MultiTenantManagement /></RootOnly></Layout>} />
                      <Route path="/settings" element={<Layout><RootOnly><AdminSettings /></RootOnly></Layout>} />
                      
                      {/* User Profile Route */}
                      <Route path="/profile" element={<Layout><AuthenticatedOnly><UserProfile /></AuthenticatedOnly></Layout>} />
                      <Route path="/soc" element={<Layout><RootOnly><HackerTab /></RootOnly></Layout>} />
                      <Route path="/system" element={<Layout><RootOnly><SystemMonitor /></RootOnly></Layout>} />
                      <Route path="/root-setup" element={<RootAccountSetup />} />
                      
                      {/* Development/Test Routes */}
                      <Route path="/forms-demo" element={<Layout><FormsDemoPage /></Layout>} />
                      <Route path="/cloud-functions-test" element={<Layout><CloudFunctionsTestPage /></Layout>} />
                      
                      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                    </Routes>
                  </AuthGuard>
                } />
              </Routes>
            </Router>
          </MultiTenantProvider>
        </AdminProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
