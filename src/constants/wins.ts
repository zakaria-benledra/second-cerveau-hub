export type WinCategory = 'habit' | 'task' | 'goal' | 'finance' | 'health' | 'other';

export interface WinCategoryConfig {
  value: WinCategory;
  label: string;
  color: string;
}

export const WIN_CATEGORIES: WinCategoryConfig[] = [
  { value: 'habit', label: 'Habitude', color: 'bg-success' },
  { value: 'task', label: 'Tâche', color: 'bg-primary' },
  { value: 'goal', label: 'Objectif', color: 'bg-warning' },
  { value: 'finance', label: 'Finance', color: 'bg-info' },
  { value: 'health', label: 'Santé', color: 'bg-destructive' },
  { value: 'other', label: 'Autre', color: 'bg-muted' },
];

export const WIN_CATEGORY_FILTERS: Array<{ value: WinCategory | null; label: string }> = [
  { value: null, label: 'Toutes' },
  ...WIN_CATEGORIES.map(c => ({ value: c.value, label: c.label })),
];
