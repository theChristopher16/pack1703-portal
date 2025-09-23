import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RSVPForm from '../../components/Forms/RSVPForm';

// Mock the AdminContext
jest.mock('../../contexts/AdminContext', () => ({
  useAdmin: () => ({
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
  })
}));

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

describe('RSVPForm Component - Core Functionality', () => {
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
  });

  describe('Attendee Management', () => {
    it('should add new attendee', () => {
      render(<RSVPForm {...mockProps} />);
      
      const addButton = screen.getByText('+ Add Attendee');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Attendee 2')).toBeInTheDocument();
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
  });
});