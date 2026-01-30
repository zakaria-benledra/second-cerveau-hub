import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_frequency: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  max_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

export interface HabitWithLog extends Habit {
  todayLog: HabitLog | null;
  streak: Streak | null;
  streak_freezes_available?: number;
  last_freeze_reset_date?: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  target_frequency?: Habit['target_frequency'];
  icon?: string;
  color?: string;
}

// Fetch all habits with today's log
export async function fetchHabitsWithLogs(): Promise<HabitWithLog[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (habitsError) throw habitsError;

  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('date', today);

  if (logsError) throw logsError;

  const { data: streaks, error: streaksError } = await supabase
    .from('streaks')
    .select('*');

  if (streaksError) throw streaksError;

  return (habits as Habit[]).map((habit) => ({
    ...habit,
    todayLog: (logs as HabitLog[]).find((log) => log.habit_id === habit.id) || null,
    streak: (streaks as Streak[]).find((s) => s.habit_id === habit.id) || null,
  }));
}

// Create a new habit
export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      target_frequency: input.target_frequency || 'daily',
      icon: input.icon,
      color: input.color,
    })
    .select()
    .single();

  if (error) throw error;

  // Initialize streak
  await supabase.from('streaks').insert({
    habit_id: data.id,
    user_id: user.id,
    current_streak: 0,
    max_streak: 0,
  });

  return data as Habit;
}

// Toggle habit log for today
export async function toggleHabitLog(habitId: string): Promise<HabitLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  // Check if log exists
  const { data: existingLog, error: existingLogError } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .eq('date', today)
    .maybeSingle();

  if (existingLogError) throw existingLogError;

  if (existingLog) {
    // Toggle existing log
    const { data, error } = await supabase
      .from('habit_logs')
      .update({ completed: !existingLog.completed })
      .eq('id', existingLog.id)
      .select()
      .single();

    if (error) throw error;

    // Update streak
    await updateStreak(habitId, user.id, !existingLog.completed);

    return data as HabitLog;
  } else {
    // Create new log
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        completed: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Update streak
    await updateStreak(habitId, user.id, true);

    return data as HabitLog;
  }
}

// Update streak for a habit
async function updateStreak(habitId: string, userId: string, completed: boolean): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('*')
    .eq('habit_id', habitId)
    .maybeSingle();

  if (streakError) throw streakError;

  if (!streak) {
    // Create streak if doesn't exist
    await supabase.from('streaks').insert({
      habit_id: habitId,
      user_id: userId,
      current_streak: completed ? 1 : 0,
      max_streak: completed ? 1 : 0,
      last_completed_date: completed ? today : null,
    });
    return;
  }

  if (completed) {
    const wasYesterday = streak.last_completed_date === yesterday;
    const isToday = streak.last_completed_date === today;

    let newCurrent = streak.current_streak;
    if (isToday) {
      // Already logged today, no change
      return;
    } else if (wasYesterday) {
      newCurrent = streak.current_streak + 1;
    } else {
      newCurrent = 1;
    }

    await supabase
      .from('streaks')
      .update({
        current_streak: newCurrent,
        max_streak: Math.max(streak.max_streak, newCurrent),
        last_completed_date: today,
      })
      .eq('id', streak.id);
  } else {
    // Uncompleted - check if this breaks the streak
    if (streak.last_completed_date === today) {
      const { data: yesterdayLog } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', yesterday)
        .eq('completed', true)
        .maybeSingle();

      await supabase
        .from('streaks')
        .update({
          current_streak: yesterdayLog ? streak.current_streak - 1 : 0,
          last_completed_date: yesterdayLog ? yesterday : null,
        })
        .eq('id', streak.id);
    }
  }
}

// Delete a habit
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Use a streak freeze instead of breaking the streak
export async function useStreakFreeze(habitId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Call the database function
  const { data, error } = await supabase
    .rpc('use_streak_freeze', {
      p_habit_id: habitId,
      p_user_id: user.id
    });

  if (error) throw error;
  return data as boolean;
}

// Check if streak freeze is available
export async function checkStreakFreezeAvailable(habitId: string): Promise<{
  available: boolean;
  freezesLeft: number;
}> {
  const { data: habit, error } = await supabase
    .from('habits')
    .select('streak_freezes_available')
    .eq('id', habitId)
    .single();

  if (error) throw error;

  const freezesLeft = (habit as any)?.streak_freezes_available ?? 0;
  return {
    available: freezesLeft > 0,
    freezesLeft
  };
}
