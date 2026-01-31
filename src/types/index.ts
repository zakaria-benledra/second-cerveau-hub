// Core types for Minded

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type InboxItemStatus = 'new' | 'processed' | 'archived';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  startDate?: Date;
  estimateMin?: number;
  actualDurationMin?: number;
  energyLevel?: EnergyLevel;
  projectId?: string;
  goalId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  targetFrequency: HabitFrequency;
  isActive: boolean;
  icon?: string;
  color?: string;
  createdAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
}

export interface Streak {
  habitId: string;
  current: number;
  max: number;
}

export interface InboxItem {
  id: string;
  source: string;
  title: string;
  content?: string;
  status: InboxItemStatus;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  domainId?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
}

export interface DailyStats {
  date: Date;
  tasksPlanned: number;
  tasksCompleted: number;
  habitsCompleted: number;
  focusMinutes: number;
  overloadIndex: number;
  clarityScore: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message?: string;
  read: boolean;
  createdAt: Date;
}
