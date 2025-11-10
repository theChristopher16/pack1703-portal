import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';
import {
  HouseholdInvitation,
  HouseholdMember,
  HouseholdMemberRole,
  HouseholdPermissions,
  SharedHousehold,
  UserHouseholds,
  ChildProfile,
  OWNER_PERMISSIONS,
  ADMIN_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  CHILD_PERMISSIONS,
} from '../types/householdSharing';

class HouseholdSharingService {
  private readonly HOUSEHOLDS_COLLECTION = 'sharedHouseholds';
  private readonly INVITATIONS_COLLECTION = 'householdInvitations';
  private readonly USER_HOUSEHOLDS_COLLECTION = 'userHouseholds';
  private readonly CHILD_PROFILES_COLLECTION = 'childProfiles';

  /**
   * Get all households the current user is a member of
   */
  async getUserHouseholds(): Promise<UserHouseholds | null> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.USER_HOUSEHOLDS_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      userId: user.uid,
      primaryHouseholdId: data.primaryHouseholdId,
      households: data.households || [],
    };
  }

  /**
   * Get household details
   */
  async getHousehold(householdId: string): Promise<SharedHousehold | null> {
    const docRef = doc(db, this.HOUSEHOLDS_COLLECTION, householdId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      members: data.members || [],
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as SharedHousehold;
  }

  /**
   * Convert existing household profile to shared household
   */
  async migrateToSharedHousehold(householdProfileId: string): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get existing household profile
    const profileRef = doc(db, 'householdProfiles', householdProfileId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      throw new Error('Household profile not found');
    }

    const profile = profileSnap.data();
    const now = Timestamp.now();

    // Create shared household
    const sharedHouseholdRef = doc(collection(db, this.HOUSEHOLDS_COLLECTION));
    const sharedHousehold: Omit<SharedHousehold, 'id'> = {
      name: profile.householdName,
      address: profile.address,
      ownerId: user.uid,
      members: [
        {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Unknown',
          role: 'owner',
          joinedAt: now.toDate(),
          addedBy: user.uid,
          permissions: OWNER_PERMISSIONS,
        },
      ],
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };

    await setDoc(sharedHouseholdRef, {
      ...sharedHousehold,
      createdAt: now,
      updatedAt: now,
    });

    // Update user households
    await this.addHouseholdToUser(user.uid, sharedHouseholdRef.id, profile.householdName, 'owner', true);

    // Update household profile to reference shared household
    await updateDoc(profileRef, {
      sharedHouseholdId: sharedHouseholdRef.id,
      updatedAt: now,
    });

    return sharedHouseholdRef.id;
  }

  /**
   * Send invitation to join household
   */
  async inviteToHousehold(
    householdId: string,
    invitedEmail: string,
    role: HouseholdMemberRole = 'member',
    permissions?: HouseholdPermissions,
    message?: string
  ): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Verify user has permission to invite
    const household = await this.getHousehold(householdId);
    if (!household) throw new Error('Household not found');

    const currentMember = household.members.find((m) => m.userId === user.uid);
    if (!currentMember || !currentMember.permissions.canManageMembers) {
      throw new Error('You do not have permission to invite members');
    }

    // Check if user is already a member
    const existingMember = household.members.find((m) => m.email === invitedEmail);
    if (existingMember) {
      throw new Error('This user is already a member of the household');
    }

    // Check for pending invitation
    const existingInviteQuery = query(
      collection(db, this.INVITATIONS_COLLECTION),
      where('householdId', '==', householdId),
      where('invitedEmail', '==', invitedEmail),
      where('status', '==', 'pending')
    );
    const existingInvites = await getDocs(existingInviteQuery);
    if (!existingInvites.empty) {
      throw new Error('An invitation has already been sent to this email');
    }

    const now = Timestamp.now();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

    const inviteRef = doc(collection(db, this.INVITATIONS_COLLECTION));
    const invitation: Omit<HouseholdInvitation, 'id'> = {
      householdId,
      householdName: household.name,
      invitedEmail,
      invitedBy: user.uid,
      invitedByName: user.displayName || 'Unknown',
      role,
      permissions: permissions || this.getDefaultPermissionsForRole(role),
      status: 'pending',
      message,
      createdAt: now.toDate(),
      expiresAt,
    };

    await setDoc(inviteRef, {
      ...invitation,
      createdAt: now,
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    return inviteRef.id;
  }

  /**
   * Get pending invitations for current user
   */
  async getMyInvitations(): Promise<HouseholdInvitation[]> {
    const user = authService.getCurrentUser();
    if (!user || !user.email) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.INVITATIONS_COLLECTION),
      where('invitedEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const invitations: HouseholdInvitation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Check if expired
      const expiresAt = data.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        // Mark as expired
        updateDoc(doc.ref, { status: 'expired' });
        return;
      }

      invitations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        respondedAt: data.respondedAt?.toDate(),
      } as HouseholdInvitation);
    });

    return invitations;
  }

  /**
   * Accept household invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const inviteRef = doc(db, this.INVITATIONS_COLLECTION, invitationId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) throw new Error('Invitation not found');

    const invitation = inviteSnap.data() as any;

    if (invitation.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    if (invitation.invitedEmail !== user.email) {
      throw new Error('This invitation is not for you');
    }

    const now = Timestamp.now();

    // Add user to household
    const householdRef = doc(db, this.HOUSEHOLDS_COLLECTION, invitation.householdId);
    const newMember: HouseholdMember = {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Unknown',
      role: invitation.role,
      joinedAt: now.toDate(),
      addedBy: invitation.invitedBy,
      permissions: invitation.permissions,
    };

    await updateDoc(householdRef, {
      members: arrayUnion(newMember),
      updatedAt: now,
    });

    // Add household to user's list
    await this.addHouseholdToUser(
      user.uid,
      invitation.householdId,
      invitation.householdName,
      invitation.role,
      false
    );

    // Mark invitation as accepted
    await updateDoc(inviteRef, {
      status: 'accepted',
      respondedAt: now,
    });
  }

  /**
   * Decline household invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const inviteRef = doc(db, this.INVITATIONS_COLLECTION, invitationId);
    await updateDoc(inviteRef, {
      status: 'declined',
      respondedAt: Timestamp.now(),
    });
  }

  /**
   * Leave a household
   */
  async leaveHousehold(householdId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const household = await this.getHousehold(householdId);
    if (!household) throw new Error('Household not found');

    if (household.ownerId === user.uid) {
      throw new Error('Owners cannot leave. Transfer ownership or delete the household instead.');
    }

    // Remove from household members
    const member = household.members.find((m) => m.userId === user.uid);
    if (member) {
      const householdRef = doc(db, this.HOUSEHOLDS_COLLECTION, householdId);
      await updateDoc(householdRef, {
        members: arrayRemove(member),
        updatedAt: Timestamp.now(),
      });
    }

    // Remove from user's households
    const userHouseholdsRef = doc(db, this.USER_HOUSEHOLDS_COLLECTION, user.uid);
    const userHouseholdsSnap = await getDoc(userHouseholdsRef);

    if (userHouseholdsSnap.exists()) {
      const data = userHouseholdsSnap.data();
      const updatedHouseholds = (data.households || []).filter(
        (h: any) => h.householdId !== householdId
      );

      await updateDoc(userHouseholdsRef, {
        households: updatedHouseholds,
        primaryHouseholdId:
          data.primaryHouseholdId === householdId ? null : data.primaryHouseholdId,
      });
    }
  }

  /**
   * Remove member from household
   */
  async removeMember(householdId: string, memberUserId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const household = await this.getHousehold(householdId);
    if (!household) throw new Error('Household not found');

    const currentMember = household.members.find((m) => m.userId === user.uid);
    if (!currentMember || !currentMember.permissions.canManageMembers) {
      throw new Error('You do not have permission to remove members');
    }

    if (household.ownerId === memberUserId) {
      throw new Error('Cannot remove the household owner');
    }

    const memberToRemove = household.members.find((m) => m.userId === memberUserId);
    if (!memberToRemove) throw new Error('Member not found');

    // Remove from household
    const householdRef = doc(db, this.HOUSEHOLDS_COLLECTION, householdId);
    await updateDoc(householdRef, {
      members: arrayRemove(memberToRemove),
      updatedAt: Timestamp.now(),
    });

    // Remove from user's households
    const userHouseholdsRef = doc(db, this.USER_HOUSEHOLDS_COLLECTION, memberUserId);
    const userHouseholdsSnap = await getDoc(userHouseholdsRef);

    if (userHouseholdsSnap.exists()) {
      const data = userHouseholdsSnap.data();
      const updatedHouseholds = (data.households || []).filter(
        (h: any) => h.householdId !== householdId
      );

      await updateDoc(userHouseholdsRef, {
        households: updatedHouseholds,
        primaryHouseholdId:
          data.primaryHouseholdId === householdId ? null : data.primaryHouseholdId,
      });
    }
  }

  /**
   * Update member permissions
   */
  async updateMemberPermissions(
    householdId: string,
    memberUserId: string,
    permissions: Partial<HouseholdPermissions>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const household = await this.getHousehold(householdId);
    if (!household) throw new Error('Household not found');

    const currentMember = household.members.find((m) => m.userId === user.uid);
    if (!currentMember || !currentMember.permissions.canManageMembers) {
      throw new Error('You do not have permission to update member permissions');
    }

    const memberIndex = household.members.findIndex((m) => m.userId === memberUserId);
    if (memberIndex === -1) throw new Error('Member not found');

    household.members[memberIndex].permissions = {
      ...household.members[memberIndex].permissions,
      ...permissions,
    };

    const householdRef = doc(db, this.HOUSEHOLDS_COLLECTION, householdId);
    await updateDoc(householdRef, {
      members: household.members,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Set primary household for user
   */
  async setPrimaryHousehold(householdId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userHouseholdsRef = doc(db, this.USER_HOUSEHOLDS_COLLECTION, user.uid);
    const userHouseholdsSnap = await getDoc(userHouseholdsRef);

    if (!userHouseholdsSnap.exists()) {
      throw new Error('User households not found');
    }

    const data = userHouseholdsSnap.data();
    const households = (data.households || []).map((h: any) => ({
      ...h,
      isPrimary: h.householdId === householdId,
    }));

    await updateDoc(userHouseholdsRef, {
      primaryHouseholdId: householdId,
      households,
    });
  }

  /**
   * Create child profile
   */
  async createChildProfile(childData: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();
    const childRef = doc(collection(db, this.CHILD_PROFILES_COLLECTION));

    await setDoc(childRef, {
      ...childData,
      dateOfBirth: childData.dateOfBirth ? Timestamp.fromDate(childData.dateOfBirth) : null,
      createdAt: now,
      updatedAt: now,
    });

    return childRef.id;
  }

  /**
   * Get child profiles for a household
   */
  async getHouseholdChildren(householdId: string): Promise<ChildProfile[]> {
    const q = query(
      collection(db, this.CHILD_PROFILES_COLLECTION),
      where('households', 'array-contains', { householdId })
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as ChildProfile;
    });
  }

  /**
   * Add household to user's list
   */
  private async addHouseholdToUser(
    userId: string,
    householdId: string,
    householdName: string,
    role: HouseholdMemberRole,
    isPrimary: boolean
  ): Promise<void> {
    const userHouseholdsRef = doc(db, this.USER_HOUSEHOLDS_COLLECTION, userId);
    const userHouseholdsSnap = await getDoc(userHouseholdsRef);

    if (userHouseholdsSnap.exists()) {
      const data = userHouseholdsSnap.data();
      const households = data.households || [];
      households.push({ householdId, householdName, role, isPrimary });

      await updateDoc(userHouseholdsRef, {
        households,
        primaryHouseholdId: isPrimary ? householdId : data.primaryHouseholdId,
      });
    } else {
      await setDoc(userHouseholdsRef, {
        userId,
        primaryHouseholdId: isPrimary ? householdId : null,
        households: [{ householdId, householdName, role, isPrimary }],
      });
    }
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissionsForRole(role: HouseholdMemberRole): HouseholdPermissions {
    switch (role) {
      case 'owner':
        return OWNER_PERMISSIONS;
      case 'admin':
        return ADMIN_PERMISSIONS;
      case 'child':
        return CHILD_PERMISSIONS;
      default:
        return DEFAULT_PERMISSIONS;
    }
  }
}

const householdSharingService = new HouseholdSharingService();
export default householdSharingService;

