import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface HabitHistoryEntry {
  date: string;
  completed: boolean;
  habitId: string;
  habitName: string;
  habitIcon: string;
}

export interface HabitDailySummary {
  date: Date;
  completed: number;
  total: number;
  rate: number;
}

export interface HabitKPI {
  habitId: string;
  habitName: string;
  habitIcon: string;
  currentStreak: number;
  maxStreak: number;
  consistency7d: number;
  consistency30d: number;
  completedThisWeek: number;
  totalThisWeek: number;
}

// Fetch real habit history from DB (last N days)
export function useHabitHistory(days: number = 7) {
  return useQuery({
    queryKey: ['habitHistory', days],
    queryFn: async (): Promise<HabitDailySummary[]> => {
      const today = new Date();
      const startDate = format(subDays(today, days - 1), 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');

      // Get all active habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('is_active', true);

      if (habitsError) throw habitsError;

      const totalHabits = habits?.length || 0;
      if (totalHabits === 0) {
        return Array.from({ length: days }, (_, i) => ({
          date: subDays(today, days - 1 - i),
          completed: 0,
          total: 0,
          rate: 0,
        }));
      }

      // Get logs for date range
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('completed', true);

      if (logsError) throw logsError;

      // Group by date
      const logsByDate = new Map<string, number>();
      (logs || []).forEach(log => {
        const count = logsByDate.get(log.date) || 0;
        logsByDate.set(log.date, count + 1);
      });

      // Build summary array
      return Array.from({ length: days }, (_, i) => {
        const date = subDays(today, days - 1 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const completed = logsByDate.get(dateStr) || 0;
        
        return {
          date,
          completed,
          total: totalHabits,
          rate: totalHabits > 0 ? (completed / totalHabits) * 100 : 0,
        };
      });
    },
    staleTime: 60000, // 1 minute
  });
}

// Fetch detailed KPIs per habit
export function useHabitsKPIs() {
  return useQuery({
    queryKey: ['habitsKPIs'],
    queryFn: async (): Promise<HabitKPI[]> => {
      const today = new Date();
      const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
      const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');

      // Get all active habits with streaks
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, icon')
        .eq('is_active', true);

      if (habitsError) throw habitsError;
      if (!habits || habits.length === 0) return [];

      const habitIds = habits.map(h => h.id);

      // Get streaks
      const { data: streaks } = await supabase
        .from('streaks')
        .select('habit_id, current_streak, max_streak')
        .in('habit_id', habitIds);

      // Get logs for 30 days
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .in('habit_id', habitIds)
        .gte('date', thirtyDaysAgo)
        .lte('date', todayStr)
        .eq('completed', true);

      const streakMap = new Map(streaks?.map(s => [s.habit_id, s]) || []);
      const logsByHabit = new Map<string, string[]>();
      
      (logs || []).forEach(log => {
        const dates = logsByHabit.get(log.habit_id) || [];
        dates.push(log.date);
        logsByHabit.set(log.habit_id, dates);
      });

      return habits.map(habit => {
        const streak = streakMap.get(habit.id);
        const habitLogs = logsByHabit.get(habit.id) || [];
        
        // Calculate consistency
        const logsLast7 = habitLogs.filter(d => d >= sevenDaysAgo).length;
        const logsLast30 = habitLogs.length;
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          habitIcon: habit.icon || '✨',
          currentStreak: streak?.current_streak || 0,
          maxStreak: streak?.max_streak || 0,
          consistency7d: Math.round((logsLast7 / 7) * 100),
          consistency30d: Math.round((logsLast30 / 30) * 100),
          completedThisWeek: logsLast7,
          totalThisWeek: 7,
        };
      });
    },
    staleTime: 60000,
  });
}

// Get today's completion summary
export function useTodayHabitsSummary() {
  return useQuery({
    queryKey: ['todayHabitsSummary'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('is_active', true);

      const totalHabits = habits?.length || 0;

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('date', today)
        .eq('completed', true);

      const completedToday = logs?.length || 0;

      return {
        completed: completedToday,
        total: totalHabits,
        rate: totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0,
      };
    },
    staleTime: 30000,
  });
}
