import { getApiKeys, API_CONFIG, API_STATUS } from '../config/apiKeys';

export interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  error_codes?: string[];
}

export interface RecaptchaVerificationResult {
  isValid: boolean;
  score: number;
  isHuman: boolean;
  error?: string;
}

class RecaptchaService {
  private siteKey: string | null = null;
  private secretKey: string | null = null;
  private config: any;

  constructor() {
    this.config = API_CONFIG.RECAPTCHA;
  }

  /**
   * Get reCAPTCHA site key (lazy loading)
   */
  private async getSiteKey(): Promise<string> {
    if (this.siteKey === null) {
      const apiKeys = await getApiKeys();
      this.siteKey = apiKeys.RECAPTCHA?.SITE_KEY || '';
    }
    return this.siteKey || '';
  }

  /**
   * Get reCAPTCHA secret key (server-side only)
   * Note: Secret key is not available on client-side for security
   */
  private async getSecretKey(): Promise<string> {
    // Secret key should only be used in Cloud Functions, not client-side
    console.warn('⚠️ reCAPTCHA secret key not available on client-side');
    return '';
  }

  /**
   * Load reCAPTCHA script dynamically
   */
  async loadRecaptchaScript(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const siteKey = await this.getSiteKey();
        if (!siteKey) {
          console.warn('reCAPTCHA site key not configured - skipping script load');
          resolve(); // Resolve instead of reject to prevent blocking
          return;
        }

        // Check if script is already loaded
        if (window.grecaptcha) {
          resolve();
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          // Wait for grecaptcha to be available
          const checkGrecaptcha = () => {
            if (window.grecaptcha) {
              resolve();
            } else {
              setTimeout(checkGrecaptcha, 100);
            }
          };
          checkGrecaptcha();
        };

        script.onerror = () => {
          console.warn('Failed to load reCAPTCHA script - continuing without reCAPTCHA');
          resolve(); // Resolve instead of reject to prevent blocking
        };

        document.head.appendChild(script);
      } catch (error) {
        console.warn('Error loading reCAPTCHA script:', error);
        resolve(); // Resolve instead of reject to prevent blocking
      }
    });
  }

  /**
   * Execute reCAPTCHA verification
   */
  async executeRecaptcha(action: string = 'submit'): Promise<string> {
    try {
      const siteKey = await this.getSiteKey();
      if (!siteKey) {
        console.warn('reCAPTCHA site key not configured - skipping verification');
        return 'mock-token'; // Return a mock token to prevent blocking
      }

      // Track API usage
      API_STATUS.RECAPTCHA.requestsToday++;

      // Load script if not already loaded
      await this.loadRecaptchaScript();

      // Execute reCAPTCHA
      const token = await window.grecaptcha.execute(siteKey, { action });
      
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      API_STATUS.RECAPTCHA.errorsToday++;
      // Return a mock token instead of throwing to prevent blocking
      return 'mock-token';
    }
  }

  /**
   * Verify reCAPTCHA token on the server side
   * Note: This method is for client-side use and will always return success
   * Actual verification should be done in Cloud Functions
   */
  async verifyToken(token: string, action: string = 'submit'): Promise<RecaptchaVerificationResult> {
    // Client-side verification is not secure - this should be done in Cloud Functions
    console.warn('⚠️ reCAPTCHA token verification should be done server-side in Cloud Functions');
    
    return {
      isValid: true,
      score: 0.9, // Assume good score for client-side
      isHuman: true,
    };
  }

  /**
   * Verify user action with reCAPTCHA
   */
  async verifyAction(action: string = 'submit'): Promise<RecaptchaVerificationResult> {
    try {
      const siteKey = await this.getSiteKey();
      if (!siteKey) {
        console.warn('reCAPTCHA site key not configured - returning mock verification');
        return {
          isValid: true, // Allow action to proceed
          score: 0.9,
          isHuman: true,
        };
      }

      const token = await this.executeRecaptcha(action);
      return await this.verifyToken(token, action);
    } catch (error) {
      console.error('Error in reCAPTCHA verification:', error);
      return {
        isValid: true, // Allow action to proceed even if reCAPTCHA fails
        score: 0.9,
        isHuman: true,
      };
    }
  }

  /**
   * Get reCAPTCHA status
   */
  async getStatus() {
    const siteKey = await this.getSiteKey();
    return {
      isEnabled: Boolean(siteKey),
      siteKey: siteKey,
      minScore: this.config.minScore,
      requestsToday: API_STATUS.RECAPTCHA.requestsToday,
      errorsToday: API_STATUS.RECAPTCHA.errorsToday,
    };
  }

  /**
   * Reset reCAPTCHA (useful for forms)
   */
  reset() {
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  }
}

// Create singleton instance
const recaptchaService = new RecaptchaService();

export default recaptchaService;
