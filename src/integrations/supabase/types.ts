export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_actions: {
        Row: {
          confidence_score: number | null
          created_at: string
          executed_at: string | null
          explanation: string | null
          id: string
          proposed_payload: Json
          source: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          executed_at?: string | null
          explanation?: string | null
          id?: string
          proposed_payload: Json
          source?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          executed_at?: string | null
          explanation?: string | null
          id?: string
          proposed_payload?: Json
          source?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_metrics: {
        Row: {
          approval_rate: number | null
          created_at: string
          date: string
          id: string
          latency_ms: number | null
          rejection_rate: number | null
          total_requests: number | null
        }
        Insert: {
          approval_rate?: number | null
          created_at?: string
          date: string
          id?: string
          latency_ms?: number | null
          rejection_rate?: number | null
          total_requests?: number | null
        }
        Update: {
          approval_rate?: number | null
          created_at?: string
          date?: string
          id?: string
          latency_ms?: number | null
          rejection_rate?: number | null
          total_requests?: number | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          model: string | null
          name: string
          template: string
          updated_at: string | null
          variables: Json | null
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name: string
          template: string
          updated_at?: string | null
          variables?: Json | null
          version?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name?: string
          template?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number
        }
        Relationships: []
      }
      ai_proposals: {
        Row: {
          confidence_score: number | null
          context: Json | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          priority: string | null
          proposed_actions: Json
          reasoning: string | null
          reviewed_at: string | null
          source: string | null
          status: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          proposed_actions?: Json
          reasoning?: string | null
          reviewed_at?: string | null
          source?: string | null
          status?: string | null
          title: string
          type: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          proposed_actions?: Json
          reasoning?: string | null
          reviewed_at?: string | null
          source?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      automation_events: {
        Row: {
          created_at: string
          entity: string | null
          entity_id: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          result: Json | null
          rule_id: string | null
          status: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          result?: Json | null
          rule_id?: string | null
          status?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          result?: Json | null
          rule_id?: string | null
          status?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_payload: Json
          action_type: string
          channel: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          source: string | null
          trigger_conditions: Json
          trigger_count: number | null
          trigger_event: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_payload?: Json
          action_type: string
          channel?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          source?: string | null
          trigger_conditions?: Json
          trigger_count?: number | null
          trigger_event: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_payload?: Json
          action_type?: string
          channel?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          source?: string | null
          trigger_conditions?: Json
          trigger_count?: number | null
          trigger_event?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_templates: {
        Row: {
          action_payload: Json
          action_type: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          priority: number | null
          trigger_conditions: Json
          trigger_event: string
        }
        Insert: {
          action_payload?: Json
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_event: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          priority?: number | null
          trigger_conditions?: Json
          trigger_event?: string
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          access_token: string | null
          account_ids: string[] | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          refresh_token: string | null
          requisition_id: string | null
          status: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_token?: string | null
          account_ids?: string[] | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          requisition_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          access_token?: string | null
          account_ids?: string[] | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          requisition_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string | null
          subscription_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string | null
          subscription_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string | null
          subscription_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          calendar_id: string | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          external_id: string | null
          id: string
          location: string | null
          provider: string | null
          source: string | null
          start_time: string
          sync_token: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          updated_at_provider: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          external_id?: string | null
          id?: string
          location?: string | null
          provider?: string | null
          source?: string | null
          start_time: string
          sync_token?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          updated_at_provider?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          external_id?: string | null
          id?: string
          location?: string | null
          provider?: string | null
          source?: string | null
          start_time?: string
          sync_token?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          updated_at_provider?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          clarity_score: number | null
          created_at: string
          date: string
          focus_minutes: number
          habits_completed: number
          habits_total: number
          id: string
          overload_index: number | null
          tasks_completed: number
          tasks_planned: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          clarity_score?: number | null
          created_at?: string
          date: string
          focus_minutes?: number
          habits_completed?: number
          habits_total?: number
          id?: string
          overload_index?: number | null
          tasks_completed?: number
          tasks_planned?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          clarity_score?: number | null
          created_at?: string
          date?: string
          focus_minutes?: number
          habits_completed?: number
          habits_total?: number
          id?: string
          overload_index?: number | null
          tasks_completed?: number
          tasks_planned?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          account_label: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          deleted_at: string | null
          document_type: string | null
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          parse_errors: Json | null
          parsed_at: string | null
          parsed_status: string | null
          provider: string | null
          source: string | null
          storage_path: string
          transactions_count: number | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          account_label?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          deleted_at?: string | null
          document_type?: string | null
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          parse_errors?: Json | null
          parsed_at?: string | null
          parsed_status?: string | null
          provider?: string | null
          source?: string | null
          storage_path: string
          transactions_count?: number | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          account_label?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          deleted_at?: string | null
          document_type?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          parse_errors?: Json | null
          parsed_at?: string | null
          parsed_status?: string | null
          provider?: string | null
          source?: string | null
          storage_path?: string
          transactions_count?: number | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          bank_connection_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          document_id: string | null
          external_id: string | null
          id: string
          source: string | null
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          bank_connection_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          document_id?: string | null
          external_id?: string | null
          id?: string
          source?: string | null
          type?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          bank_connection_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          document_id?: string | null
          external_id?: string | null
          id?: string
          source?: string | null
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck: string | null
          difficulty: number | null
          front: string
          id: string
          next_review: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          back: string
          created_at?: string
          deck?: string | null
          difficulty?: number | null
          front: string
          id?: string
          next_review?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          back?: string
          created_at?: string
          deck?: string | null
          difficulty?: number | null
          front?: string
          id?: string
          next_review?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          created_at: string
          duration_min: number | null
          end_time: string | null
          id: string
          source: string | null
          start_time: string
          task_id: string | null
          type: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          end_time?: string | null
          id?: string
          source?: string | null
          start_time: string
          task_id?: string | null
          type?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          end_time?: string | null
          id?: string
          source?: string | null
          start_time?: string
          task_id?: string | null
          type?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          source: string | null
          start_date: string | null
          status: string
          target: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          source?: string | null
          start_date?: string | null
          status?: string
          target?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          source?: string | null
          start_date?: string | null
          status?: string
          target?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          source: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          habit_id: string
          id?: string
          source?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          source?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          source: string | null
          target_frequency: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          source?: string | null
          target_frequency?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          source?: string | null
          target_frequency?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          content: string
          created_at: string
          id: string
          note: string | null
          page: number | null
          reading_item_id: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note?: string | null
          page?: number | null
          reading_item_id?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note?: string | null
          page?: number | null
          reading_item_id?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_reading_item_id_fkey"
            columns: ["reading_item_id"]
            isOneToOne: false
            referencedRelation: "reading_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          content: string | null
          converted_task_id: string | null
          created_at: string
          id: string
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content?: string | null
          converted_task_id?: string | null
          created_at?: string
          id?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string | null
          converted_task_id?: string | null
          created_at?: string
          id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_name: string
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          challenges: string[] | null
          created_at: string
          date: string
          energy_level: string | null
          gratitude: string[] | null
          id: string
          mood: string | null
          reflections: string | null
          source: string | null
          updated_at: string
          user_id: string
          wins: string[] | null
          workspace_id: string | null
        }
        Insert: {
          challenges?: string[] | null
          created_at?: string
          date?: string
          energy_level?: string | null
          gratitude?: string[] | null
          id?: string
          mood?: string | null
          reflections?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
          wins?: string[] | null
          workspace_id?: string | null
        }
        Update: {
          challenges?: string[] | null
          created_at?: string
          date?: string
          energy_level?: string | null
          gratitude?: string[] | null
          id?: string
          mood?: string | null
          reflections?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
          wins?: string[] | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_registry: {
        Row: {
          created_at: string
          description: string | null
          formula: string
          id: string
          key: string
          source_tables: string[]
          status: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          formula: string
          id?: string
          key: string
          source_tables: string[]
          status?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          formula?: string
          id?: string
          key?: string
          source_tables?: string[]
          status?: string
          version?: number
        }
        Relationships: []
      }
      monthly_stats: {
        Row: {
          created_at: string
          id: string
          month: string
          summary: Json
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          summary?: Json
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          summary?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_stats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          payload: Json | null
          read: boolean
          source: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          read?: boolean
          source?: string | null
          title: string
          type: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          read?: boolean
          source?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          ai_requests_limit: number
          automations_limit: number
          features: Json
          history_days: number
          plan: string
          storage_limit_mb: number
          team_members_limit: number
        }
        Insert: {
          ai_requests_limit: number
          automations_limit: number
          features?: Json
          history_days: number
          plan: string
          storage_limit_mb: number
          team_members_limit: number
        }
        Update: {
          ai_requests_limit?: number
          automations_limit?: number
          features?: Json
          history_days?: number
          plan?: string
          storage_limit_mb?: number
          team_members_limit?: number
        }
        Relationships: []
      }
      preferences: {
        Row: {
          agent_mode: string | null
          created_at: string
          daily_capacity_min: number | null
          energy_profile: Json | null
          id: string
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_mode?: string | null
          created_at?: string
          daily_capacity_min?: number | null
          energy_profile?: Json | null
          id?: string
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_mode?: string | null
          created_at?: string
          daily_capacity_min?: number | null
          energy_profile?: Json | null
          id?: string
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          domain_id: string | null
          id: string
          name: string
          source: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          name: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string | null
          id?: string
          name?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_test_status: {
        Row: {
          created_at: string | null
          expected_action: string
          expected_result: string
          feature_name: string
          id: string
          last_tested_at: string | null
          module: string
          notes: string | null
          status: string | null
          tested_by: string | null
          ui_entry: string
          updated_at: string | null
          verify_screen: string
        }
        Insert: {
          created_at?: string | null
          expected_action: string
          expected_result: string
          feature_name: string
          id?: string
          last_tested_at?: string | null
          module: string
          notes?: string | null
          status?: string | null
          tested_by?: string | null
          ui_entry: string
          updated_at?: string | null
          verify_screen: string
        }
        Update: {
          created_at?: string | null
          expected_action?: string
          expected_result?: string
          feature_name?: string
          id?: string
          last_tested_at?: string | null
          module?: string
          notes?: string | null
          status?: string | null
          tested_by?: string | null
          ui_entry?: string
          updated_at?: string | null
          verify_screen?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          created_at: string
          deck: string | null
          id: string
          score: number
          total: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          deck?: string | null
          id?: string
          score: number
          total: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          deck?: string | null
          id?: string
          score?: number
          total?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_items: {
        Row: {
          author: string | null
          created_at: string
          id: string
          notes: string | null
          progress: number | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          project_id: string
          title: string
          type: string
          url: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          title: string
          type: string
          url?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          title?: string
          type?: string
          url?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_logs: {
        Row: {
          completed: boolean
          completed_items: Json | null
          created_at: string
          date: string
          id: string
          routine_id: string
          source: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed?: boolean
          completed_items?: Json | null
          created_at?: string
          date: string
          id?: string
          routine_id: string
          source?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed?: boolean
          completed_items?: Json | null
          created_at?: string
          date?: string
          id?: string
          routine_id?: string
          source?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          checklist: Json
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          source: string | null
          type: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          source?: string | null
          type: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          source?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_daily: {
        Row: {
          burnout_index: number | null
          computed_at: string
          consistency_factor: number | null
          created_at: string
          date: string
          finance_score: number | null
          global_score: number | null
          habits_score: number | null
          health_score: number | null
          id: string
          metadata: Json | null
          momentum_index: number | null
          tasks_score: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          burnout_index?: number | null
          computed_at?: string
          consistency_factor?: number | null
          created_at?: string
          date: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          metadata?: Json | null
          momentum_index?: number | null
          tasks_score?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          burnout_index?: number | null
          computed_at?: string
          consistency_factor?: number | null
          created_at?: string
          date?: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          metadata?: Json | null
          momentum_index?: number | null
          tasks_score?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_daily_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_monthly: {
        Row: {
          achievements: Json | null
          computed_at: string
          created_at: string
          finance_score: number | null
          global_score: number | null
          habits_score: number | null
          health_score: number | null
          id: string
          insights: Json | null
          kpi_version: number | null
          metadata: Json | null
          month: string
          tasks_score: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          achievements?: Json | null
          computed_at?: string
          created_at?: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          insights?: Json | null
          kpi_version?: number | null
          metadata?: Json | null
          month: string
          tasks_score?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          achievements?: Json | null
          computed_at?: string
          created_at?: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          insights?: Json | null
          kpi_version?: number | null
          metadata?: Json | null
          month?: string
          tasks_score?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_monthly_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_weekly: {
        Row: {
          computed_at: string
          created_at: string
          finance_score: number | null
          global_score: number | null
          habits_score: number | null
          health_score: number | null
          id: string
          kpi_version: number | null
          metadata: Json | null
          tasks_score: number | null
          trend_direction: string | null
          user_id: string
          week_over_week_change: number | null
          week_start: string
          workspace_id: string | null
        }
        Insert: {
          computed_at?: string
          created_at?: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          kpi_version?: number | null
          metadata?: Json | null
          tasks_score?: number | null
          trend_direction?: string | null
          user_id: string
          week_over_week_change?: number | null
          week_start: string
          workspace_id?: string | null
        }
        Update: {
          computed_at?: string
          created_at?: string
          finance_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          kpi_version?: number | null
          metadata?: Json | null
          tasks_score?: number | null
          trend_direction?: string | null
          user_id?: string
          week_over_week_change?: number | null
          week_start?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_weekly_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          habit_id: string
          id: string
          last_completed_date: string | null
          max_streak: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          habit_id: string
          id?: string
          last_completed_date?: string | null
          max_streak?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          habit_id?: string
          id?: string
          last_completed_date?: string | null
          max_streak?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streaks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: true
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streaks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string
          entity: string
          entity_id: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          source: Database["public"]["Enums"]["event_source"]
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          entity: string
          entity_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source?: Database["public"]["Enums"]["event_source"]
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          entity?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source?: Database["public"]["Enums"]["event_source"]
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          created_at: string
          id: string
          last_check: string
          message: string | null
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_check?: string
          message?: string | null
          service: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          last_check?: string
          message?: string | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      task_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          task_id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          task_id: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          task_id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_duration_min: number | null
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          energy_level: string | null
          estimate_min: number | null
          goal_id: string | null
          id: string
          kanban_column: string | null
          kanban_status: Database["public"]["Enums"]["kanban_status"] | null
          priority: string
          project_id: string | null
          sort_order: number | null
          source: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_duration_min?: number | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          energy_level?: string | null
          estimate_min?: number | null
          goal_id?: string | null
          id?: string
          kanban_column?: string | null
          kanban_status?: Database["public"]["Enums"]["kanban_status"] | null
          priority?: string
          project_id?: string | null
          sort_order?: number | null
          source?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          actual_duration_min?: number | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          energy_level?: string | null
          estimate_min?: number | null
          goal_id?: string | null
          id?: string
          kanban_column?: string | null
          kanban_status?: Database["public"]["Enums"]["kanban_status"] | null
          priority?: string
          project_id?: string | null
          sort_order?: number | null
          source?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          task_id: string | null
          title: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          task_id?: string | null
          title?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          task_id?: string | null
          title?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      undo_stack: {
        Row: {
          action_id: string
          created_at: string
          current_state: Json | null
          entity: string | null
          entity_id: string | null
          expires_at: string | null
          id: string
          is_undone: boolean | null
          operation: string | null
          previous_state: Json | null
          revert_payload: Json
          undone_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_id: string
          created_at?: string
          current_state?: Json | null
          entity?: string | null
          entity_id?: string | null
          expires_at?: string | null
          id?: string
          is_undone?: boolean | null
          operation?: string | null
          previous_state?: Json | null
          revert_payload: Json
          undone_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_id?: string
          created_at?: string
          current_state?: Json | null
          entity?: string | null
          entity_id?: string | null
          expires_at?: string | null
          id?: string
          is_undone?: boolean | null
          operation?: string | null
          previous_state?: Json | null
          revert_payload?: Json
          undone_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "undo_stack_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "agent_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undo_stack_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_ledger: {
        Row: {
          cost_estimate: number | null
          created_at: string
          day: string
          id: string
          metadata: Json | null
          operation: string | null
          service: string | null
          tokens_in: number
          tokens_out: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          day: string
          id?: string
          metadata?: Json | null
          operation?: string | null
          service?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          day?: string
          id?: string
          metadata?: Json | null
          operation?: string | null
          service?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          ai_requests_limit: number | null
          ai_requests_used: number | null
          automations_limit: number | null
          automations_used: number | null
          created_at: string | null
          id: string
          reset_at: string | null
          storage_limit_mb: number | null
          storage_used_mb: number | null
          team_members_limit: number | null
          team_members_used: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          ai_requests_limit?: number | null
          ai_requests_used?: number | null
          automations_limit?: number | null
          automations_used?: number | null
          created_at?: string | null
          id?: string
          reset_at?: string | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          team_members_limit?: number | null
          team_members_used?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          ai_requests_limit?: number | null
          ai_requests_used?: number | null
          automations_limit?: number | null
          automations_used?: number | null
          created_at?: string | null
          id?: string
          reset_at?: string | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          team_members_limit?: number | null
          team_members_used?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_stats: {
        Row: {
          created_at: string
          id: string
          summary: Json
          updated_at: string
          user_id: string
          week_start: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: Json
          updated_at?: string
          user_id: string
          week_start: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          summary?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_stats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_feature_access: {
        Args: { _feature: string; _user_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { _limit_type: string; _workspace_id: string }
        Returns: boolean
      }
      delete_user_data: { Args: { target_user_id: string }; Returns: boolean }
      export_user_data: { Args: { target_user_id: string }; Returns: Json }
      get_user_workspace: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _amount?: number; _limit_type: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member"
      event_source:
        | "ui"
        | "api"
        | "automation"
        | "ai"
        | "integration"
        | "system"
      kanban_status: "backlog" | "todo" | "doing" | "done"
      plan_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "member"],
      event_source: ["ui", "api", "automation", "ai", "integration", "system"],
      kanban_status: ["backlog", "todo", "doing", "done"],
      plan_tier: ["free", "pro", "enterprise"],
    },
  },
} as const
