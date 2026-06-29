// File: src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/services/supabase';

interface AuthProps {
  user: User | null;
  session: Session | null;
  role: string | null;
  profile: any | null;
  roleLoaded: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<Partial<AuthProps>>({});

export function useAuth() {
  return useContext(AuthContext);
}

const fetchProfile = async (userId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, username, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile fetch error:', error.message);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

// Auto-creates the profile row if it was deleted (e.g. schema reset).
// Only redirects to username-setup if the row EXISTS but username is missing.
const loadOrCreateProfile = async (user: any): Promise<any | null> => {
  let profile = await fetchProfile(user.id);
  if (!profile) {
    // Profile row missing — create it from auth metadata
    const username = user.user_metadata?.username || null; // null → will prompt username-setup
    await supabase.from('profiles').upsert({
      id: user.id,
      username,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cricket Player',
      role: (user.user_metadata?.role as any) || 'PLAYER',
    }, { onConflict: 'id' });
    profile = await fetchProfile(user.id);
  }
  return profile;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [roleLoaded, setRoleLoaded] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Restore session on boot — wait for BOTH session AND role before setting initialized
    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        const p = await loadOrCreateProfile(data.session.user);
        setProfile(p);
        setRole(p?.role ?? 'PLAYER');
        setRoleLoaded(true);
      }
      setInitialized(true);
    };

    restoreSession();

    // Listen for auth state changes (login / logout / token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession ? newSession.user : null);
        if (newSession) {
          setRoleLoaded(false);
          const p = await loadOrCreateProfile(newSession.user);
          setProfile(p);
          setRole(p?.role ?? 'PLAYER');
          setRoleLoaded(true);
        } else {
          setProfile(null);
          setRole(null);
          setRoleLoaded(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id) {
      const p = await fetchProfile(data.session.user.id);
      setProfile(p);
      setRole(p?.role ?? 'PLAYER');
    }
  };

  const value = {
    user,
    session,
    role,
    profile,
    roleLoaded,
    initialized,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
