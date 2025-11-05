import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import configService from './services/configService';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import ScrollToTop from './components/ScrollToTop';
import { versionCheckService } from './services/versionCheckService';

// Components
import Layout from './components/Layout/Layout';
import { AdminOnly, RootOnly, AuthenticatedOnly, SuperUserOnly } from './components/Auth/RoleGuard';
import AuthGuard from './components/Auth/AuthGuard';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import ArchivedEventsPage from './pages/ArchivedEventsPage';
import LocationsPage from './pages/LocationsPage';
import UnifiedAnnouncementsPage from './pages/UnifiedAnnouncementsPage';
import ResourcesPage from './pages/ResourcesPage';
import InventoryPage from './pages/InventoryPage';
import VolunteerPage from './pages/VolunteerPage';
import PasswordResetPage from './pages/PasswordResetPage';
import PasswordSetupPage from './pages/PasswordSetupPage';
import EcologyPage from './pages/EcologyPage';
import FeedbackPage from './pages/FeedbackPage';
import DataAuditPage from './pages/DataAuditPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DuesInformation from './pages/DuesInformation';
import FundraisingPage from './pages/FundraisingPage';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import AnalyticsTest from './components/Analytics/AnalyticsTest';
import UserInteractionDashboard from './components/Analytics/UserInteractionDashboard';
import FormsDemoPage from './pages/FormsDemoPage';
import CloudFunctionsTestPage from './pages/CloudFunctionsTestPage';
import NotFoundPage from './pages/NotFoundPage';
import EventDetailPage from './pages/EventDetailPage';
import TestNavigation from './pages/TestNavigation';
import AuthDebugPage from './pages/AuthDebugPage';

// Admin Pages
import AdminLocations from './pages/AdminLocations';
import UnifiedChat from './components/Chat/UnifiedChat';
// AdminAI removed - AI functionality disabled
import AdminLists from './pages/AdminLists';
import AdminSeasons from './pages/AdminSeasons';
import AdminFundraising from './pages/AdminFundraising';
import AdminFinances from './pages/AdminFinances';
import AdminCostManagement from './pages/AdminCostManagement';
import JoinPage from './pages/JoinPage';
import RootAccountSetup from './pages/RootAccountSetup';
import HackerTab from './pages/HackerTab';
import AdminSettings from './pages/AdminSettings';
import UserProfile from './pages/UserProfile';
import AdminReminders from './pages/AdminReminders';
import AdminUsers from './pages/AdminUsers';
import SystemMonitor from './components/Admin/SystemMonitor';
import OrganizationsPage from './pages/OrganizationsPage';
import InitializePack1703Page from './pages/InitializePack1703Page';
import OrganizationRouter from './components/OrganizationRouter';
import PackRouter from './components/PackRouter';
import { AdminProvider } from './contexts/AdminContext';

function App() {
  useEffect(() => {
    // Disable browser scroll restoration to prevent automatic scrolling on page load
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
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
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes (no authentication required) */}
              <Route path="/reset-password" element={<PasswordResetPage />} />
              <Route path="/password-setup" element={<PasswordSetupPage />} />
              <Route path="/join/:inviteId" element={<JoinPage />} />
              
              {/* Protected Routes (authentication required) */}
              <Route path="/*" element={
                <AuthGuard>
                  <Routes>
                    {/* Super Admin Routes - Must come before other routes */}
                    <Route path="/organizations" element={<Layout><SuperUserOnly><OrganizationsPage /></SuperUserOnly></Layout>} />
                    <Route path="/initialize-pack1703" element={<Layout><SuperUserOnly><InitializePack1703Page /></SuperUserOnly></Layout>} />
                    
                    {/* Pack 1703 Routes - All Pack app routes under /pack1703 */}
                    <Route path="/pack1703/*" element={<PackRouter />} />
                    
                    {/* Organization Router - Handles other org routes (must come after pack1703) */}
                    <Route path="/:orgSlug/:componentSlug?" element={<OrganizationRouter />} />
                    
                    {/* Root route - Only redirect here if not Pack 1703 and not super admin */}
                    <Route path="/" element={<Layout><HomePage /></Layout>} />
                    
                    <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                  </Routes>
                </AuthGuard>
              } />
            </Routes>
          </Router>
        </AdminProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
