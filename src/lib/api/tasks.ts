import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  start_date: string | null;
  estimate_min: number | null;
  actual_duration_min: number | null;
  energy_level: 'low' | 'medium' | 'high' | null;
  project_id: string | null;
  goal_id: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Task['priority'];
  due_date?: string;
  start_date?: string;
  estimate_min?: number;
  energy_level?: Task['energy_level'];
  project_id?: string;
  goal_id?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  due_date?: string | null;
  start_date?: string | null;
  estimate_min?: number | null;
  energy_level?: Task['energy_level'];
  project_id?: string | null;
  goal_id?: string | null;
}

// Fetch tasks for today
export async function fetchTodayTasks(): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .or(`due_date.eq.${today},start_date.eq.${today}`)
    .neq('status', 'cancelled')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

// Fetch all tasks
export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

// Create a new task
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
      due_date: input.due_date,
      start_date: input.start_date,
      estimate_min: input.estimate_min,
      energy_level: input.energy_level,
      project_id: input.project_id,
      goal_id: input.goal_id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log task event (types will sync after migration)
  await (supabase.from('task_events') as any).insert({
    task_id: data.id,
    user_id: user.id,
    event_type: 'created',
    payload: { title: input.title },
  });

  return data as Task;
}

// Update a task
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log task event
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await (supabase.from('task_events') as any).insert({
      task_id: id,
      user_id: user.id,
      event_type: 'updated',
      payload: input,
    });
  }

  return data as Task;
}

// Complete a task
export async function completeTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log task event
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await (supabase.from('task_events') as any).insert({
      task_id: id,
      user_id: user.id,
      event_type: 'completed',
    });
  }

  return data as Task;
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Log before delete
  if (user) {
    await (supabase.from('task_events') as any).insert({
      task_id: id,
      user_id: user.id,
      event_type: 'deleted',
    });
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get Next Best Action task
export async function getNextBestAction(): Promise<Task | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'todo')
    .or(`due_date.lte.${today},due_date.is.null`)
    .order('priority', { ascending: false })
    .order('estimate_min', { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Task | null;
}
