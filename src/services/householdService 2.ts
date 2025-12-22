import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';
import { HouseholdProfile, Room, DEFAULT_BUDGET_CATEGORIES, DEFAULT_ROOMS } from '../types/household';

class HouseholdService {
  private readonly HOUSEHOLD_PROFILES_COLLECTION = 'householdProfiles';

  /**
   * Get user's household profile
   */
  async getHouseholdProfile(): Promise<HouseholdProfile | null> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.HOUSEHOLD_PROFILES_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        members: data.members || [],
        rooms: data.rooms || [],
        setupCompletedAt: data.setupCompletedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as HouseholdProfile;
    }

    return null;
  }

  /**
   * Check if user has completed household setup
   */
  async hasCompletedSetup(): Promise<boolean> {
    const profile = await this.getHouseholdProfile();
    return profile?.setupCompleted || false;
  }

  /**
   * Create household profile from setup wizard
   */
  async createHouseholdProfile(data: {
    householdName: string;
    address?: string;
    members: Omit<HouseholdProfile['members'][0], 'id'>[];
    rooms: Omit<Room, 'id'>[];
    hasVehicles: boolean;
    hasPets: boolean;
    monthlyBudget?: number;
    useBudgetCategories: boolean;
  }): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = Timestamp.now();

    // Generate IDs for members and rooms
    const members = data.members.map((member, index) => ({
      ...member,
      id: `member_${index}_${Date.now()}`,
    }));

    const rooms = data.rooms.map((room, index) => ({
      ...room,
      id: `room_${index}_${Date.now()}`,
    }));

    const profile = {
      userId: user.uid,
      householdName: data.householdName,
      address: data.address || undefined,
      members,
      rooms,
      hasVehicles: data.hasVehicles,
      hasPets: data.hasPets,
      monthlyBudget: data.monthlyBudget || undefined,
      budgetCategories: data.useBudgetCategories ? DEFAULT_BUDGET_CATEGORIES : undefined,
      setupCompleted: true,
      setupCompletedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, this.HOUSEHOLD_PROFILES_COLLECTION, user.uid);
    await setDoc(docRef, profile);

    return user.uid;
  }

  /**
   * Update household profile
   */
  async updateHouseholdProfile(updates: Partial<Omit<HouseholdProfile, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.HOUSEHOLD_PROFILES_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Household profile not found');
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Add household member
   */
  async addMember(member: Omit<HouseholdProfile['members'][0], 'id'>): Promise<void> {
    const profile = await this.getHouseholdProfile();
    if (!profile) throw new Error('Household profile not found');

    const newMember = {
      ...member,
      id: `member_${Date.now()}`,
    };

    await this.updateHouseholdProfile({
      members: [...profile.members, newMember],
    });
  }

  /**
   * Add room
   */
  async addRoom(room: Omit<Room, 'id'>): Promise<void> {
    const profile = await this.getHouseholdProfile();
    if (!profile) throw new Error('Household profile not found');

    const newRoom = {
      ...room,
      id: `room_${Date.now()}`,
    };

    await this.updateHouseholdProfile({
      rooms: [...profile.rooms, newRoom],
    });
  }

  /**
   * Get all rooms for dropdown/selection
   */
  async getRooms(): Promise<Room[]> {
    const profile = await this.getHouseholdProfile();
    return profile?.rooms || [];
  }

  /**
   * Get all household members
   */
  async getMembers(): Promise<HouseholdProfile['members']> {
    const profile = await this.getHouseholdProfile();
    return profile?.members || [];
  }
}

const householdService = new HouseholdService();
export default householdService;

