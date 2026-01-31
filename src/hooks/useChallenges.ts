import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export type ChallengeStatus = "active" | "completed" | "abandoned";

export interface Challenge {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  duration: number;
  days_completed: number;
  reward: string | null;
  status: ChallengeStatus;
  started_at: string;
  completed_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChallengeLog {
  id: string;
  challenge_id: string;
  user_id: string;
  workspace_id: string | null;
  date: string;
  completed: boolean;
  note: string | null;
  source: string | null;
  created_at: string;
}

export interface ChallengeInput {
  name: string;
  description?: string;
  duration: number;
  reward?: string;
}

export function useChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all challenges
  const challengesQuery = useQuery({
    queryKey: ["challenges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user?.id,
  });

  // Fetch today's logs for active challenges
  const todayLogsQuery = useQuery({
    queryKey: ["challenge-logs-today", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("challenge_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);

      if (error) throw error;
      return data as ChallengeLog[];
    },
    enabled: !!user?.id,
  });

  // Create a new challenge
  const createChallenge = useMutation({
    mutationFn: async (input: ChallengeInput) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          duration: input.duration,
          reward: input.reward || null,
          days_completed: 0,
          status: "active",
          started_at: new Date().toISOString().split("T")[0],
          source: "ui",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Défi créé ! Bonne chance 💪");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Mark today as completed for a challenge
  const markTodayComplete = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const today = new Date().toISOString().split("T")[0];

      // Check if already logged today
      const { data: existing } = await supabase
        .from("challenge_logs")
        .select("id")
        .eq("challenge_id", challengeId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        throw new Error("Déjà marqué comme fait aujourd'hui");
      }

      // Get current challenge
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .eq("user_id", user.id)
        .single();

      if (challengeError) throw challengeError;

      // Insert log
      const { error: logError } = await supabase.from("challenge_logs").insert({
        challenge_id: challengeId,
        user_id: user.id,
        date: today,
        completed: true,
        source: "ui",
      });

      if (logError) throw logError;

      // Update days_completed
      const newDaysCompleted = (challenge.days_completed || 0) + 1;
      const isCompleted = newDaysCompleted >= challenge.duration;

      const { error: updateError } = await supabase
        .from("challenges")
        .update({
          days_completed: newDaysCompleted,
          status: isCompleted ? "completed" : "active",
          completed_at: isCompleted ? today : null,
        })
        .eq("id", challengeId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return { isCompleted, challenge };
    },
    onSuccess: ({ isCompleted, challenge }) => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenge-logs-today"] });

      if (isCompleted) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success(`🎉 Défi "${challenge.name}" terminé ! ${challenge.reward ? `Récompense: ${challenge.reward}` : ""}`, {
          duration: 5000,
        });
      } else {
        toast.success("Jour complété ! Continue comme ça 🔥");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Abandon a challenge
  const abandonChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("challenges")
        .update({ status: "abandoned" })
        .eq("id", challengeId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.info("Défi abandonné");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete a challenge
  const deleteChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("challenges")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", challengeId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Défi supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const challenges = challengesQuery.data ?? [];
  const todayLogs = todayLogsQuery.data ?? [];

  const activeChallenges = challenges.filter((c) => c.status === "active");
  const completedChallenges = challenges.filter((c) => c.status === "completed");

  const isTodayCompleted = (challengeId: string) =>
    todayLogs.some((log) => log.challenge_id === challengeId && log.completed);

  return {
    challenges,
    activeChallenges,
    completedChallenges,
    todayLogs,
    isLoading: challengesQuery.isLoading,
    isTodayCompleted,
    createChallenge,
    markTodayComplete,
    abandonChallenge,
    deleteChallenge,
  };
}
