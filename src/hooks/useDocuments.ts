import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  document_type: string;
  account_label?: string;
  date_from?: string;
  date_to?: string;
  parsed_status: 'pending' | 'processing' | 'completed' | 'failed';
  parsed_at?: string;
  parse_errors?: Record<string, unknown>;
  transactions_count: number;
  created_at: string;
}

export function useDocuments(documentType?: string) {
  return useQuery({
    queryKey: ['documents', documentType],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
  });
}

export function useUploadStatement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      file, 
      accountLabel, 
      dateFrom, 
      dateTo 
    }: { 
      file: File; 
      accountLabel?: string; 
      dateFrom?: string; 
      dateTo?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      if (accountLabel) formData.append('accountLabel', accountLabel);
      if (dateFrom) formData.append('dateFrom', dateFrom);
      if (dateTo) formData.append('dateTo', dateTo);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-statement`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Fichier importé',
        description: data.message || 'Le relevé a été importé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur d\'import',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document supprimé',
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
