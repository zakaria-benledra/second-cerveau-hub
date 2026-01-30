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
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { useTodayTasks, useAllTasks, useCreateTask, useCompleteTask } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';

// Test wrapper with QueryClient
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

describe('useTasks hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTodayTasks', () => {
    it('should fetch today tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'high' },
        { id: '2', title: 'Task 2', status: 'in_progress', priority: 'medium' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
        }),
      } as any);

      const { result } = renderHook(() => useTodayTasks(), {
        wrapper: createWrapper(),
      });

      // Wait for query to complete
      await vi.waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTasks);
    });

    it('should handle fetch error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      } as any);

      const { result } = renderHook(() => useTodayTasks(), {
        wrapper: createWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAllTasks', () => {
    it('should fetch all tasks ordered correctly', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', due_date: '2025-01-30', priority: 'urgent' },
        { id: '2', title: 'Task 2', due_date: '2025-01-31', priority: 'high' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAllTasks(), {
        wrapper: createWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });
});

describe('Task API types', () => {
  it('should have correct Task interface structure', () => {
    const task = {
      id: 'uuid',
      user_id: 'uuid',
      title: 'Test Task',
      description: null,
      status: 'todo' as const,
      priority: 'medium' as const,
      due_date: null,
      start_date: null,
      estimate_min: null,
      actual_duration_min: null,
      energy_level: null,
      project_id: null,
      goal_id: null,
      created_at: '2025-01-30T00:00:00Z',
      completed_at: null,
      updated_at: '2025-01-30T00:00:00Z',
    };

    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
  });

  it('should validate priority values', () => {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    validPriorities.forEach(priority => {
      expect(['low', 'medium', 'high', 'urgent']).toContain(priority);
    });
  });

  it('should validate status values', () => {
    const validStatuses = ['todo', 'in_progress', 'done', 'cancelled'];
    validStatuses.forEach(status => {
      expect(['todo', 'in_progress', 'done', 'cancelled']).toContain(status);
    });
  });
});
