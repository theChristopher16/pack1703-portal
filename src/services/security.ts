import DOMPurify from 'dompurify';
import { z } from 'zod';

// ============================================================================
// CONTENT SANITIZATION SERVICE
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export class ContentSanitizer {
  private static instance: ContentSanitizer;

  public static getInstance(): ContentSanitizer {
    if (!ContentSanitizer.instance) {
      ContentSanitizer.instance = new ContentSanitizer();
    }
    return ContentSanitizer.instance;
  }

  /**
   * Sanitize HTML content, stripping dangerous elements
   */
  public sanitizeHTML(input: string): string {
    if (!input) return '';
    
    // Configure DOMPurify to be very strict
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'], // Very limited HTML
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      FORCE_BODY: true,
    };

    return DOMPurify.sanitize(input.trim(), config);
  }

  /**
   * Strip all HTML and return plain text only
   */
  public stripHTML(input: string): string {
    if (!input) return '';
    
    // Strip all HTML tags completely
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], KEEP_CONTENT: true }).trim();
  }

  /**
   * Validate and sanitize user input for forms
   */
  public sanitizeFormInput(input: string, allowBasicHTML: boolean = false): string {
    if (!input) return '';
    
    if (allowBasicHTML) {
      return this.sanitizeHTML(input);
    } else {
      return this.stripHTML(input);
    }
  }

  /**
   * Check if content contains dangerous patterns
   */
  public containsDangerousContent(input: string): boolean {
    if (!input) return false;

    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /onclick=/gi,
      /onmouseover=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<form/gi,
      /<input/gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
  }
}

// ============================================================================
// RATE LIMITING SERVICE
// ============================================================================

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  endpoint: string;
}

/**
 * Token bucket rate limiting implementation
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private buckets: Map<string, RateLimitBucket> = new Map();
  
  // Rate limit configuration
  private readonly config = {
    rsvp: { maxTokens: 5, refillRate: 1, window: 60000 }, // 5 requests per minute
    feedback: { maxTokens: 3, refillRate: 1, window: 60000 }, // 3 requests per minute  
    volunteer: { maxTokens: 10, refillRate: 2, window: 60000 }, // 10 requests per minute
    default: { maxTokens: 10, refillRate: 1, window: 60000 }, // Default limits
  };

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is allowed under rate limits
   */
  public isAllowed(ipHash: string, endpoint: string): boolean {
    const key = `${ipHash}:${endpoint}`;
    const now = Date.now();
    
    // Get or create bucket
    let bucket = this.buckets.get(key);
    const limits = this.config[endpoint as keyof typeof this.config] || this.config.default;
    
    if (!bucket) {
      bucket = {
        tokens: limits.maxTokens,
        lastRefill: now,
        endpoint,
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / limits.window * limits.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(limits.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for debugging/monitoring
   */
  public getRemainingTokens(ipHash: string, endpoint: string): number {
    const key = `${ipHash}:${endpoint}`;
    const bucket = this.buckets.get(key);
    return bucket?.tokens || 0;
  }

  /**
   * Clear old buckets to prevent memory leaks
   */
  public cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}

// ============================================================================
// IP HASHING SERVICE
// ============================================================================

/**
 * Generate secure hashes for IP addresses and user agents
 */
export class SecurityHasher {
  private static instance: SecurityHasher;
  private salt: string;

  constructor() {
    // Generate a session-specific salt (changes on app restart)
    this.salt = this.generateSalt();
  }

  public static getInstance(): SecurityHasher {
    if (!SecurityHasher.instance) {
      SecurityHasher.instance = new SecurityHasher();
    }
    return SecurityHasher.instance;
  }

  /**
   * Generate a secure hash of IP address + user agent for rate limiting
   */
  public async hashIPAndUA(ip: string, userAgent: string): Promise<string> {
    try {
      const data = `${ip}:${userAgent}:${this.salt}`;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for environments without crypto.subtle
      return this.fallbackHash(ip, userAgent);
    }
  }

  /**
   * Generate client-side hash for rate limiting (less secure but functional)
   */
  public async generateClientHash(): Promise<string> {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    
    try {
      const data = `${userAgent}:${timestamp}:${this.salt}`;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      return this.fallbackHash(userAgent, timestamp);
    }
  }

  private generateSalt(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for older environments
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  private fallbackHash(input1: string, input2: string): string {
    // Simple hash for environments without crypto.subtle
    let hash = 0;
    const str = `${input1}:${input2}:${this.salt}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// METADATA COLLECTION SERVICE
// ============================================================================

/**
 * Collect security metadata for submissions
 */
export class SecurityMetadata {
  /**
   * Generate security metadata for form submissions
   */
  public static async generateMetadata(): Promise<{
    ipHash: string;
    userAgent: string;
    timestamp: Date;
  }> {
    const hasher = SecurityHasher.getInstance();
    const ipHash = await hasher.generateClientHash();
    
    return {
      ipHash,
      userAgent: this.sanitizeUserAgent(navigator.userAgent),
      timestamp: new Date(),
    };
  }

  /**
   * Sanitize user agent string to remove potential injection attacks
   */
  private static sanitizeUserAgent(ua: string): string {
    if (!ua) return 'Unknown';
    
    // Remove dangerous characters and limit length
    return ua
      .replace(/[<>'"]/g, '') // Remove HTML-dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .substring(0, 500) // Limit length
      .trim();
  }
}

// ============================================================================
// COMPREHENSIVE FORM VALIDATOR
// ============================================================================

/**
 * Main validation service that combines all security measures
 */
export class FormValidator {
  private sanitizer: ContentSanitizer;
  private rateLimiter: RateLimiter;

  constructor() {
    this.sanitizer = ContentSanitizer.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
  }

  /**
   * Validate and sanitize RSVP form data
   */
  public async validateRSVPForm(data: unknown, ipHash: string): Promise<{
    isValid: boolean;
    data?: any;
    errors?: string[];
    rateLimited?: boolean;
  }> {
    // Check rate limiting first
    if (!this.rateLimiter.isAllowed(ipHash, 'rsvp')) {
      return {
        isValid: false,
        rateLimited: true,
        errors: ['Too many requests. Please wait before submitting again.']
      };
    }

    try {
      // Validate with Zod schema
      const validatedData = await this.validateWithSchema(data, 'rsvp');
      
      // Additional security checks
      const securityErrors = this.performSecurityChecks(validatedData);
      if (securityErrors.length > 0) {
        return {
          isValid: false,
          errors: securityErrors
        };
      }

      // Sanitize all text content
      const sanitizedData = this.sanitizeFormData(validatedData);
      
      return {
        isValid: true,
        data: sanitizedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: error instanceof z.ZodError ? 
          error.issues.map(e => e.message) : 
          ['Validation failed']
      };
    }
  }

  /**
   * Validate and sanitize feedback form data
   */
  public async validateFeedbackForm(data: unknown, ipHash: string): Promise<{
    isValid: boolean;
    data?: any;
    errors?: string[];
    rateLimited?: boolean;
  }> {
    // Check rate limiting first
    if (!this.rateLimiter.isAllowed(ipHash, 'feedback')) {
      return {
        isValid: false,
        rateLimited: true,
        errors: ['Too many requests. Please wait before submitting again.']
      };
    }

    try {
      // Validate with Zod schema
      const validatedData = await this.validateWithSchema(data, 'feedback');
      
      // Additional security checks
      const securityErrors = this.performSecurityChecks(validatedData);
      if (securityErrors.length > 0) {
        return {
          isValid: false,
          errors: securityErrors
        };
      }

      // Sanitize all text content
      const sanitizedData = this.sanitizeFormData(validatedData);
      
      return {
        isValid: true,
        data: sanitizedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: error instanceof z.ZodError ? 
          error.issues.map(e => e.message) : 
          ['Validation failed']
      };
    }
  }

  /**
   * Validate and sanitize volunteer form data
   */
  public async validateVolunteerForm(data: unknown, ipHash: string): Promise<{
    isValid: boolean;
    data?: any;
    errors?: string[];
    rateLimited?: boolean;
  }> {
    // Check rate limiting first
    if (!this.rateLimiter.isAllowed(ipHash, 'volunteer')) {
      return {
        isValid: false,
        rateLimited: true,
        errors: ['Too many requests. Please wait before submitting again.']
      };
    }

    try {
      // Validate with Zod schema
      const validatedData = await this.validateWithSchema(data, 'volunteer');
      
      // Additional security checks
      const securityErrors = this.performSecurityChecks(validatedData);
      if (securityErrors.length > 0) {
        return {
          isValid: false,
          errors: securityErrors
        };
      }

      // Sanitize all text content
      const sanitizedData = this.sanitizeFormData(validatedData);
      
      return {
        isValid: true,
        data: sanitizedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: error instanceof z.ZodError ? 
          error.issues.map(e => e.message) : 
          ['Validation failed']
      };
    }
  }

  /**
   * Validate data against Zod schemas
   */
  private async validateWithSchema(data: unknown, formType: 'rsvp' | 'feedback' | 'volunteer'): Promise<any> {
    const schemas = {
      rsvp: await import('../types/validation').then(m => m.rsvpFormSchema),
      feedback: await import('../types/validation').then(m => m.feedbackFormSchema),
      volunteer: await import('../types/validation').then(m => m.volunteerFormSchema),
    };

    return schemas[formType].parse(data);
  }

  /**
   * Perform additional security checks
   */
  private performSecurityChecks(data: any): string[] {
    const errors: string[] = [];

    // Check for suspicious patterns in text fields
    const textFields = ['familyName', 'notes', 'dietaryRestrictions', 'specialNeeds', 'message'];
    
    for (const field of textFields) {
      if (data[field] && this.sanitizer.containsDangerousContent(data[field])) {
        errors.push(`${field} contains prohibited content`);
      }
    }

    // Check attendee data if present
    if (data.attendees) {
      for (let i = 0; i < data.attendees.length; i++) {
        const attendee = data.attendees[i];
        if (attendee.name && this.sanitizer.containsDangerousContent(attendee.name)) {
          errors.push(`Attendee ${i + 1} name contains prohibited content`);
        }
      }
    }

    return errors;
  }

  /**
   * Sanitize all form data
   */
  private sanitizeFormData(data: any): any {
    const sanitized = { ...data };

    // Sanitize text fields
    const textFields = ['familyName', 'notes', 'dietaryRestrictions', 'specialNeeds', 'message'];
    
    for (const field of textFields) {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizer.stripHTML(sanitized[field]);
      }
    }

    // Sanitize attendee data
    if (sanitized.attendees) {
      sanitized.attendees = sanitized.attendees.map((attendee: any) => ({
        ...attendee,
        name: this.sanitizer.stripHTML(attendee.name || ''),
        dietaryRestrictions: attendee.dietaryRestrictions ? 
          this.sanitizer.stripHTML(attendee.dietaryRestrictions) : undefined,
        specialNeeds: attendee.specialNeeds ? 
          this.sanitizer.stripHTML(attendee.specialNeeds) : undefined,
      }));
    }

    return sanitized;
  }
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Validate that App Check token is present (for production)
 */
export const validateAppCheck = (request: any): boolean => {
  // In development, we might skip this check
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for App Check token header
  const appCheckToken = request.headers?.['x-firebase-appcheck'];
  return !!appCheckToken;
};

/**
 * Extract and validate IP address from request
 */
export const extractClientIP = (request: any): string => {
  // Try various headers for real IP (behind proxies/CDN)
  const forwarded = request.headers?.['x-forwarded-for'];
  const cfConnectingIP = request.headers?.['cf-connecting-ip'];
  const realIP = request.headers?.['x-real-ip'];
  
  const ip = cfConnectingIP || forwarded?.split(',')[0] || realIP || request.connection?.remoteAddress || 'unknown';
  
  // Basic IP validation
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipRegex.test(ip) || ipv6Regex.test(ip)) {
    return ip;
  }
  
  return 'unknown';
};

/**
 * Generate secure submission metadata
 */
export const generateSubmissionMetadata = async (request: any) => {
  const hasher = SecurityHasher.getInstance();
  const clientIP = extractClientIP(request);
  const userAgent = request.headers?.['user-agent'] || 'unknown';
  
  return {
    ipHash: await hasher.hashIPAndUA(clientIP, userAgent),
    userAgent: userAgent.substring(0, 500), // Limit UA length
    timestamp: new Date(),
    clientIP: clientIP, // For server-side logging only, never stored in database
  };
};

// Export singleton instances for easy use
export const contentSanitizer = ContentSanitizer.getInstance();
export const rateLimiter = RateLimiter.getInstance();
export const formValidator = new FormValidator();
