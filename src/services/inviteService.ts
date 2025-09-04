import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserRole } from './authService';
import { emailService } from './emailService';
import { authService } from './authService';

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  message?: string;
  denId?: string; // For den-specific invites
}

export interface InviteCreateData {
  email: string;
  role: UserRole;
  message?: string;
  denId?: string;
  expiresInDays?: number;
}

class InviteService {
  private readonly COLLECTION = 'invites';

  // Create an invite (root/admin only)
  async createInvite(data: InviteCreateData, currentUser: any): Promise<Invite> {
    const inviteId = this.generateInviteId();
    const expiresInDays = data.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite: Omit<Invite, 'id'> = {
      email: data.email.toLowerCase(),
      role: data.role,
      invitedBy: currentUser.uid,
      invitedByName: currentUser.displayName || currentUser.email,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      message: data.message,
      denId: data.denId
    };

    await setDoc(doc(db, this.COLLECTION, inviteId), {
      ...invite,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt
    });

    return {
      id: inviteId,
      ...invite
    };
  }

  // Get invite by ID
  async getInvite(inviteId: string): Promise<Invite | null> {
    try {
      const inviteDoc = await getDoc(doc(db, this.COLLECTION, inviteId));
      if (!inviteDoc.exists()) {
        return null;
      }

      const data = inviteDoc.data();
      return {
        id: inviteId,
        email: data.email,
        role: data.role,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
        status: data.status,
        expiresAt: data.expiresAt.toDate(),
        createdAt: data.createdAt.toDate(),
        acceptedAt: data.acceptedAt?.toDate(),
        acceptedBy: data.acceptedBy,
        message: data.message,
        denId: data.denId
      };
    } catch (error) {
      console.error('Error getting invite:', error);
      return null;
    }
  }

  // Get invites by email
  async getInvitesByEmail(email: string): Promise<Invite[]> {
    try {
      const invitesQuery = query(
        collection(db, this.COLLECTION),
        where('email', '==', email.toLowerCase())
      );
      const snapshot = await getDocs(invitesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        invitedBy: doc.data().invitedBy,
        invitedByName: doc.data().invitedByName,
        status: doc.data().status,
        expiresAt: doc.data().expiresAt.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
        acceptedBy: doc.data().acceptedBy,
        message: doc.data().message,
        denId: doc.data().denId
      }));
    } catch (error) {
      console.error('Error getting invites by email:', error);
      return [];
    }
  }

  // Get all pending invites (for admin view)
  async getPendingInvites(): Promise<Invite[]> {
    try {
      const invitesQuery = query(
        collection(db, this.COLLECTION),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(invitesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        invitedBy: doc.data().invitedBy,
        invitedByName: doc.data().invitedByName,
        status: doc.data().status,
        expiresAt: doc.data().expiresAt.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
        acceptedBy: doc.data().acceptedBy,
        message: doc.data().message,
        denId: doc.data().denId
      }));
    } catch (error) {
      console.error('Error getting pending invites:', error);
      return [];
    }
  }

  // Accept an invite and create user
  async acceptInvite(inviteId: string, acceptedBy: string, userData?: { email: string; displayName: string; password: string }): Promise<boolean> {
    try {
      const invite = await this.getInvite(inviteId);
      if (!invite) {
        throw new Error('Invite not found');
      }

      if (invite.status !== 'pending') {
        throw new Error('Invite has already been used or expired');
      }

      if (invite.expiresAt < new Date()) {
        throw new Error('Invite has expired');
      }

      // Update invite status
      await updateDoc(doc(db, this.COLLECTION, inviteId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy
      });

      // Create user account if userData is provided
      if (userData) {
        try {
          await authService.createUser(
            userData.email,
            userData.password,
            userData.displayName,
            invite.role
          );
          console.log(`✅ User account created for ${userData.email} with role ${invite.role}`);
        } catch (userError) {
          console.error('Error creating user account:', userError);
          // Don't fail the invite acceptance if user creation fails
          // The user can still be created manually later
        }
      }

      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      return false;
    }
  }

  // Cancel/delete an invite
  async cancelInvite(inviteId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, inviteId));
      return true;
    } catch (error) {
      console.error('Error canceling invite:', error);
      return false;
    }
  }

  // Resend an invite (extend expiration)
  async resendInvite(inviteId: string, expiresInDays: number = 7): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await updateDoc(doc(db, this.COLLECTION, inviteId), {
        expiresAt: serverTimestamp(),
        status: 'pending'
      });

      return true;
    } catch (error) {
      console.error('Error resending invite:', error);
      return false;
    }
  }

  // Check if invite is valid
  async isInviteValid(inviteId: string): Promise<{ valid: boolean; invite?: Invite; error?: string }> {
    try {
      const invite = await this.getInvite(inviteId);
      if (!invite) {
        return { valid: false, error: 'Invite not found' };
      }

      if (invite.status !== 'pending') {
        return { valid: false, error: 'Invite has already been used' };
      }

      if (invite.expiresAt < new Date()) {
        return { valid: false, error: 'Invite has expired' };
      }

      return { valid: true, invite };
    } catch (error) {
      return { valid: false, error: 'Invalid invite' };
    }
  }

  // Generate a secure invite ID
  private generateInviteId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Get invite URL
  getInviteUrl(inviteId: string): string {
    return `${window.location.origin}/join/${inviteId}`;
  }

  // Send invite email using email service
  async sendInviteEmail(invite: Invite): Promise<boolean> {
    try {
      const inviteUrl = this.getInviteUrl(invite.id);
      
      // Use the email service to send the invitation
      const success = await emailService.sendInviteEmail(invite.email, inviteUrl, invite);
      
      if (success) {
        console.log(`📧 Invitation email sent successfully to ${invite.email}`);
      } else {
        console.error(`❌ Failed to send invitation email to ${invite.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending invite email:', error);
      return false;
    }
  }
}

export const inviteService = new InviteService();
export default inviteService;
