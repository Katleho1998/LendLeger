import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { CheckSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (data) {
        setUserProfile({
          uid: data.id,
          email: data.email,
          displayName: data.display_name,
          businessName: data.business_name,
          phoneNumber: data.phone_number,
          createdAt: data.created_at
        });
      } else {
        setUserProfile({
            uid: uid,
            email: user?.email || '',
            displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest',
            createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
        setLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (isSupabaseConfigured) {
        await supabase.auth.signOut();
    }
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user && isSupabaseConfigured) {
      await fetchUserProfile(user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mx-auto mb-4 animate-pulse">
              <CheckSquare className="text-white" size={32} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">LendLedger</h2>
            <p className="text-slate-500 text-sm mt-2">Loading your secure data...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};