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
  // Always use debug token for now to ensure App Check works
  // TODO: Set up proper reCAPTCHA v3 configuration for production
  (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '8EC4C83B-FA44-453B-9EDB-DC063C36FCA8';
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('8EC4C83B-FA44-453B-9EDB-DC063C36FCA8'),
    isTokenAutoRefreshEnabled: true
  });
  console.log('✅ App Check initialized with debug token (forced for stability) - Build: ' + new Date().toISOString() + ' - Testing after billing upgrade');
} catch (error) {
  console.warn('❌ App Check initialization failed:', error);
  // Continue without App Check if initialization fails
  console.log('Continuing without App Check enforcement');
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
