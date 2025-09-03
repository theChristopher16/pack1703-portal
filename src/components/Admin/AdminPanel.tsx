import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Megaphone, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Shield,
  Crown,
  Star,
  Heart,
  User,
  UserCheck,
  Mail,
  Bell,
  FileText,
  Database,
  Activity,
  TrendingUp,
  Cog,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MessageSquare,
  Bot
} from 'lucide-react';
import { UserRole } from '../../services/authService';
import RoleBadge from '../ui/RoleBadge';

interface AdminPanelProps {
  className?: string;
  currentUser?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ className = '', currentUser }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Helper function to check if user has at least a specific role
  const hasAtLeastRole = (role: UserRole): boolean => {
    if (!currentUser?.role) return false;
    
    const roleHierarchy: Record<string, number> = {
      [UserRole.ANONYMOUS]: 0,
      [UserRole.PARENT]: 1,
      [UserRole.VOLUNTEER]: 2,
      [UserRole.ADMIN]: 3,
      [UserRole.ROOT]: 4
    };
    
    return roleHierarchy[currentUser.role] >= roleHierarchy[role];
  };

  // Role-based section access
  const getAvailableSections = () => {
    const sections = [];

    // ANONYMOUS - No admin access
    if (currentUser?.role === UserRole.ANONYMOUS) {
      return [];
    }

    // PARENT - Basic family management
    if (hasAtLeastRole(UserRole.PARENT)) {
      sections.push(
        { id: 'dashboard', name: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
        { id: 'family', name: 'Family Management', icon: Heart, color: 'text-purple-600' },
        { id: 'events', name: 'Events', icon: Calendar, color: 'text-green-600' },
        { id: 'chat', name: 'Chat', icon: MessageSquare, color: 'text-indigo-600' }
      );
    }

    // VOLUNTEER - Den-level management
    if (hasAtLeastRole(UserRole.VOLUNTEER)) {
      sections.push(
        { id: 'den', name: 'Den Management', icon: Users, color: 'text-emerald-600' },
        { id: 'volunteers', name: 'Volunteer Hub', icon: Star, color: 'text-orange-600' },
        { id: 'announcements', name: 'Announcements', icon: Megaphone, color: 'text-pink-600' }
      );
    }

    // ADMIN - Pack-level management (including LLM access)
    if (hasAtLeastRole(UserRole.ADMIN)) {
      sections.push(
        { id: 'users', name: 'User Management', icon: Shield, color: 'text-red-600' },
        { id: 'locations', name: 'Locations', icon: MapPin, color: 'text-cyan-600' },
        { id: 'invites', name: 'Invitations', icon: Mail, color: 'text-violet-600' },
        { id: 'analytics', name: 'Analytics', icon: TrendingUp, color: 'text-teal-600' },
        { id: 'costs', name: 'Cost Management', icon: DollarSign, color: 'text-amber-600' },
        { id: 'llm', name: 'AI Assistant', icon: Bot, color: 'text-purple-600' }
      );
    }

    // ROOT - Full system access
    if (hasAtLeastRole(UserRole.ROOT)) {
      sections.push(
        { id: 'system', name: 'System Settings', icon: Cog, color: 'text-gray-600' },
        { id: 'security', name: 'Security', icon: Key, color: 'text-red-700' },
        { id: 'logs', name: 'Audit Logs', icon: FileText, color: 'text-slate-600' },
        { id: 'database', name: 'Database', icon: Database, color: 'text-blue-700' }
      );
    }

    return sections;
  };

  const getRoleWelcomeMessage = () => {
    if (currentUser?.role === UserRole.ROOT) {
      return {
        title: "System Owner Dashboard",
        subtitle: "Complete system control and oversight",
        icon: Crown,
        color: "text-yellow-600"
      };
    } else if (currentUser?.role === UserRole.ADMIN) {
      return {
        title: "Pack Administrator Dashboard",
        subtitle: "Full pack management and oversight",
        icon: Shield,
        color: "text-purple-600"
      };
    } else if (currentUser?.role === UserRole.VOLUNTEER) {
      return {
        title: "Volunteer Dashboard",
        subtitle: "Den-level management and coordination",
        icon: Star,
        color: "text-green-600"
      };
    } else if (currentUser?.role === UserRole.PARENT) {
      return {
        title: "Family Dashboard",
        subtitle: "Family management and pack participation",
        icon: Heart,
        color: "text-blue-600"
      };
    }
    return {
      title: "Welcome",
      subtitle: "Limited access",
      icon: User,
      color: "text-gray-600"
    };
  };

  const renderSectionContent = () => {
    const welcome = getRoleWelcomeMessage();
    const IconComponent = welcome.icon;

    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-gradient-to-br from-white to-gray-50/50 ${welcome.color}`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{welcome.title}</h1>
                  <p className="text-gray-600">{welcome.subtitle}</p>
                </div>
                <div className="ml-auto">
                  <RoleBadge 
                    role={currentUser?.role || UserRole.ANONYMOUS} 
                    size="lg" 
                    showIcon={true}
                  />
                </div>
              </div>
            </div>

            {/* Role-specific Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hasAtLeastRole(UserRole.PARENT) && (
                <>
                  <QuickActionCard
                    title="Family Profile"
                    description="Update family information and preferences"
                    icon={Heart}
                    color="text-purple-600"
                    onClick={() => setActiveSection('family')}
                  />
                  <QuickActionCard
                    title="Event RSVPs"
                    description="View and manage event registrations"
                    icon={Calendar}
                    color="text-green-600"
                    onClick={() => setActiveSection('events')}
                  />
                  <QuickActionCard
                    title="Chat"
                    description="Communicate with den and pack"
                    icon={MessageSquare}
                    color="text-indigo-600"
                    onClick={() => setActiveSection('chat')}
                  />
                </>
              )}

              {hasAtLeastRole(UserRole.VOLUNTEER) && (
                <>
                  <QuickActionCard
                    title="Den Management"
                    description="Manage den members and activities"
                    icon={Users}
                    color="text-emerald-600"
                    onClick={() => setActiveSection('den')}
                  />
                  <QuickActionCard
                    title="Volunteer Hub"
                    description="Coordinate volunteer activities"
                    icon={Star}
                    color="text-orange-600"
                    onClick={() => setActiveSection('volunteers')}
                  />
                  <QuickActionCard
                    title="Announcements"
                    description="Create and manage den announcements"
                    icon={Megaphone}
                    color="text-pink-600"
                    onClick={() => setActiveSection('announcements')}
                  />
                </>
              )}

              {hasAtLeastRole(UserRole.ADMIN) && (
                <>
                  <QuickActionCard
                    title="User Management"
                    description="Manage pack members and roles"
                    icon={Shield}
                    color="text-red-600"
                    onClick={() => setActiveSection('users')}
                  />
                  <QuickActionCard
                    title="Cost Management"
                    description="Monitor API usage and costs"
                    icon={DollarSign}
                    color="text-amber-600"
                    onClick={() => setActiveSection('costs')}
                  />
                  <QuickActionCard
                    title="AI Assistant"
                    description="Access AI-powered assistance"
                    icon={Bot}
                    color="text-purple-600"
                    onClick={() => setActiveSection('llm')}
                  />
                </>
              )}

              {hasAtLeastRole(UserRole.ROOT) && (
                <>
                  <QuickActionCard
                    title="System Settings"
                    description="Configure system-wide settings"
                    icon={Cog}
                    color="text-gray-600"
                    onClick={() => setActiveSection('system')}
                  />
                  <QuickActionCard
                    title="Security"
                    description="Manage security and access controls"
                    icon={Key}
                    color="text-red-700"
                    onClick={() => setActiveSection('security')}
                  />
                  <QuickActionCard
                    title="Audit Logs"
                    description="Review system activity logs"
                    icon={FileText}
                    color="text-slate-600"
                    onClick={() => setActiveSection('logs')}
                  />
                </>
              )}
            </div>

            {/* System Status */}
            {(hasAtLeastRole(UserRole.ADMIN)) && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  System Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatusCard
                    title="API Health"
                    status="healthy"
                    icon={CheckCircle}
                    color="text-green-600"
                  />
                  <StatusCard
                    title="Database"
                    status="connected"
                    icon={Database}
                    color="text-blue-600"
                  />
                  <StatusCard
                    title="Costs Today"
                    status="$0.03"
                    icon={DollarSign}
                    color="text-amber-600"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'llm':
        return hasAtLeastRole(UserRole.ADMIN) ? (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-600" />
                AI Assistant
              </h2>
              <p className="text-gray-600 mb-4">This section is only available to administrators and system owners.</p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">AI Features Available:</h3>
                <ul className="text-purple-700 space-y-1">
                  <li>• Chat assistance for administrative tasks</li>
                  <li>• Event planning and coordination</li>
                  <li>• Content generation and editing</li>
                  <li>• Data analysis and insights</li>
                  <li>• Multi-tenant collaboration</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <AccessDeniedSection />
        );

      case 'costs':
        return hasAtLeastRole(UserRole.ADMIN) ? (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Management</h2>
              <p className="text-gray-600">This section is only available to administrators and system owners.</p>
            </div>
          </div>
        ) : (
          <AccessDeniedSection />
        );

      case 'system':
        return hasAtLeastRole(UserRole.ROOT) ? (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600">This section is only available to system owners.</p>
            </div>
          </div>
        ) : (
          <AccessDeniedSection />
        );

      default:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {getAvailableSections().find(s => s.id === activeSection)?.name || 'Section'}
              </h2>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center">
        <div className="text-center">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const availableSections = getAvailableSections();

  if (availableSections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Admin Access</h2>
          <p className="text-gray-600">Your current role doesn't have access to the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 ${className}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-white/50 shadow-soft min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>

            {/* User Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <RoleBadge 
                    role={currentUser.role || UserRole.ANONYMOUS} 
                    size="sm" 
                    showIcon={true}
                  />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {availableSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${section.color}`} />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-105"
  >
    <div className={`p-3 rounded-full bg-gradient-to-br from-white to-gray-50/50 w-fit mb-4 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </button>
);

const StatusCard: React.FC<{
  title: string;
  status: string;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, status, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
    <Icon className={`w-5 h-5 ${color}`} />
    <div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-600">{status}</p>
    </div>
  </div>
);

const AccessDeniedSection: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center">
    <div className="text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600">You don't have permission to access this section.</p>
    </div>
  </div>
);

export default AdminPanel;
