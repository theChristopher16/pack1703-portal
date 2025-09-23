import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAdmin } from '../../contexts/AdminContext';
import RSVPForm from '../../components/Forms/RSVPForm';

// Mock the AdminContext
jest.mock('../../contexts/AdminContext');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
  functions: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

// Mock the submitRSVP function
jest.mock('../../services/firestore', () => ({
  submitRSVP: jest.fn()
}));

describe('RSVPForm Component', () => {
  const mockProps = {
    eventId: 'test-event-id',
    eventTitle: 'Test Event',
    eventDate: '2025-01-01',
    maxCapacity: 50,
    currentRSVPs: 3,
    onSuccess: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock admin context with authenticated user
    mockUseAdmin.mockReturnValue({
      state: {
        currentUser: { 
          uid: 'test-user-id', 
          role: 'root', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          isAdmin: true,
          permissions: ['system_admin', 'user_management', 'event_management'],
          lastLogin: new Date(),
          isActive: true
        },
        isAuthenticated: true,
        isLoading: false,
        permissions: ['system_admin', 'user_management', 'event_management'],
        role: 'root',
        recentActions: [],
        auditLogs: [],
        dashboardStats: null,
        systemHealth: null,
        notifications: [],
        error: null
      },
      login: jest.fn(),
      logout: jest.fn(),
      updateUserRole: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  describe('Form Rendering', () => {
    it('should render RSVP form for authenticated users', () => {
      render(<RSVPForm {...mockProps} />);
      
      expect(screen.getByText('RSVP for Event')).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('47 spots remaining')).toBeInTheDocument();
      expect(screen.getByText('Family Information')).toBeInTheDocument();
      expect(screen.getByText('Attendees')).toBeInTheDocument();
    });

    it('should show login prompt for unauthenticated users', () => {
      mockUseAdmin.mockReturnValue({
        state: {
          ...mockUseAdmin().state,
          currentUser: null,
          isAuthenticated: false
        },
        login: jest.fn(),
        logout: jest.fn(),
        updateUserRole: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<RSVPForm {...mockProps} />);
      
      expect(screen.getByText('Login Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to your account to RSVP for this event.')).toBeInTheDocument();
      expect(screen.getByText('Login to RSVP')).toBeInTheDocument();
    });

    it('should show capacity warning when event is at capacity', () => {
      const atCapacityProps = { ...mockProps, currentRSVPs: 50 };
      
      render(<RSVPForm {...atCapacityProps} />);
      
      expect(screen.getByText('Event at Capacity')).toBeInTheDocument();
      expect(screen.getByText('This event has reached its maximum capacity.')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<RSVPForm {...mockProps} />);
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Family name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Attendee name is required')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid age')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<RSVPForm {...mockProps} />);
      
      const emailInput = screen.getByLabelText('Email Address *');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate attendee age', async () => {
      render(<RSVPForm {...mockProps} />);
      
      const ageInput = screen.getByDisplayValue('0');
      fireEvent.change(ageInput, { target: { value: '150' } });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid age')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit RSVP successfully', async () => {
      const { submitRSVP } = require('../../services/firestore');
      submitRSVP.mockResolvedValue({ success: true });
      
      render(<RSVPForm {...mockProps} />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Family Name *'), { 
        target: { value: 'Smith Family' } 
      });
      fireEvent.change(screen.getByLabelText('Email Address *'), { 
        target: { value: 'smith@example.com' } 
      });
      fireEvent.change(screen.getByDisplayValue(''), { 
        target: { value: 'John Smith' } 
      });
      fireEvent.change(screen.getByDisplayValue('0'), { 
        target: { value: '8' } 
      });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitRSVP).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'test-event-id',
            familyName: 'Smith Family',
            email: 'smith@example.com',
            attendees: expect.arrayContaining([
              expect.objectContaining({
                name: 'John Smith',
                age: 8
              })
            ])
          })
        );
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const { submitRSVP } = require('../../services/firestore');
      submitRSVP.mockResolvedValue({ success: true });
      
      render(<RSVPForm {...mockProps} />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Family Name *'), { 
        target: { value: 'Smith Family' } 
      });
      fireEvent.change(screen.getByLabelText('Email Address *'), { 
        target: { value: 'smith@example.com' } 
      });
      fireEvent.change(screen.getByDisplayValue(''), { 
        target: { value: 'John Smith' } 
      });
      fireEvent.change(screen.getByDisplayValue('0'), { 
        target: { value: '8' } 
      });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('should handle submission errors', async () => {
      const { submitRSVP } = require('../../services/firestore');
      submitRSVP.mockRejectedValue(new Error('Submission failed'));
      
      render(<RSVPForm {...mockProps} />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Family Name *'), { 
        target: { value: 'Smith Family' } 
      });
      fireEvent.change(screen.getByLabelText('Email Address *'), { 
        target: { value: 'smith@example.com' } 
      });
      fireEvent.change(screen.getByDisplayValue(''), { 
        target: { value: 'John Smith' } 
      });
      fireEvent.change(screen.getByDisplayValue('0'), { 
        target: { value: '8' } 
      });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Submission Failed')).toBeInTheDocument();
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });
  });

  describe('Attendee Management', () => {
    it('should add new attendee', () => {
      render(<RSVPForm {...mockProps} />);
      
      const addButton = screen.getByText('+ Add Attendee');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Attendee 2')).toBeInTheDocument();
    });

    it('should remove attendee when more than one exists', () => {
      render(<RSVPForm {...mockProps} />);
      
      // Add a second attendee
      const addButton = screen.getByText('+ Add Attendee');
      fireEvent.click(addButton);
      
      // Remove the second attendee
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('Attendee 2')).not.toBeInTheDocument();
    });

    it('should not allow removing the only attendee', () => {
      render(<RSVPForm {...mockProps} />);
      
      expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    });
  });

  describe('Capacity Management', () => {
    it('should show remaining spots correctly', () => {
      render(<RSVPForm {...mockProps} />);
      
      expect(screen.getByText('47 spots remaining')).toBeInTheDocument();
    });

    it('should handle unlimited capacity', () => {
      const unlimitedProps = { ...mockProps, maxCapacity: undefined };
      
      render(<RSVPForm {...unlimitedProps} />);
      
      expect(screen.queryByText('spots remaining')).not.toBeInTheDocument();
    });

    it('should prevent submission when over capacity', async () => {
      const nearCapacityProps = { ...mockProps, currentRSVPs: 45 };
      
      render(<RSVPForm {...nearCapacityProps} />);
      
      // Add 6 attendees (would exceed capacity of 50)
      for (let i = 0; i < 5; i++) {
        const addButton = screen.getByText('+ Add Attendee');
        fireEvent.click(addButton);
      }
      
      // Fill out all attendees
      const nameInputs = screen.getAllByDisplayValue('');
      const ageInputs = screen.getAllByDisplayValue('0');
      
      nameInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: `Attendee ${index + 1}` } });
      });
      
      ageInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: '8' } });
      });
      
      // Fill out family info
      fireEvent.change(screen.getByLabelText('Family Name *'), { 
        target: { value: 'Smith Family' } 
      });
      fireEvent.change(screen.getByLabelText('Email Address *'), { 
        target: { value: 'smith@example.com' } 
      });
      
      const submitButton = screen.getByText('Submit RSVP');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Event is at capacity. Only 5 spots remaining.')).toBeInTheDocument();
      });
    });
  });
});
