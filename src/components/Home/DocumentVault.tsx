import React from 'react';
import { FileText, Lock } from 'lucide-react';

const DocumentVault: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <div className="relative w-16 h-16 mx-auto mb-4">
        <FileText className="w-16 h-16 text-gray-300" />
        <Lock className="w-6 h-6 text-blue-600 absolute -bottom-1 -right-1" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Document Vault</h3>
      <p className="text-gray-600">Securely store important documents</p>
    </div>
  );
};

export default DocumentVault;

