import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { submitRSVP, createRSVPPayment, completeRSVPPayment, firestoreService } from '../../services/firestore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formValidator, SecurityMetadata } from '../../services/security';
import { rsvpFormSchema } from '../../types/validation';
import { useAdmin } from '../../contexts/AdminContext';
import { authService, AppUser } from '../../services/authService';
import LoginModal from '../Auth/LoginModal';

interface SquarePaymentResult {
  nonce: string;
  paymentMethod: string;
  status: string;
}

interface RSVPFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  currentRSVPs?: number;
  rsvpCountLoading?: boolean;
  onSuccess?: (data: RSVPData) => void;
  onError?: (error: string) => void;
  className?: string;
  // Payment specific props
  paymentRequired?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDescription?: string;
  // Elective event specific props
  isElective?: boolean;
  electiveOptions?: {
    casualAttendance?: boolean;
    familyFriendly?: boolean;
    noBeltLoop?: boolean;
  };
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
  rsvpId?: string;
  newRSVPCount?: number;
  // Payment related fields
  paymentRequired?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDescription?: string;
  paymentStatus?: 'not_required' | 'pending' | 'completed' | 'failed';
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
  rsvpCountLoading = false,
  onSuccess,
  onError,
  className = '',
  paymentRequired = false,
  paymentAmount = 0,
  paymentCurrency = 'USD',
  paymentDescription = '',
  isElective = false,
  electiveOptions
}) => {
  const { state } = useAdmin();
  const analytics = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'payment_required'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUser | null>(null);
  const [rsvpResult, setRsvpResult] = useState<any>(null);
  const [existingRSVP, setExistingRSVP] = useState<any>(null);
  const [isLoadingExistingRSVP, setIsLoadingExistingRSVP] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = !!state.currentUser;

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

  // Effect to get current user profile data
  useEffect(() => {
    if (isAuthenticated) {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUserProfile(user);
      }
    } else {
      setCurrentUserProfile(null);
    }
  }, [isAuthenticated]);

  // Effect to check for existing RSVP when component loads
  useEffect(() => {
    const checkExistingRSVP = async () => {
      if (!isAuthenticated || !eventId) return;
      
      setIsLoadingExistingRSVP(true);
      try {
        console.log('🔍 Checking for existing RSVP for event:', eventId);
        const result = await firestoreService.getUserRSVPs();
        console.log('📋 User RSVPs result:', result);
        if (result.success && result.rsvps) {
          // Find RSVP for this specific event
          const existingEventRSVP = result.rsvps.find((rsvp: any) => rsvp.eventId === eventId);
          console.log('🎯 Found existing RSVP:', existingEventRSVP);
          if (existingEventRSVP) {
            setExistingRSVP(existingEventRSVP);
            // Pre-populate form with existing RSVP data
            setFormData({
              eventId,
              familyName: existingEventRSVP.familyName,
              email: existingEventRSVP.email,
              phone: existingEventRSVP.phone || '',
              attendees: existingEventRSVP.attendees || [{ name: '', age: 0, den: '', isAdult: false }],
              dietaryRestrictions: existingEventRSVP.dietaryRestrictions || '',
              specialNeeds: existingEventRSVP.specialNeeds || '',
              notes: existingEventRSVP.notes || ''
            });
          }
        }
      } catch (error) {
        console.error('❌ Error checking existing RSVP:', error);
      } finally {
        setIsLoadingExistingRSVP(false);
      }
    };

    checkExistingRSVP();
  }, [isAuthenticated, eventId]);

  // Effect to populate form with user profile data when profile is loaded (only if no existing RSVP)
  useEffect(() => {
    if (currentUserProfile && !existingRSVP) {
      // Auto-populate basic info from user profile
      setFormData(prev => ({
        ...prev,
        familyName: buildFamilyName(currentUserProfile),
        email: currentUserProfile.email || '',
        phone: currentUserProfile.profile?.phone || ''
      }));

      // Auto-populate attendees with user info
      const autoAttendees = buildAutoAttendees(currentUserProfile);
      if (autoAttendees.length > 0) {
        setFormData(prev => ({
          ...prev,
          attendees: autoAttendees
        }));
      }
    }
  }, [currentUserProfile, existingRSVP]);

  // Helper function to build family name from user data
  const buildFamilyName = (user: AppUser): string => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user.displayName) {
      return user.displayName;
    }
    if (user.profile?.nickname) {
      return user.profile.nickname;
    }
    return '';
  };

  // Helper function to build auto-attendees from user profile
  const buildAutoAttendees = (user: AppUser): Attendee[] => {
    const attendees: Attendee[] = [];

    // Add the main user
    attendees.push({
      name: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : (user.displayName || 'Primary User'),
      age: user.profile?.scoutAge || (user.profile?.scoutGrade ? parseInt(user.profile.scoutGrade) + 5 : 25),
      den: user.profile?.den || '',
      isAdult: !user.profile?.scoutAge || user.profile.scoutAge >= 18
    });

    // Add other family members from profile data
    if (user.profile?.scouts && user.profile.scouts.length > 0) {
      user.profile.scouts.forEach((scout: any) => {
        attendees.push({
          name: scout.name || scout.scoutName || 'Family Member',
          age: scout.age || (scout.grade ? parseInt(scout.grade) + 5 : 8),
          den: scout.den || '',
          isAdult: scout.isAdult || false
        });
      });
    }

    // Add parent names if available and not included already
    if (user.profile?.parentNames) {
      user.profile.parentNames.forEach((parentName: string) => {
        if (!attendees.some(att => att.name.toLowerCase().includes(parentName.toLowerCase()))) {
          attendees.push({
            name: parentName,
            age: 35, // Estimated adult age
            den: 'Adult',
            isAdult: true
          });
        }
      });
    }

    return attendees.length > 0 ? attendees : [{ name: '', age: 0, den: '', isAdult: false }];
  };

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
      analytics.trackFeatureClick('RSVP Form', { eventId, action: existingRSVP ? 'update_attempt' : 'submit_attempt' });

      // If updating an existing RSVP, use the update function
      if (existingRSVP) {
        const updateData = {
          familyName: formData.familyName,
          email: formData.email,
          phone: formData.phone,
          attendees: formData.attendees,
          dietaryRestrictions: formData.dietaryRestrictions,
          specialNeeds: formData.specialNeeds,
          notes: formData.notes
        };

        const result = await firestoreService.updateRSVP(existingRSVP.id, updateData);

        if (result.success) {
          setSubmitStatus('success');
          
          // Track successful update
          analytics.trackFeatureClick('RSVP Form', { eventId, action: 'update_success' });
          
          // Call success callback
          if (onSuccess) {
            onSuccess({
              ...formData as RSVPData,
              rsvpId: existingRSVP.id
            });
          }

          // Reset to show updated data
          setTimeout(() => {
            setSubmitStatus('idle');
          }, 3000);

          return;
        } else {
          throw new Error(result.message || 'Failed to update RSVP');
        }
      }

      // Generate security metadata for new RSVPs
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
      const result = await submitRSVP(secureData);

      // Check if submission was successful
      if (result.data && (result.data as any).success) {
        const resultData = result.data as any;
        setRsvpResult(resultData);
        
        // Determine status based on payment requirements
        if (resultData.paymentRequired) {
          setSubmitStatus('payment_required');
        } else {
          setSubmitStatus('success');
        }
        
        // Track successful submission
        analytics.trackRSVPSubmission(eventId, true, { 
          attendees: secureData.attendees?.length || 0,
          rsvpId: resultData.rsvpId,
          newRSVPCount: resultData.newRSVPCount,
          paymentRequired: resultData.paymentRequired
        });
        
        // Call success callback with updated data
        if (onSuccess) {
          onSuccess({
            ...secureData as RSVPData,
            rsvpId: resultData.rsvpId,
            newRSVPCount: resultData.newRSVPCount,
            paymentRequired: resultData.paymentRequired,
            paymentAmount: resultData.paymentAmount,
            paymentCurrency: resultData.paymentCurrency,
            paymentDescription: resultData.paymentDescription,
            paymentStatus: resultData.paymentRequired ? 'pending' : 'not_required'
          });
        }
      } else {
        throw new Error((result.data as any)?.message || 'RSVP submission failed');
      }

      // Reset form after success, but preserve profile data
      setTimeout(() => {
        if (currentUserProfile) {
          const autoAttendees = buildAutoAttendees(currentUserProfile);
          
          setFormData({
            eventId,
            familyName: buildFamilyName(currentUserProfile),
            email: currentUserProfile.email || '',
            phone: currentUserProfile.profile?.phone || '',
            attendees: autoAttendees.length > 0 ? autoAttendees : [{ name: '', age: 0, den: '', isAdult: false }],
            dietaryRestrictions: '',
            specialNeeds: '',
            notes: ''
          });
        } else {
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
        }
        setSubmitStatus('idle');
      }, 3000);

    } catch (error: any) {
      setSubmitStatus('error');
      
      // Handle specific error types
      let errorMsg = 'An error occurred while submitting your RSVP';
      
      if (error?.code === 'unauthenticated') {
        errorMsg = 'You must be logged in to RSVP for events. Please log in and try again.';
      } else if (error?.code === 'already-exists') {
        errorMsg = 'You already have an RSVP for this event.';
      } else if (error?.code === 'resource-exhausted') {
        errorMsg = error.message || 'This event is at capacity.';
      } else if (error?.code === 'not-found') {
        errorMsg = 'Event not found. Please refresh the page and try again.';
      } else if (error?.code === 'permission-denied') {
        errorMsg = 'You do not have permission to RSVP for this event.';
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      // Track error
      analytics.trackError('rsvp_submission_error', errorMsg, 'RSVPForm');
      
      if (onError) {
        onError(errorMsg);
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

  // Initialize Square payment using your existing USS Stewart configuration
  const initializeSquarePayment = async (paymentData: any): Promise<SquarePaymentResult> => {
    return new Promise<SquarePaymentResult>((resolve, reject) => {
      // Load Square Web Payments SDK if not already loaded
      if (typeof window !== 'undefined' && !(window as any).Square) {
        const script = document.createElement('script');
        script.src = 'https://web.squarecdn.com/v1/square.js';
        script.onload = () => initializeSquareForm(paymentData, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Square SDK'));
        document.head.appendChild(script);
      } else {
        initializeSquareForm(paymentData, resolve, reject);
      }
    });
  };

  const initializeSquareForm = (paymentData: any, resolve: (value: SquarePaymentResult) => void, reject: (reason?: any) => void) => {
    try {
      const Square = (window as any).Square;
      if (!Square) {
        reject(new Error('Square SDK not loaded'));
        return;
      }

      // Use your existing Square configuration
      // You'll need to replace these with your actual USS Stewart Square credentials
      const payments = Square.payments(paymentData.applicationId, paymentData.locationId);

      payments.card({
        style: {
          '.input-container': {
            'border-radius': '8px',
          },
          '.input-container.is-focus': {
            borderColor: '#6BAA75',
          },
          '.message-text': {
            color: '#4C6F7A',
          },
        },
      }).then((card: any) => {
        // Show the Square payment form
        const paymentRequest = {
          requestPaymentMethod: () => card,
        };

        // Create payment form UI
        showSquarePaymentModal(paymentData, paymentRequest, resolve, reject);
      }).catch((error: any) => {
        console.error('Square card initialization failed:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  };

  const showSquarePaymentModal = async (paymentData: any, paymentRequest: any, resolve: (value: SquarePaymentResult) => void, reject: (reason?: any) => void) => {
    try {
      // Get the Square payment method token (nonce) from the form
      const result = await paymentRequest.requestPaymentMethod();
      
      if (result.errors && result.errors.length > 0) {
        reject(new Error('Payment form validation failed: ' + result.errors[0].detail));
        return;
      }

      // Return the nonce for backend processing
      resolve({
        nonce: result.nonce, // This is the Square payment token we need
        paymentMethod: 'card',
        status: 'READY_FOR_PROCESSING'
      });
    } catch (error) {
      reject(error);
    }
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!rsvpResult?.rsvpId) {
      setErrorMessage('RSVP ID not found. Please try submitting again.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Create payment record
      const paymentResult = await createRSVPPayment({
        rsvpId: rsvpResult.rsvpId,
        eventId: eventId
      });

      if (paymentResult.data && (paymentResult.data as any).success) {
        const paymentData = paymentResult.data as any;
        
        // Integrate with Square Web Payments SDK
        // This will use your existing USS Stewart Square configuration
        try {
          const squareResult = await initializeSquarePayment(paymentData);
          
          if (squareResult && squareResult.nonce) {
            // Call completeRSVPPayment with the Square nonce
            const completeResult = await completeRSVPPayment({
              paymentId: paymentData.paymentId,
              rsvpId: rsvpResult.rsvpId,
              nonce: squareResult.nonce
            });

            if (completeResult.data && (completeResult.data as any).success) {
              setSubmitStatus('success');
              setErrorMessage('');
              // Update the UI to show payment completed
              if (onSuccess) {
                onSuccess({
                  ...rsvpResult,
                  paymentStatus: 'completed'
                });
              }
            } else {
              throw new Error('Failed to complete payment after Square processing');
            }
          } else {
            throw new Error('Square payment failed - no nonce returned');
          }
        } catch (squareError: any) {
          console.error('Square payment processing failed:', squareError);
          throw new Error('Payment processing failed: ' + squareError.message);
        }
      } else {
        throw new Error((paymentResult.data as any)?.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to process payment');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
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

  if (!isAuthenticated) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center ${className}`}>
        <LogIn className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-blue-700 mb-2">Login Required</h3>
        <p className="text-blue-600 mb-4">
          Please log in to your account to RSVP for this event. This helps us keep track of attendance and send you important updates.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 transform hover:scale-105 shadow-glow-primary/50"
        >
          <LogIn className="w-5 h-5 mr-2 inline" />
          Login to RSVP
        </button>
        
        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {
              setShowLoginModal(false);
              // The component will re-render and show the form
            }}
          />
        )}
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
              <span className="text-rainbow-animated">
                {isElective && electiveOptions?.casualAttendance 
                  ? 'Let Us Know You\'re Coming!' 
                  : 'RSVP for Event'
                }
              </span>
            </h3>
            <p className="text-gray-600">{eventTitle}</p>
            {isElective && electiveOptions?.casualAttendance && (
              <p className="text-sm text-indigo-600 mt-1">
                ⭐ This is an elective event - come if you can!
              </p>
            )}
          </div>
        </div>
        
        {rsvpCountLoading ? (
          <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
            <Users className="w-4 h-4 mr-2 animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : remainingSpots && (
          <div className="inline-flex items-center px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            {remainingSpots} spots remaining
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Loading Existing RSVP Notice */}
        {isLoadingExistingRSVP && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 text-gray-600 mr-2 animate-spin" />
              <p className="text-sm text-gray-700">
                Checking for existing RSVP...
              </p>
            </div>
          </div>
        )}

        {/* Editing Existing RSVP Notice */}
        {existingRSVP && !isLoadingExistingRSVP && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-700">
                You already have an RSVP for this event. You can update your information below.
              </p>
            </div>
          </div>
        )}

        {/* Auto-Population Notice */}
        {isAuthenticated && currentUserProfile && !existingRSVP && !isLoadingExistingRSVP && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-700">
                Your RSVP form has been automatically populated with information from your profile. 
                You can edit any fields as needed.
              </p>
            </div>
          </div>
        )}

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

        {/* Payment Notice */}
        {paymentRequired && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Payment Required</p>
                <p className="text-sm text-yellow-600">
                  ${(paymentAmount / 100).toFixed(2)} {paymentCurrency} - {paymentDescription || 'Event Fee'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-yellow-600">Payment due after RSVP</p>
              </div>
            </div>
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
                {existingRSVP ? 'Updating...' : (isElective && electiveOptions?.casualAttendance ? 'Letting us know...' : 'Submitting RSVP...')}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                {console.log('🔘 Button text - existingRSVP:', existingRSVP, 'eventId:', eventId)}
                {existingRSVP ? (
                  'Update RSVP'
                ) : paymentRequired ? (
                  <>
                    Submit RSVP (Payment ${(paymentAmount / 100).toFixed(2)} required after)
                  </>
                ) : (
                  <>
                    {isElective && electiveOptions?.casualAttendance ? 'Let Us Know You\'re Coming!' : 'Submit RSVP'}
                  </>
                )}
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-green-700 mb-1">
              {existingRSVP ? 'RSVP Updated Successfully!' : 'RSVP Submitted Successfully!'}
            </h4>
            <p className="text-green-600">
              {existingRSVP ? 'Your RSVP has been updated. See you at the event!' : 'Thank you for your RSVP. We\'ll see you at the event!'}
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-red-700 mb-1">Submission Failed</h4>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}

        {submitStatus === 'payment_required' && rsvpResult && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="text-lg font-semibold text-yellow-700 mb-2">RSVP Submitted - Payment Required</h4>
            <p className="text-yellow-600 mb-4">
              Your RSVP has been submitted, but payment is required to complete your registration.
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-sm text-gray-600 mb-2">{rsvpResult.paymentDescription || 'Event Payment'}</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(rsvpResult.paymentAmount / 100).toFixed(2)} {rsvpResult.paymentCurrency}
              </p>
            </div>
            
            <button
              onClick={() => handlePayment()}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pay Now to Complete RSVP
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RSVPForm;
