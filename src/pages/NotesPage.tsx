import React from 'react';
import NotesPanel from '../components/Notes/NotesPanel';
import { useOrganization } from '../contexts/OrganizationContext';

const NotesPage: React.FC = () => {
  const { organizationId } = useOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-forest-900 mb-2">Notes</h1>
          <p className="text-forest-600">
            View and manage organization notes and reminders
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <NotesPanel 
            componentId="notes" 
            componentType="page"
          />
        </div>
      </div>
    </div>
  );
};

export default NotesPage;

