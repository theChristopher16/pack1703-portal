import React, { useState } from 'react';
import { Users, Heart, CheckCircle, AlertCircle, Loader2, Clock, MapPin } from 'lucide-react';
import { claimVolunteerRole } from '../../services/firestore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formValidator, SecurityMetadata } from '../../services/security';
import { volunteerFormSchema } from '../../types/validation';

interface VolunteerSignupFormProps {
  volunteerNeed: VolunteerNeed;
  onSuccess?: (data: VolunteerSignupData) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface VolunteerNeed {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  maxVolunteers: number;
  currentVolunteers: number;
  skills: string[];
  ageRequirement: string;
  physicalRequirements?: string;
}

interface VolunteerSignupData {
  volunteerNeedId: string;
  volunteerName: string;
  email: string;
  phone?: string;
  age: number;
  skills: string[];
  availability: string;
  experience: string;
  specialNeeds?: string;
  emergencyContact?: string;
  ipHash: string;
  userAgent: string;
  timestamp: Date;
}

const VolunteerSignupForm: React.FC<VolunteerSignupFormProps> = ({
  volunteerNeed,
  onSuccess,
  onError,
  className = ''
}) => {
  const analytics = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<VolunteerSignupData>>({
    volunteerNeedId: volunteerNeed.id,
    volunteerName: '',
    email: '',
    phone: '',
    age: 0,
    skills: [],
    availability: '',
    experience: '',
    specialNeeds: '',
    emergencyContact: ''
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if volunteer need is full
  const isFull = volunteerNeed.currentVolunteers >= volunteerNeed.maxVolunteers;
  const remainingSpots = volunteerNeed.maxVolunteers - volunteerNeed.currentVolunteers;

  // Available skills (excluding already selected ones) - ready for future use
  // const availableSkills = volunteerNeed.skills.filter(skill => !formData.skills?.includes(skill));

  // Generate IP hash for rate limiting (simplified)
  const generateIPHash = (): string => {
    return `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // PII scrubbing function (ready for future implementation)
  // const scrubPII = (text: string): string => {
  //   if (!text) return text;
  //   
  //   return text
  //     .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '***-***-****') // Phone numbers
  //     .replace(/\b\d{5}(-\d{4})?\b/g, '*****') // ZIP codes
  //     .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '**/**/****'); // Dates
  // };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Volunteer name validation
    if (!formData.volunteerName?.trim()) {
      newErrors.volunteerName = 'Volunteer name is required';
    } else if (formData.volunteerName.trim().length < 2) {
      newErrors.volunteerName = 'Volunteer name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Age validation
    if (!formData.age || formData.age < 0) {
      newErrors.age = 'Please enter a valid age';
    } else if (formData.age < 18 && volunteerNeed.ageRequirement === 'adult') {
      newErrors.age = 'This volunteer role requires adult volunteers (18+)';
    }

    // Skills validation
    if (!formData.skills || formData.skills.length === 0) {
      newErrors.skills = 'Please select at least one relevant skill';
    }

    // Availability validation
    if (!formData.availability?.trim()) {
      newErrors.availability = 'Please describe your availability';
    }

    // Experience validation
    if (!formData.experience?.trim()) {
      newErrors.experience = 'Please describe your relevant experience';
    }

    // Capacity check
    if (isFull) {
      newErrors.capacity = 'This volunteer role is already full';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Track form submission attempt
      analytics.trackFeatureClick('Volunteer Signup Form', { 
        volunteerNeedId: volunteerNeed.id, 
        action: 'submit_attempt' 
      });

      // Generate security metadata
      const securityMeta = await SecurityMetadata.generateMetadata();

      // Prepare submission data with security metadata
      const submissionData = {
        ...formData,
        volunteerNeedId: volunteerNeed.id,
        ...securityMeta
      };

      // Validate and sanitize with enhanced security
      const validationResult = await formValidator.validateVolunteerForm(
        submissionData, 
        securityMeta.ipHash
      );

      if (!validationResult.isValid) {
        if (validationResult.rateLimited) {
          setErrorMessage('Too many requests. Please wait before submitting again.');
        } else {
          setErrorMessage(validationResult.errors?.join(', ') || 'Validation failed');
        }
        setSubmitStatus('error');
        return;
      }

      // Use validated and sanitized data
      const secureData = validationResult.data;

      // Call Firebase Cloud Function with secure data
      await claimVolunteerRole(secureData);

      // Simulate success
      setSubmitStatus('success');
      
      // Track successful submission
      analytics.trackVolunteerSignup(volunteerNeed.id, true, { 
        skills: secureData.skills.length 
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(secureData);
      }

      // Reset form after success
      setTimeout(() => {
        setFormData({
          volunteerNeedId: volunteerNeed.id,
          volunteerName: '',
          email: '',
          phone: '',
          age: 0,
          skills: [],
          availability: '',
          experience: '',
          specialNeeds: '',
          emergencyContact: ''
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while submitting your volunteer signup');
      
      // Track error
      analytics.trackError('volunteer_signup_error', error instanceof Error ? error.message : 'Unknown error', 'VolunteerSignupForm');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof VolunteerSignupData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle skill selection
  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill]
    }));
  };

  if (isFull) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Volunteer Role Full</h3>
        <p className="text-red-600">
          This volunteer role has reached its maximum capacity. Please check back later for cancellations or consider other volunteer opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-display font-semibold text-gray-900">Volunteer Signup</h3>
            <p className="text-gray-600">{volunteerNeed.title}</p>
          </div>
          {remainingSpots > 0 && (
            <div className="inline-flex items-center px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              {remainingSpots} spots left
            </div>
          )}
        </div>

        {/* Volunteer Need Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4 text-primary-500" />
            <span>{volunteerNeed.date} at {volunteerNeed.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4 text-secondary-500" />
            <span>{volunteerNeed.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="w-4 h-4 text-accent-500" />
            <span>{volunteerNeed.duration}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Volunteer Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Volunteer Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="volunteerName" className="block text-sm font-medium text-gray-900 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="volunteerName"
                value={formData.volunteerName}
                onChange={(e) => handleInputChange('volunteerName', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                  errors.volunteerName 
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                } focus:ring-4`}
                placeholder="Enter your full name"
              />
              {errors.volunteerName && (
                <p className="mt-1 text-sm text-red-600">{errors.volunteerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                } focus:ring-4`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-900 mb-2">
                Age *
              </label>
              <input
                type="number"
                id="age"
                min="0"
                max="120"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                  errors.age 
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                } focus:ring-4`}
                placeholder="Your age"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Relevant Skills *</h4>
          <p className="text-sm text-gray-600">
            Select the skills that apply to this volunteer role
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {volunteerNeed.skills.map((skill) => (
              <label
                key={skill}
                className={`relative cursor-pointer p-3 border-2 rounded-xl transition-all duration-200 ${
                  formData.skills?.includes(skill)
                    ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.skills?.includes(skill) || false}
                  onChange={() => handleSkillToggle(skill)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{skill}</div>
                </div>
              </label>
            ))}
          </div>
          
          {errors.skills && (
            <p className="text-sm text-red-600">{errors.skills}</p>
          )}
        </div>

        {/* Availability and Experience */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Availability & Experience</h4>
          
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-900 mb-2">
              Availability *
            </label>
            <textarea
              id="availability"
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                errors.availability 
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
              } focus:ring-4`}
              placeholder="Describe when you're available to volunteer..."
            />
            {errors.availability && (
              <p className="mt-1 text-sm text-red-600">{errors.availability}</p>
            )}
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-900 mb-2">
              Relevant Experience *
            </label>
            <textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                errors.experience 
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                  : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
              } focus:ring-4`}
              placeholder="Describe your relevant experience, training, or background..."
            />
            {errors.experience && (
              <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
          
          <div>
            <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-900 mb-2">
              Special Needs or Accommodations
            </label>
            <textarea
              id="specialNeeds"
              value={formData.specialNeeds}
              onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              placeholder="Any special needs or accommodations required..."
            />
          </div>

          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-900 mb-2">
              Emergency Contact (Optional)
            </label>
            <input
              type="text"
              id="emergencyContact"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              placeholder="Name and phone number of emergency contact"
            />
          </div>
        </div>

        {/* Capacity Warning */}
        {errors.capacity && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{errors.capacity}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-lg rounded-2xl hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Submitting Signup...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 mr-3" />
                Sign Up to Volunteer
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-green-700 mb-1">Volunteer Signup Successful!</h4>
            <p className="text-green-600">Thank you for volunteering! We'll be in touch with more details.</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-red-700 mb-1">Signup Failed</h4>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default VolunteerSignupForm;
