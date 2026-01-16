import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mockAuth } from '../lib/mockAuth';
import { mockReportService } from '../services/mockReportService';
import type { User } from '../types';

// モックモード判定（デモ用）
const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // デモモード: モック認証を使用
      mockAuth.getSession().then((session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            created_at: session.user.created_at,
          });
        }
        setLoading(false);
      });
      return;
    }

    // 本番モード: Supabaseを使用
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      // デモモード: モック認証を使用
      const session = await mockAuth.signIn(email, password);
      setUser({
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        created_at: session.user.created_at,
      });

      // サンプルデータ自動生成（初回ログイン時のみ）
      mockReportService.createSampleData(session.user.id);

      return;
    }

    // 本番モード: Supabaseを使用
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser(mapSupabaseUser(data.user));

      await supabase.from('activity_logs').insert({
        user_id: data.user.id,
        action: 'login',
      });
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (DEMO_MODE) {
      // デモモード: モック認証を使用
      const session = await mockAuth.signUp(email, password, fullName);
      setUser({
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        created_at: session.user.created_at,
      });
      return;
    }

    // 本番モード: Supabaseを使用
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'employee',
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser(mapSupabaseUser(data.user));

      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: 'employee',
      });

      await supabase.from('activity_logs').insert({
        user_id: data.user.id,
        action: 'signup',
      });
    }
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      // デモモード: モック認証を使用
      await mockAuth.signOut();
      setUser(null);
      return;
    }

    // 本番モード: Supabaseを使用
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'logout',
      });
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthはAuthProvider内で使用する必要があります');
  }
  return context;
}

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    role: (supabaseUser.user_metadata?.role as 'employee' | 'admin') || 'employee',
    created_at: supabaseUser.created_at || new Date().toISOString(),
  };
}
