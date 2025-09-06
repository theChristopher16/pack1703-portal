import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyD6QerA4QW2KKrBqgDJvFwhvAHc6WobKX0",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.firebasestorage.app",
  messagingSenderId: "1090892022787",
  appId: "1:1090892022787:web:a04a0ad22006b26f557a36"
  // measurementId removed to prevent mismatch with server config
};

const app = initializeApp(firebaseConfig);

// Initialize App Check for security
// Using reCAPTCHA v3 for production and debug token for development
try {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Set debug token for development/testing
    (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '8EC4C83B-FA44-453B-9EDB-DC063C36FCA8';
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('8EC4C83B-FA44-453B-9EDB-DC063C36FCA8'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('App Check initialized with debug token for development');
  } else {
    // For production, use reCAPTCHA v3
    // The reCAPTCHA site key should be set as an environment variable
    const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY;
    if (recaptchaSiteKey && recaptchaSiteKey.startsWith('6L')) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('App Check initialized with reCAPTCHA v3 for production');
    } else {
      // Fallback: Use debug token if no reCAPTCHA key is configured
      console.warn('App Check using debug token: REACT_APP_RECAPTCHA_V3_SITE_KEY not configured or invalid');
      console.warn('Please set REACT_APP_RECAPTCHA_V3_SITE_KEY environment variable with a valid reCAPTCHA v3 site key');
      (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '8EC4C83B-FA44-453B-9EDB-DC063C36FCA8';
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('8EC4C83B-FA44-453B-9EDB-DC063C36FCA8'),
        isTokenAutoRefreshEnabled: true
      });
    }
  }
} catch (error) {
  console.warn('App Check initialization failed:', error);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Cloud Functions with region
export const functions = getFunctions(app, 'us-central1');

// Initialize Auth
export const auth = getAuth(app);

// Configure auth persistence to LOCAL (persists across browser sessions)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Analytics
export const analytics = isSupported().then((supported) => {
  if (supported) {
    return getAnalytics(app);
  } else {
    console.log('Analytics not supported in this environment');
    return null;
  }
});

export default app;
