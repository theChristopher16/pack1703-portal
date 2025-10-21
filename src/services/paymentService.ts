/**
 * Payment Service
 * Handles all payment-related operations including Square integration, 
 * payment tracking, and manual payment recording
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PaymentInfo } from '../types/firestore';

// Square Web SDK types
interface SquarePaymentForm {
  build: () => void;
  requestCardNonce: () => void;
  destroy: () => void;
}

interface SquarePaymentResult {
  nonce: string;
  card: {
    brand: string;
    last4: string;
  };
}

interface PaymentStatusSummary {
  totalRSVPs: number;
  paidCount: number;
  unpaidCount: number;
  totalExpected: number;
  totalReceived: number;
  pendingAmount: number;
}

interface RSVPPaymentInfo {
  rsvpId: string;
  familyName: string;
  email: string;
  attendeeCount: number;
  paymentRequired: boolean;
  paymentStatus: 'not_required' | 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentId?: string;
  paymentMethod?: 'square' | 'cash' | 'check' | 'other';
  paymentNotes?: string;
  paidAt?: Timestamp;
}

class PaymentService {
  private functions = getFunctions();

  /**
   * Initialize Square payment form
   */
  async initializeSquarePayment(
    paymentData: {
      applicationId: string;
      locationId: string;
      amount: number;
      currency: string;
      description: string;
    },
    onSuccess: (result: SquarePaymentResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Square Web Payments SDK if not already loaded
      if (typeof window !== 'undefined' && !(window as any).Square) {
        const script = document.createElement('script');
        script.src = 'https://web.squarecdn.com/v1/square.js';
        script.onload = () => {
          this.buildSquareForm(paymentData, onSuccess, onError);
          resolve();
        };
        script.onerror = () => {
          const error = new Error('Failed to load Square SDK');
          onError(error);
          reject(error);
        };
        document.head.appendChild(script);
      } else {
        this.buildSquareForm(paymentData, onSuccess, onError);
        resolve();
      }
    });
  }

  private buildSquareForm(
    paymentData: any,
    onSuccess: (result: SquarePaymentResult) => void,
    onError: (error: Error) => void
  ): void {
    const Square = (window as any).Square;
    
    const paymentForm: SquarePaymentForm = new Square.PaymentForm({
      applicationId: paymentData.applicationId,
      locationId: paymentData.locationId,
      inputClass: 'sq-input',
      cardNumber: {
        elementId: 'sq-card-number',
        placeholder: 'Card Number'
      },
      cvv: {
        elementId: 'sq-cvv',
        placeholder: 'CVV'
      },
      expirationDate: {
        elementId: 'sq-expiration-date',
        placeholder: 'MM/YY'
      },
      postalCode: {
        elementId: 'sq-postal-code',
        placeholder: 'Postal Code'
      },
      callbacks: {
        cardNonceResponseReceived: (errors: any[], nonce: string, cardData: any) => {
          if (errors) {
            onError(new Error(errors[0].message));
            return;
          }
          
          onSuccess({
            nonce,
            card: {
              brand: cardData.card_brand,
              last4: cardData.last_4
            }
          });
        }
      }
    });

    paymentForm.build();
  }

  /**
   * Create a payment record and initialize Square payment
   */
  async createRSVPPayment(rsvpId: string, eventId: string): Promise<any> {
    const createPayment = httpsCallable(this.functions, 'createRSVPPayment');
    
    try {
      const result = await createPayment({ rsvpId, eventId });
      return result;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw new Error(error.message || 'Failed to create payment');
    }
  }

  /**
   * Complete a payment with Square nonce
   */
  async completeRSVPPayment(
    paymentId: string,
    rsvpId: string,
    nonce: string
  ): Promise<any> {
    const completePayment = httpsCallable(this.functions, 'completeRSVPPayment');
    
    try {
      const result = await completePayment({ paymentId, rsvpId, nonce });
      return result;
    } catch (error: any) {
      console.error('Error completing payment:', error);
      throw new Error(error.message || 'Failed to complete payment');
    }
  }

  /**
   * Record a manual payment (cash, check, etc.)
   */
  async recordManualPayment(
    rsvpId: string,
    eventId: string,
    amount: number,
    method: 'cash' | 'check' | 'other',
    notes?: string
  ): Promise<void> {
    try {
      // Get RSVP document
      const rsvpRef = doc(db, 'rsvps', rsvpId);
      const rsvpDoc = await getDoc(rsvpRef);
      
      if (!rsvpDoc.exists()) {
        throw new Error('RSVP not found');
      }

      const rsvpData = rsvpDoc.data();

      // Create payment record
      const paymentData: Partial<PaymentInfo> = {
        eventId,
        rsvpId,
        userId: rsvpData.userId,
        amount,
        currency: 'USD',
        status: 'completed',
        description: `Manual payment (${method}) for ${rsvpData.familyName}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        processedAt: Timestamp.now(),
      };

      // Add payment record
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);

      // Update RSVP with payment status
      await updateDoc(rsvpRef, {
        paymentStatus: 'completed',
        paymentId: paymentRef.id,
        paymentMethod: method,
        paymentNotes: notes,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('Manual payment recorded successfully');
    } catch (error: any) {
      console.error('Error recording manual payment:', error);
      throw new Error(error.message || 'Failed to record manual payment');
    }
  }

  /**
   * Get all payments for an event
   */
  async getEventPayments(eventId: string): Promise<PaymentInfo[]> {
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('eventId', '==', eventId)
      );

      const snapshot = await getDocs(paymentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PaymentInfo));
    } catch (error: any) {
      console.error('Error getting event payments:', error);
      throw new Error(error.message || 'Failed to get event payments');
    }
  }

  /**
   * Get payment status summary for an event
   */
  async getPaymentStatusSummary(eventId: string): Promise<PaymentStatusSummary> {
    try {
      // Get all RSVPs for the event using Cloud Function (bypasses security rules)
      const getRSVPData = httpsCallable(this.functions, 'getRSVPData');
      const result = await getRSVPData({ eventId });
      const rsvps = (result.data as any).rsvps || [];

      // Get event details
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      const eventData = eventDoc.data();

      const paymentRequired = eventData?.paymentRequired || false;
      const paymentAmount = eventData?.paymentAmount || 0;

      // Calculate statistics
      let paidCount = 0;
      let unpaidCount = 0;
      let totalReceived = 0;

      rsvps.forEach((rsvp: any) => {
        if (!paymentRequired) return;

        if (rsvp.paymentStatus === 'completed') {
          paidCount++;
          totalReceived += paymentAmount;
        } else {
          unpaidCount++;
        }
      });

      const totalRSVPs = rsvps.length;
      const totalExpected = totalRSVPs * paymentAmount;
      const pendingAmount = totalExpected - totalReceived;

      return {
        totalRSVPs,
        paidCount,
        unpaidCount,
        totalExpected,
        totalReceived,
        pendingAmount
      };
    } catch (error: any) {
      console.error('Error getting payment status summary:', error);
      throw new Error(error.message || 'Failed to get payment status summary');
    }
  }

  /**
   * Get RSVP payment information for admin view
   */
  async getRSVPPaymentInfo(eventId: string): Promise<RSVPPaymentInfo[]> {
    try {
      // Get all RSVPs for the event using Cloud Function
      const getRSVPData = httpsCallable(this.functions, 'getRSVPData');
      const result = await getRSVPData({ eventId });
      const rsvps = (result.data as any).rsvps || [];

      return rsvps.map((rsvp: any) => ({
        rsvpId: rsvp.id,
        familyName: rsvp.familyName,
        email: rsvp.email,
        attendeeCount: rsvp.attendees?.length || 0,
        paymentRequired: rsvp.paymentRequired || false,
        paymentStatus: rsvp.paymentStatus || 'not_required',
        paymentAmount: rsvp.paymentAmount,
        paymentId: rsvp.paymentId,
        paymentMethod: rsvp.paymentMethod,
        paymentNotes: rsvp.paymentNotes,
        paidAt: rsvp.paidAt
      }));
    } catch (error: any) {
      console.error('Error getting RSVP payment info:', error);
      throw new Error(error.message || 'Failed to get RSVP payment info');
    }
  }

  /**
   * Export payment data to CSV
   */
  exportPaymentData(
    eventTitle: string,
    paymentInfo: RSVPPaymentInfo[],
    summary: PaymentStatusSummary
  ): void {
    // Create CSV content
    const headers = [
      'Family Name',
      'Email',
      'Attendees',
      'Payment Status',
      'Amount',
      'Payment Method',
      'Paid Date',
      'Notes'
    ];

    const rows = paymentInfo.map(info => [
      info.familyName,
      info.email,
      info.attendeeCount.toString(),
      info.paymentStatus,
      info.paymentAmount ? `$${(info.paymentAmount / 100).toFixed(2)}` : 'N/A',
      info.paymentMethod || 'N/A',
      info.paidAt ? new Date(info.paidAt.seconds * 1000).toLocaleDateString() : 'N/A',
      info.paymentNotes || ''
    ]);

    // Add summary at the top
    const summaryRows = [
      ['Payment Summary'],
      ['Total RSVPs', summary.totalRSVPs.toString()],
      ['Paid', summary.paidCount.toString()],
      ['Unpaid', summary.unpaidCount.toString()],
      ['Total Expected', `$${(summary.totalExpected / 100).toFixed(2)}`],
      ['Total Received', `$${(summary.totalReceived / 100).toFixed(2)}`],
      ['Pending Amount', `$${(summary.pendingAmount / 100).toFixed(2)}`],
      [],
      headers
    ];

    const csvContent = [
      ...summaryRows,
      ...rows
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}_payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Format currency amount
   */
  formatCurrency(amountInCents: number, currency: string = 'USD'): string {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }
}

export const paymentService = new PaymentService();
export type { PaymentStatusSummary, RSVPPaymentInfo, SquarePaymentResult };

