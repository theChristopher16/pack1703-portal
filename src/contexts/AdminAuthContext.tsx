import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  role: string;
  permissions: string[];
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  signInAsAdmin: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sign in as admin
  const signInAsAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // For development, allow any user to be admin
      // In production, this should be restricted
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const devAdminUser: AdminUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: true,
        role: 'content-admin',
        permissions: ['events:create', 'events:update', 'events:delete', 'announcements:create', 'announcements:update', 'announcements:delete'],
      };
      setAdminUser(devAdminUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in as admin';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await auth.signOut();
      setAdminUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // For development, automatically make any authenticated user an admin
          const devAdminUser: AdminUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: true,
            role: 'content-admin',
            permissions: ['events:create', 'events:update', 'events:delete', 'announcements:create', 'announcements:update', 'announcements:delete'],
          };
          setAdminUser(devAdminUser);
        } else {
          setAdminUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AdminAuthContextType = {
    adminUser,
    loading,
    error,
    signInAsAdmin,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
