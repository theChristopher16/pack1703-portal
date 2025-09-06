// Secure API Key Management Service
// Frontend version - uses environment variables only
// For production server environments, use the server-side version with Google Secret Manager

export interface KeyConfig {
  name: string;
  required: boolean;
  fallback?: string;
  description?: string;
}

export interface KeyValidationResult {
  isValid: boolean;
  source: 'environment' | 'fallback' | 'missing';
  error?: string;
}

class SecureKeyManager {
  private projectId: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'pack-1703-portal';
    console.log('🔑 Secure Key Manager initialized (frontend mode)');
  }

  /**
   * Get API key from environment variable
   */
  async getKey(keyName: string, config: KeyConfig): Promise<string> {
    // Try environment variable
    const envKey = process.env[keyName];
    if (envKey) {
      console.log(`🔑 Using ${keyName} from environment variable`);
      return envKey;
    }

    // Use fallback if provided
    if (config.fallback) {
      console.warn(`⚠️ Using fallback for ${keyName}`);
      return config.fallback;
    }

    // For required keys, return empty string instead of throwing error
    // This allows the app to continue running with limited functionality
    if (config.required) {
      console.warn(`⚠️ ${keyName} is required but not configured - using empty string`);
      return '';
    }

    return '';
  }

  /**
   * Validate API key format and accessibility
   */
  async validateKey(keyName: string, config: KeyConfig): Promise<KeyValidationResult> {
    try {
      const key = await this.getKey(keyName, config);
      
      if (!key) {
        return {
          isValid: false,
          source: 'missing',
          error: `${keyName} is not configured`
        };
      }

      // Basic validation based on key type
      const isValid = this.validateKeyFormat(keyName, key);
      
      return {
        isValid,
        source: process.env[keyName] ? 'environment' : 'fallback',
        error: isValid ? undefined : `Invalid format for ${keyName}`
      };
    } catch (error) {
      return {
        isValid: false,
        source: 'missing',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate key format based on service type
   */
  private validateKeyFormat(keyName: string, key: string): boolean {
    if (!key || key.length < 10) return false;

    // OpenAI API keys
    if (keyName.includes('OPENAI')) {
      return key.startsWith('sk-proj-') || key.startsWith('sk-');
    }

    // Google API keys
    if (keyName.includes('GOOGLE') || keyName.includes('TENOR')) {
      return key.startsWith('AIza');
    }

    // reCAPTCHA keys
    if (keyName.includes('RECAPTCHA')) {
      return key.startsWith('6L');
    }

    // Phone validation keys
    if (keyName.includes('PHONE')) {
      return key.startsWith('num_live_') || key.startsWith('num_test_');
    }

    // OpenWeather keys
    if (keyName.includes('OPENWEATHER')) {
      return key.length === 32 && /^[a-f0-9]+$/i.test(key);
    }

    // Default validation
    return key.length >= 10;
  }

  /**
   * Get all API keys with validation
   */
  async getAllKeys(): Promise<Record<string, string>> {
    const keyConfigs: Record<string, KeyConfig> = {
      // Admin Keys (OpenAI removed - using Firebase AI Logic with Gemini)
      'REACT_APP_ADMIN_GOOGLE_MAPS_API_KEY': {
        name: 'admin-google-maps-key',
        required: true,
        description: 'Admin Google Maps API key'
      },
      'REACT_APP_ADMIN_OPENWEATHER_API_KEY': {
        name: 'admin-openweather-key',
        required: true,
        description: 'Admin OpenWeather API key'
      },
      'REACT_APP_ADMIN_GOOGLE_PLACES_API_KEY': {
        name: 'admin-google-places-key',
        required: true,
        description: 'Admin Google Places API key'
      },

      // User Keys (OpenAI removed - using Firebase AI Logic with Gemini)
      'REACT_APP_USER_GOOGLE_MAPS_API_KEY': {
        name: 'user-google-maps-key',
        required: true,
        description: 'User Google Maps API key'
      },
      'REACT_APP_USER_OPENWEATHER_API_KEY': {
        name: 'user-openweather-key',
        required: true,
        description: 'User OpenWeather API key'
      },
      'REACT_APP_USER_GOOGLE_PLACES_API_KEY': {
        name: 'user-google-places-key',
        required: true,
        description: 'User Google Places API key'
      },

      // Shared Keys
      'REACT_APP_PHONE_VALIDATION_API_KEY': {
        name: 'phone-validation-key',
        required: true,
        description: 'Phone validation API key'
      },
      'REACT_APP_TENOR_API_KEY': {
        name: 'tenor-key',
        required: true,
        description: 'Tenor GIF API key'
      },
      'REACT_APP_RECAPTCHA_V3_SITE_KEY': {
        name: 'recaptcha-site-key',
        required: true,
        description: 'reCAPTCHA v3 site key'
      },
      'REACT_APP_RECAPTCHA_V3_SECRET_KEY': {
        name: 'recaptcha-secret-key',
        required: true,
        description: 'reCAPTCHA v3 secret key'
      }
    };

    const keys: Record<string, string> = {};
    const validationResults: Record<string, KeyValidationResult> = {};

    // Get all keys
    for (const [envVar, config] of Object.entries(keyConfigs)) {
      try {
        keys[envVar] = await this.getKey(envVar, config);
        validationResults[envVar] = await this.validateKey(envVar, config);
      } catch (error) {
        console.error(`Failed to get ${envVar}:`, error);
        keys[envVar] = '';
        validationResults[envVar] = {
          isValid: false,
          source: 'missing',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Log validation results
    this.logValidationResults(validationResults);

    return keys;
  }

  /**
   * Log validation results
   */
  private logValidationResults(results: Record<string, KeyValidationResult>): void {
    console.log('\n🔐 API Key Validation Results:');
    console.log('================================');

    const validKeys = Object.entries(results).filter(([_, result]) => result.isValid);
    const invalidKeys = Object.entries(results).filter(([_, result]) => !result.isValid);

    console.log(`✅ Valid Keys (${validKeys.length}):`);
    validKeys.forEach(([key, result]) => {
      console.log(`  ${key}: ${result.source}`);
    });

    if (invalidKeys.length > 0) {
      console.log(`\n❌ Invalid/Missing Keys (${invalidKeys.length}):`);
      invalidKeys.forEach(([key, result]) => {
        console.log(`  ${key}: ${result.error}`);
      });
    }

    console.log('================================\n');
  }

  /**
   * Get key rotation status (placeholder for frontend)
   */
  async getKeyRotationStatus(): Promise<Record<string, { age: number; needsRotation: boolean }>> {
    const rotationStatus: Record<string, { age: number; needsRotation: boolean }> = {};
    
    const keyNames = [
      'admin-openai-key',
      'user-openai-key',
      'admin-google-maps-key',
      'user-google-maps-key',
      'recaptcha-site-key'
    ];

    keyNames.forEach(keyName => {
      rotationStatus[keyName] = {
        age: 0, // Would be calculated from creation date
        needsRotation: false // Would be true if age > 90 days
      };
    });

    return rotationStatus;
  }

  /**
   * Check if Secret Manager is available (always false in frontend)
   */
  isSecretManagerAvailable(): boolean {
    return false;
  }

  /**
   * Get environment info
   */
  getEnvironmentInfo(): { isServer: boolean; isSecretManagerEnabled: boolean } {
    return {
      isServer: false,
      isSecretManagerEnabled: false
    };
  }
}

// Export singleton instance
export const secureKeyManager = new SecureKeyManager();

// Export types and functions
export { SecureKeyManager };
export type { KeyConfig as ApiKeyConfig, KeyValidationResult as ApiKeyValidationResult };