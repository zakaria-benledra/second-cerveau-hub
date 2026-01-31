import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import {
  getDailyBriefing,
  detectRisks,
  generateProposal,
  approveProposal,
  rejectProposal,
  undoAction,
  getWeeklyReview,
  simulateEvent,
  fetchAIProposals,
  fetchAgentActions,
} from '@/lib/api/ai-coach';
import type { AIRisk, AIAction } from '@/ai';
import { toast } from 'sonner';

// Rate limiting constants
const MIN_REFETCH_INTERVAL = 30000; // 30 seconds minimum between refetches

export function useAICoach() {
  const queryClient = useQueryClient();
  const lastBriefingFetchRef = useRef<number>(0);
  const lastRisksFetchRef = useRef<number>(0);

  const briefingQuery = useQuery({
    queryKey: ['ai-briefing'],
    queryFn: getDailyBriefing,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const risksQuery = useQuery({
    queryKey: ['ai-risks'],
    queryFn: detectRisks,
    staleTime: 5 * 60 * 1000,
  });

  const weeklyReviewQuery = useQuery({
    queryKey: ['ai-weekly-review'],
    queryFn: getWeeklyReview,
    enabled: false, // Manual trigger only
  });

  const proposalsQuery = useQuery({
    queryKey: ['ai-proposals'],
    queryFn: fetchAIProposals,
  });

  const actionsQuery = useQuery({
    queryKey: ['agent-actions'],
    queryFn: fetchAgentActions,
  });

  const generateProposalMutation = useMutation({
    mutationFn: ({ type, context }: { type: string; context?: Record<string, unknown> }) =>
      generateProposal(type, context),
    onSuccess: (data) => {
      toast.success('Proposition IA générée');
      queryClient.invalidateQueries({ queryKey: ['ai-proposals'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: approveProposal,
    onSuccess: (data) => {
      toast.success('Proposition approuvée et exécutée');
      queryClient.invalidateQueries({ queryKey: ['ai-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-actions'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: ({ proposalId, reason }: { proposalId: string; reason?: string }) =>
      rejectProposal(proposalId, reason),
    onSuccess: () => {
      toast.info('Proposition rejetée');
      queryClient.invalidateQueries({ queryKey: ['ai-proposals'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const undoActionMutation = useMutation({
    mutationFn: undoAction,
    onSuccess: () => {
      toast.success('Action annulée');
      queryClient.invalidateQueries({ queryKey: ['agent-actions'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const simulateEventMutation = useMutation({
    mutationFn: simulateEvent,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['system-events'] });
      queryClient.invalidateQueries({ queryKey: ['ai-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(`Erreur simulation: ${error.message}`);
    },
  });

  // Rate-limited refetch functions
  const refetchBriefingThrottled = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastBriefingFetchRef.current;

    if (timeSinceLastFetch < MIN_REFETCH_INTERVAL) {
      const remainingSeconds = Math.ceil((MIN_REFETCH_INTERVAL - timeSinceLastFetch) / 1000);
      toast.warning(`Veuillez attendre ${remainingSeconds}s avant de rafraîchir`);
      return Promise.resolve();
    }

    lastBriefingFetchRef.current = now;
    return briefingQuery.refetch();
  }, [briefingQuery]);

  const refetchRisksThrottled = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastRisksFetchRef.current;

    if (timeSinceLastFetch < MIN_REFETCH_INTERVAL) {
      const remainingSeconds = Math.ceil((MIN_REFETCH_INTERVAL - timeSinceLastFetch) / 1000);
      toast.warning(`Veuillez attendre ${remainingSeconds}s avant de rafraîchir`);
      return Promise.resolve();
    }

    lastRisksFetchRef.current = now;
    return risksQuery.refetch();
  }, [risksQuery]);

  return {
    // Queries
    briefing: briefingQuery.data,
    briefingLoading: briefingQuery.isLoading,
    refetchBriefing: refetchBriefingThrottled,
    
    risks: risksQuery.data,
    risksLoading: risksQuery.isLoading,
    refetchRisks: refetchRisksThrottled,
    
    weeklyReview: weeklyReviewQuery.data,
    weeklyReviewLoading: weeklyReviewQuery.isLoading,
    fetchWeeklyReview: weeklyReviewQuery.refetch,
    
    proposals: proposalsQuery.data || [],
    proposalsLoading: proposalsQuery.isLoading,
    
    actions: actionsQuery.data || [],
    actionsLoading: actionsQuery.isLoading,
    
    // Mutations
    generateProposal: generateProposalMutation.mutate,
    isGeneratingProposal: generateProposalMutation.isPending,
    
    approveProposal: approveProposalMutation.mutate,
    isApproving: approveProposalMutation.isPending,
    
    rejectProposal: rejectProposalMutation.mutate,
    isRejecting: rejectProposalMutation.isPending,
    
    undoAction: undoActionMutation.mutate,
    isUndoing: undoActionMutation.isPending,
    
    simulateEvent: simulateEventMutation.mutate,
    isSimulating: simulateEventMutation.isPending,
  };
}
