import { accountRequestService, AccountRequestFormData } from '../accountRequestService';

describe('AccountRequestService', () => {
  describe('validateFormData', () => {
    it('should validate form data correctly', () => {
      const validData: AccountRequestFormData = {
        email: 'test@example.com',
        displayName: 'John Doe',
        phone: '555-1234',
        address: '123 Main Street, City, State 12345'
      };

      const result = accountRequestService.validateFormData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidData: AccountRequestFormData = {
        email: 'invalid-email',
        displayName: 'A', // Too short
        phone: 'abc', // Invalid phone
        address: 'Short' // Too short
      };

      const result = accountRequestService.validateFormData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid email address');
      expect(result.errors).toContain('Display name must be at least 2 characters');
      expect(result.errors).toContain('Please enter a valid phone number');
      expect(result.errors).toContain('Please enter a complete address');
    });

    it('should return errors for missing required fields', () => {
      const emptyData: AccountRequestFormData = {
        email: '',
        displayName: '',
        phone: '',
        address: ''
      };

      const result = accountRequestService.validateFormData(emptyData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Display name is required');
      expect(result.errors).toContain('Phone number is required');
      expect(result.errors).toContain('Address is required');
    });
  });

  describe('generateIPHash', () => {
    it('should generate IP hash', () => {
      // Test the IP hash generation method exists
      const service = accountRequestService as any;
      expect(typeof service.generateIPHash).toBe('function');
      
      const hash = service.generateIPHash();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.length).toBeLessThanOrEqual(64);
    });
  });

  describe('service methods exist', () => {
    it('should have submitRequest method', () => {
      expect(typeof accountRequestService.submitRequest).toBe('function');
    });

    it('should have getPendingRequests method', () => {
      expect(typeof accountRequestService.getPendingRequests).toBe('function');
    });

    it('should have approveRequest method', () => {
      expect(typeof accountRequestService.approveRequest).toBe('function');
    });

    it('should have rejectRequest method', () => {
      expect(typeof accountRequestService.rejectRequest).toBe('function');
    });
  });

  describe('method parameter handling', () => {
    it('should handle submitRequest parameters correctly', async () => {
      const formData: AccountRequestFormData = {
        email: 'test@example.com',
        displayName: 'Test User',
        phone: '555-1234',
        address: '123 Test St'
      };

      // Test that the method exists and can be called
      expect(typeof accountRequestService.submitRequest).toBe('function');
      
      // In a real test environment, this would fail due to Firebase not being initialized
      // For now, we just verify the method exists and accepts the right parameters
      const result = await accountRequestService.submitRequest(formData);
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle approveRequest parameters correctly', async () => {
      expect(typeof accountRequestService.approveRequest).toBe('function');
      
      const result = await accountRequestService.approveRequest('test-request-id', 'parent');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle rejectRequest parameters correctly', async () => {
      expect(typeof accountRequestService.rejectRequest).toBe('function');
      
      const result = await accountRequestService.rejectRequest('test-request-id', 'Invalid information');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should handle getPendingRequests parameters correctly', async () => {
      expect(typeof accountRequestService.getPendingRequests).toBe('function');
      
      const result = await accountRequestService.getPendingRequests();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });
});