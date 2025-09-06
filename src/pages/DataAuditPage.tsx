import React from 'react';
import { Shield, Database, Download, Eye } from 'lucide-react';
import DataAuditComponent from '../components/DataAudit/DataAuditComponent';

const DataAuditPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-4xl font-display font-bold text-gray-800">Data Audit</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Complete transparency about the data we collect, store, and use. 
            View, understand, and download all data associated with your account.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft text-center">
            <Eye className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">View Your Data</h3>
            <p className="text-sm text-gray-600">
              See exactly what information we have about you, organized by category and type.
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft text-center">
            <Database className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Categories</h3>
            <p className="text-sm text-gray-600">
              Understand what types of data we collect: profile, events, messages, and more.
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft text-center">
            <Download className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Download Everything</h3>
            <p className="text-sm text-gray-600">
              Get a complete copy of all your data in JSON format for your records.
            </p>
          </div>
        </div>

        {/* Main Data Audit Component */}
        <DataAuditComponent />

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Privacy Rights */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-primary-600 mr-2" />
              Your Privacy Rights
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Right to access your personal data</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Right to correct inaccurate information</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Right to delete your data (with limitations)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Right to data portability</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Right to restrict processing</span>
              </li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Database className="h-5 w-5 text-primary-600 mr-2" />
              Data Security
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>All data is encrypted in transit and at rest</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Access controls limit who can view your data</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Regular security audits and monitoring</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Secure cloud infrastructure (Google Cloud)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Compliance with data protection regulations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Questions About Your Data?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have questions about your data or need help with data-related requests, 
            please contact us.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <a 
              href="mailto:privacy@sfpack1703.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              privacy@sfpack1703.com
            </a>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <a 
              href="/privacy-policy"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Privacy Policy
            </a>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <a 
              href="/terms-of-service"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAuditPage;
