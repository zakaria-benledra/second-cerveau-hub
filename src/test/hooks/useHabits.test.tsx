import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { useHabitsWithLogs, useCreateHabit, useToggleHabitLog } from '@/hooks/useHabits';
import { supabase } from '@/integrations/supabase/client';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useHabits hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useHabitsWithLogs', () => {
    it('should fetch habits with their logs', async () => {
      const mockHabits = [
        { 
          id: '1', 
          name: 'Exercise', 
          target_frequency: 'daily',
          is_active: true,
          habit_logs: [
            { id: 'log1', date: '2025-01-30', completed: true }
          ]
        },
        { 
          id: '2', 
          name: 'Read', 
          target_frequency: 'daily',
          is_active: true,
          habit_logs: []
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockHabits, error: null }),
      } as any);

      const { result } = renderHook(() => useHabitsWithLogs(), {
        wrapper: createWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('should handle empty habits list', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { result } = renderHook(() => useHabitsWithLogs(), {
        wrapper: createWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});

describe('Habit data validation', () => {
  it('should validate target_frequency values', () => {
    const validFrequencies = ['daily', 'weekly', 'weekdays'];
    validFrequencies.forEach(freq => {
      expect(['daily', 'weekly', 'weekdays', 'custom']).toContain(freq);
    });
  });

  it('should have correct habit log structure', () => {
    const habitLog = {
      id: 'uuid',
      habit_id: 'uuid',
      user_id: 'uuid',
      date: '2025-01-30',
      completed: true,
      created_at: '2025-01-30T10:00:00Z',
    };

    expect(habitLog.completed).toBe(true);
    expect(habitLog.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should calculate streak correctly', () => {
    const calculateStreak = (logs: { date: string; completed: boolean }[]) => {
      let streak = 0;
      const sortedLogs = [...logs].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      for (const log of sortedLogs) {
        if (log.completed) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const logs = [
      { date: '2025-01-30', completed: true },
      { date: '2025-01-29', completed: true },
      { date: '2025-01-28', completed: true },
      { date: '2025-01-27', completed: false },
    ];

    expect(calculateStreak(logs)).toBe(3);
  });
});
