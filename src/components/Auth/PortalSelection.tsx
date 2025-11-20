import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, authService } from '../../services/authService';
import { 
  Building2, 
  Users, 
  Shield, 
  Home,
  ArrowRight,
  Network
} from 'lucide-react';

interface Portal {
  id: string;
  name: string;
  description: string;
  path: string;
  role: UserRole;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const PortalSelection: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [redirecting, setRedirecting] = React.useState(false);
  
  // Get all user roles (multi-role support)
  const userRoles = currentUser ? authService.getUserRoles(currentUser) : [];
  
  // Define available portals based on roles
  const availablePortals: Portal[] = [];
  
  // Copse Admin Portal
  if (userRoles.includes(UserRole.COPSE_ADMIN)) {
    availablePortals.push({
      id: 'copse-admin',
      name: 'Copse Admin Portal',
      description: 'Network-wide administration across all organizations',
      path: '/copse-admin',
      role: UserRole.COPSE_ADMIN,
      icon: <Network className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    });
  }
  
  // Super Admin Portal (Organizations)
  if (userRoles.includes(UserRole.SUPER_ADMIN)) {
    availablePortals.push({
      id: 'organizations',
      name: 'Organizations',
      description: 'Manage multiple organizations and network settings',
      path: '/organizations',
      role: UserRole.SUPER_ADMIN,
      icon: <Building2 className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    });
  }
  
  // Pack/Organization Portal (for admins, den leaders, parents)
  if (userRoles.some(role => 
    [UserRole.ADMIN, UserRole.DEN_LEADER, UserRole.PARENT, UserRole.AI_ASSISTANT].includes(role)
  )) {
    availablePortals.push({
      id: 'pack1703',
      name: 'Pack 1703 Portal',
      description: 'Access your pack events, announcements, and activities',
      path: '/pack1703/',
      role: UserRole.PARENT, // Default role for pack portal
      icon: <Home className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100 border-green-200'
    });
  }
  
  // If only one portal available, redirect automatically
  React.useEffect(() => {
    if (availablePortals.length === 1 && !redirecting && currentUser) {
      setRedirecting(true);
      navigate(availablePortals[0].path, { replace: true });
    }
  }, [availablePortals.length, navigate, redirecting, currentUser]);
  
  if (!currentUser) {
    return null;
  }
  
  if (availablePortals.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-ocean-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
          <p className="text-forest-700">Redirecting to {availablePortals[0].name}...</p>
        </div>
      </div>
    );
  }
  
  // If no portals available, show error
  if (availablePortals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-ocean-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Portal Access</h2>
          <p className="text-gray-600 mb-6">
            You don't have access to any portals. Please contact your administrator.
          </p>
          <button
            onClick={() => authService.signOut()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handlePortalSelect = (portal: Portal) => {
    // Store selected portal in session storage for future visits
    sessionStorage.setItem('selected_portal', portal.id);
    navigate(portal.path, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-ocean-50 p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-forest-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Select Your Portal
            </h1>
            <p className="text-gray-600">
              You have access to multiple portals. Choose where you'd like to go.
            </p>
            {currentUser.displayName && (
              <p className="text-sm text-gray-500 mt-2">
                Signed in as <span className="font-medium">{currentUser.displayName}</span>
              </p>
            )}
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {availablePortals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => handlePortalSelect(portal)}
                className={`${portal.bgColor} border-2 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:scale-105 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${portal.color} p-3 rounded-lg bg-white`}>
                    {portal.icon}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {portal.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {portal.description}
                </p>
                <div className="mt-4">
                  <span className={`text-xs font-medium ${portal.color} bg-white px-2 py-1 rounded`}>
                    {portal.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <button
              onClick={() => authService.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSelection;

