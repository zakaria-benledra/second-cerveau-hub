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
      ai_interventions: {
        Row: {
          ai_message: string
          applied_at: string | null
          auto_applied: boolean | null
          context: Json | null
          created_at: string
          id: string
          impact_after: Json | null
          impact_before: Json | null
          intervention_type: string
          reason: string | null
          responded_at: string | null
          reverted_at: string | null
          severity: string | null
          user_action: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          ai_message: string
          applied_at?: string | null
          auto_applied?: boolean | null
          context?: Json | null
          created_at?: string
          id?: string
          impact_after?: Json | null
          impact_before?: Json | null
          intervention_type: string
          reason?: string | null
          responded_at?: string | null
          reverted_at?: string | null
          severity?: string | null
          user_action?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          ai_message?: string
          applied_at?: string | null
          auto_applied?: boolean | null
          context?: Json | null
          created_at?: string
          id?: string
          impact_after?: Json | null
          impact_before?: Json | null
          intervention_type?: string
          reason?: string | null
          responded_at?: string | null
          reverted_at?: string | null
          severity?: string | null
          user_action?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interventions_workspace_id_fkey"
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
      ai_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          delivered: boolean | null
          id: string
          message: string
          notification_type: string | null
          read_at: string | null
          title: string | null
          urgency: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          delivered?: boolean | null
          id?: string
          message: string
          notification_type?: string | null
          read_at?: string | null
          title?: string | null
          urgency?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          delivered?: boolean | null
          id?: string
          message?: string
          notification_type?: string | null
          read_at?: string | null
          title?: string | null
          urgency?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      ai_suggestions_cache: {
        Row: {
          cache_key: string
          context_hash: string
          created_at: string | null
          expires_at: string | null
          id: string
          suggestions: Json
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          cache_key: string
          context_hash: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          suggestions: Json
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          cache_key?: string
          context_hash?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          suggestions?: Json
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_cache_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_category: string
          event_data: Json | null
          event_name: string
          id: string
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_category: string
          event_data?: Json | null
          event_name: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_category?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          events_count: number | null
          id: string
          os: string | null
          page_views: number | null
          started_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          events_count?: number | null
          id: string
          os?: string | null
          page_views?: number | null
          started_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          os?: string | null
          page_views?: number | null
          started_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_workspace_id_fkey"
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
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          rarity: string | null
          requirement_type: string
          requirement_value: number
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id: string
          name: string
          rarity?: string | null
          requirement_type: string
          requirement_value: number
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string | null
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number | null
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
      behavior_signals: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          score: number
          signal_type: string
          source: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          score?: number
          signal_type: string
          source?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          score?: number
          signal_type?: string
          source?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_dna: {
        Row: {
          created_at: string
          dna_data: Json
          generated_at: string
          id: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          dna_data: Json
          generated_at?: string
          id?: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          dna_data?: Json
          generated_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_dna_workspace_id_fkey"
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
      calendar_events_sync: {
        Row: {
          created_at: string | null
          external_event_id: string
          id: string
          last_synced_at: string | null
          minded_habit_id: string | null
          minded_task_id: string | null
          provider: string
          sync_direction: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          external_event_id: string
          id?: string
          last_synced_at?: string | null
          minded_habit_id?: string | null
          minded_task_id?: string | null
          provider: string
          sync_direction?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          external_event_id?: string
          id?: string
          last_synced_at?: string | null
          minded_habit_id?: string | null
          minded_task_id?: string | null
          provider?: string
          sync_direction?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_sync_minded_habit_id_fkey"
            columns: ["minded_habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_sync_minded_task_id_fkey"
            columns: ["minded_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_sync_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_logs: {
        Row: {
          challenge_id: string
          completed: boolean | null
          created_at: string
          date: string
          id: string
          note: string | null
          source: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          created_at?: string
          date: string
          id?: string
          note?: string | null
          source?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          source?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_logs_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          completed_at: string | null
          created_at: string
          days_completed: number | null
          deleted_at: string | null
          description: string | null
          duration: number
          id: string
          name: string
          reward: string | null
          source: string | null
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          days_completed?: number | null
          deleted_at?: string | null
          description?: string | null
          duration: number
          id?: string
          name: string
          reward?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          days_completed?: number | null
          deleted_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          name?: string
          reward?: string | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_risk_scores: {
        Row: {
          last_activity_at: string | null
          risk_level: string
          risk_score: number
          signals: Json | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          last_activity_at?: string | null
          risk_level?: string
          risk_score?: number
          signals?: Json | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          last_activity_at?: string | null
          risk_level?: string
          risk_score?: number
          signals?: Json | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_risk_scores_workspace_id_fkey"
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
          encryption_version: number | null
          expires_at: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          refresh_token_encrypted: string | null
          scopes: string[] | null
          sync_enabled: boolean | null
          token_migrated_at: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          encryption_version?: number | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          sync_enabled?: boolean | null
          token_migrated_at?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          encryption_version?: number | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          sync_enabled?: boolean | null
          token_migrated_at?: string | null
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
      finance_documents: {
        Row: {
          created_at: string
          error_message: string | null
          file_type: string
          filename: string
          id: string
          parsed_at: string | null
          status: string
          storage_path: string | null
          summary: Json | null
          transactions_imported: number | null
          updated_at: string
          uploaded_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_type: string
          filename: string
          id?: string
          parsed_at?: string | null
          status?: string
          storage_path?: string | null
          summary?: Json | null
          transactions_imported?: number | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_type?: string
          filename?: string
          id?: string
          parsed_at?: string | null
          status?: string
          storage_path?: string | null
          summary?: Json | null
          transactions_imported?: number | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_parsed_transactions: {
        Row: {
          amount: number
          anomaly_score: number | null
          category_id: string | null
          created_at: string
          date: string
          document_id: string | null
          id: string
          imported: boolean | null
          label: string | null
          type: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          anomaly_score?: number | null
          category_id?: string | null
          created_at?: string
          date: string
          document_id?: string | null
          id?: string
          imported?: boolean | null
          label?: string | null
          type?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          anomaly_score?: number | null
          category_id?: string | null
          created_at?: string
          date?: string
          document_id?: string | null
          id?: string
          imported?: boolean | null
          label?: string | null
          type?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_parsed_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_parsed_transactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_parsed_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_rules: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[]
          priority: number | null
          regex_pattern: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          priority?: number | null
          regex_pattern?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          priority?: number | null
          regex_pattern?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
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
          goal_id: string | null
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
          goal_id?: string | null
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
          goal_id?: string | null
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
            foreignKeyName: "finance_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
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
      finance_visual_snapshots: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          expenses: number | null
          id: string
          income: number | null
          metadata: Json | null
          snapshot_type: string
          trend_index: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          date: string
          expenses?: number | null
          id?: string
          income?: number | null
          metadata?: Json | null
          snapshot_type: string
          trend_index?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          expenses?: number | null
          id?: string
          income?: number | null
          metadata?: Json | null
          snapshot_type?: string
          trend_index?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_visual_snapshots_workspace_id_fkey"
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
      funnel_daily: {
        Row: {
          activated_users: number | null
          activation_rate: number | null
          ai_engaged_users: number | null
          churned_users: number | null
          created_at: string
          date: string
          finance_connected_users: number | null
          retained_users: number | null
          retention_rate: number | null
          signups: number | null
          updated_at: string
          visits: number | null
          workspace_id: string
        }
        Insert: {
          activated_users?: number | null
          activation_rate?: number | null
          ai_engaged_users?: number | null
          churned_users?: number | null
          created_at?: string
          date: string
          finance_connected_users?: number | null
          retained_users?: number | null
          retention_rate?: number | null
          signups?: number | null
          updated_at?: string
          visits?: number | null
          workspace_id: string
        }
        Update: {
          activated_users?: number | null
          activation_rate?: number | null
          ai_engaged_users?: number | null
          churned_users?: number | null
          created_at?: string
          date?: string
          finance_connected_users?: number | null
          retained_users?: number | null
          retention_rate?: number | null
          signups?: number | null
          updated_at?: string
          visits?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_daily_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_profiles: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          lifetime_habits_completed: number | null
          lifetime_tasks_completed: number | null
          longest_streak: number | null
          total_xp: number | null
          updated_at: string | null
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id: string
          last_activity_date?: string | null
          lifetime_habits_completed?: number | null
          lifetime_tasks_completed?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          lifetime_habits_completed?: number | null
          lifetime_tasks_completed?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          xp_to_next_level?: number | null
        }
        Relationships: []
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
      gratitude_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          items: string[]
          source: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          items: string[]
          source?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          items?: string[]
          source?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_behavior_links: {
        Row: {
          behavior_type: string
          created_at: string
          habit_id: string | null
          id: string
          metadata: Json | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          behavior_type: string
          created_at?: string
          habit_id?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          behavior_type?: string
          created_at?: string
          habit_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_behavior_links_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_behavior_links_workspace_id_fkey"
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
      habit_streak_freezes: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          reason: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          habit_id: string
          id?: string
          reason?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          reason?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_streak_freezes_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_streak_freezes_workspace_id_fkey"
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
          last_freeze_reset_date: string | null
          name: string
          source: string | null
          streak_freezes_available: number | null
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
          last_freeze_reset_date?: string | null
          name: string
          source?: string | null
          streak_freezes_available?: number | null
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
          last_freeze_reset_date?: string | null
          name?: string
          source?: string | null
          streak_freezes_available?: number | null
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
      habits_kpi: {
        Row: {
          completed: boolean | null
          consistency_30d: number | null
          consistency_7d: number | null
          created_at: string
          date: string
          habit_id: string | null
          id: string
          streak_at_date: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed?: boolean | null
          consistency_30d?: number | null
          consistency_7d?: number | null
          created_at?: string
          date: string
          habit_id?: string | null
          id?: string
          streak_at_date?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          completed?: boolean | null
          consistency_30d?: number | null
          consistency_7d?: number | null
          created_at?: string
          date?: string
          habit_id?: string | null
          id?: string
          streak_at_date?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_kpi_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
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
      interests: {
        Row: {
          category: string
          created_at: string | null
          icon: string | null
          id: string
          keywords: string[] | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          icon?: string | null
          id?: string
          keywords?: string[] | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
        }
        Relationships: []
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
      journal_ai_assists: {
        Row: {
          accepted: boolean | null
          created_at: string
          entry_id: string | null
          id: string
          suggestion: string
          suggestion_type: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          entry_id?: string | null
          id?: string
          suggestion: string
          suggestion_type?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          entry_id?: string | null
          id?: string
          suggestion?: string
          suggestion_type?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_ai_assists_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_ai_assists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      kanban_metrics_daily: {
        Row: {
          avg_time_in_column: Json | null
          created_at: string
          date: string
          id: string
          productivity_score: number | null
          tasks_completed: number | null
          tasks_created: number | null
          tasks_moved: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          avg_time_in_column?: Json | null
          created_at?: string
          date: string
          id?: string
          productivity_score?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_moved?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          avg_time_in_column?: Json | null
          created_at?: string
          date?: string
          id?: string
          productivity_score?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_moved?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_metrics_daily_workspace_id_fkey"
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
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
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
          ai_preferences: Json | null
          birth_year: number | null
          created_at: string
          email: string
          gender: string | null
          id: string
          location_city: string | null
          location_country: string | null
          name: string | null
          personalization_level: string | null
          processing_limit_date: string | null
          processing_limit_scope: string | null
          processing_limited: boolean | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_preferences?: Json | null
          birth_year?: number | null
          created_at?: string
          email: string
          gender?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          name?: string | null
          personalization_level?: string | null
          processing_limit_date?: string | null
          processing_limit_scope?: string | null
          processing_limited?: boolean | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_preferences?: Json | null
          birth_year?: number | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          name?: string | null
          personalization_level?: string | null
          processing_limit_date?: string | null
          processing_limit_scope?: string | null
          processing_limited?: boolean | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_workspace_id_fkey"
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
      sage_experiences: {
        Row: {
          action_type: string
          consent_snapshot: Json | null
          context_vector: number[]
          created_at: string
          feedback_type: string | null
          id: string
          learning_enabled: boolean | null
          metrics_after: Json | null
          metrics_before: Json | null
          policy_version: string | null
          reward: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          consent_snapshot?: Json | null
          context_vector: number[]
          created_at?: string
          feedback_type?: string | null
          id?: string
          learning_enabled?: boolean | null
          metrics_after?: Json | null
          metrics_before?: Json | null
          policy_version?: string | null
          reward?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          consent_snapshot?: Json | null
          context_vector?: number[]
          created_at?: string
          feedback_type?: string | null
          id?: string
          learning_enabled?: boolean | null
          metrics_after?: Json | null
          metrics_before?: Json | null
          policy_version?: string | null
          reward?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_experiences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_feedback: {
        Row: {
          action_type: string
          consent_snapshot: Json | null
          created_at: string
          helpful: boolean | null
          id: string
          ignored: boolean | null
          run_id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          consent_snapshot?: Json | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          ignored?: boolean | null
          run_id: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          consent_snapshot?: Json | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          ignored?: boolean | null
          run_id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_memory_facts: {
        Row: {
          category: string
          confidence: number
          created_at: string
          fact: string
          id: string
          last_seen: string
          source: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          fact: string
          id?: string
          last_seen?: string
          source?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          fact?: string
          id?: string
          last_seen?: string
          source?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_memory_facts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_memory_patterns: {
        Row: {
          actionable: boolean | null
          confidence: number
          created_at: string
          evidence: string[] | null
          id: string
          pattern: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actionable?: boolean | null
          confidence?: number
          created_at?: string
          evidence?: string[] | null
          id?: string
          pattern: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          actionable?: boolean | null
          confidence?: number
          created_at?: string
          evidence?: string[] | null
          id?: string
          pattern?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_memory_patterns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_policy_weights: {
        Row: {
          action_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          weights: number[]
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          weights: number[]
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          weights?: number[]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_policy_weights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_runs: {
        Row: {
          action_type: string
          completed_at: string | null
          confidence: number | null
          consent_snapshot: Json | null
          context_vector: number[] | null
          created_at: string
          feedback: string | null
          id: string
          learning_enabled: boolean | null
          outcome: string | null
          reasoning: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          completed_at?: string | null
          confidence?: number | null
          consent_snapshot?: Json | null
          context_vector?: number[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          learning_enabled?: boolean | null
          outcome?: string | null
          reasoning?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          completed_at?: string | null
          confidence?: number | null
          consent_snapshot?: Json | null
          context_vector?: number[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          learning_enabled?: boolean | null
          outcome?: string | null
          reasoning?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sage_user_profile: {
        Row: {
          ai_profiling_enabled: boolean | null
          communication_style: string | null
          constraints: Json | null
          created_at: string
          id: string
          north_star_identity: string
          opt_out_date: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          values: string[] | null
          workspace_id: string | null
        }
        Insert: {
          ai_profiling_enabled?: boolean | null
          communication_style?: string | null
          constraints?: Json | null
          created_at?: string
          id?: string
          north_star_identity?: string
          opt_out_date?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          values?: string[] | null
          workspace_id?: string | null
        }
        Update: {
          ai_profiling_enabled?: boolean | null
          communication_style?: string | null
          constraints?: Json | null
          created_at?: string
          id?: string
          north_star_identity?: string
          opt_out_date?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          values?: string[] | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sage_user_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          category_id: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          goal_id: string | null
          id: string
          name: string
          source: string | null
          status: string
          target_amount: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_id?: string | null
          id?: string
          name: string
          source?: string | null
          status?: string
          target_amount?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_id?: string | null
          id?: string
          name?: string
          source?: string | null
          status?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_daily: {
        Row: {
          budget_adherence: number | null
          burnout_index: number | null
          computed_at: string
          consistency_factor: number | null
          created_at: string
          date: string
          finance_score: number | null
          financial_discipline_score: number | null
          global_score: number | null
          habits_score: number | null
          health_score: number | null
          id: string
          impulsive_spending: number | null
          metadata: Json | null
          momentum_index: number | null
          savings_rate: number | null
          tasks_score: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          budget_adherence?: number | null
          burnout_index?: number | null
          computed_at?: string
          consistency_factor?: number | null
          created_at?: string
          date: string
          finance_score?: number | null
          financial_discipline_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          impulsive_spending?: number | null
          metadata?: Json | null
          momentum_index?: number | null
          savings_rate?: number | null
          tasks_score?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          budget_adherence?: number | null
          burnout_index?: number | null
          computed_at?: string
          consistency_factor?: number | null
          created_at?: string
          date?: string
          finance_score?: number | null
          financial_discipline_score?: number | null
          global_score?: number | null
          habits_score?: number | null
          health_score?: number | null
          id?: string
          impulsive_spending?: number | null
          metadata?: Json | null
          momentum_index?: number | null
          savings_rate?: number | null
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
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
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
      suggestion_feedback: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          rating: number
          suggestion_id: string
          suggestion_type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          rating: number
          suggestion_id: string
          suggestion_type: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          rating?: number
          suggestion_id?: string
          suggestion_type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          service: string
          severity: string
          title: string
          trace_id: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          service: string
          severity: string
          title: string
          trace_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          service?: string
          severity?: string
          title?: string
          trace_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_workspace_id_fkey"
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
      task_checklist_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          sort_order: number
          task_id: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          payload: Json | null
          task_id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          task_id: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
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
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
          event_id: string | null
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
          event_id?: string | null
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
          event_id?: string | null
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
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          id: string
          is_completed: boolean | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_version: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          purpose: string
          updated_at: string
          user_id: string
          withdrawn_at: string | null
          workspace_id: string | null
        }
        Insert: {
          consent_version?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          purpose: string
          updated_at?: string
          user_id: string
          withdrawn_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          consent_version?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          purpose?: string
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          intensity: number | null
          interest_id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intensity?: number | null
          interest_id: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intensity?: number | null
          interest_id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journey_events: {
        Row: {
          created_at: string
          entity: string | null
          entity_id: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_profile: {
        Row: {
          best_engagement_time: string | null
          last_updated: string | null
          learning_data: Json | null
          positive_feedback_rate: number | null
          pref_coach_analytical: number | null
          pref_coach_motivation: number | null
          pref_coach_practical: number | null
          pref_journal_goals: number | null
          pref_journal_gratitude: number | null
          pref_journal_introspection: number | null
          preferred_tone: string | null
          response_length_pref: string | null
          total_interactions: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          best_engagement_time?: string | null
          last_updated?: string | null
          learning_data?: Json | null
          positive_feedback_rate?: number | null
          pref_coach_analytical?: number | null
          pref_coach_motivation?: number | null
          pref_coach_practical?: number | null
          pref_journal_goals?: number | null
          pref_journal_gratitude?: number | null
          pref_journal_introspection?: number | null
          preferred_tone?: string | null
          response_length_pref?: string | null
          total_interactions?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          best_engagement_time?: string | null
          last_updated?: string | null
          learning_data?: Json | null
          positive_feedback_rate?: number | null
          pref_coach_analytical?: number | null
          pref_coach_motivation?: number | null
          pref_coach_practical?: number | null
          pref_journal_goals?: number | null
          pref_journal_gratitude?: number | null
          pref_journal_introspection?: number | null
          preferred_tone?: string | null
          response_length_pref?: string | null
          total_interactions?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          goal_discipline: number | null
          goal_financial_stability: number | null
          goal_mental_balance: number | null
          id: string
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          sound_enabled: boolean | null
          source: string | null
          theme: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          goal_discipline?: number | null
          goal_financial_stability?: number | null
          goal_mental_balance?: number | null
          id?: string
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          sound_enabled?: boolean | null
          source?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          goal_discipline?: number | null
          goal_financial_stability?: number | null
          goal_mental_balance?: number | null
          id?: string
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          sound_enabled?: boolean | null
          source?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          preferred_sage_tone: string | null
          sound_enabled: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferred_sage_tone?: string | null
          sound_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferred_sage_tone?: string | null
          sound_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_cache: {
        Row: {
          expires_at: string | null
          fetched_at: string | null
          id: string
          location_key: string
          weather_data: Json
        }
        Insert: {
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          location_key: string
          weather_data: Json
        }
        Update: {
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          location_key?: string
          weather_data?: Json
        }
        Relationships: []
      }
      weather_snapshots: {
        Row: {
          created_at: string
          date: string
          humidity: number | null
          id: string
          location: string | null
          mood_index: number | null
          productivity_correlation: number | null
          temp: number | null
          user_id: string
          weather: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          humidity?: number | null
          id?: string
          location?: string | null
          mood_index?: number | null
          productivity_correlation?: number | null
          temp?: number | null
          user_id: string
          weather?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          humidity?: number | null
          id?: string
          location?: string | null
          mood_index?: number | null
          productivity_correlation?: number | null
          temp?: number | null
          user_id?: string
          weather?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          ends_at: string
          icon: string
          id: string
          is_active: boolean | null
          starts_at: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          ends_at: string
          icon: string
          id?: string
          is_active?: boolean | null
          starts_at: string
          target_value: number
          title: string
          xp_reward: number
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          ends_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          starts_at?: string
          target_value?: number
          title?: string
          xp_reward?: number
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
      wins: {
        Row: {
          achieved_at: string
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          score_impact: number | null
          source: string | null
          tags: string[] | null
          title: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          achieved_at?: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          score_impact?: number | null
          source?: string | null
          tags?: string[] | null
          title: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          achieved_at?: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          score_impact?: number | null
          source?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wins_workspace_id_fkey"
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
      analytics_daily_summary: {
        Row: {
          count: number | null
          date: string | null
          event_category: string | null
          event_name: string | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      analytics_user_retention: {
        Row: {
          day_0: number | null
          day_1: number | null
          day_30: number | null
          day_7: number | null
          signup_date: string | null
          signup_day: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_completed_tasks: { Args: never; Returns: number }
      calculate_level: { Args: { xp: number }; Returns: number }
      check_feature_access: {
        Args: { _feature: string; _user_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { _limit_type: string; _workspace_id: string }
        Returns: boolean
      }
      compute_savings_progress: { Args: { goal_id: string }; Returns: number }
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
      reset_weekly_streak_freezes: { Args: never; Returns: undefined }
      use_streak_freeze: {
        Args: { p_habit_id: string; p_user_id: string }
        Returns: boolean
      }
      xp_for_next_level: { Args: { current_level: number }; Returns: number }
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
      task_event_type:
        | "created"
        | "updated"
        | "status_changed"
        | "completed"
        | "reverted"
        | "deleted"
        | "archived"
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
      task_event_type: [
        "created",
        "updated",
        "status_changed",
        "completed",
        "reverted",
        "deleted",
        "archived",
      ],
    },
  },
} as const
