import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Configuration, ConfigCategory } from '../types/firestore';

class ConfigService {
  private readonly COLLECTION = 'configurations';
  private cache: Map<string, Configuration> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a configuration value by key
   */
  async getConfig(key: string): Promise<Configuration | null> {
    // Check cache first
    if (this.isCacheValid(key)) {
      return this.cache.get(key) || null;
    }

    try {
      const configQuery = query(
        collection(db, this.COLLECTION),
        where('key', '==', key)
      );
      const snapshot = await getDocs(configQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const config = snapshot.docs[0].data() as Configuration;
      this.updateCache(key, config);
      return config;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return null;
    }
  }

  /**
   * Get configuration value by key (returns just the value)
   */
  async getConfigValue(key: string): Promise<string | number | boolean | string[] | null> {
    const config = await this.getConfig(key);
    return config?.value || null;
  }

  /**
   * Get all configurations by category
   */
  async getConfigsByCategory(category: ConfigCategory): Promise<Configuration[]> {
    try {
      const configQuery = query(
        collection(db, this.COLLECTION),
        where('category', '==', category),
        orderBy('key')
      );
      const snapshot = await getDocs(configQuery);
      
      return snapshot.docs.map(doc => doc.data() as Configuration);
    } catch (error) {
      console.error('Error fetching configurations by category:', error);
      return [];
    }
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<Configuration[]> {
    try {
      const configQuery = query(
        collection(db, this.COLLECTION),
        orderBy('category'),
        orderBy('key')
      );
      const snapshot = await getDocs(configQuery);
      
      return snapshot.docs.map(doc => doc.data() as Configuration);
    } catch (error) {
      console.error('Error fetching all configurations:', error);
      return [];
    }
  }

  /**
   * Create or update a configuration
   */
  async setConfig(
    key: string, 
    value: string | number | boolean | string[], 
    category: ConfigCategory,
    description: string,
    isEditable: boolean = true,
    validationRules?: any,
    userId: string = 'system'
  ): Promise<boolean> {
    try {
      const configRef = doc(db, this.COLLECTION, key);
      const now = Timestamp.now();
      
      const config: Configuration = {
        id: key,
        key,
        value,
        category,
        description,
        isEditable,
        validationRules,
        updatedAt: now,
        updatedBy: userId,
        createdAt: now,
        createdBy: userId
      };

      await setDoc(configRef, config);
      this.updateCache(key, config);
      return true;
    } catch (error) {
      console.error('Error setting configuration:', error);
      return false;
    }
  }

  /**
   * Update an existing configuration
   */
  async updateConfig(
    key: string, 
    updates: Partial<Configuration>,
    userId: string = 'system'
  ): Promise<boolean> {
    try {
      const configRef = doc(db, this.COLLECTION, key);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: userId
      };

      await updateDoc(configRef, updateData);
      
      // Update cache
      const existingConfig = this.cache.get(key);
      if (existingConfig) {
        this.updateCache(key, { ...existingConfig, ...updateData });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating configuration:', error);
      return false;
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(key: string): Promise<boolean> {
    try {
      const configRef = doc(db, this.COLLECTION, key);
      await deleteDoc(configRef);
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return true;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return false;
    }
  }

  /**
   * Initialize default configurations
   */
  async initializeDefaultConfigs(userId: string = 'system'): Promise<void> {
    const defaultConfigs: Array<{
      key: string;
      value: string | number | boolean | string[];
      category: ConfigCategory;
      description: string;
      validationRules?: any;
    }> = [
      {
        key: 'contact.email.primary',
        value: 'pack1703@gmail.com',
        category: 'email',
        description: 'Primary contact email address for the pack',
        validationRules: {
          type: 'email',
          required: true
        }
      },
      {
        key: 'contact.email.support',
        value: 'pack1703@gmail.com',
        category: 'email',
        description: 'Support email address for technical issues',
        validationRules: {
          type: 'email',
          required: true
        }
      },
      {
        key: 'contact.email.emergency',
        value: 'pack1703@gmail.com',
        category: 'email',
        description: 'Emergency contact email address',
        validationRules: {
          type: 'email',
          required: true
        }
      },
      {
        key: 'contact.phone.primary',
        value: '(555) 123-4567',
        category: 'contact',
        description: 'Primary contact phone number',
        validationRules: {
          type: 'phone',
          required: true
        }
      },
      {
        key: 'system.pack.name',
        value: 'Pack 1703',
        category: 'system',
        description: 'Official pack name',
        validationRules: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 100
        }
      },
      {
        key: 'system.pack.location',
        value: 'Peoria, IL',
        category: 'system',
        description: 'Pack location/city',
        validationRules: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 100
        }
      },
      {
        key: 'display.site.title',
        value: 'Pack 1703 Families Portal',
        category: 'display',
        description: 'Website title',
        validationRules: {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 100
        }
      },
      {
        key: 'notifications.enabled',
        value: true,
        category: 'notifications',
        description: 'Enable email notifications',
        validationRules: {
          type: 'boolean'
        }
      },
      {
        key: 'display.cycling_scout_icons',
        value: ['🏕️', '🔥', '🌲', '🏆', '⭐', '🎖️', '🏅', '🎯', '🗺️', '🔦'],
        category: 'display',
        description: 'Scout-themed icons that cycle through for important locations and features',
        validationRules: {
          type: 'array',
          required: true,
          minLength: 1,
          maxLength: 20
        }
      },
      {
        key: 'security.require.approval',
        value: false,
        category: 'security',
        description: 'Require admin approval for new registrations',
        validationRules: {
          type: 'boolean'
        }
      }
    ];

    const batch = writeBatch(db);
    
    for (const config of defaultConfigs) {
      const configRef = doc(db, this.COLLECTION, config.key);
      const existingDoc = await getDoc(configRef);
      
      if (!existingDoc.exists()) {
        const now = Timestamp.now();
        batch.set(configRef, {
          ...config,
          id: config.key,
          isEditable: true,
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
          updatedBy: userId
        });
      }
    }

    await batch.commit();
  }

  /**
   * Validate configuration value against rules
   */
  validateConfigValue(value: any, rules?: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rules) {
      return { isValid: true, errors: [] };
    }

    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push('This field is required');
    }

    if (value !== null && value !== undefined && value !== '') {
      switch (rules.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push('Please enter a valid email address');
          }
          break;
        
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push('Please enter a valid URL');
          }
          break;
        
        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            errors.push('Please enter a valid phone number');
          }
          break;
        
        case 'number':
          if (isNaN(Number(value))) {
            errors.push('Please enter a valid number');
          }
          break;
        
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push('Value must be true or false');
          }
          break;
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
      }

      if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push('Value does not match required pattern');
        }
      }

      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(`Value must be one of: ${rules.allowedValues.join(', ')}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private updateCache(key: string, config: Configuration): void {
    this.cache.set(key, config);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const configService = new ConfigService();
export default configService;
