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
   * Get reCAPTCHA secret key (lazy loading)
   */
  private async getSecretKey(): Promise<string> {
    if (this.secretKey === null) {
      const apiKeys = await getApiKeys();
      this.secretKey = apiKeys.RECAPTCHA?.SECRET_KEY || '';
    }
    return this.secretKey || '';
  }

  /**
   * Load reCAPTCHA script dynamically
   */
  async loadRecaptchaScript(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const siteKey = await this.getSiteKey();
      if (!siteKey) {
        reject(new Error('reCAPTCHA site key not configured'));
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
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Execute reCAPTCHA verification
   */
  async executeRecaptcha(action: string = 'submit'): Promise<string> {
    try {
      const siteKey = await this.getSiteKey();
      if (!siteKey) {
        throw new Error('reCAPTCHA site key not configured');
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
      throw error;
    }
  }

  /**
   * Verify reCAPTCHA token on the server side
   * Note: This would typically be done on the backend
   * For now, we'll simulate the verification
   */
  async verifyToken(token: string, action: string = 'submit'): Promise<RecaptchaVerificationResult> {
    try {
      const secretKey = await this.getSecretKey();
      if (!secretKey) {
        throw new Error('reCAPTCHA secret key not configured');
      }

      // In a real implementation, this would be a server-side call
      // For now, we'll simulate the verification
      const response = await fetch(this.config.siteVerifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      });

      const data: RecaptchaResponse = await response.json();

      const score = data.score || 0;
      const isHuman = score >= this.config.minScore;
      const isValid = data.success && isHuman;

      return {
        isValid,
        score,
        isHuman,
        error: data.error_codes?.join(', '),
      };
    } catch (error) {
      console.error('Error verifying reCAPTCHA token:', error);
      API_STATUS.RECAPTCHA.errorsToday++;
      return {
        isValid: false,
        score: 0,
        isHuman: false,
        error: 'Verification failed',
      };
    }
  }

  /**
   * Verify user action with reCAPTCHA
   */
  async verifyAction(action: string = 'submit'): Promise<RecaptchaVerificationResult> {
    try {
      const token = await this.executeRecaptcha(action);
      return await this.verifyToken(token, action);
    } catch (error) {
      console.error('Error in reCAPTCHA verification:', error);
      return {
        isValid: false,
        score: 0,
        isHuman: false,
        error: 'Verification failed',
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
