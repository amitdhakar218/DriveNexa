import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { UserProfile, UserRole } from '../types';
import { verifyBiometricSensitiveAction, checkBiometricSupport, registerDevicePasskey } from '../services/biometricService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  biometricSupported: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  requireBiometricVerification: (actionDesc: string) => Promise<boolean>;
  enablePasskeyBiometric: () => Promise<boolean>;
  updateUserRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [biometricSupported, setBiometricSupported] = useState<boolean>(false);

  useEffect(() => {
    checkBiometricSupport().then((status) => {
      setBiometricSupported(status.supported);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // New user profile initialization
            const isInitialAdmin = firebaseUser.email === 'carinovation1@gmail.com';
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL,
              role: isInitialAdmin ? 'ADMIN' : 'USER',
              createdAt: Date.now(),
              lastLogin: Date.now(),
              authorizedDevices: ['ROVER-ESP32-01'],
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('User profile fetch note:', err);
          // Fallback profile if offline
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Authorized Operator',
            photoURL: firebaseUser.photoURL,
            role: firebaseUser.email === 'carinovation1@gmail.com' ? 'ADMIN' : 'USER',
            createdAt: Date.now(),
            lastLogin: Date.now(),
            authorizedDevices: ['ROVER-ESP32-01'],
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName });
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName,
        photoURL: null,
        role: cred.user.email === 'carinovation1@gmail.com' ? 'ADMIN' : 'USER',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        authorizedDevices: ['ROVER-ESP32-01'],
      };
      await setDoc(doc(db, 'users', cred.user.uid), initialProfile);
      setUserProfile(initialProfile);
    }
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const requireBiometricVerification = async (actionDesc: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await verifyBiometricSensitiveAction(user.uid, actionDesc);
      return res.verified;
    } catch (err: any) {
      alert(err.message || 'Biometric security verification failed.');
      return false;
    }
  };

  const enablePasskeyBiometric = async (): Promise<boolean> => {
    if (!user || !user.email) return false;
    try {
      const res = await registerDevicePasskey(user.uid, user.email);
      if (res.success) {
        if (userProfile) {
          const updated = { ...userProfile, biometricEnabled: true };
          setUserProfile(updated);
          await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      alert(err.message || 'Passkey enrollment error');
      return false;
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!user || !userProfile) return;
    const updated = { ...userProfile, role: newRole };
    setUserProfile(updated);
    await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        biometricSupported,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        resetPassword,
        requireBiometricVerification,
        enablePasskeyBiometric,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
