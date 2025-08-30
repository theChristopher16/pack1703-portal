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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources & Downloads</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Access all the resources you need for Pack 1703 activities, including packing lists, 
          medical forms, policies, and helpful guides for families.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Resources
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="Search by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popular Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 6).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full hover:bg-indigo-200"
                >
                  {tag}
                  <span className="ml-1 text-indigo-600">×</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  {React.createElement(getCategoryIcon(resource.category), { 
                    className: "h-5 w-5 text-indigo-600 mr-2" 
                  })}
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{resource.title}</h3>
                </div>
                {resource.fileType && (
                  <div className="ml-2">
                    {getFileTypeIcon(resource.fileType)}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>

              {/* Category Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                  {categories.find(c => c.id === resource.category)?.name}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                  >
                    {/* Removed Tag icon as it's no longer imported */}
                    {tag}
                  </span>
                ))}
              </div>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 mb-4">
                Last updated: {new Date(resource.lastUpdated).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {resource.url ? (
                  <button
                    onClick={() => handleDownload(resource)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View
                  </button>
                )}
                
                {resource.url && (
                  <button
                    onClick={() => window.open(resource.url, '_blank')}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
              ? 'Try adjusting your search or filters.'
              : 'No resources are currently available.'}
          </p>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Event Calendar</h3>
            <p className="text-sm text-gray-600">View upcoming pack events and activities</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Locations</h3>
            <p className="text-sm text-gray-600">Find meeting places and event venues</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Volunteer</h3>
            <p className="text-sm text-gray-600">Sign up for volunteer opportunities</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-md">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Safety</h3>
            <p className="text-sm text-gray-600">Safety guidelines and emergency info</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
