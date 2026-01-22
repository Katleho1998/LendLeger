import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  resetActivityTimer: () => void;
  timeUntilLogout: number;
  showLogoutWarning: boolean;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-logout state
  const [timeUntilLogout, setTimeUntilLogout] = useState(20 * 60 * 1000); // 20 minutes in milliseconds
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const AUTO_LOGOUT_TIME = 20 * 60 * 1000; // 20 minutes
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

  // Activity tracking functions
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeUntilLogout(AUTO_LOGOUT_TIME);
    setShowLogoutWarning(false);

    // Clear existing timers
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Set new timers if user is logged in
    if (user) {
      warningTimerRef.current = setTimeout(() => {
        setShowLogoutWarning(true);
      }, AUTO_LOGOUT_TIME - WARNING_TIME);

      logoutTimerRef.current = setTimeout(async () => {
        await logout();
      }, AUTO_LOGOUT_TIME);
    }
  }, [user]);

  const extendSession = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

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

  // Activity tracking effect
  useEffect(() => {
    if (!user) {
      // Clear timers when user logs out
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      setShowLogoutWarning(false);
      return;
    }

    // Start activity timer when user logs in
    resetActivityTimer();

    // Add activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Update countdown timer every second
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, AUTO_LOGOUT_TIME - elapsed);
      setTimeUntilLogout(remaining);

      if (remaining <= WARNING_TIME && !showLogoutWarning) {
        setShowLogoutWarning(true);
      }
    }, 1000);

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(countdownInterval);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [user, resetActivityTimer, handleActivity, showLogoutWarning]);

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
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      logout, 
      refreshProfile,
      resetActivityTimer,
      timeUntilLogout,
      showLogoutWarning,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};