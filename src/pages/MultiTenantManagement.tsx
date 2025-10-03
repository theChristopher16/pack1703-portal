import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMultiTenant } from '../contexts/MultiTenantContext';
import { authService } from '../services/authService';
import { 
  Building2, 
  Users, 
  Globe, 
  Plus, 
  Settings, 
  ArrowRight, 
  Shield, 
  Star,
  Calendar,
  MapPin,
  MessageSquare,
  FileText,
  BarChart3,
  DollarSign,
  Heart,
  UserPlus,
  Bot,
  Sparkles
} from 'lucide-react';

const MultiTenantManagement: React.FC = () => {
  const { 
    state, 
    createCategory, 
    createOrganization, 
    loadCategories, 
    loadUserOrganizations,
    // switchOrganization,
    clearError 
  } = useMultiTenant();
  
  const [activeTab, setActiveTab] = useState<'tenants' | 'categories' | 'organizations' | 'collaborations' | 'ai'>('categories');
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const { tenantId } = useTenant();
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateOrganization, setShowCreateOrganization] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '🏢',
    color: '#3B82F6'
  });
  
  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    website: '',
    type: 'scout_pack' as const,
    size: 'medium' as const,
    region: '',
    tags: [] as string[]
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadCategories();
    loadUserOrganizations();
    // Super-admin tenant directory (client-side minimal: requires server to page in real usage)
    (async () => {
      try {
        // Minimal read: load just current tenant for preview to avoid cross-tenant queries on client
        const ref = doc(db, 'tenants', tenantId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setTenants([{ id: snap.id, ...snap.data() }]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [loadCategories, loadUserOrganizations, tenantId]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createCategory({
      ...categoryForm,
      isActive: true,
      createdBy: currentUser?.uid || '',
      settings: {
        allowCrossOrganizationCollaboration: true,
        requireApprovalForCollaboration: false,
        maxOrganizationsPerCategory: 100,
        allowedFeatures: ['events', 'locations', 'announcements', 'resources', 'chat', 'analytics', 'fundraising', 'finances', 'volunteer', 'ai'],
        customFields: {}
      }
    });

    if (result.success) {
      setShowCreateCategory(false);
      setCategoryForm({ name: '', description: '', icon: '🏢', color: '#3B82F6' });
      clearError();
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    const result = await createOrganization({
      categoryId: selectedCategory,
      ...organizationForm,
      isActive: true,
      createdBy: currentUser?.uid || '',
      settings: {
        allowPublicAccess: true,
        requireInvitation: false,
        allowCrossOrganizationChat: true,
        allowCrossOrganizationEvents: true,
        allowCrossOrganizationResources: true,
        customBranding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        features: {
          events: true,
          locations: true,
          announcements: true,
          resources: true,
          chat: true,
          analytics: true,
          fundraising: true,
          finances: true,
          volunteer: true,
          ai: true
        }
      },
      metadata: {
        type: organizationForm.type,
        size: organizationForm.size,
        region: organizationForm.region,
        tags: organizationForm.tags,
        customFields: {}
      }
    });

    if (result.success) {
      setShowCreateOrganization(false);
      setOrganizationForm({ name: '', description: '', contactEmail: '', website: '', type: 'scout_pack', size: 'medium', region: '', tags: [] });
      setSelectedCategory('');
      clearError();
    }
  };

  const getCategoryIcon = (icon: string) => {
    return <span className="text-2xl">{icon}</span>;
  };

  const getOrganizationTypeIcon = (type: string) => {
    switch (type) {
      case 'scout_pack': return <Shield className="w-5 h-5" />;
      case 'sports_team': return <Star className="w-5 h-5" />;
      case 'community_group': return <Users className="w-5 h-5" />;
      case 'school': return <Building2 className="w-5 h-5" />;
      case 'church': return <Globe className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  const getOrganizationSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'large': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Multi-Tenant Management
        </h1>
        <p className="text-gray-600">
          Manage categories, organizations, and cross-organization collaborations
        </p>
      </div>

      {/* Current Organization Info */}
      {state.currentOrganization && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {state.currentOrganization.name}
                </h2>
                <p className="text-gray-600">
                  {state.currentOrganization.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Current Organization</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-2 mb-8">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'tenants'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenants</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'organizations'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organizations</span>
        </button>
        <button
          onClick={() => setActiveTab('collaborations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'collaborations'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Collaborations</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Sessions</span>
        </button>
      </div>
      {/* Tenants Tab (Super Admin Lens) */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Pack</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Square</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3">{t.packNumber}</td>
                    <td className="px-4 py-3">{t.slug}</td>
                    <td className="px-4 py-3">{t.status || 'active'}</td>
                    <td className="px-4 py-3">{t.features?.squarePayments ? 'Connected' : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="px-3 py-1 text-sm rounded-lg bg-blue-600 text-white"
                        onClick={() => setSelectedTenant(t)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tenant Manage Drawer */}
          {selectedTenant && (
            <div className="fixed inset-0 bg-black/40 flex items-end md:items-center md:justify-center z-50">
              <div className="bg-white rounded-2xl w-full md:max-w-xl p-6" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Manage {selectedTenant.name}</h3>
                  <button className="text-gray-500" onClick={() => setSelectedTenant(null)}>✕</button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Square</div>
                        <div className="text-sm text-gray-600">Connect or manage Square for this tenant.</div>
                      </div>
                      <button
                        className="px-3 py-2 rounded-lg bg-green-600 text-white"
                        onClick={() => {
                          // POST to squareConnectStart with x-tenant header
                          // Frontend wiring later; placeholder button
                          alert('Square connect flow will start here');
                        }}
                      >
                        {selectedTenant.features?.squarePayments ? 'Reconnect' : 'Connect Square'}
                      </button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Tenant</div>
                        <div className="text-sm text-gray-600">Set this tenant as your default landing after login.</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white"
                          onClick={() => {
                            try {
                              localStorage.setItem('defaultTenantSlug', selectedTenant.slug || selectedTenant.id);
                              alert(`Default tenant set to ${selectedTenant.slug || selectedTenant.id}`);
                            } catch {}
                          }}
                        >
                          Set as default
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800"
                          onClick={() => {
                            try {
                              localStorage.removeItem('defaultTenantSlug');
                              alert('Default tenant cleared');
                            } catch {}
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <button
              onClick={() => setShowCreateCategory(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.availableCategories.map((category) => (
              <div key={category.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-3xl">{getCategoryIcon(category.icon)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.organizationCount} organizations</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Settings</span>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
            <button
              onClick={() => setShowCreateOrganization(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.userOrganizations.map((org) => (
              <div key={org.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    {getOrganizationTypeIcon(org.metadata.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-600">{org.memberCount} members</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{org.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrganizationSizeColor(org.metadata.size)}`}>
                    {org.metadata.size}
                  </span>
                  <span className="text-sm text-gray-500">{org.metadata.region}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <Heart className="w-4 h-4 text-gray-400" />
                    <UserPlus className="w-4 h-4 text-gray-400" />
                    <Bot className="w-4 h-4 text-gray-400" />
                  </div>
                  {org.id === state.currentOrganization?.id && (
                    <span className="text-xs text-blue-600 font-medium">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborations Tab */}
      {activeTab === 'collaborations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Cross-Organization Collaborations</h2>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft">
              <Plus className="w-4 h-4" />
              <span>New Collaboration</span>
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collaborations Yet</h3>
              <p className="text-gray-600 mb-4">
                Start collaborating with other organizations to share resources, events, and more.
              </p>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft">
                Create First Collaboration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Sessions Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">AI Collaboration Sessions</h2>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft">
              <Sparkles className="w-4 h-4" />
              <span>New AI Session</span>
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Sessions Yet</h3>
              <p className="text-gray-600 mb-4">
                Start AI-powered collaboration sessions to coordinate with other organizations.
              </p>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-soft">
                Start AI Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="🏢"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-xl"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCategory(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state.isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrganization && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Organization</h3>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {state.availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={organizationForm.name}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={organizationForm.description}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={organizationForm.contactEmail}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input
                  type="url"
                  value={organizationForm.website}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={organizationForm.type}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scout_pack">Scout Pack</option>
                  <option value="sports_team">Sports Team</option>
                  <option value="community_group">Community Group</option>
                  <option value="school">School</option>
                  <option value="church">Church</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  value={organizationForm.size}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, size: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small (1-50 members)</option>
                  <option value="medium">Medium (51-200 members)</option>
                  <option value="large">Large (200+ members)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  value={organizationForm.region}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco Bay Area"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOrganization(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state.isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTenantManagement;
