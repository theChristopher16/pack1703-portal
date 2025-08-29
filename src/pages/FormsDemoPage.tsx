import React, { useState } from 'react';
import { RSVPForm, FeedbackForm, VolunteerSignupForm } from '../components/Forms';
import { Calendar, MessageSquare, Heart, CheckCircle } from 'lucide-react';

const FormsDemoPage: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'rsvp' | 'feedback' | 'volunteer'>('rsvp');

  // Sample event data for RSVP form
  const sampleEvent = {
    id: 'event-001',
    title: 'Pack 1703 Fall Campout',
    date: 'October 15-17, 2024',
    maxCapacity: 50,
    currentRSVPs: 23
  };

  // Sample volunteer need data
  const sampleVolunteerNeed = {
    id: 'volunteer-001',
    title: 'Campout Setup & Cleanup Crew',
    description: 'Help set up tents, cooking areas, and clean up after the event',
    location: 'Camp Wokanda',
    date: 'October 15-17, 2024',
    time: 'Various times throughout weekend',
    duration: '2-4 hours per shift',
    maxVolunteers: 8,
    currentVolunteers: 3,
    skills: ['Physical Labor', 'Organization', 'Cooking', 'First Aid', 'Leadership'],
    ageRequirement: 'adult'
  };

  const handleRSVPSuccess = (data: any) => {
    console.log('RSVP submitted successfully:', data);
  };

  const handleFeedbackSuccess = (data: any) => {
    console.log('Feedback submitted successfully:', data);
  };

  const handleVolunteerSuccess = (data: any) => {
    console.log('Volunteer signup successful:', data);
  };

  const handleError = (error: string) => {
    console.error('Form submission error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            🧪 Forms Demo
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Two-Way</span> Submission Forms
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Interactive forms for RSVPs, feedback, and volunteer signups with comprehensive validation, 
            PII scrubbing, and analytics tracking.
          </p>
        </div>

        {/* Form Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/90 backdrop-blur-sm rounded-2xl p-2 border border-white/50 shadow-soft">
            <button
              onClick={() => setActiveForm('rsvp')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeForm === 'rsvp'
                  ? 'bg-primary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              RSVP Form
            </button>
            <button
              onClick={() => setActiveForm('feedback')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeForm === 'feedback'
                  ? 'bg-primary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Feedback Form
            </button>
            <button
              onClick={() => setActiveForm('volunteer')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeForm === 'volunteer'
                  ? 'bg-primary-500 text-white shadow-glow-primary/50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Heart className="w-5 h-5 inline mr-2" />
              Volunteer Form
            </button>
          </div>
        </div>

        {/* Form Display */}
        <div className="max-w-4xl mx-auto">
          {activeForm === 'rsvp' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                  RSVP Form Demo
                </h2>
                <p className="text-gray-600">
                  Test the RSVP form with sample event data. Try submitting with invalid data to see validation in action.
                </p>
              </div>
              
              <RSVPForm
                eventId={sampleEvent.id}
                eventTitle={sampleEvent.title}
                eventDate={sampleEvent.date}
                maxCapacity={sampleEvent.maxCapacity}
                currentRSVPs={sampleEvent.currentRSVPs}
                onSuccess={handleRSVPSuccess}
                onError={handleError}
              />
            </div>
          )}

          {activeForm === 'feedback' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                  Feedback Form Demo
                </h2>
                <p className="text-gray-600">
                  Test the feedback form with various categories and ratings. All fields are validated before submission.
                </p>
              </div>
              
              <FeedbackForm
                onSuccess={handleFeedbackSuccess}
                onError={handleError}
              />
            </div>
          )}

          {activeForm === 'volunteer' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                  Volunteer Signup Form Demo
                </h2>
                <p className="text-gray-600">
                  Test the volunteer signup form with sample volunteer need data. Try different skill combinations.
                </p>
              </div>
              
              <VolunteerSignupForm
                volunteerNeed={sampleVolunteerNeed}
                onSuccess={handleVolunteerSuccess}
                onError={handleError}
              />
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="mt-16 bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
          <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-8">
            Form Features & Capabilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary/50">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Validation</h3>
              <p className="text-gray-600 text-sm">
                Real-time validation with clear error messages and field-specific feedback
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-secondary/50">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PII Scrubbing</h3>
              <p className="text-gray-600 text-sm">
                Automatic detection and masking of sensitive information like emails and phone numbers
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-accent/50">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Integration</h3>
              <p className="text-gray-600 text-sm">
                Full analytics tracking for form interactions, submissions, and conversions
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary/50">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Solar-Punk Design</h3>
              <p className="text-gray-600 text-sm">
                Beautiful, accessible UI with solar-punk aesthetic and smooth animations
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-secondary/50">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-600 text-sm">
                WCAG 2.2 AA compliant with proper labels, focus states, and screen reader support
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-accent/50">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile-First</h3>
              <p className="text-gray-600 text-sm">
                Responsive design optimized for mobile devices with touch-friendly interactions
              </p>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Testing Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Try Invalid Submissions:</strong> Submit forms with missing required fields to see validation</p>
            <p>2. <strong>Test PII Scrubbing:</strong> Enter phone numbers and emails to see automatic masking</p>
            <p>3. <strong>Check Analytics:</strong> Open browser console to see analytics events being tracked</p>
            <p>4. <strong>Test Responsiveness:</strong> Resize browser window to see mobile-first design</p>
            <p>5. <strong>Accessibility:</strong> Use keyboard navigation and screen reader to test accessibility</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsDemoPage;
