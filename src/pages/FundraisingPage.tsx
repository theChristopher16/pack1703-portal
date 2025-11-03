import React from 'react';
import { CharlestonWrapDashboard } from '../components/Fundraising';

/**
 * Public-facing Fundraising Page
 * Displays Charleston Wrap fundraising campaign data
 */
const FundraisingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CharlestonWrapDashboard />
    </div>
  );
};

export default FundraisingPage;

