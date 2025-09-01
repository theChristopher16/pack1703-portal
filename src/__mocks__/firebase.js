// Mock Firebase services for testing
export const getFirestore = jest.fn(() => ({}));
export const getAuth = jest.fn(() => ({}));
export const initializeApp = jest.fn(() => ({}));
export const getApp = jest.fn(() => ({}));

export const collection = jest.fn(() => ({}));
export const doc = jest.fn(() => ({}));
export const getDocs = jest.fn(() => Promise.resolve({ docs: [] }));
export const getDoc = jest.fn(() => Promise.resolve({ exists: () => false }));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
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
export const Timestamp = jest.fn();

export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({}));
export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({}));
export const signOut = jest.fn(() => Promise.resolve());
export const onAuthStateChanged = jest.fn(() => jest.fn());

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
  onAuthStateChanged
};
