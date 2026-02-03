import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResetResult {
  success: boolean;
  message: string;
  details: Record<string, number>;
  totalDeleted: number;
  preserved: string[];
}

export function useResetData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('reset-user-data', {
        body: { 
          userId: user.id, 
          confirmReset: 'RESET_ALL_DATA' 
        },
      });

      if (response.error) throw response.error;
      return response.data as ResetResult;
    },
    onSuccess: (data) => {
      // Invalider TOUS les caches
      queryClient.clear();
      
      toast({
        title: '✅ Données réinitialisées',
        description: `${data.totalDeleted} éléments supprimés. Ton apprentissage AI a été conservé.`,
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
