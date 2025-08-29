import React from 'react';
import { Users, Heart, Star, Award } from 'lucide-react';

const VolunteerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text mb-4">
            Volunteer Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help make Pack 1703 amazing! Find volunteer roles that match your skills and interests.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-text mb-4">
            Volunteer System Coming Soon!
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            We're building an easy way to sign up for volunteer positions and track your contributions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 justify-center">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-text font-medium">Easy Sign-up</span>
            </div>
            <div className="flex items-center space-x-3 justify-center">
              <Star className="w-6 h-6 text-secondary" />
              <span className="text-text font-medium">Track Hours</span>
            </div>
            <div className="flex items-center space-x-3 justify-center">
              <Award className="w-6 h-6 text-accent" />
              <span className="text-text font-medium">Recognition</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerPage;
