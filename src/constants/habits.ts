export const HABIT_EMOJI_OPTIONS = [
  '✨', '🧘', '📚', '💪', '🏃', '💧', '🍎', '😴', 
  '✍️', '🎯', '🧠', '🌱', '🎨', '🎵', '💡'
] as const;

export type HabitEmoji = typeof HABIT_EMOJI_OPTIONS[number];
