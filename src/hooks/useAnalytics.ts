import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type EventCategory = 'page_view' | 'action' | 'engagement' | 'conversion' | 'error';

interface TrackEventParams {
  name: string;
  category: EventCategory;
  data?: Record<string, Json>;
}

// Générer un ID de session unique
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Détecter le type d'appareil
const getDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export function useAnalytics() {
  const location = useLocation();
  const lastPageRef = useRef<string>('');

  // Track un événement
  const track = useCallback(async ({ name, category, data = {} }: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event = {
        user_id: user?.id || null,
        session_id: getSessionId(),
        event_name: name,
        event_category: category,
        event_data: data,
        page_path: location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      };

      // En dev, log dans la console
      if (import.meta.env.DEV) {
        console.log('📊 Analytics:', name, event);
      }

      // Envoyer à Supabase
      await supabase.from('analytics_events').insert([event]);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [location.pathname]);

  // Track automatique des pages vues
  useEffect(() => {
    if (location.pathname !== lastPageRef.current) {
      lastPageRef.current = location.pathname;
      track({
        name: 'page_view',
        category: 'page_view',
        data: { path: location.pathname },
      });
    }
  }, [location.pathname, track]);

  // Helpers pour les événements communs
  const trackAction = useCallback((name: string, data?: Record<string, Json>) => {
    track({ name, category: 'action', data });
  }, [track]);

  const trackEngagement = useCallback((name: string, data?: Record<string, Json>) => {
    track({ name, category: 'engagement', data });
  }, [track]);

  const trackConversion = useCallback((name: string, data?: Record<string, Json>) => {
    track({ name, category: 'conversion', data });
  }, [track]);

  const trackError = useCallback((name: string, error: unknown) => {
    const errorObj = error as Error;
    track({ 
      name, 
      category: 'error', 
      data: { 
        message: errorObj?.message || String(error),
        stack: errorObj?.stack,
      } 
    });
  }, [track]);

  return {
    track,
    trackAction,
    trackEngagement,
    trackConversion,
    trackError,
  };
}

// Hook pour tracker le temps passé sur une page
export function usePageTime(pageName: string) {
  const { trackEngagement } = useAnalytics();
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 2) { // Ignore les visites < 2 secondes
        trackEngagement('time_on_page', {
          page: pageName,
          seconds: timeSpent,
        });
      }
    };
  }, [pageName, trackEngagement]);
}
