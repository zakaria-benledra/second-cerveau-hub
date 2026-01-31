-- Create task_checklist_items table for subtasks/checklist
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own checklist items"
ON public.task_checklist_items
FOR ALL
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);
CREATE INDEX idx_task_checklist_items_user_id ON public.task_checklist_items(user_id);

-- Add archived_at column to tasks for archive functionality
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;