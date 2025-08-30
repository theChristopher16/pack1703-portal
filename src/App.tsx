import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Layout from './components/Layout/Layout';
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import LocationsPage from './pages/LocationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ResourcesPage from './pages/ResourcesPage';
import VolunteerPage from './pages/VolunteerPage';
import FeedbackPage from './pages/FeedbackPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import AnalyticsTest from './components/Analytics/AnalyticsTest';
import FormsDemoPage from './pages/FormsDemoPage';
import CloudFunctionsTestPage from './pages/CloudFunctionsTestPage';
import NotFoundPage from './pages/NotFoundPage';
import EventDetailPage from './pages/EventDetailPage';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminLocations from './pages/AdminLocations';
import AdminAnnouncements from './pages/AdminAnnouncements';
import { AdminProvider } from './contexts/AdminContext';

// Styles
import './App.css';
import './styles/accessibility.css';

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <AdminProvider>
      <Router>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/events" element={<Layout><EventsPage /></Layout>} />
          <Route path="/events/:eventId" element={<Layout><EventDetailPage /></Layout>} />
          <Route path="/locations" element={<Layout><LocationsPage /></Layout>} />
          <Route path="/announcements" element={<Layout><AnnouncementsPage /></Layout>} />
          <Route path="/resources" element={<Layout><ResourcesPage /></Layout>} />
          <Route path="/volunteer" element={<Layout><VolunteerPage /></Layout>} />
          <Route path="/feedback" element={<Layout><FeedbackPage /></Layout>} />
          <Route path="/analytics" element={<Layout><AnalyticsDashboard /></Layout>} />
          <Route path="/analytics/test" element={<Layout><AnalyticsTest /></Layout>} />
          <Route path="/forms-demo" element={<Layout><FormsDemoPage /></Layout>} />
          <Route path="/cloud-functions-test" element={<Layout><CloudFunctionsTestPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
          
          {/* Admin Routes with AdminLayout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/events" element={<AdminLayout><AdminEvents /></AdminLayout>} />
          <Route path="/admin/locations" element={<AdminLayout><AdminLocations /></AdminLayout>} />
          <Route path="/admin/announcements" element={<AdminLayout><AdminAnnouncements /></AdminLayout>} />
          <Route path="/admin/lists" element={<AdminLayout><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-gray-900">Admin Lists - Coming Soon</h1></div></AdminLayout>} />
          <Route path="/admin/volunteer" element={<AdminLayout><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-gray-900">Admin Volunteer - Coming Soon</h1></div></AdminLayout>} />
          <Route path="/admin/seasons" element={<AdminLayout><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-gray-900">Admin Seasons - Coming Soon</h1></div></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-gray-900">Admin Users - Coming Soon</h1></div></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-gray-900">Admin Settings - Coming Soon</h1></div></AdminLayout>} />
          
          <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
        </Routes>
      </Router>
    </AdminProvider>
  );
}

export default App;
