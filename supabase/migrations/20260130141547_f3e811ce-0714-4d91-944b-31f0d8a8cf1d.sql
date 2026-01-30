-- MILESTONE 1: Full schema for Google Calendar, Kanban, Bank Statements

-- 1) connected_accounts - OAuth connections (Google, etc.)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  provider_account_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- 2) Update calendar_events with external sync fields
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS calendar_id TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris',
ADD COLUMN IF NOT EXISTS updated_at_provider TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_token TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_external 
ON public.calendar_events(user_id, provider, external_id) 
WHERE external_id IS NOT NULL;

-- 3) Update tasks with Kanban fields
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kanban_status') THEN
    CREATE TYPE kanban_status AS ENUM ('backlog', 'todo', 'doing', 'done');
  END IF;
END $$;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS kanban_status kanban_status DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS sort_order NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS kanban_column TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON public.tasks(user_id, kanban_status, sort_order);

-- 4) documents table for bank statements and file uploads
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  document_type TEXT DEFAULT 'bank_statement' CHECK (document_type IN ('bank_statement', 'receipt', 'invoice', 'other')),
  date_from DATE,
  date_to DATE,
  account_label TEXT,
  provider TEXT,
  parsed_status TEXT DEFAULT 'pending' CHECK (parsed_status IN ('pending', 'processing', 'completed', 'failed')),
  parsed_at TIMESTAMP WITH TIME ZONE,
  parse_errors JSONB,
  transactions_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'upload',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id, document_type, created_at DESC);

-- 5) bank_connections for Open Banking
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  provider TEXT NOT NULL CHECK (provider IN ('nordigen', 'tink', 'plaid', 'truelayer')),
  institution_id TEXT,
  institution_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  requisition_id TEXT,
  account_ids TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON public.bank_connections(user_id, status);

-- 6) Link finance_transactions to documents
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id),
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES public.bank_connections(id);

-- Enable RLS on all new tables
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view own connected accounts"
ON public.connected_accounts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own connected accounts"
ON public.connected_accounts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own connected accounts"
ON public.connected_accounts FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own connected accounts"
ON public.connected_accounts FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for bank_connections
CREATE POLICY "Users can view own bank connections"
ON public.bank_connections FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bank connections"
ON public.bank_connections FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bank connections"
ON public.bank_connections FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bank connections"
ON public.bank_connections FOR DELETE
USING (user_id = auth.uid());

-- Updated_at triggers
CREATE TRIGGER update_connected_accounts_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_connections_updated_at
BEFORE UPDATE ON public.bank_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_connected_accounts
AFTER INSERT OR UPDATE OR DELETE ON public.connected_accounts
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_documents
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_bank_connections
AFTER INSERT OR UPDATE OR DELETE ON public.bank_connections
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);