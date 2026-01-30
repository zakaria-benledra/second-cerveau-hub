import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type WinCategory = 'habit' | 'task' | 'goal' | 'finance' | 'health' | 'other';

export interface Win {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  description: string | null;
  category: WinCategory | null;
  tags: string[] | null;
  achieved_at: string;
  score_impact: number | null;
  source: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface WinInput {
  title: string;
  description?: string;
  category?: WinCategory;
  tags?: string[];
  achieved_at?: string;
  score_impact?: number;
}

export function useWins(categoryFilter?: WinCategory | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const winsQuery = useQuery({
    queryKey: ["wins", user?.id, categoryFilter],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("wins")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("achieved_at", { ascending: false });

      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Win[];
    },
    enabled: !!user?.id,
  });

  const statsQuery = useQuery({
    queryKey: ["wins-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalWins: 0, totalImpact: 0 };

      const { data, error } = await supabase
        .from("wins")
        .select("score_impact")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (error) throw error;

      const totalWins = data?.length ?? 0;
      const totalImpact = data?.reduce((sum, w) => sum + (w.score_impact ?? 0), 0) ?? 0;

      return { totalWins, totalImpact };
    },
    enabled: !!user?.id,
  });

  const createWin = useMutation({
    mutationFn: async (input: WinInput) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("wins")
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          category: input.category || null,
          tags: input.tags || [],
          achieved_at: input.achieved_at || new Date().toISOString().split('T')[0],
          score_impact: input.score_impact || 0,
          source: 'ui',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      queryClient.invalidateQueries({ queryKey: ["wins-stats"] });
      toast.success("Victoire ajoutée ! 🎉");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout: " + error.message);
    },
  });

  const updateWin = useMutation({
    mutationFn: async ({ id, ...input }: WinInput & { id: string }) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("wins")
        .update({
          title: input.title,
          description: input.description || null,
          category: input.category || null,
          tags: input.tags || [],
          achieved_at: input.achieved_at,
          score_impact: input.score_impact || 0,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      queryClient.invalidateQueries({ queryKey: ["wins-stats"] });
      toast.success("Victoire mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteWin = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("wins")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wins"] });
      queryClient.invalidateQueries({ queryKey: ["wins-stats"] });
      toast.success("Victoire supprimée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    wins: winsQuery.data ?? [],
    stats: statsQuery.data ?? { totalWins: 0, totalImpact: 0 },
    isLoading: winsQuery.isLoading,
    createWin,
    updateWin,
    deleteWin,
  };
}
