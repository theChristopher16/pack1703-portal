// Mock Firebase services for testing
export const getFirestore = jest.fn(() => ({}));
export const getAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
}));
export const initializeApp = jest.fn(() => ({}));
export const getApp = jest.fn(() => ({}));

export const collection = jest.fn(() => ({}));
export const doc = jest.fn(() => ({}));
export const getDocs = jest.fn(() => Promise.resolve({ docs: [] }));
export const getDoc = jest.fn(() => Promise.resolve({ exists: () => false }));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve({ id: 'test-id' }));
export const query = jest.fn(() => ({}));
export const where = jest.fn(() => ({}));
export const orderBy = jest.fn(() => ({}));
export const limit = jest.fn(() => ({}));
export const writeBatch = jest.fn(() => ({
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve())
}));
export const runTransaction = jest.fn(() => Promise.resolve());
export const Timestamp = {
  now: jest.fn(() => ({ toDate: () => new Date() })),
  fromDate: jest.fn(() => ({ toDate: () => new Date() })),
};

export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: {} }));
export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: {} }));
export const signOut = jest.fn(() => Promise.resolve());
export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());
export const updateProfile = jest.fn(() => Promise.resolve());
export const onAuthStateChanged = jest.fn(() => jest.fn());
export const GoogleAuthProvider = jest.fn();
export const FacebookAuthProvider = jest.fn();
export const TwitterAuthProvider = jest.fn();
export const GithubAuthProvider = jest.fn();
export const signInWithPopup = jest.fn(() => Promise.resolve({ user: {} }));
export const signInWithRedirect = jest.fn(() => Promise.resolve({ user: {} }));
export const getRedirectResult = jest.fn(() => Promise.resolve({ user: {} }));

// Mock Firebase Functions
export const getFunctions = jest.fn(() => ({}));
export const httpsCallable = jest.fn(() => jest.fn(() => Promise.resolve({ data: {} })));

// Mock Firebase Analytics
export const getAnalytics = jest.fn(() => ({}));
export const logEvent = jest.fn(() => Promise.resolve());
export const setUserProperties = jest.fn(() => Promise.resolve());
export const isSupported = jest.fn(() => Promise.resolve(true));

// Default export
export default {
  getFirestore,
  getAuth,
  initializeApp,
  getApp,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction,
  Timestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getFunctions,
  httpsCallable,
  getAnalytics,
  logEvent,
  setUserProperties,
  isSupported
};
