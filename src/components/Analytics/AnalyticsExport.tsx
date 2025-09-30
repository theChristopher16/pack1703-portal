import React, { useState } from 'react';
import { Download, FileText, BarChart3 } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  timeRange: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  dataTypes: string[];
  includeCharts: boolean;
}

const AnalyticsExport: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    timeRange: '30d',
    dataTypes: ['page_views', 'feature_usage', 'sessions', 'user_actions'],
    includeCharts: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const db = getFirestore();
      const auth = getAuth();
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user for analytics export');
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (exportOptions.timeRange === 'custom' && exportOptions.startDate && exportOptions.endDate) {
        startDate = new Date(exportOptions.startDate);
      } else {
        const daysAgo = exportOptions.timeRange === '7d' ? 7 : 
                       exportOptions.timeRange === '30d' ? 30 : 90;
        startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      }

      setExportProgress(20);

      // Get analytics data
      const analyticsQuery = query(
        collection(db, 'analytics'),
        orderBy('timestamp', 'desc'),
        limit(5000) // Limit for performance
      );
      const analyticsSnapshot = await getDocs(analyticsQuery);

      setExportProgress(40);

      // Filter and process data
      const allData = analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(item => {
        const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
        return itemDate >= startDate;
      });

      setExportProgress(60);

      // Generate export data based on format
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (exportOptions.format === 'csv') {
        exportData = generateCSV(allData);
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (exportOptions.format === 'json') {
        exportData = JSON.stringify(allData, null, 2);
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // PDF export (simplified - would need a proper PDF library)
        exportData = generatePDFContent(allData);
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
      }

      setExportProgress(80);

      // Download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      
      // Reset progress after a delay
      setTimeout(() => {
        setExportProgress(0);
        setIsExporting(false);
      }, 2000);

    } catch (error) {
      console.error('Error exporting analytics data:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'timestamp' || typeof item[key] !== 'object') {
          allKeys.add(key);
        }
      });
    });

    const headers = Array.from(allKeys);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          const value = item[header];
          if (header === 'timestamp' && value?.toDate) {
            return `"${value.toDate().toISOString()}"`;
          }
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generatePDFContent = (data: any[]): string => {
    const summary = {
      totalRecords: data.length,
      dateRange: `${exportOptions.startDate || 'N/A'} to ${exportOptions.endDate || 'N/A'}`,
      exportDate: new Date().toISOString(),
      dataTypes: exportOptions.dataTypes.join(', ')
    };

    return `
ANALYTICS EXPORT REPORT
=======================

Export Summary:
- Total Records: ${summary.totalRecords}
- Date Range: ${summary.dateRange}
- Export Date: ${summary.exportDate}
- Data Types: ${summary.dataTypes}

Data Sample (first 10 records):
${JSON.stringify(data.slice(0, 10), null, 2)}

Note: This is a simplified text export. For full data, use CSV or JSON format.
    `.trim();
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  const toggleDataType = (dataType: string) => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataType)
        ? prev.dataTypes.filter(type => type !== dataType)
        : [...prev.dataTypes, dataType]
    }));
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
      <div className="flex items-center mb-6">
        <Download className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Export Analytics Data</h3>
      </div>

      {/* Export Options */}
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'csv', label: 'CSV', icon: <FileText className="w-4 h-4" /> },
              { value: 'json', label: 'JSON', icon: <BarChart3 className="w-4 h-4" /> },
              { value: 'pdf', label: 'PDF Report', icon: <FileText className="w-4 h-4" /> }
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => updateExportOptions({ format: format.value as any })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  exportOptions.format === format.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {format.icon}
                <span>{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <div className="flex space-x-4">
            {['7d', '30d', '90d', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => updateExportOptions({ timeRange: range as any })}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  exportOptions.timeRange === range
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'custom' ? 'Custom Range' : `${range.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {exportOptions.timeRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={exportOptions.startDate || ''}
                onChange={(e) => updateExportOptions({ startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={exportOptions.endDate || ''}
                onChange={(e) => updateExportOptions({ endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Data Types Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Types to Include
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'page_views', label: 'Page Views' },
              { value: 'feature_usage', label: 'Feature Usage' },
              { value: 'sessions', label: 'Sessions' },
              { value: 'user_actions', label: 'User Actions' },
              { value: 'performance', label: 'Performance' },
              { value: 'errors', label: 'Errors' },
              { value: 'conversions', label: 'Conversions' },
              { value: 'engagement', label: 'Engagement' }
            ].map((dataType) => (
              <label key={dataType.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.dataTypes.includes(dataType.value)}
                  onChange={() => toggleDataType(dataType.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{dataType.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting... {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Analytics Data</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsExport;
