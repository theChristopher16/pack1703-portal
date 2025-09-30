import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Users, 
  Shield, 
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { Resource, ResourceCategory, resourceService } from '../services/resourceService';
import { ResourceManagementModal } from '../components/Resources';

// Resource interface is now imported from resourceService

const ResourcesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  
  const { state } = useAdmin();

  // Load resources from Firebase
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const resourcesData = await resourceService.getResources({ isActive: true });
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

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => resource.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Check if user can manage resources
  const canManageResources = state.currentUser && resourceService.canManageResources(state.currentUser);

  const handleDownload = async (resource: Resource) => {
    if (resource.url) {
      try {
        // Increment download count
        await resourceService.incrementDownloadCount(resource.id);
        
        // Open in new tab
        window.open(resource.url, '_blank');
      } catch (error) {
        console.error('Error downloading resource:', error);
        // Still try to open the URL even if count increment fails
        window.open(resource.url, '_blank');
      }
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
        await resourceService.deleteResource(resource.id);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
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
          
          {/* Add Resource Button */}
          {canManageResources && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Add New Resource
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resources...</p>
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
                          {getFileTypeIcon(resource.fileType)}
                          {resource.url && (
                            <button
                              onClick={() => handleDownload(resource)}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          {canManageResources && (
                            <div className="flex items-center space-x-1">
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

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {resource.description}
                      </p>

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
                        <span>Updated {new Date(resource.lastUpdated).toLocaleDateString()}</span>
                        {resource.url && (
                          <ExternalLink className="h-3 w-3" />
                        )}
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
      </div>
    </div>
  );
};

export default ResourcesPage;