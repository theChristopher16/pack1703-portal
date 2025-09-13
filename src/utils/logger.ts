/**
 * Production-friendly logging utility
 * Reduces console output in production while maintaining development verbosity
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  // Always log errors, even in production
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },

  // Log warnings in development, reduce in production
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    } else {
      // In production, only log critical warnings
      if (message.includes('permission') || message.includes('auth') || message.includes('security')) {
        console.warn(message, ...args);
      }
    }
  },

  // Log info in development, minimal in production
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    } else {
      // In production, only log important info
      if (message.includes('deploy') || message.includes('initialized') || message.includes('connected')) {
        console.info(message, ...args);
      }
    }
  },

  // Log debug only in development
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },

  // Log activity tracking only in development
  activity: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[ACTIVITY] ${message}`, ...args);
    }
  },

  // Log heartbeat only in development
  heartbeat: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[HEARTBEAT] ${message}`, ...args);
    }
  },

  // Log service worker only in development
  serviceWorker: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[SW] ${message}`, ...args);
    }
  },

  // Log Firebase operations only in development
  firebase: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[FIREBASE] ${message}`, ...args);
    }
  }
};

export default logger;
