import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  MapPin, 
  Users, 
  Shield, 
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  EyeOff,
  Heart,
  Upload,
  Eye,
  Package
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { Resource, ResourceSubmission, resourceService } from '../services/resourceService';
import { ResourceManagementModal, SubmissionReviewModal } from '../components/Resources';
import { useUserInteraction } from '../hooks/useUserInteraction';

// Resource interface is now imported from resourceService

const ResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const { trackUserAction } = useUserInteraction({
    componentName: 'ResourcesPage',
    componentPath: '/resources',
    trackComponentView: true
  });
  const [activeTab, setActiveTab] = useState<'resources' | 'inventory'>('resources');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [submittingTo, setSubmittingTo] = useState<Resource | null>(null);
  const [uploadingSubmission, setUploadingSubmission] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<ResourceSubmission[]>([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [reviewingResourceId, setReviewingResourceId] = useState<string | undefined>(undefined);
  
  const { state, hasRole } = useAdmin();
  
  const canManageInventory = hasRole('super-admin') || hasRole('content-admin') || hasRole('parent');

  // Load resources from Firebase
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const resourcesData = await resourceService.getResourcesWithLikeStatus({ isActive: true });
      console.log('🔍 Loaded resources:', resourcesData);
      resourcesData.forEach((resource, index) => {
        console.log(`🔍 Resource ${index}:`, {
          title: resource.title,
          url: resource.url,
          hasUrl: !!resource.url
        });
      });
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Resources', icon: BookOpen, color: 'bg-gray-100 text-gray-800' },
    { id: 'packing-list', name: 'Packing Lists', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { id: 'medical', name: 'Medical Forms', icon: Shield, color: 'bg-red-100 text-red-800' },
    { id: 'policy', name: 'Policies', icon: BookOpen, color: 'bg-purple-100 text-purple-800' },
    { id: 'guide', name: 'Guides', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    { id: 'form', name: 'Forms', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'reference', name: 'Reference', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'scout-handbook', name: 'Scout Handbook', icon: BookOpen, color: 'bg-orange-100 text-orange-800' },
    { id: 'advancement', name: 'Advancement', icon: BookOpen, color: 'bg-pink-100 text-pink-800' },
    { id: 'safety', name: 'Safety', icon: Shield, color: 'bg-red-100 text-red-800' },
    { id: 'camping', name: 'Camping', icon: MapPin, color: 'bg-green-100 text-green-800' },
    { id: 'hiking', name: 'Hiking', icon: MapPin, color: 'bg-green-100 text-green-800' },
    { id: 'cooking', name: 'Cooking', icon: BookOpen, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'crafts', name: 'Crafts', icon: BookOpen, color: 'bg-purple-100 text-purple-800' },
    { id: 'games', name: 'Games', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
    { id: 'ceremonies', name: 'Ceremonies', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'leadership', name: 'Leadership', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { id: 'fundraising', name: 'Fundraising', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    { id: 'uniform', name: 'Uniform', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
    { id: 'awards', name: 'Awards', icon: BookOpen, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'outdoor-skills', name: 'Outdoor Skills', icon: MapPin, color: 'bg-green-100 text-green-800' },
    { id: 'environmental', name: 'Environmental', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    { id: 'community-service', name: 'Community Service', icon: Users, color: 'bg-blue-100 text-blue-800' },
    { id: 'parent-resources', name: 'Parent Resources', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { id: 'den-specific', name: 'Den Specific', icon: Users, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'pack-specific', name: 'Pack Specific', icon: Users, color: 'bg-blue-100 text-blue-800' },
    { id: 'district', name: 'District', icon: BookOpen, color: 'bg-gray-100 text-gray-800' },
    { id: 'council', name: 'Council', icon: BookOpen, color: 'bg-gray-100 text-gray-800' },
    { id: 'national', name: 'National', icon: BookOpen, color: 'bg-gray-100 text-gray-800' }
  ];

  const allTags = Array.from(new Set(resources.flatMap(r => r.tags))).sort();

  const filteredResources = resources
    .filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => resource.tags.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      // Sort by like count (most liked first)
      const aLikes = a.likeCount || 0;
      const bLikes = b.likeCount || 0;
      
      if (bLikes !== aLikes) {
        return bLikes - aLikes;
      }
      
      // Then by last updated (newest first)
      return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleDescription = (resourceId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  // Check if user can manage resources (approve/reject resources from parents)
  const canManageResources = state.currentUser && resourceService.canManageResources(state.currentUser);
  
  // Allow all authenticated users to add resources (parents will require approval)
  const canAddResources = !!state.currentUser;
  
  // Debug logging
  console.log('🔍 ResourcesPage Debug:', {
    currentUser: state.currentUser,
    userRole: state.currentUser?.role,
    isAdmin: state.currentUser?.isAdmin,
    canManageResources: canManageResources
  });
  
  // Debug current user role for permission testing
  const isParent = state.currentUser?.role === 'parent';
  const isAdmin = state.currentUser?.role === 'super-admin' || state.currentUser?.role === 'root';
  
  console.log('🔍 User Permission Debug:', {
    isParent,
    isAdmin,
    userRole: state.currentUser?.role,
    shouldShowAdminButtons: canManageResources,
    shouldShowDownloadOnly: isParent
  });

  const handleDownload = async (resource: Resource) => {
    console.log('🔍 Download clicked for resource:', resource);
    console.log('🔍 Resource URL:', resource.url);
    
    if (resource.url) {
      try {
        console.log('🔍 Incrementing download count...');
        // Increment download count
        await resourceService.incrementDownloadCount(resource.id);
        console.log('🔍 Download count incremented successfully');
        
        // Create a temporary anchor element to trigger download (avoids popup blockers)
        console.log('🔍 Triggering download for:', resource.url);
        const link = document.createElement('a');
        link.href = resource.url;
        link.download = resource.fileName || resource.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading resource:', error);
        // Still try to download even if count increment fails
        console.log('🔍 Downloading despite error:', resource.url);
        const link = document.createElement('a');
        link.href = resource.url;
        link.download = resource.fileName || resource.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      console.warn('🔍 No URL found for resource:', resource.title);
      alert('No download URL available for this resource.');
    }
  };

  const handleLikeToggle = async (resource: Resource) => {
    try {
      if (resource.isLikedByCurrentUser) {
        await resourceService.unlikeResource(resource.id);
      } else {
        await resourceService.likeResource(resource.id);
      }
      
      // Reload resources to update like status
      await loadResources();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowManagementModal(true);
  };

  const handleDeleteResource = async (resource: Resource) => {
    if (window.confirm(`Are you sure you want to delete "${resource.title}"? This action cannot be undone.`)) {
      try {
        setDeletingResource(resource.id);
        // Pass the current user explicitly to avoid timing issues
        await resourceService.deleteResource(resource.id, state.currentUser);
        await loadResources(); // Refresh the list
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Failed to delete resource. Please try again.');
      } finally {
        setDeletingResource(null);
      }
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowManagementModal(false);
    setEditingResource(null);
  };

  const handleModalSave = async () => {
    await loadResources(); // Refresh the list
    handleModalClose();
  };

  const handleSubmitForm = async (resource: Resource) => {
    setSubmittingTo(resource);
  };

  const handleSubmissionUpload = async (file: File) => {
    if (!submittingTo) return;
    
    try {
      setUploadingSubmission(true);
      await resourceService.submitForm(submittingTo.id, file);
      alert(`Form submitted successfully for "${submittingTo.title}"!`);
      setSubmittingTo(null);
      // Reload user submissions
      if (state.currentUser) {
        const submissions = await resourceService.getUserSubmissions();
        setUserSubmissions(submissions);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setUploadingSubmission(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : BookOpen;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const getFileTypeIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'doc':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'image':
        return <FileText className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
            <span className="text-gradient">Resources</span> & Downloads
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Access all the resources you need for scout activities, including packing lists, 
            medical forms, policies, and helpful guides for families.
          </p>
          
          {/* Tab Navigation */}
          {canManageInventory && (
            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setActiveTab('resources')}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'resources'
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <FileText className="h-5 w-5" />
                Forms & Docs
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'inventory'
                    ? 'bg-gradient-to-r from-forest-600 to-ocean-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Package className="h-5 w-5" />
                Pack Inventory
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          {activeTab === 'resources' && (
            <div className="flex justify-center gap-4 flex-wrap mb-8">
              {canManageResources && (
                <button
                  onClick={() => {
                    setReviewingResourceId(undefined);
                    setShowSubmissionsModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Eye className="h-5 w-5" />
                  Review Submissions
                </button>
              )}
              {canAddResources && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Add New Resource
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resources...</p>
          </div>
        ) : activeTab === 'inventory' && canManageInventory ? (
          // Redirect to inventory page
          <div className="text-center py-12">
            <button
              onClick={() => navigate('/resources/inventory')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-forest-600 to-ocean-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Package className="h-6 w-6" />
              Go to Pack Inventory
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-soft border border-white/50">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="lg:w-64">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Filter by tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No resources found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
                    ? 'Try adjusting your search criteria'
                    : 'No resources are available at the moment'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => {
                  const CategoryIcon = getCategoryIcon(resource.category);
                  return (
                    <div
                      key={resource.id}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-white/50 hover:shadow-glow transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${getCategoryColor(resource.category)}`}>
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        <div className="flex items-center space-x-2">
                          {!resource.isPublic && (
                            <div className="p-1 text-gray-400" title="Private resource">
                              <EyeOff className="h-4 w-4" />
                            </div>
                          )}
                          <div className="p-1" title={`File type: ${resource.fileType || 'unknown'}`}>
                            {getFileTypeIcon(resource.fileType)}
                          </div>
                          <button
                            onClick={() => handleLikeToggle(resource)}
                            className={`p-2 transition-colors duration-200 relative z-10 ${
                              resource.isLikedByCurrentUser 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title={resource.isLikedByCurrentUser ? 'Unlike' : 'Like'}
                          >
                            <Heart className={`h-4 w-4 ${resource.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                          </button>
                          {/* Download button - visible to all users if file exists */}
                          {resource.url ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownload(resource);
                              }}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200 cursor-pointer relative z-10"
                              title="Download"
                              type="button"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="p-2 text-gray-300" title="No download available">
                              <Download className="h-4 w-4" />
                            </div>
                          )}
                          
                          {/* Upload button - visible to authenticated users if resource allows submissions */}
                          {resource.allowSubmissions && state.currentUser && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSubmitForm(resource);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 cursor-pointer relative z-10"
                              title="Submit your completed form"
                              type="button"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Admin-only buttons - only show for users who can manage resources */}
                          {canManageResources && (
                            <div className="flex items-center space-x-1">
                              {resource.allowSubmissions && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setReviewingResourceId(resource.id);
                                    setShowSubmissionsModal(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                                  title="Review submissions"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditResource(resource)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="Edit resource"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource)}
                                disabled={deletingResource === resource.id}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                title="Delete resource"
                              >
                                {deletingResource === resource.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                        {resource.title}
                      </h3>

                      <div className="mb-4">
                        <p className={`text-gray-600 text-sm ${expandedDescriptions.has(resource.id) ? '' : 'line-clamp-3'}`}>
                          {resource.description}
                        </p>
                        {resource.description.length > 150 && (
                          <button
                            onClick={() => toggleDescription(resource.id)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 transition-colors duration-200"
                          >
                            {expandedDescriptions.has(resource.id) ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{resource.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center space-x-1">
                            <Heart className={`h-3 w-3 ${resource.likeCount && resource.likeCount > 0 ? 'text-red-600' : ''}`} />
                            <span>{resource.likeCount || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>{resource.downloadCount || 0}</span>
                          </span>
                        </div>
                        <span>Updated {new Date(resource.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Resource Management Modals */}
        <ResourceManagementModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          mode="create"
        />

        <ResourceManagementModal
          isOpen={showManagementModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          resource={editingResource || undefined}
          mode="edit"
        />

        {/* Submission Modal */}
        {submittingTo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Submit Completed Form
              </h2>
              <p className="text-gray-600 mb-4">
                Upload your completed "{submittingTo.title}" form:
              </p>
              
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleSubmissionUpload(file);
                  }
                }}
                disabled={uploadingSubmission}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none hover:bg-gray-100 transition-colors duration-200 p-2"
              />
              
              {uploadingSubmission && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-primary-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                  <span>Uploading...</span>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSubmittingTo(null)}
                  disabled={uploadingSubmission}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Review Modal */}
        <SubmissionReviewModal
          isOpen={showSubmissionsModal}
          onClose={() => {
            setShowSubmissionsModal(false);
            setReviewingResourceId(undefined);
          }}
          resourceId={reviewingResourceId}
          onReviewComplete={() => {
            // Optionally reload resources or show notification
            console.log('Submission reviewed');
          }}
        />
      </div>
    </div>
  );
};

export default ResourcesPage;