import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

let startTime = Date.now();

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    startTime = Date.now();

    // Track page view on mount
    trackPageView(location.pathname, sessionId);

    // Track time spent when component unmounts or location changes
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      updateTimeSpent(location.pathname, sessionId, timeSpent);
    };
  }, [location.pathname]);
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const trackPageView = async (pagePath: string, sessionId: string) => {
  try {
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_path: pagePath,
        session_id: sessionId,
        ip_address: null, // Will be handled by RLS if needed
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        time_spent_seconds: 0,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking page view:', error);
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

const updateTimeSpent = async (pagePath: string, sessionId: string, timeSpent: number) => {
  try {
    // Get the most recent page view for this session and path
    const { data: pageViews, error: fetchError } = await supabase
      .from('page_views')
      .select('id')
      .eq('page_path', pagePath)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !pageViews || pageViews.length === 0) {
      return;
    }

    const { error: updateError } = await supabase
      .from('page_views')
      .update({ time_spent_seconds: timeSpent })
      .eq('id', pageViews[0].id);

    if (updateError) {
      console.error('Error updating time spent:', updateError);
    }
  } catch (error) {
    console.error('Error updating time spent:', error);
  }
};