import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountRequestModal from '../AccountRequestModal';
import { accountRequestService, AccountRequestFormData } from '../../../services/accountRequestService';

// Mock the account request service
jest.mock('../../../services/accountRequestService', () => ({
  accountRequestService: {
    submitRequest: jest.fn(),
    validateFormData: jest.fn(),
  },
}));

const mockAccountRequestService = accountRequestService as jest.Mocked<typeof accountRequestService>;

describe('AccountRequestModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Request Account Access')).toBeInTheDocument();
    expect(screen.getByText('Submit your information for pack leadership review')).toBeInTheDocument();
    expect(screen.getByText('Full Name *')).toBeInTheDocument();
    expect(screen.getByText('Email Address *')).toBeInTheDocument();
    expect(screen.getByText('Phone Number *')).toBeInTheDocument();
    expect(screen.getByText('Address *')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AccountRequestModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Request Account Access')).not.toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Find the close button by its icon (X button)
    const closeButton = screen.getByRole('button', { name: '' }); // The X button has no accessible name
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    mockAccountRequestService.submitRequest.mockResolvedValue({
      success: true,
      requestId: 'test-request-id',
      message: 'Account request submitted successfully'
    });

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out required fields using the actual input elements
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    const addressInput = screen.getByPlaceholderText('Enter your complete address');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '555-1234');
    await user.type(addressInput, '123 Main St');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAccountRequestService.validateFormData).toHaveBeenCalledWith({
        email: 'john@example.com',
        displayName: 'John Doe',
        phone: '555-1234',
        address: '123 Main St',
        scoutRank: '',
        den: '',
        emergencyContact: '',
        reason: ''
      });
    });

    await waitFor(() => {
      expect(mockAccountRequestService.submitRequest).toHaveBeenCalledWith({
        email: 'john@example.com',
        displayName: 'John Doe',
        phone: '555-1234',
        address: '123 Main St',
        scoutRank: '',
        den: '',
        emergencyContact: '',
        reason: ''
      });
    });

    expect(screen.getByText('Request Submitted Successfully!')).toBeInTheDocument();
    expect(mockOnSuccess).toHaveBeenCalledWith('test-request-id');
  });

  it('shows error message when validation fails', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: false,
      errors: ['Email is required', 'Display name is required']
    });

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required, Display name is required')).toBeInTheDocument();
    });

    expect(mockAccountRequestService.submitRequest).not.toHaveBeenCalled();
  });

  it('shows error message when submission fails', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    mockAccountRequestService.submitRequest.mockResolvedValue({
      success: false,
      message: 'An account with this email already exists'
    });

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out required fields
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    const addressInput = screen.getByPlaceholderText('Enter your complete address');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(phoneInput, '555-1234');
    await user.type(addressInput, '123 Main St');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockAccountRequestService.submitRequest.mockReturnValue(promise);

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out required fields
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    const addressInput = screen.getByPlaceholderText('Enter your complete address');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '555-1234');
    await user.type(addressInput, '123 Main St');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      success: true,
      requestId: 'test-request-id',
      message: 'Account request submitted successfully'
    });

    await waitFor(() => {
      expect(screen.getByText('Request Submitted Successfully!')).toBeInTheDocument();
    });
  });

  it('fills optional fields correctly', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    mockAccountRequestService.submitRequest.mockResolvedValue({
      success: true,
      requestId: 'test-request-id',
      message: 'Account request submitted successfully'
    });

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out all fields
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    const addressInput = screen.getByPlaceholderText('Enter your complete address');
    const emergencyInput = screen.getByPlaceholderText('Emergency contact name and phone');
    const reasonInput = screen.getByPlaceholderText('Tell us why you\'d like to join Pack 1703...');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '555-1234');
    await user.type(addressInput, '123 Main St');
    await user.type(emergencyInput, 'Jane Doe');
    await user.type(reasonInput, 'Want to join the pack');

    // Select from dropdowns
    const scoutRankSelect = screen.getByDisplayValue('Select Rank');
    const denSelect = screen.getByDisplayValue('Select Den');

    await user.selectOptions(scoutRankSelect, 'Wolf');
    await user.selectOptions(denSelect, 'Wolf Den');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAccountRequestService.submitRequest).toHaveBeenCalledWith({
        email: 'john@example.com',
        displayName: 'John Doe',
        phone: '555-1234',
        address: '123 Main St',
        scoutRank: 'Wolf',
        den: 'Wolf Den',
        emergencyContact: 'Jane Doe',
        reason: 'Want to join the pack'
      });
    });
  });

  it('closes modal after successful submission', async () => {
    const user = userEvent.setup();
    
    mockAccountRequestService.validateFormData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    mockAccountRequestService.submitRequest.mockResolvedValue({
      success: true,
      requestId: 'test-request-id',
      message: 'Account request submitted successfully'
    });

    render(
      <AccountRequestModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out required fields
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    const addressInput = screen.getByPlaceholderText('Enter your complete address');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '555-1234');
    await user.type(addressInput, '123 Main St');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Request Submitted Successfully!')).toBeInTheDocument();
    });

    // Wait for auto-close after 3 seconds
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 4000 });
  });
});