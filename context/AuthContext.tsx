import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createDwollaCustomer } from '../lib/dwollaSupabase';

type AuthContextType = {
  isLoggedIn: boolean;
  isHydrated: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* Dwolla customer is not created by Supabase triggers; the edge function must run once per user. */
  useEffect(() => {
    const token = session?.access_token;
    if (!isHydrated || !session?.user?.id || !token) return;
    let cancelled = false;
    (async () => {
      const { error } = await createDwollaCustomer(token);
      if (cancelled || !error) return;
      if (__DEV__) console.warn('[dwolla] createDwollaCustomer:', error.message);
    })();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, session?.user?.id, session?.access_token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const isLoggedIn = !!session;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isHydrated,
        session,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
