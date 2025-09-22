import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useListingTracking = (listingId: string | undefined) => {
  useEffect(() => {
    if (!listingId) return;

    const trackListingView = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        
        const { error } = await supabase
          .from('listing_views')
          .insert({
            listing_id: listingId,
            session_id: sessionId,
            time_spent_seconds: 0,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error tracking listing view:', error);
        }
      } catch (error) {
        console.error('Error tracking listing view:', error);
      }
    };

    trackListingView();
  }, [listingId]);
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};