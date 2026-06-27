import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  dob: string;
  pin: string;
  profilePic?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function profileToUser(p: Record<string, unknown>): User {
  return {
    id: p.id as string,
    email: p.email as string,
    fullName: (p.full_name as string) || '',
    dob: (p.dob as string) || '',
    profilePic: (p.avatar_url as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
    walletNumber: (p.wallet_number as string) || '',
    upiId: (p.upi_id as string) || '',
    memberSince: ((p.created_at as string) || '').split('T')[0],
    isVerified: true,
    isFrozen: (p.is_frozen as boolean) || false,
    pin: (p.pin_hash as string) || '',
    referralCode: (p.referral_code as string) || '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      const u = profileToUser(data as Record<string, unknown>);
      setUser(u);
      setIsAdmin(data.role === 'admin');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id);
      else { setUser(null); setIsAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      await loadProfile(data.user.id);
      // Log login history
      await supabase.from('login_history').insert({ user_id: data.user.id, user_agent: navigator.userAgent });
      await supabase.from('audit_logs').insert({ user_id: data.user.id, user_name: data.user.email || '', action: 'LOGIN', details: 'Successful login' });
    }
    return { success: true };
  }, [loadProfile]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        return { success: false, error: 'Not an admin account.' };
      }
      await loadProfile(data.user.id);
    }
    return { success: true };
  }, [loadProfile]);

  const register = useCallback(async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
    if (error) return { success: false, error: error.message };
    if (!authData.user) return { success: false, error: 'Registration failed.' };

    // Update profile with extra fields
    const updates: Record<string, unknown> = {
      full_name: data.fullName,
      dob: data.dob || null,
      pin_hash: data.pin,
    };
    if (data.profilePic) updates.avatar_url = data.profilePic;

    await supabase.from('profiles').update(updates).eq('id', authData.user.id);
    // Update virtual card holder name
    await supabase.from('virtual_cards').update({ holder_name: data.fullName.toUpperCase() }).eq('user_id', authData.user.id);

    await loadProfile(authData.user.id);
    return { success: true };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.dob !== undefined) dbUpdates.dob = updates.dob;
    if (updates.profilePic !== undefined) dbUpdates.avatar_url = updates.profilePic;
    if (updates.pin !== undefined) dbUpdates.pin_hash = updates.pin;
    await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, [user]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await loadProfile(session.user.id);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{
      user, isAdmin, isLoggedIn: !!user, loading,
      login, loginAdmin, register, logout, updateUser, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
