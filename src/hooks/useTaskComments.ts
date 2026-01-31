import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async (): Promise<TaskComment[]> => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get workspace_id from user's workspace
      const { data: membership } = await supabase
        .from('memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          workspace_id: membership?.workspace_id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] });
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été enregistré.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', data.taskId] });
      toast({
        title: 'Commentaire supprimé',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });
}

// Function to trigger weekly archive
export async function triggerWeeklyArchive(): Promise<number> {
  const { data, error } = await supabase.rpc('archive_completed_tasks');
  if (error) throw error;
  return data as number;
}
