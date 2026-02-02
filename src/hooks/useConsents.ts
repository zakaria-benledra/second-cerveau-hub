import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsentManager, CONSENT_PURPOSES } from '@/compliance/consent-manager';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useConsents() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-consents', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const manager = new ConsentManager(user.id);
      return manager.getConsents();
    },
    enabled: !!user?.id,
  });
}

export function useConsentRecords() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-consent-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const manager = new ConsentManager(user.id);
      return manager.getConsentRecords();
    },
    enabled: !!user?.id,
  });
}

export function useUpdateConsent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ purpose, granted }: { purpose: string; granted: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const manager = new ConsentManager(user.id);
      
      if (granted) {
        await manager.grantConsent(purpose);
      } else {
        await manager.withdrawConsent(purpose);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents'] });
      queryClient.invalidateQueries({ queryKey: ['user-consent-records'] });
    },
  });
}

export function useExportUserData() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const [tasks, habits, journal, finance, profile, consents] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('finance_transactions').select('*').eq('user_id', user.id),
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_consents').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profile.data,
        consents: consents.data || [],
        tasks: tasks.data || [],
        habits: habits.data || [],
        journal_entries: journal.data || [],
        finance_transactions: finance.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minded-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    },
  });
}

export { CONSENT_PURPOSES };
