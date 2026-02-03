import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AINotification {
  id: string;
  type: 'intervention' | 'notification';
  message: string;
  action_type?: string;
  signal_type?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export function useAINotifications() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-notifications-unified', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch both tables in parallel
      const [interventions, notifs] = await Promise.all([
        supabase
          .from('ai_interventions')
          .select('id, ai_message, intervention_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('ai_notifications')
          .select('id, message, notification_type, read_at, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      // Unify format
      const unified: AINotification[] = [
        ...(interventions.data || []).map(i => ({
          id: i.id,
          type: 'intervention' as const,
          message: i.ai_message,
          action_type: i.intervention_type,
          read: false,
          created_at: i.created_at,
        })),
        ...(notifs.data || []).map(n => ({
          id: n.id,
          type: 'notification' as const,
          message: n.message,
          action_type: n.notification_type,
          read: !!n.read_at,
          created_at: n.created_at,
        })),
      ];

      // Sort by date
      return unified.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
    refetchInterval: 30000, // 30s
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
  };
}
