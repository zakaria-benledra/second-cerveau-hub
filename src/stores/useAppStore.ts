import { create } from 'zustand';
import type { Task, Habit, HabitLog, InboxItem, Project, Goal, DailyStats } from '@/types';

// Sample data for demo
const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Finish quarterly report',
    description: 'Complete the Q4 financial analysis',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(),
    estimateMin: 120,
    energyLevel: 'high',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    title: 'Review team proposals',
    description: 'Go through all submitted project proposals',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(),
    estimateMin: 45,
    energyLevel: 'medium',
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: '3',
    title: 'Schedule 1:1 meetings',
    status: 'todo',
    priority: 'low',
    dueDate: new Date(Date.now() + 86400000),
    estimateMin: 15,
    energyLevel: 'low',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Update project roadmap',
    status: 'todo',
    priority: 'urgent',
    dueDate: new Date(),
    estimateMin: 60,
    energyLevel: 'high',
    createdAt: new Date(),
  },
];

const sampleHabits: Habit[] = [
  { id: '1', name: 'Morning meditation', targetFrequency: 'daily', isActive: true, icon: '🧘', createdAt: new Date() },
  { id: '2', name: 'Read 30 minutes', targetFrequency: 'daily', isActive: true, icon: '📚', createdAt: new Date() },
  { id: '3', name: 'Exercise', targetFrequency: 'daily', isActive: true, icon: '💪', createdAt: new Date() },
  { id: '4', name: 'Journal', targetFrequency: 'daily', isActive: true, icon: '✍️', createdAt: new Date() },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

const sampleHabitLogs: HabitLog[] = [
  { id: '1', habitId: '1', date: today, completed: true },
  { id: '2', habitId: '2', date: today, completed: true },
  { id: '3', habitId: '3', date: today, completed: false },
  { id: '4', habitId: '4', date: today, completed: false },
];

const sampleInboxItems: InboxItem[] = [
  { id: '1', source: 'email', title: 'Meeting request from Alex', status: 'new', createdAt: new Date() },
  { id: '2', source: 'note', title: 'Research AI productivity tools', status: 'new', createdAt: new Date() },
  { id: '3', source: 'capture', title: 'Call dentist for appointment', status: 'new', createdAt: new Date() },
];

interface AppState {
  // Data
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  inboxItems: InboxItem[];
  projects: Project[];
  goals: Goal[];
  dailyStats: DailyStats | null;
  
  // UI State
  sidebarOpen: boolean;
  currentView: string;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  
  // Habit actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  toggleHabitLog: (habitId: string, date: Date) => void;
  
  // Inbox actions
  addInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  convertInboxToTask: (inboxId: string) => void;
  archiveInboxItem: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial data
  tasks: sampleTasks,
  habits: sampleHabits,
  habitLogs: sampleHabitLogs,
  inboxItems: sampleInboxItems,
  projects: [],
  goals: [],
  dailyStats: {
    date: new Date(),
    tasksPlanned: 4,
    tasksCompleted: 0,
    habitsCompleted: 2,
    focusMinutes: 45,
    overloadIndex: 0.7,
    clarityScore: 0.85,
  },
  
  // UI State
  sidebarOpen: true,
  currentView: 'today',
  
  // Actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  
  // Task actions
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), createdAt: new Date() }],
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),
  
  completeTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, status: 'done' as const, completedAt: new Date() } : t
    ),
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
  })),
  
  // Habit actions
  addHabit: (habit) => set((state) => ({
    habits: [...state.habits, { ...habit, id: crypto.randomUUID(), createdAt: new Date() }],
  })),
  
  toggleHabitLog: (habitId, date) => set((state) => {
    const dateStr = date.toDateString();
    const existingLog = state.habitLogs.find(
      (l) => l.habitId === habitId && l.date.toDateString() === dateStr
    );
    
    if (existingLog) {
      return {
        habitLogs: state.habitLogs.map((l) =>
          l.id === existingLog.id ? { ...l, completed: !l.completed } : l
        ),
      };
    }
    
    return {
      habitLogs: [...state.habitLogs, { id: crypto.randomUUID(), habitId, date, completed: true }],
    };
  }),
  
  // Inbox actions
  addInboxItem: (item) => set((state) => ({
    inboxItems: [...state.inboxItems, { ...item, id: crypto.randomUUID(), createdAt: new Date() }],
  })),
  
  convertInboxToTask: (inboxId) => {
    const { inboxItems, addTask, archiveInboxItem } = get();
    const item = inboxItems.find((i) => i.id === inboxId);
    if (item) {
      addTask({ title: item.title, status: 'todo', priority: 'medium' });
      archiveInboxItem(inboxId);
    }
  },
  
  archiveInboxItem: (id) => set((state) => ({
    inboxItems: state.inboxItems.map((i) =>
      i.id === id ? { ...i, status: 'archived' as const } : i
    ),
  })),
}));
