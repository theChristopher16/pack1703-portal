import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Users, 
  Shield, 
  BookOpen,
  Search
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'packing-list' | 'medical' | 'policy' | 'guide' | 'form' | 'reference';
  tags: string[];
  url?: string;
  fileType?: 'pdf' | 'doc' | 'image';
  lastUpdated: string;
  isActive: boolean;
}

const ResourcesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mock resources data - will be replaced with Firebase calls
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Camping Packing List',
      description: 'Complete checklist for overnight camping trips including tent, sleeping gear, clothing, and personal items.',
      category: 'packing-list',
      tags: ['camping', 'overnight', 'gear', 'checklist'],
      url: '/resources/camping-packing-list.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-15',
      isActive: true
    },
    {
      id: '2',
      title: 'Day Trip Packing List',
      description: 'Essential items for day trips and activities including water, snacks, first aid, and weather protection.',
      category: 'packing-list',
      tags: ['day-trip', 'essentials', 'weather', 'safety'],
      url: '/resources/day-trip-packing-list.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-15',
      isActive: true
    },
    {
      id: '3',
      title: 'Medical Form A',
      description: 'Required medical form for all scouts participating in activities. Must be completed annually.',
      category: 'medical',
      tags: ['medical', 'required', 'annual', 'health'],
      url: '/resources/medical-form-a.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    },
    {
      id: '4',
      title: 'Photo Release Form',
      description: 'Permission form for using photos of scouts in pack communications and social media.',
      category: 'form',
      tags: ['photo', 'permission', 'media', 'privacy'],
      url: '/resources/photo-release-form.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    },
    {
      id: '5',
      title: 'Pack 1703 Photo Policy',
      description: 'Guidelines for taking and sharing photos during pack activities and events.',
      category: 'policy',
      tags: ['photo', 'policy', 'guidelines', 'safety'],
      url: '/resources/photo-policy.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    },
    {
      id: '6',
      title: 'Scout Oath and Law',
      description: 'The Scout Oath and Law - fundamental principles that guide all scouting activities.',
      category: 'reference',
      tags: ['oath', 'law', 'principles', 'scouting'],
      url: '/resources/scout-oath-law.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    },
    {
      id: '7',
      title: 'What to Expect: Camping Trip',
      description: 'Guide for families new to camping, covering what to bring, what to expect, and safety tips.',
      category: 'guide',
      tags: ['camping', 'new-families', 'safety', 'expectations'],
      url: '/resources/camping-guide.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-15',
      isActive: true
    },
    {
      id: '8',
      title: 'What to Expect: Pinewood Derby',
      description: 'Complete guide to the Pinewood Derby including rules, car specifications, and race day information.',
      category: 'guide',
      tags: ['pinewood-derby', 'competition', 'rules', 'specifications'],
      url: '/resources/pinewood-derby-guide.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-02-01',
      isActive: true
    },
    {
      id: '9',
      title: 'Emergency Contact Information',
      description: 'Important phone numbers and contact information for pack leadership and emergency situations.',
      category: 'reference',
      tags: ['emergency', 'contacts', 'leadership', 'safety'],
      url: '/resources/emergency-contacts.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    },
    {
      id: '10',
      title: 'Uniform Guidelines',
      description: 'Proper uniform requirements for different events and activities, including placement of patches and insignia.',
      category: 'guide',
      tags: ['uniform', 'patches', 'insignia', 'requirements'],
      url: '/resources/uniform-guidelines.pdf',
      fileType: 'pdf',
      lastUpdated: '2024-01-01',
      isActive: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Resources', icon: BookOpen, color: 'bg-gray-100 text-gray-800' },
    { id: 'packing-list', name: 'Packing Lists', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { id: 'medical', name: 'Medical Forms', icon: Shield, color: 'bg-red-100 text-red-800' },
    { id: 'policy', name: 'Policies', icon: BookOpen, color: 'bg-purple-100 text-purple-800' },
    { id: 'guide', name: 'Guides', icon: BookOpen, color: 'bg-green-100 text-green-800' },
    { id: 'form', name: 'Forms', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'reference', name: 'Reference', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800' }
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

  const handleDownload = (resource: Resource) => {
    if (resource.url) {
      // TODO: Implement actual file download
      console.log(`Downloading: ${resource.title}`);
      // For now, just open in new tab
      window.open(resource.url, '_blank');
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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Access all the resources you need for scout activities, including packing lists, 
            medical forms, policies, and helpful guides for families.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-soft border border-gray-200/50 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-display font-semibold text-gray-900 mb-3">
                Search Resources
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-display font-semibold text-gray-900 mb-3">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-sm font-display font-semibold text-gray-900 mb-3">
                Popular Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-soft'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Tag Filters */}
          {selectedTags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-display font-semibold text-gray-900">Active filters:</span>
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-xl hover:from-primary-200 hover:to-secondary-200 transition-all duration-200"
                  >
                    {tag}
                    <span className="ml-2 text-primary-600 font-bold">×</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-sm text-primary-600 hover:text-primary-700 font-display font-semibold transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-soft border border-gray-200/50 overflow-hidden hover:shadow-glow-primary transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center mr-4 shadow-glow">
                      {React.createElement(getCategoryIcon(resource.category), { 
                        className: "h-6 w-6 text-white" 
                      })}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-gray-900 flex-1 group-hover:text-gradient transition-all duration-300">{resource.title}</h3>
                  </div>
                  {resource.fileType && (
                    <div className="ml-3">
                      {getFileTypeIcon(resource.fileType)}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">{resource.description}</p>

                {/* Category Badge */}
                <div className="mb-6">
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${getCategoryColor(resource.category)}`}>
                    {categories.find(c => c.id === resource.category)?.name}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {resource.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Last Updated */}
                <div className="text-sm text-gray-500 mb-6">
                  Last updated: {new Date(resource.lastUpdated).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {resource.url ? (
                    <button
                      onClick={() => handleDownload(resource)}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-display font-semibold rounded-xl text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300/50 transition-all duration-200 transform hover:scale-105 shadow-glow-primary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-display font-semibold rounded-xl text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </button>
                  )}
                  
                  {resource.url && (
                    <button
                      onClick={() => window.open(resource.url, '_blank')}
                      className="inline-flex items-center justify-center px-4 py-3 border-2 border-gray-200 text-sm font-display font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-300/50 transition-all duration-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredResources.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">No resources found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'No resources are currently available. Check back soon!'}
            </p>
          </div>
        )}

        {/* Quick Access Section */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 rounded-3xl p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-8 left-8 w-16 h-16 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/20 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">
              Quick <span className="text-gradient">Access</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-soft group-hover:shadow-glow-primary transition-all duration-300 transform group-hover:scale-110">
                  <Calendar className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">Event Calendar</h3>
                <p className="text-sm text-gray-600">View upcoming pack events and activities</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-soft group-hover:shadow-glow-primary transition-all duration-300 transform group-hover:scale-110">
                  <MapPin className="h-10 w-10 text-secondary-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">Locations</h3>
                <p className="text-sm text-gray-600">Find meeting places and event venues</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-soft group-hover:shadow-glow-primary transition-all duration-300 transform group-hover:scale-110">
                  <Users className="h-10 w-10 text-accent-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">Volunteer</h3>
                <p className="text-sm text-gray-600">Sign up for volunteer opportunities</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-soft group-hover:shadow-glow-primary transition-all duration-300 transform group-hover:scale-110">
                  <Shield className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">Safety</h3>
                <p className="text-sm text-gray-600">Safety guidelines and emergency info</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
