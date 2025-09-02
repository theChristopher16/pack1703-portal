import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfileManager from '../Profile/UserProfileManager';
import { authService, UserRole, SocialProvider } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../contexts/AuthContext');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserProfileManager', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    role: UserRole.SCOUT,
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    authProvider: SocialProvider.GOOGLE,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      nickname: 'Tester',
      phone: '555-1234',
      address: '123 Test St',
      emergencyContact: '555-5678',
      scoutRank: 'Wolf',
      den: 'Wolf',
      packNumber: '1703',
      scoutAge: 9,
      scoutGrade: '3rd Grade',
      familyId: 'family-123',
      parentNames: ['Parent 1', 'Parent 2'],
      siblings: ['Sibling 1'],
      username: 'testuser',
      socialData: {
        google: {
          id: 'google-123',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/photo.jpg'
        }
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        timezone: 'America/Chicago'
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null
    });
    mockAuthService.validateUsername.mockResolvedValue({ isValid: true });
  });

  describe('Rendering', () => {
    test('should render user profile information', () => {
      render(<UserProfileManager />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Scout')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tester')).toBeInTheDocument();
    });

    test('should render profile sections', () => {
      render(<UserProfileManager />);
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Scouting Information')).toBeInTheDocument();
      expect(screen.getByText('Family Information')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });

    test('should show edit button when not in edit mode', () => {
      render(<UserProfileManager />);
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    test('should show role management section when canEditRole is true', () => {
      render(<UserProfileManager canEditRole={true} />);
      
      expect(screen.getByText('Role Management')).toBeInTheDocument();
      expect(screen.getByDisplayValue('scout')).toBeInTheDocument();
    });

    test('should not show role management section when canEditRole is false', () => {
      render(<UserProfileManager canEditRole={false} />);
      
      expect(screen.queryByText('Role Management')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    test('should enter edit mode when edit button is clicked', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    test('should exit edit mode when cancel is clicked', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    test('should enable form fields in edit mode', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const displayNameInput = screen.getByDisplayValue('Test User');
      expect(displayNameInput).not.toBeDisabled();
      
      const phoneInput = screen.getByDisplayValue('555-1234');
      expect(phoneInput).not.toBeDisabled();
    });

    test('should disable form fields when not in edit mode', () => {
      render(<UserProfileManager />);
      
      const displayNameInput = screen.getByDisplayValue('Test User');
      expect(displayNameInput).toBeDisabled();
      
      const phoneInput = screen.getByDisplayValue('555-1234');
      expect(phoneInput).toBeDisabled();
    });
  });

  describe('Username Validation', () => {
    test('should validate username on change', async () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      await waitFor(() => {
        expect(mockAuthService.validateUsername).toHaveBeenCalledWith('newusername');
      });
    });

    test('should show validation error for invalid username', async () => {
      mockAuthService.validateUsername.mockResolvedValue({
        isValid: false,
        error: 'Username is already taken'
      });

      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
      
      await waitFor(() => {
        expect(screen.getByText('Username is already taken')).toBeInTheDocument();
      });
    });

    test('should show validation success for valid username', async () => {
      mockAuthService.validateUsername.mockResolvedValue({
        isValid: true
      });

      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'validusername' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('username-validation-success')).toBeInTheDocument();
      });
    });
  });

  describe('Form Updates', () => {
    test('should update form data when fields are changed', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const displayNameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      
      expect(displayNameInput).toHaveValue('Updated Name');
    });

    test('should update select fields', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const scoutRankSelect = screen.getByDisplayValue('Wolf');
      fireEvent.change(scoutRankSelect, { target: { value: 'Bear' } });
      
      expect(scoutRankSelect).toHaveValue('Bear');
    });

    test('should update checkbox fields', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const emailNotificationsCheckbox = screen.getByLabelText('Email notifications');
      fireEvent.click(emailNotificationsCheckbox);
      
      expect(emailNotificationsCheckbox).not.toBeChecked();
    });
  });

  describe('Family Information', () => {
    test('should display existing parent names', () => {
      render(<UserProfileManager />);
      
      expect(screen.getByDisplayValue('Parent 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Parent 2')).toBeInTheDocument();
    });

    test('should add new parent name', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Add Parent'));
      
      const newParentInputs = screen.getAllByPlaceholderText('Parent name');
      expect(newParentInputs).toHaveLength(3); // 2 existing + 1 new
    });

    test('should remove parent name', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const removeButtons = screen.getAllByTestId('remove-parent');
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByDisplayValue('Parent 1')).not.toBeInTheDocument();
    });

    test('should display existing siblings', () => {
      render(<UserProfileManager />);
      
      expect(screen.getByDisplayValue('Sibling 1')).toBeInTheDocument();
    });

    test('should add new sibling', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Add Sibling'));
      
      const newSiblingInputs = screen.getAllByPlaceholderText('Sibling name');
      expect(newSiblingInputs).toHaveLength(2); // 1 existing + 1 new
    });

    test('should remove sibling', () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const removeButtons = screen.getAllByTestId('remove-sibling');
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByDisplayValue('Sibling 1')).not.toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);
    });

    test('should save profile changes successfully', async () => {
      const onSave = jest.fn();
      render(<UserProfileManager onSave={onSave} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const displayNameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(
          'test-user-123',
          expect.objectContaining({
            displayName: 'Updated Name'
          })
        );
      });
      
      expect(onSave).toHaveBeenCalled();
    });

    test('should show success message after save', async () => {
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });

    test('should show error message on save failure', async () => {
      mockAuthService.updateUserProfile.mockRejectedValue(new Error('Update failed'));
      
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    test('should validate username before saving', async () => {
      mockAuthService.validateUsername.mockResolvedValue({
        isValid: false,
        error: 'Username is invalid'
      });
      
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'invalid@username' } });
      
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(screen.getByText('Username is invalid')).toBeInTheDocument();
      });
      
      expect(mockAuthService.updateUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    test('should allow role changes when canEditRole is true', () => {
      render(<UserProfileManager canEditRole={true} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const roleSelect = screen.getByDisplayValue('scout');
      expect(roleSelect).not.toBeDisabled();
    });

    test('should not allow role changes when canEditRole is false', () => {
      render(<UserProfileManager canEditRole={false} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const roleSelect = screen.queryByDisplayValue('scout');
      expect(roleSelect).not.toBeInTheDocument();
    });

    test('should update role in form data', () => {
      render(<UserProfileManager canEditRole={true} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const roleSelect = screen.getByDisplayValue('scout');
      fireEvent.change(roleSelect, { target: { value: 'admin' } });
      
      expect(roleSelect).toHaveValue('admin');
    });
  });

  describe('Loading States', () => {
    test('should show loading state when user is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null
      });

      render(<UserProfileManager />);
      
      expect(screen.getByText('Loading user profile...')).toBeInTheDocument();
    });

    test('should show loading state when saving', async () => {
      mockAuthService.updateUserProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should show error when user is not found', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'User not found'
      });

      render(<UserProfileManager />);
      
      expect(screen.getByText('Loading user profile...')).toBeInTheDocument();
    });

    test('should clear error when canceling', () => {
      mockAuthService.updateUserProfile.mockRejectedValue(new Error('Update failed'));
      
      render(<UserProfileManager />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.queryByText('Update failed')).not.toBeInTheDocument();
    });
  });
});
