'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGet, apiPublicSend, apiPublicWrite, apiWrite } from '@/lib/api-client';
import {
  clearUserSession,
  readUserSession,
  saveUserSession,
  UserSession,
} from '@/lib/user-session';
import type { UserRole } from '@/lib/types';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  phone_confirmed_at: string | null;
  role: UserRole | 'platform_admin';
}

interface User {
  id: string;
  email: string;
  phone: string | null;
  phone_confirmed_at: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: UserSession | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const data = await apiGet<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        phoneConfirmedAt: string | null;
        role: UserRole | 'platform_admin';
      }>('/me');
      setProfile({
        id: data.id,
        email: data.email,
        full_name: data.fullName,
        phone: data.phone,
        phone_confirmed_at: data.phoneConfirmedAt,
        role: data.role,
      });
      setUser({
        id: data.id,
        email: data.email,
        phone: data.phone,
        phone_confirmed_at: data.phoneConfirmedAt,
      });
    } catch (error) {
      console.error('Could not load the signed-in user profile from the API.', error);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const expireSession = () => {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    };
    window.addEventListener('synora:session-expired', expireSession);
    const savedSession = readUserSession();
    if (!savedSession) {
      setLoading(false);
      return () => window.removeEventListener('synora:session-expired', expireSession);
    }

    setSession(savedSession);
    void loadProfile();
    return () => window.removeEventListener('synora:session-expired', expireSession);
  }, []);

  const refreshProfile = async () => {
    if (session) await loadProfile();
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await apiPublicSend<UserSession>('/auth/login', { email, password });
      saveUserSession(result);
      setSession(result);
      setLoading(true);
      await loadProfile();
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not sign in.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => {
    try {
      await apiPublicWrite('/auth/register', {
        email,
        password,
        fullName,
        phone: phone.trim() || null,
      });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Could not create the account.' };
    }
  };

  const signOut = async () => {
    try {
      if (session) await apiWrite('/auth/logout', 'POST', {});
    } finally {
      clearUserSession();
      setProfile(null);
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
