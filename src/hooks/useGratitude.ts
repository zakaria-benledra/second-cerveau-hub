import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { differenceInDays, parseISO, subDays, format } from "date-fns";

export interface GratitudeEntry {
  id: string;
  user_id: string;
  workspace_id: string | null;
  date: string;
  items: string[];
  source: string | null;
  created_at: string;
  updated_at: string;
}

export function useGratitude() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all gratitude entries
  const entriesQuery = useQuery({
    queryKey: ["gratitude-entries", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(90);

      if (error) throw error;
      return data as GratitudeEntry[];
    },
    enabled: !!user?.id,
  });

  // Get today's entry
  const todayEntry = entriesQuery.data?.find(
    (e) => e.date === format(new Date(), "yyyy-MM-dd")
  );

  // Calculate streak
  const calculateStreak = () => {
    const entries = entriesQuery.data ?? [];
    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today or yesterday has an entry to start counting
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
    
    const hasTodayEntry = entries.some((e) => e.date === todayStr);
    const hasYesterdayEntry = entries.some((e) => e.date === yesterdayStr);

    if (!hasTodayEntry && !hasYesterdayEntry) return 0;

    // Start from the most recent date that has an entry
    let currentDate = hasTodayEntry ? today : subDays(today, 1);

    for (let i = 0; i < 365; i++) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const hasEntry = entries.some((e) => e.date === dateStr);

      if (hasEntry) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Save or update today's gratitude
  const saveGratitude = useMutation({
    mutationFn: async (items: string[]) => {
      if (!user?.id) throw new Error("Non authentifié");

      const today = format(new Date(), "yyyy-MM-dd");
      const filteredItems = items.filter((i) => i.trim());

      if (filteredItems.length === 0) {
        throw new Error("Ajoute au moins une gratitude");
      }

      // Check if entry exists for today
      const { data: existing } = await supabase
        .from("gratitude_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("gratitude_entries")
          .update({ items: filteredItems })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("gratitude_entries").insert({
          user_id: user.id,
          date: today,
          items: filteredItems,
          source: "ui",
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gratitude-entries"] });
      toast.success("Gratitudes enregistrées 🙏");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    entries: entriesQuery.data ?? [],
    todayEntry,
    streak: calculateStreak(),
    isLoading: entriesQuery.isLoading,
    saveGratitude,
  };
}
