import { useState, useEffect, useCallback } from 'react';
import recaptchaService, { RecaptchaVerificationResult } from '../services/recaptchaService';

interface UseRecaptchaOptions {
  action?: string;
  autoExecute?: boolean;
}

interface UseRecaptchaReturn {
  isLoaded: boolean;
  isLoading: boolean;
  execute: (action?: string) => Promise<RecaptchaVerificationResult>;
  reset: () => void;
  error: string | null;
}

export const useRecaptcha = (options: UseRecaptchaOptions = {}): UseRecaptchaReturn => {
  const { action = 'submit', autoExecute = false } = options;
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reCAPTCHA script on mount
  useEffect(() => {
    const loadRecaptcha = async () => {
      try {
        await recaptchaService.loadRecaptchaScript();
        setIsLoaded(true);
      } catch (err) {
        setError('Failed to load reCAPTCHA');
        console.error('Failed to load reCAPTCHA:', err);
      }
    };

    loadRecaptcha();
  }, []);

  // Execute reCAPTCHA verification
  const execute = useCallback(async (customAction?: string): Promise<RecaptchaVerificationResult> => {
    if (!isLoaded) {
      throw new Error('reCAPTCHA not loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await recaptchaService.verifyAction(customAction || action);
      
      if (!result.isValid) {
        setError(result.error || 'reCAPTCHA verification failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'reCAPTCHA execution failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, action]);

  // Reset reCAPTCHA
  const reset = useCallback(() => {
    recaptchaService.reset();
    setError(null);
  }, []);

  // Auto-execute if enabled
  useEffect(() => {
    if (autoExecute && isLoaded && !isLoading) {
      execute();
    }
  }, [autoExecute, isLoaded, isLoading, execute]);

  return {
    isLoaded,
    isLoading,
    execute,
    reset,
    error,
  };
};
