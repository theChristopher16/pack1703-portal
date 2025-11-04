import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  memberCount?: number;
  eventCount?: number;
  locationCount?: number;
}

const OrganizationsPage: React.FC = () => {
  const { state, addNotification } = useAdmin();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  });

  // Check if user is super admin
  const isSuperAdmin = state.currentUser?.role === 'super-admin' || 
                      state.currentUser?.role === 'root';

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
      return;
    }
    loadOrganizations();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    } else {
      setFilteredOrganizations(organizations);
    }
  }, [searchTerm, organizations]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const orgs: Organization[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orgs.push({
          id: doc.id,
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isActive: data.isActive !== undefined ? data.isActive : true,
          memberCount: data.memberCount || 0,
          eventCount: data.eventCount || 0,
          locationCount: data.locationCount || 0,
        });
      });

      setOrganizations(orgs);
      setFilteredOrganizations(orgs);
    } catch (err: any) {
      console.error('Error loading organizations:', err);
      setError(err.message || 'Failed to load organizations');
      addNotification('error', 'Failed to load organizations', err.message || 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true
    });
    setSelectedOrg(null);
    setShowCreateModal(true);
  };

  const handleEdit = (org: Organization) => {
    setFormData({
      name: org.name,
      slug: org.slug,
      description: org.description || '',
      isActive: org.isActive
    });
    setSelectedOrg(org);
    setShowEditModal(true);
  };

  const handleDelete = (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      addNotification('error', 'Organization name is required', 'Please provide a name for the organization.');
      return;
    }

    const slug = formData.slug.trim() || generateSlug(formData.name);

    try {
      setIsSaving(true);
      setError(null);

      if (selectedOrg) {
        // Update existing organization
        const orgRef = doc(db, 'organizations', selectedOrg.id);
        await updateDoc(orgRef, {
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          updatedAt: new Date()
        });
        
        addNotification('success', 'Organization updated successfully', 'The organization has been updated.');
      } else {
        // Create new organization
        await addDoc(collection(db, 'organizations'), {
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
          memberCount: 0,
          eventCount: 0,
          locationCount: 0
        });
        
        addNotification('success', 'Organization created successfully', 'The organization has been created.');
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      await loadOrganizations();
    } catch (err: any) {
      console.error('Error saving organization:', err);
      setError(err.message || 'Failed to save organization');
      addNotification('error', 'Failed to save organization', err.message || 'Failed to save organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;

    try {
      setIsSaving(true);
      setError(null);

      await deleteDoc(doc(db, 'organizations', selectedOrg.id));
      
      addNotification('success', 'Organization deleted successfully', 'The organization has been deleted.');

      setShowDeleteModal(false);
      await loadOrganizations();
    } catch (err: any) {
      console.error('Error deleting organization:', err);
      setError(err.message || 'Failed to delete organization');
      addNotification('error', 'Failed to delete organization', err.message || 'Failed to delete organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigateToOrg = (orgSlug: string) => {
    // Navigate to the organization's portal
    // For now, we'll navigate to the pack1703 app with an organization context
    // In the future, this could be dynamic based on organization slug
    navigate(`/?org=${orgSlug}`);
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold text-ink mb-2 flex items-center gap-3">
                <Building2 className="w-10 h-10 text-forest-600" />
                Organizations
              </h1>
              <p className="text-lg text-teal-700">
                Manage multi-tenant organizations and their portals
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="solarpunk-btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Organization
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600 w-5 h-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="ml-3 text-teal-700">Loading organizations...</span>
          </div>
        ) : (
          /* Organizations Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <Building2 className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-ink mb-2">No organizations found</h3>
                <p className="text-teal-700 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first organization'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreate}
                    className="solarpunk-btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                    Create Organization
                  </button>
                )}
              </div>
            ) : (
              filteredOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="solarpunk-card group hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-ink mb-1">
                          {org.name}
                        </h3>
                        <p className="text-sm text-teal-600 font-mono">/{org.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {org.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {org.description && (
                      <p className="text-forest-600 mb-4 line-clamp-2">
                        {org.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-ink">{org.memberCount || 0}</p>
                        <p className="text-xs text-forest-600">Members</p>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-ink">{org.eventCount || 0}</p>
                        <p className="text-xs text-forest-600">Events</p>
                      </div>
                      <div className="text-center">
                        <MapPin className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-ink">{org.locationCount || 0}</p>
                        <p className="text-xs text-forest-600">Locations</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-teal-100">
                      <button
                        onClick={() => handleNavigateToOrg(org.slug)}
                        className="flex-1 solarpunk-btn-secondary text-sm py-2"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Portal
                      </button>
                      <button
                        onClick={() => handleEdit(org)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit organization"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete organization"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-teal-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-ink">Create Organization</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value)
                    });
                  }}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Pack 1703"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  placeholder="e.g., pack1703"
                />
                <p className="text-xs text-forest-600 mt-1">
                  Auto-generated from name if left empty
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Brief description of the organization..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-ink">
                  Active (organization is accessible)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-teal-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="solarpunk-btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Organization
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-teal-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-ink">Edit Organization</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="isActiveEdit" className="ml-2 text-sm text-ink">
                  Active (organization is accessible)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-teal-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="solarpunk-btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-teal-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-ink">Delete Organization</h2>
                  <p className="text-sm text-forest-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-forest-700 mb-4">
                Are you sure you want to delete <strong>{selectedOrg.name}</strong>? 
                This will permanently remove the organization and all associated data.
              </p>
            </div>

            <div className="p-6 border-t border-teal-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Organization
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;

