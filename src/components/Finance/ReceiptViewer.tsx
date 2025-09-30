import React, { useState } from 'react';
import { X, Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';

interface ReceiptViewerProps {
  attachments: string[];
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({
  attachments,
  isOpen,
  onClose
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || attachments.length === 0) return null;

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return 'Unknown file';
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName(url);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-white/50 shadow-soft">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Receipts & Attachments ({attachments.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          {selectedImage ? (
            /* Image Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getFileName(selectedImage)}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back to List
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Receipt"
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                  <p>Unable to display image</p>
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* File List */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {attachments.map((url, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getFileIcon(url)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getFileName(url)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Receipt #{index + 1}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedImage(url)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(url)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
