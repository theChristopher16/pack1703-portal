import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'; // Disabled
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g",
  authDomain: "pack1703-portal.firebaseapp.com",
  projectId: "pack1703-portal",
  storageBucket: "pack1703-portal.firebasestorage.app",
  messagingSenderId: "869412763535",
  appId: "1:869412763535:web:94b3b1ccc756ddfe92bdfa"
  // measurementId removed to prevent mismatch with server config
};

const app = initializeApp(firebaseConfig);

// Initialize App Check for security
// COMPLETELY DISABLED - App Check is blocking authentication and Firestore access
// TODO: Fix reCAPTCHA configuration and re-enable App Check
console.log('⚠️ App Check completely disabled to allow authentication and Firestore access');
// App Check initialization is completely commented out
/*
try {
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY;
  
  if (recaptchaSiteKey) {
    // Initialize App Check with reCAPTCHA v3
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey as string),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ Firebase App Check initialized with reCAPTCHA v3');
  } else {
    console.warn('⚠️ reCAPTCHA site key not configured - App Check disabled');
  }
} catch (error) {
  console.warn('❌ App Check initialization failed:', error);
  // Continue without App Check if initialization fails
  console.log('Continuing without App Check enforcement');
}
*/

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Cloud Functions with region
export const functions = getFunctions(app, 'us-central1');

// Initialize Auth
export const auth = getAuth(app);

// Configure auth persistence to LOCAL (persists across browser sessions)
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Firebase Auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Error setting auth persistence:', error);
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
