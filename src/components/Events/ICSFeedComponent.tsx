import React, { useState } from 'react';
import { Calendar, Download, Link, Copy, Check, Settings, Filter } from 'lucide-react';
import { generateICSFeedURL, getPublicICSFeedURL, ICSFeedOptions } from '../../utils/icsGenerator';

interface ICSFeedComponentProps {
  className?: string;
}

const ICSFeedComponent: React.FC<ICSFeedComponentProps> = ({ className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ICSFeedOptions>({
    categories: [],
    dens: [],
    includeDescription: true,
    includeLocation: true
  });

  const availableCategories = [
    'pack-wide',
    'den',
    'camping',
    'overnight',
    'service'
  ];

  const availableDens = [
    'Lion Den',
    'Tiger Den',
    'Wolf Den',
    'Bear Den',
    'Webelos Den',
    'Arrow of Light Den'
  ];

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateICSFeedURL(options);
    } catch (error) {
      console.error('Error generating ICS feed:', error);
      alert('Failed to generate ICS feed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyURL = async () => {
    const feedURL = getPublicICSFeedURL(options);
    try {
      await navigator.clipboard.writeText(feedURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = feedURL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleCategory = (category: string) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category]
    }));
  };

  const toggleDen = (den: string) => {
    setOptions(prev => ({
      ...prev,
      dens: prev.dens?.includes(den)
        ? prev.dens.filter(d => d !== den)
        : [...(prev.dens || []), den]
    }));
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Calendar Feed</h3>
        </div>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Filter options"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Subscribe to Pack 1703 events in your calendar app. The feed automatically updates when new events are added.
      </p>

      {/* Filter Options */}
      {showOptions && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-medium text-gray-900">Filter Options</h4>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    options.categories?.includes(category)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Dens */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dens</label>
            <div className="flex flex-wrap gap-2">
              {availableDens.map(den => (
                <button
                  key={den}
                  onClick={() => toggleDen(den)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    options.dens?.includes(den)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {den}
                </button>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeDescription}
                onChange={(e) => setOptions(prev => ({ ...prev, includeDescription: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include event descriptions</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeLocation}
                onChange={(e) => setOptions(prev => ({ ...prev, includeLocation: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include event locations</span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{isGenerating ? 'Generating...' : 'Download ICS File'}</span>
        </button>

        <button
          onClick={handleCopyURL}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy Feed URL'}</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to Subscribe:</h4>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Copy the feed URL using the button above</li>
          <li>In your calendar app, add a new calendar subscription</li>
          <li>Paste the URL and save</li>
          <li>Events will automatically sync and update</li>
        </ol>
      </div>

      {/* Feed URL Display */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Link className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Feed URL:</span>
        </div>
        <code className="text-xs text-gray-600 break-all bg-white p-2 rounded border">
          {getPublicICSFeedURL(options)}
        </code>
      </div>
    </div>
  );
};

export default ICSFeedComponent;
