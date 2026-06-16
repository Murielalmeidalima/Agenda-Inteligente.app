'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Profile } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

interface ProfileContextType {
  profile: Profile | null;
  subscription: any | null;
  loading: boolean;
  error: any | null;
  refreshProfile: () => Promise<void>;
  hasPermission: (screen: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const supabase = createBrowserClient();

  const fetchProfile = async () => {
    let userId: string | undefined;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setSubscription(null);
        return;
      }
      userId = user.id;

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);

      // Buscar assinatura mais recente da clínica
      if (data?.company_id) {
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('company_id', data.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subError) {
          console.error('[ProfileProvider] Erro ao carregar assinatura:', subError);
        } else {
          setSubscription(subData || null);
        }
      } else {
        setSubscription(null);
      }
    } catch (err) {
      const pgError = err as PostgrestError;
      
      // Handle "Row not found" (PGRST116) - Warn only, do not error
      if (pgError?.code === 'PGRST116') {
        console.warn('Profile sync: User has no profile data (PGRST116). This is expected for new users until they complete setup.');
        setProfile(null);
        return;
      }

      // Handle AbortError (network cancellation)
      // Check for strictly standard AbortError OR specific Supabase/Fetch abort messages
      const isAbort = 
        (err instanceof Error && err.name === 'AbortError') ||
        (err instanceof Error && err.message?.includes('AbortError')) ||
        (typeof err === 'object' && err !== null && 'message' in err && (err as any).message?.includes('AbortError'));

      if (isAbort) {
        // Request was aborted (component unmount or fast navigation), ignore.
        return;
      }

      // Handle missing table
      if (pgError?.code === '42P01') {
        console.error('CRITICAL: Missing table "profiles". Run database setup scripts.');
      } else {
        // Log other unexpected errors
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err, null, 2);
        console.error('Error fetching profile for user:', userId || 'unknown', errorMessage);
      }

      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (screen: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    if (!profile) return false;
    
    // Admins e Chefes têm acesso total
    if (profile.role === 'admin' || profile.role === 'chefe') return true;

    if (!profile.permissions) return false;

    const screenPermissions = profile.permissions[screen.toLowerCase()];
    if (!screenPermissions) return false;

    return !!screenPermissions[action];
  };

  return (
    <ProfileContext.Provider 
      value={{ 
        profile, 
        subscription,
        loading, 
        error, 
        refreshProfile: fetchProfile,
        hasPermission
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
