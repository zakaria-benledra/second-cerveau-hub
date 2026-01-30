import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { KanbanColumns, KanbanTask } from '@/hooks/useKanban';

describe('Kanban Optimistic Update Logic', () => {
  let queryClient: QueryClient;

  const mockTask: KanbanTask = {
    id: 'task-1',
    title: 'Test Task',
    priority: 'high',
    kanban_status: 'todo',
    sort_order: 1,
    created_at: new Date().toISOString(),
  };

  const initialColumns: KanbanColumns = {
    backlog: [],
    todo: [mockTask],
    doing: [],
    done: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['kanban-tasks'], initialColumns);
  });

  it('should move task optimistically from todo to doing', async () => {
    const taskId = 'task-1';
    const newStatus = 'doing';

    // Simulate onMutate logic
    await queryClient.cancelQueries({ queryKey: ['kanban-tasks'] });
    const previousData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);

    if (previousData) {
      const allTasks = [
        ...previousData.backlog,
        ...previousData.todo,
        ...previousData.doing,
        ...previousData.done,
      ];
      const task = allTasks.find((t) => t.id === taskId);

      if (task) {
        const newData: KanbanColumns = {
          backlog: previousData.backlog.filter((t) => t.id !== taskId),
          todo: previousData.todo.filter((t) => t.id !== taskId),
          doing: previousData.doing.filter((t) => t.id !== taskId),
          done: previousData.done.filter((t) => t.id !== taskId),
        };
        newData[newStatus] = [...newData[newStatus], { ...task, kanban_status: newStatus }];
        queryClient.setQueryData(['kanban-tasks'], newData);
      }
    }

    // Verify optimistic update
    const updatedData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);
    expect(updatedData?.todo).toHaveLength(0);
    expect(updatedData?.doing).toHaveLength(1);
    expect(updatedData?.doing[0].id).toBe(taskId);
    expect(updatedData?.doing[0].kanban_status).toBe('doing');
  });

  it('should rollback on error', async () => {
    const taskId = 'task-1';
    const newStatus = 'doing';

    // Store previous data (like context in onMutate)
    const previousData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);

    // Simulate optimistic update
    if (previousData) {
      const allTasks = [
        ...previousData.backlog,
        ...previousData.todo,
        ...previousData.doing,
        ...previousData.done,
      ];
      const task = allTasks.find((t) => t.id === taskId);

      if (task) {
        const newData: KanbanColumns = {
          backlog: previousData.backlog.filter((t) => t.id !== taskId),
          todo: previousData.todo.filter((t) => t.id !== taskId),
          doing: previousData.doing.filter((t) => t.id !== taskId),
          done: previousData.done.filter((t) => t.id !== taskId),
        };
        newData[newStatus] = [...newData[newStatus], { ...task, kanban_status: newStatus }];
        queryClient.setQueryData(['kanban-tasks'], newData);
      }
    }

    // Verify update applied
    let updatedData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);
    expect(updatedData?.doing).toHaveLength(1);

    // Simulate onError rollback
    queryClient.setQueryData(['kanban-tasks'], previousData);

    // Verify rollback
    updatedData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);
    expect(updatedData?.todo).toHaveLength(1);
    expect(updatedData?.doing).toHaveLength(0);
    expect(updatedData?.todo[0].id).toBe(taskId);
  });

  it('should preserve task data during move', async () => {
    const taskId = 'task-1';
    const newStatus = 'done';

    const previousData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);

    if (previousData) {
      const allTasks = [
        ...previousData.backlog,
        ...previousData.todo,
        ...previousData.doing,
        ...previousData.done,
      ];
      const task = allTasks.find((t) => t.id === taskId);

      if (task) {
        const newData: KanbanColumns = {
          backlog: previousData.backlog.filter((t) => t.id !== taskId),
          todo: previousData.todo.filter((t) => t.id !== taskId),
          doing: previousData.doing.filter((t) => t.id !== taskId),
          done: previousData.done.filter((t) => t.id !== taskId),
        };
        newData[newStatus] = [...newData[newStatus], { ...task, kanban_status: newStatus }];
        queryClient.setQueryData(['kanban-tasks'], newData);
      }
    }

    const updatedData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);
    const movedTask = updatedData?.done[0];

    expect(movedTask?.title).toBe('Test Task');
    expect(movedTask?.priority).toBe('high');
    expect(movedTask?.sort_order).toBe(1);
  });
});
