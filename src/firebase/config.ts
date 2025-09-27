import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'; // DISABLED
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

// Force disable App Check enforcement with debug token
// Set global debug token to bypass App Check completely
(window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
console.log('🔧 Set FIREBASE_APPCHECK_DEBUG_TOKEN = true to bypass App Check enforcement');
console.log('🚫 App Check enforcement bypassed for development/debugging');

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
