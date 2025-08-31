import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyD6QerA4QW2KKrBqgDJvFwhvAHc6WobKX0",
  authDomain: "pack-1703-portal.firebaseapp.com",
  projectId: "pack-1703-portal",
  storageBucket: "pack-1703-portal.firebasestorage.app",
  messagingSenderId: "1090892022787",
  appId: "1:1090892022787:web:a04a0ad22006b26f557a36"
  // Removed measurementId to prevent conflicts with server-side configuration
};

const app = initializeApp(firebaseConfig);

// Initialize App Check for security (disabled temporarily for admin login debugging)
// TODO: Re-enable after configuring reCAPTCHA v3 site key
/*
if (process.env.NODE_ENV === 'production') {
  // Initialize App Check with reCAPTCHA v3
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY || ''),
    isTokenAutoRefreshEnabled: true
  });
  
  // In development, we can use debug tokens
} else if (process.env.NODE_ENV === 'development') {
  // Set debug token for development
  (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
*/

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

// Initialize Analytics conditionally (only if supported and in production)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
