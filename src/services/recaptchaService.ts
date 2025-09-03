import { API_KEYS, API_CONFIG, API_STATUS } from '../config/apiKeys';

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
  private siteKey: string;
  private secretKey: string;
  private config: any;

  constructor() {
    this.siteKey = API_KEYS.RECAPTCHA.SITE_KEY;
    this.secretKey = API_KEYS.RECAPTCHA.SECRET_KEY;
    this.config = API_CONFIG.RECAPTCHA;
  }

  /**
   * Load reCAPTCHA script dynamically
   */
  loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.grecaptcha) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
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
      // Track API usage
      API_STATUS.RECAPTCHA.requestsToday++;

      // Load script if not already loaded
      await this.loadRecaptchaScript();

      // Execute reCAPTCHA
      const token = await window.grecaptcha.execute(this.siteKey, { action });
      
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
      // In a real implementation, this would be a server-side call
      // For now, we'll simulate the verification
      const response = await fetch(this.config.siteVerifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.secretKey,
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
  getStatus() {
    return {
      isEnabled: true,
      siteKey: this.siteKey,
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
