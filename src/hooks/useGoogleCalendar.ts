import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleConnectionStatus {
  connected: boolean;
  configured: boolean;
  account: {
    email: string;
    connectedAt: string;
    expiresAt: string;
  } | null;
}

export function useGoogleConnectionStatus() {
  return useQuery({
    queryKey: ['google-connection'],
    queryFn: async (): Promise<GoogleConnectionStatus> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-google?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      // Handle "not configured" gracefully
      if (response.status === 400) {
        const data = await response.json();
        if (data.configured === false) {
          return { connected: false, configured: false, account: null };
        }
      }
      
      if (!response.ok) throw new Error('Failed to get status');
      const data = await response.json();
      return { ...data, configured: true };
    },
  });
}

export function useConnectGoogle() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-google?action=start`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        // Special handling for not configured
        if (error.configured === false) {
          throw new Error('NOT_CONFIGURED');
        }
        throw new Error(error.message || 'Failed to start connection');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      // Don't show toast for NOT_CONFIGURED - UI will handle this
      if (error.message === 'NOT_CONFIGURED') return;
      
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-google?action=disconnect`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-connection'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Déconnecté',
        description: 'Google Calendar a été déconnecté.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-calendar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Synchronisation terminée',
        description: `${data.events_synced} événements synchronisés.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
