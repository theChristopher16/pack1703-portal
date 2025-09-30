import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image, 
  File, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Resource, ResourceCategory, resourceService } from '../../services/resourceService';
import { useAdmin } from '../../contexts/AdminContext';

interface ResourceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  resource?: Resource;
  mode: 'create' | 'edit';
}

const RESOURCE_CATEGORIES: { id: ResourceCategory; name: string; description: string }[] = [
  { id: 'packing-list', name: 'Packing Lists', description: 'Lists for camping, hiking, and events' },
  { id: 'medical', name: 'Medical Forms', description: 'Health forms and medical information' },
  { id: 'policy', name: 'Policies', description: 'Pack policies and guidelines' },
  { id: 'guide', name: 'Guides', description: 'How-to guides and instructions' },
  { id: 'form', name: 'Forms', description: 'Official forms and applications' },
  { id: 'reference', name: 'Reference', description: 'Quick reference materials' },
  { id: 'scout-handbook', name: 'Scout Handbook', description: 'Scout handbook sections and excerpts' },
  { id: 'advancement', name: 'Advancement', description: 'Advancement requirements and tracking' },
  { id: 'safety', name: 'Safety', description: 'Safety guidelines and procedures' },
  { id: 'camping', name: 'Camping', description: 'Camping skills and preparation' },
  { id: 'hiking', name: 'Hiking', description: 'Hiking guides and trail information' },
  { id: 'cooking', name: 'Cooking', description: 'Cooking skills and recipes' },
  { id: 'crafts', name: 'Crafts', description: 'Craft projects and instructions' },
  { id: 'games', name: 'Games', description: 'Games and activities' },
  { id: 'ceremonies', name: 'Ceremonies', description: 'Pack and den ceremonies' },
  { id: 'leadership', name: 'Leadership', description: 'Leadership development materials' },
  { id: 'fundraising', name: 'Fundraising', description: 'Fundraising ideas and resources' },
  { id: 'uniform', name: 'Uniform', description: 'Uniform guidelines and care' },
  { id: 'awards', name: 'Awards', description: 'Award requirements and recognition' },
  { id: 'outdoor-skills', name: 'Outdoor Skills', description: 'Outdoor skills and techniques' },
  { id: 'environmental', name: 'Environmental', description: 'Environmental awareness and conservation' },
  { id: 'community-service', name: 'Community Service', description: 'Service project ideas and guidelines' },
  { id: 'parent-resources', name: 'Parent Resources', description: 'Resources specifically for parents' },
  { id: 'den-specific', name: 'Den Specific', description: 'Resources for specific dens' },
  { id: 'pack-specific', name: 'Pack Specific', description: 'Pack-specific information' },
  { id: 'district', name: 'District', description: 'District-level resources' },
  { id: 'council', name: 'Council', description: 'Council-level resources' },
  { id: 'national', name: 'National', description: 'National BSA resources' },
];

const COMMON_TAGS = [
  'beginner', 'advanced', 'indoor', 'outdoor', 'winter', 'summer', 'spring', 'fall',
  'family', 'youth', 'adult', 'leader', 'scout', 'cub-scout', 'webelos', 'lion', 'tiger', 'wolf', 'bear',
  'camping', 'hiking', 'swimming', 'cooking', 'crafts', 'games', 'safety', 'first-aid',
  'uniform', 'badge', 'award', 'advancement', 'rank', 'belt-loop', 'pin',
  'fundraising', 'service', 'community', 'environmental', 'conservation',
  'emergency', 'weather', 'equipment', 'gear', 'checklist', 'guide', 'instructions'
];

const ResourceManagementModal: React.FC<ResourceManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resource,
  mode
}) => {
  const { state } = useAdmin();
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    category: (resource?.category || 'guide') as ResourceCategory,
    tags: resource?.tags || [],
    isPublic: resource?.isPublic ?? true,
    url: resource?.url || '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        url: '', // Clear URL when file is selected
      }));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setCustomTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      // File upload and URL are both optional - resources can be informational only

      if (mode === 'create') {
        await resourceService.createResource({
          ...formData,
          isActive: true,
          createdBy: '', // Will be set by service
          createdByName: '', // Will be set by service
        }, selectedFile || undefined, state.currentUser);
        setSuccess('Resource created successfully!');
      } else if (mode === 'edit' && resource) {
        await resourceService.updateResource(resource.id, formData, selectedFile || undefined);
        setSuccess('Resource updated successfully!');
      }

      // Wait a moment to show success message
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);

    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-600" />;
    return <File className="h-4 w-4 text-blue-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter resource title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this resource contains and how it helps families"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {RESOURCE_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload or URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Content (Optional)
            </label>
            
            {/* File Upload */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-2">Upload File</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </button>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getFileIcon(selectedFile)}
                    <span>{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Or provide URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com/resource (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!!selectedFile}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Common Tags */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-2">Common Tags</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.filter(tag => !formData.tags.includes(tag)).slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTag.trim());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTag.trim())}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Public/Private */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Make this resource publicly visible to all users
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Resource' : 'Update Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceManagementModal;
