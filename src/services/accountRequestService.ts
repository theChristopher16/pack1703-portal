import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export interface AccountRequest {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  address: string;
  scoutRank?: string;
  den?: string;
  emergencyContact?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  createdAt: any;
  approvedBy?: string;
  approvedAt?: any;
  approvedRole?: string;
  rejectedBy?: string;
  rejectedAt?: any;
  rejectionReason?: string;
}

export interface AccountRequestFormData {
  email: string;
  displayName: string;
  phone: string;
  address: string;
  scoutRank?: string;
  den?: string;
  emergencyContact?: string;
  reason?: string;
}

class AccountRequestService {
  private submitAccountRequest = httpsCallable(functions, 'submitAccountRequest');
  private getPendingAccountRequests = httpsCallable(functions, 'getPendingAccountRequests');
  private approveAccountRequest = httpsCallable(functions, 'approveAccountRequest');
  private rejectAccountRequest = httpsCallable(functions, 'rejectAccountRequest');

  async submitRequest(formData: AccountRequestFormData): Promise<{ success: boolean; requestId?: string; message: string; error?: string }> {
    try {
      // Add IP hash and user agent for security
      const requestData = {
        ...formData,
        ipHash: this.generateIPHash(),
        userAgent: navigator.userAgent
      };

      const result = await this.submitAccountRequest(requestData);
      return {
        success: true,
        requestId: (result.data as any).requestId,
        message: (result.data as any).message
      };
    } catch (error: any) {
      console.error('Error submitting account request:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit account request',
        error: error.message
      };
    }
  }

  async getPendingRequests(): Promise<{ success: boolean; requests?: AccountRequest[]; count?: number; message: string; error?: string }> {
    try {
      console.log('Calling getPendingAccountRequests Cloud Function...');
      const result = await this.getPendingAccountRequests({});
      console.log('Cloud Function response:', result);
      return {
        success: true,
        requests: (result.data as any).requests,
        count: (result.data as any).count,
        message: (result.data as any).message
      };
    } catch (error: any) {
      console.error('Error getting pending requests:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return {
        success: false,
        message: error.message || 'Failed to get pending requests',
        error: error.message
      };
    }
  }

  async approveRequest(requestId: string, role: string = 'parent'): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const result = await this.approveAccountRequest({ requestId, role });
      return {
        success: true,
        message: (result.data as any).message
      };
    } catch (error: any) {
      console.error('Error approving account request:', error);
      return {
        success: false,
        message: error.message || 'Failed to approve account request',
        error: error.message
      };
    }
  }

  async rejectRequest(requestId: string, reason: string = ''): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const result = await this.rejectAccountRequest({ requestId, reason });
      return {
        success: true,
        message: (result.data as any).message
      };
    } catch (error: any) {
      console.error('Error rejecting account request:', error);
      return {
        success: false,
        message: error.message || 'Failed to reject account request',
        error: error.message
      };
    }
  }

  private generateIPHash(): string {
    // Generate a simple hash for IP tracking (in a real app, you'd get this from the server)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return btoa(timestamp + random).substring(0, 64);
  }

  validateFormData(formData: AccountRequestFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.email || !formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.displayName || !formData.displayName.trim()) {
      errors.push('Display name is required');
    } else if (formData.displayName.trim().length < 2) {
      errors.push('Display name must be at least 2 characters');
    }

    if (!formData.phone || !formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.push('Please enter a valid phone number');
    }

    if (!formData.address || !formData.address.trim()) {
      errors.push('Address is required');
    } else if (formData.address.trim().length < 10) {
      errors.push('Please enter a complete address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const accountRequestService = new AccountRequestService();
