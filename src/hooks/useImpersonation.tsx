import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ImpersonationSession {
  session_token: string;
  impersonated_user_id: string;
  admin_user_id: string;
  started_at: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonationSession: ImpersonationSession | null;
  startImpersonation: (userId: string, reason?: string) => Promise<{ error: any }>;
  endImpersonation: () => Promise<{ error: any }>;
  loading: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      checkCurrentImpersonation();
    }
  }, [profile]);

  const checkCurrentImpersonation = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_impersonation');
      
      if (error) {
        console.error('Error checking impersonation:', error);
        return;
      }

      if (data && data.length > 0) {
        const session = data[0];
        setImpersonationSession(session);
        setIsImpersonating(true);
      } else {
        setImpersonationSession(null);
        setIsImpersonating(false);
      }
    } catch (error) {
      console.error('Error checking impersonation:', error);
    }
  };

  const startImpersonation = async (userId: string, reason: string = 'Support assistance') => {
    if (profile?.user_type !== 'admin') {
      return { error: 'Only admins can impersonate users' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('start_impersonation', {
        target_user_id: userId,
        reason_text: reason
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      // The new function returns full session data as jsonb
      if (data) {
        const sessionData = data as any;
        setImpersonationSession({
          session_token: sessionData.session_token,
          impersonated_user_id: sessionData.impersonated_user_id,
          admin_user_id: sessionData.admin_user_id,
          started_at: sessionData.started_at
        });
        setIsImpersonating(true);
      }
      
      setLoading(false);
      // Trigger a page reload to refresh all data with new user context
      window.location.reload();
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const endImpersonation = async () => {
    if (!impersonationSession) {
      return { error: 'No active impersonation session' };
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('end_impersonation', {
        token: impersonationSession.session_token
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      setImpersonationSession(null);
      setIsImpersonating(false);
      setLoading(false);
      // Reload to return to admin context
      window.location.reload();
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const value = {
    isImpersonating,
    impersonationSession,
    startImpersonation,
    endImpersonation,
    loading,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}