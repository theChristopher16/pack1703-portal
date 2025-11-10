import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';
import { HomePreferences, DEFAULT_HOME_PREFERENCES } from '../types/homePreferences';

class HomePreferencesService {
  private readonly PREFERENCES_COLLECTION = 'homePreferences';

  /**
   * Get user's home preferences, creating default if none exist
   */
  async getPreferences(): Promise<HomePreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.PREFERENCES_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as HomePreferences;
    } else {
      // Create default preferences
      return await this.createDefaultPreferences(user.uid);
    }
  }

  /**
   * Create default preferences for a new user
   */
  private async createDefaultPreferences(userId: string): Promise<HomePreferences> {
    const now = Timestamp.now();
    const preferences = {
      ...DEFAULT_HOME_PREFERENCES,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
    await setDoc(docRef, preferences);

    return {
      id: userId,
      ...preferences,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Update user's home preferences
   */
  async updatePreferences(updates: Partial<HomePreferences['features']>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.PREFERENCES_COLLECTION, user.uid);
    
    // Get current preferences to merge
    const currentPrefs = await this.getPreferences();
    
    await updateDoc(docRef, {
      features: {
        ...currentPrefs.features,
        ...updates,
      },
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Toggle a specific feature on/off
   */
  async toggleFeature(featureKey: keyof HomePreferences['features']): Promise<boolean> {
    const preferences = await this.getPreferences();
    const newValue = !preferences.features[featureKey];
    
    await this.updatePreferences({
      [featureKey]: newValue,
    });
    
    return newValue;
  }

  /**
   * Enable a feature
   */
  async enableFeature(featureKey: keyof HomePreferences['features']): Promise<void> {
    await this.updatePreferences({
      [featureKey]: true,
    });
  }

  /**
   * Disable a feature
   */
  async disableFeature(featureKey: keyof HomePreferences['features']): Promise<void> {
    await this.updatePreferences({
      [featureKey]: false,
    });
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureKey: keyof HomePreferences['features']): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences.features[featureKey];
  }

  /**
   * Get all enabled features
   */
  async getEnabledFeatures(): Promise<string[]> {
    const preferences = await this.getPreferences();
    return Object.entries(preferences.features)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);
  }

  /**
   * Reset to default preferences
   */
  async resetToDefaults(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.PREFERENCES_COLLECTION, user.uid);
    await updateDoc(docRef, {
      features: DEFAULT_HOME_PREFERENCES.features,
      updatedAt: Timestamp.now(),
    });
  }
}

const homePreferencesService = new HomePreferencesService();
export default homePreferencesService;

