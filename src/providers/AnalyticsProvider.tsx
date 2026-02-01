import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Json } from '@/integrations/supabase/types';

interface AnalyticsContextType {
  trackAction: (name: string, data?: Record<string, Json>) => void;
  trackEngagement: (name: string, data?: Record<string, Json>) => void;
  trackConversion: (name: string, data?: Record<string, Json>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const analytics = useAnalytics();
  const location = useLocation();

  // Track session start
  useEffect(() => {
    const sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      analytics.trackEngagement('session_start', {
        landing_page: location.pathname,
        referrer: document.referrer,
      });
    }
  }, []);

  // Track auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        analytics.trackConversion('user_signed_in', {
          method: session?.user?.app_metadata?.provider || 'email',
        });
      } else if (event === 'SIGNED_OUT') {
        analytics.trackAction('user_signed_out');
      }
    });

    return () => subscription.unsubscribe();
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}
