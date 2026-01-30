import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchQATestStatus,
  updateQATestStatus,
  fetchSystemEvents,
  fetchAuditLog,
  computeTodayScore,
  QATestStatus,
} from '@/lib/api/qa';
import { toast } from 'sonner';

export function useQA() {
  const queryClient = useQueryClient();

  const testStatusQuery = useQuery({
    queryKey: ['qa-test-status'],
    queryFn: fetchQATestStatus,
  });

  const systemEventsQuery = useQuery({
    queryKey: ['system-events'],
    queryFn: () => fetchSystemEvents(100),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const auditLogQuery = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => fetchAuditLog(100),
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: QATestStatus['status']; notes?: string }) =>
      updateQATestStatus(id, status, notes),
    onSuccess: () => {
      toast.success('Statut de test mis à jour');
      queryClient.invalidateQueries({ queryKey: ['qa-test-status'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const computeScoreMutation = useMutation({
    mutationFn: computeTodayScore,
    onSuccess: (data) => {
      toast.success('Score recalculé avec succès');
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      queryClient.invalidateQueries({ queryKey: ['daily-score'] });
    },
    onError: (error) => {
      toast.error(`Erreur calcul: ${error.message}`);
    },
  });

  // Calculate stats
  const tests = testStatusQuery.data || [];
  const stats = {
    total: tests.length,
    verified: tests.filter(t => t.status === 'verified').length,
    partial: tests.filter(t => t.status === 'partial').length,
    failed: tests.filter(t => t.status === 'failed').length,
    notTested: tests.filter(t => t.status === 'not_tested').length,
  };

  return {
    // Queries
    tests: testStatusQuery.data || [],
    testsLoading: testStatusQuery.isLoading,
    
    events: systemEventsQuery.data || [],
    eventsLoading: systemEventsQuery.isLoading,
    refetchEvents: systemEventsQuery.refetch,
    
    auditLog: auditLogQuery.data || [],
    auditLogLoading: auditLogQuery.isLoading,
    refetchAuditLog: auditLogQuery.refetch,
    
    stats,
    
    // Mutations
    updateTestStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    
    computeScore: computeScoreMutation.mutate,
    isComputing: computeScoreMutation.isPending,
  };
}
