import React, { useState } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { submitRSVP } from '../../services/firestore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formValidator, SecurityMetadata } from '../../services/security';
import { rsvpFormSchema } from '../../types/validation';

interface RSVPFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  currentRSVPs?: number;
  onSuccess?: (data: RSVPData) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface RSVPData {
  eventId: string;
  familyName: string;
  email: string;
  phone?: string;
  attendees: Attendee[];
  dietaryRestrictions?: string;
  specialNeeds?: string;
  notes?: string;
  ipHash: string;
  userAgent: string;
  timestamp: Date;
}

interface Attendee {
  name: string;
  age: number;
  den?: string;
  isAdult: boolean;
}

const RSVPForm: React.FC<RSVPFormProps> = ({
  eventId,
  eventTitle,
  eventDate,
  maxCapacity,
  currentRSVPs = 0,
  onSuccess,
  onError,
  className = ''
}) => {
  const analytics = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<RSVPData>>({
    eventId,
    familyName: '',
    email: '',
    phone: '',
    attendees: [{ name: '', age: 0, den: '', isAdult: false }],
    dietaryRestrictions: '',
    specialNeeds: '',
    notes: ''
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if event is at capacity
  const isAtCapacity = maxCapacity ? currentRSVPs >= maxCapacity : false;
  const remainingSpots = maxCapacity ? maxCapacity - currentRSVPs : null;

  // PII scrubbing function (ready for future implementation)
  // const scrubPII = (text: string): string => {
  //   if (!text) return text;
  //   
  //   // Remove or mask sensitive information
  //   return text
  //     .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '***-***-****') // Phone numbers
  //     .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***') // Emails
  //     .replace(/\b\d{5}(-\d{4})?\b/g, '*****') // ZIP codes
  //     .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '**/**/****'); // Dates
  // };

  // Generate IP hash for rate limiting (simplified)
  const generateIPHash = (): string => {
    // In a real app, this would hash the actual IP address
    return `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Family name validation
    if (!formData.familyName?.trim()) {
      newErrors.familyName = 'Family name is required';
    } else if (formData.familyName.trim().length < 2) {
      newErrors.familyName = 'Family name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Attendees validation
    if (!formData.attendees || formData.attendees.length === 0) {
      newErrors.attendees = 'At least one attendee is required';
    } else {
      formData.attendees.forEach((attendee, index) => {
        if (!attendee.name?.trim()) {
          newErrors[`attendee_${index}_name`] = 'Attendee name is required';
        }
        if (!attendee.age || attendee.age < 0 || attendee.age > 120) {
          newErrors[`attendee_${index}_age`] = 'Please enter a valid age';
        }
      });
    }

    // Capacity check
    if (maxCapacity && formData.attendees && currentRSVPs + formData.attendees.length > maxCapacity) {
      newErrors.capacity = `Event is at capacity. Only ${remainingSpots} spots remaining.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with enhanced security
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Track form submission attempt
      analytics.trackFeatureClick('RSVP Form', { eventId, action: 'submit_attempt' });

      // Generate security metadata
      const securityMeta = await SecurityMetadata.generateMetadata();

      // Prepare submission data with security metadata
      const submissionData = {
        ...formData,
        eventId,
        ...securityMeta
      };

      // Validate and sanitize with enhanced security
      const validationResult = await formValidator.validateRSVPForm(
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
      await submitRSVP(secureData);

      // Simulate success
      setSubmitStatus('success');
      
      // Track successful submission
      analytics.trackRSVPSubmission(eventId, true, { 
        attendees: secureData.attendees?.length || 0 
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(secureData as RSVPData);
      }

      // Reset form after success
      setTimeout(() => {
        setFormData({
          eventId,
          familyName: '',
          email: '',
          phone: '',
          attendees: [{ name: '', age: 0, den: '', isAdult: false }],
          dietaryRestrictions: '',
          specialNeeds: '',
          notes: ''
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while submitting your RSVP');
      
      // Track error
      analytics.trackError('rsvp_submission_error', error instanceof Error ? error.message : 'Unknown error', 'RSVPForm');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add attendee
  const addAttendee = () => {
    setFormData(prev => ({
      ...prev,
      attendees: [...(prev.attendees || []), { name: '', age: 0, den: '', isAdult: false }]
    }));
  };

  // Remove attendee
  const removeAttendee = (index: number) => {
    if (formData.attendees && formData.attendees.length > 1) {
      setFormData(prev => ({
        ...prev,
        attendees: prev.attendees?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Update attendee
  const updateAttendee = (index: number, field: keyof Attendee, value: any) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees?.map((attendee, i) => 
        i === index ? { ...attendee, [field]: value } : attendee
      ) || []
    }));
  };

  // Handle input changes
  const handleInputChange = (field: keyof RSVPData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isAtCapacity) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Event at Capacity</h3>
        <p className="text-red-600">
          This event has reached its maximum capacity. Please check back later for cancellations or consider joining the waitlist.
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
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-display font-semibold">
              <span className="text-rainbow-animated">RSVP for Event</span>
            </h3>
            <p className="text-gray-600">{eventTitle}</p>
          </div>
        </div>
        
        {remainingSpots && (
          <div className="inline-flex items-center px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            {remainingSpots} spots remaining
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Family Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Family Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-900 mb-2">
                Family Name *
              </label>
              <input
                type="text"
                id="familyName"
                value={formData.familyName}
                onChange={(e) => handleInputChange('familyName', e.target.value)}
                className={`input-rainbow ${
                  errors.familyName ? 'border-red-300' : ''
                }`}
                placeholder="Enter your family name"
              />
              {errors.familyName && (
                <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>
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
                className={`input-rainbow ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input-rainbow"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Attendees */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Attendees</h4>
            <button
              type="button"
              onClick={addAttendee}
              className="px-4 py-2 bg-secondary-500 text-white text-sm font-medium rounded-xl hover:bg-secondary-600 transition-colors duration-200"
            >
              + Add Attendee
            </button>
          </div>

          {formData.attendees?.map((attendee, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">Attendee {index + 1}</h5>
                {formData.attendees && formData.attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(index)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={attendee.name}
                    onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
                      errors[`attendee_${index}_name`] 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-primary-400'
                    }`}
                    placeholder="Attendee name"
                  />
                  {errors[`attendee_${index}_name`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`attendee_${index}_name`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={attendee.age || ''}
                    onChange={(e) => updateAttendee(index, 'age', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
                      errors[`attendee_${index}_age`] 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-primary-400'
                    }`}
                    placeholder="Age"
                  />
                  {errors[`attendee_${index}_age`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`attendee_${index}_age`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Den (Optional)
                  </label>
                  <select
                    value={attendee.den || ''}
                    onChange={(e) => updateAttendee(index, 'den', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-400 transition-all duration-200"
                  >
                    <option value="">Select Den</option>
                    <option value="Lions">Lions (Kindergarten)</option>
                    <option value="Tigers">Tigers (1st Grade)</option>
                    <option value="Wolves">Wolves (2nd Grade)</option>
                    <option value="Bears">Bears (3rd Grade)</option>
                    <option value="Webelos">Webelos (4th Grade)</option>
                    <option value="Arrow of Light">Arrow of Light (5th Grade)</option>
                    <option value="Adult">Adult</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={attendee.isAdult}
                    onChange={(e) => updateAttendee(index, 'isAdult', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-900">This is an adult attendee</span>
                </label>
              </div>
            </div>
          ))}

          {errors.attendees && (
            <p className="text-sm text-red-600">{errors.attendees}</p>
          )}
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
          
          <div>
            <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-900 mb-2">
              Dietary Restrictions
            </label>
            <textarea
              id="dietaryRestrictions"
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              rows={2}
              className="input-rainbow"
              placeholder="Any dietary restrictions or allergies..."
            />
          </div>

          <div>
            <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-900 mb-2">
              Special Needs or Accommodations
            </label>
            <textarea
              id="specialNeeds"
              value={formData.specialNeeds}
              onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
              rows={2}
              className="input-rainbow"
              placeholder="Any special needs or accommodations required..."
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="input-rainbow"
              placeholder="Any other information you'd like to share..."
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
                Submitting RSVP...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                Submit RSVP
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-green-700 mb-1">RSVP Submitted Successfully!</h4>
            <p className="text-green-600">Thank you for your RSVP. We'll see you at the event!</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-red-700 mb-1">Submission Failed</h4>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default RSVPForm;
