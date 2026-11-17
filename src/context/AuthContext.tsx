/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/context/AuthContext.tsx
 * Purpose: Provides global authentication state, Firestore member profile, and server-checked
 *          admin role status across the entire React tree.
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { MemberProfile } from '../types/models';
import {
  checkIsAdmin,
  ensureUserProfile,
  getMemberProfile,
  logoutUser,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
  profile: MemberProfile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const [memberProfile, adminStatus] = await Promise.all([
        ensureUserProfile(firebaseUser),
        checkIsAdmin(firebaseUser),
      ]);
      setProfile(memberProfile);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error loading user session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      loadUserData(firebaseUser);
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const latest = await getMemberProfile(user.uid);
    if (latest) setProfile(latest);
  }, [user]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
