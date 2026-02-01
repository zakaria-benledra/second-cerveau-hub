import { supabase } from '@/integrations/supabase/client';

// Implémentation des droits RGPD (Articles 15-22)

export interface ExportedData {
  export_date: string;
  user_id: string;
  data: Record<string, unknown[]>;
  processing_info: {
    purposes: string[];
    legal_basis: string;
    retention: string;
  };
}

export interface DeletionResult {
  success: boolean;
  deletedTables: string[];
  errors?: string[];
}

export interface AlgorithmicExplanation {
  decision: string;
  factors: string[];
  dataUsed: string[];
  humanOverride: boolean;
}

export class UserRightsManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Article 15 — Droit d'accès
  async exportAllData(): Promise<ExportedData> {
    const data: Record<string, unknown[]> = {};

    // Fetch all tables in parallel with explicit types
    const [
      profiles,
      tasks,
      habits,
      habitLogs,
      journalEntries,
      financeTransactions,
      sageProfile,
      sageFacts,
      sagePatterns,
      sageExperiences,
      sageFeedback,
      scoresDaily,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', this.userId),
      supabase.from('tasks').select('*').eq('user_id', this.userId),
      supabase.from('habits').select('*').eq('user_id', this.userId),
      supabase.from('habit_logs').select('*').eq('user_id', this.userId),
      supabase.from('journal_entries').select('*').eq('user_id', this.userId),
      supabase.from('finance_transactions').select('*').eq('user_id', this.userId),
      supabase.from('sage_user_profile').select('*').eq('user_id', this.userId),
      supabase.from('sage_memory_facts').select('*').eq('user_id', this.userId),
      supabase.from('sage_memory_patterns').select('*').eq('user_id', this.userId),
      supabase.from('sage_experiences').select('*').eq('user_id', this.userId),
      supabase.from('sage_feedback').select('*').eq('user_id', this.userId),
      supabase.from('scores_daily').select('*').eq('user_id', this.userId),
    ]);

    data.profiles = profiles.data || [];
    data.tasks = tasks.data || [];
    data.habits = habits.data || [];
    data.habit_logs = habitLogs.data || [];
    data.journal_entries = journalEntries.data || [];
    data.finance_transactions = financeTransactions.data || [];
    data.sage_user_profile = sageProfile.data || [];
    data.sage_memory_facts = sageFacts.data || [];
    data.sage_memory_patterns = sagePatterns.data || [];
    data.sage_experiences = sageExperiences.data || [];
    data.sage_feedback = sageFeedback.data || [];
    data.scores_daily = scoresDaily.data || [];

    return {
      export_date: new Date().toISOString(),
      user_id: this.userId,
      data,
      processing_info: {
        purposes: ['behavioral_transformation_assistance'],
        legal_basis: 'contract_and_consent',
        retention: '3_years_from_last_activity',
      },
    };
  }

  // Article 17 — Droit à l'effacement
  async deleteAllData(): Promise<DeletionResult> {
    const deletedTables: string[] = [];
    const errors: string[] = [];

    // Delete in order (respecting foreign keys)
    const deleteOperations = [
      { name: 'sage_feedback', op: () => supabase.from('sage_feedback').delete().eq('user_id', this.userId) },
      { name: 'sage_experiences', op: () => supabase.from('sage_experiences').delete().eq('user_id', this.userId) },
      { name: 'sage_memory_patterns', op: () => supabase.from('sage_memory_patterns').delete().eq('user_id', this.userId) },
      { name: 'sage_memory_facts', op: () => supabase.from('sage_memory_facts').delete().eq('user_id', this.userId) },
      { name: 'sage_policy_weights', op: () => supabase.from('sage_policy_weights').delete().eq('user_id', this.userId) },
      { name: 'sage_user_profile', op: () => supabase.from('sage_user_profile').delete().eq('user_id', this.userId) },
      { name: 'sage_runs', op: () => supabase.from('sage_runs').delete().eq('user_id', this.userId) },
      { name: 'journal_entries', op: () => supabase.from('journal_entries').delete().eq('user_id', this.userId) },
      { name: 'habit_logs', op: () => supabase.from('habit_logs').delete().eq('user_id', this.userId) },
      { name: 'finance_transactions', op: () => supabase.from('finance_transactions').delete().eq('user_id', this.userId) },
      { name: 'tasks', op: () => supabase.from('tasks').delete().eq('user_id', this.userId) },
      { name: 'habits', op: () => supabase.from('habits').delete().eq('user_id', this.userId) },
      { name: 'scores_daily', op: () => supabase.from('scores_daily').delete().eq('user_id', this.userId) },
    ];

    for (const { name, op } of deleteOperations) {
      try {
        const { error } = await op();
        if (!error) {
          deletedTables.push(name);
        } else {
          errors.push(`${name}: ${error.message}`);
        }
      } catch (e) {
        errors.push(`${name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    // Log de l'effacement pour audit
    await supabase.from('audit_log').insert({
      user_id: this.userId,
      action: 'data_erasure',
      entity: 'user_data',
      new_value: { deleted_tables: deletedTables, timestamp: new Date().toISOString() },
    });

    return {
      success: deletedTables.length > 0,
      deletedTables,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Article 18 — Droit à la limitation
  async limitProcessing(scope: 'all' | 'ai_only'): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        processing_limited: true,
        processing_limit_scope: scope,
        processing_limit_date: new Date().toISOString(),
      })
      .eq('id', this.userId);

    // Log de la limitation
    await supabase.from('audit_log').insert({
      user_id: this.userId,
      action: 'processing_limited',
      entity: 'profile',
      new_value: { scope, timestamp: new Date().toISOString() },
    });
  }

  // Lever la limitation de traitement
  async unlimitProcessing(): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        processing_limited: false,
        processing_limit_scope: null,
        processing_limit_date: null,
      })
      .eq('id', this.userId);
  }

  // Article 20 — Droit à la portabilité
  async exportPortableData(): Promise<string> {
    const data = await this.exportAllData();

    // Format JSON-LD pour interopérabilité
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      identifier: this.userId,
      dateExported: data.export_date,
      behavioralData: data.data,
      processingInformation: data.processing_info,
    }, null, 2);
  }

  // Article 21 — Droit d'opposition au profilage
  async optOutOfProfiling(): Promise<void> {
    // Désactiver l'apprentissage IA
    await supabase
      .from('sage_user_profile')
      .update({
        ai_profiling_enabled: false,
        opt_out_date: new Date().toISOString(),
      })
      .eq('user_id', this.userId);

    // Supprimer les données de profilage
    await Promise.all([
      supabase.from('sage_memory_patterns').delete().eq('user_id', this.userId),
      supabase.from('sage_experiences').delete().eq('user_id', this.userId),
      supabase.from('sage_policy_weights').delete().eq('user_id', this.userId),
    ]);

    // Log du opt-out
    await supabase.from('audit_log').insert({
      user_id: this.userId,
      action: 'profiling_opt_out',
      entity: 'sage_user_profile',
      new_value: { timestamp: new Date().toISOString() },
    });
  }

  // Réactiver le profilage
  async optInToProfiling(): Promise<void> {
    await supabase
      .from('sage_user_profile')
      .update({
        ai_profiling_enabled: true,
        opt_out_date: null,
      })
      .eq('user_id', this.userId);
  }

  // Explication algorithmique (Article 22 & AI Act)
  async getAlgorithmicExplanation(runId: string): Promise<AlgorithmicExplanation> {
    const { data: run } = await supabase
      .from('sage_runs')
      .select('*')
      .eq('id', runId)
      .eq('user_id', this.userId)
      .single();

    if (!run) {
      throw new Error('Run not found');
    }

    return {
      decision: run.action_type,
      factors: run.reasoning?.split(', ') || [],
      dataUsed: [
        'habits_completion_rate',
        'task_status',
        'journal_mood',
        'temporal_context',
      ],
      humanOverride: true, // L'utilisateur peut toujours ignorer
    };
  }

  // Obtenir l'historique des décisions IA
  async getDecisionHistory(limit: number = 50): Promise<Array<{
    id: string;
    action: string;
    reasoning: string;
    date: Date;
  }>> {
    const { data } = await supabase
      .from('sage_runs')
      .select('id, action_type, reasoning, created_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(run => ({
      id: run.id,
      action: run.action_type,
      reasoning: run.reasoning || '',
      date: new Date(run.created_at),
    }));
  }

  // Vérifier le statut de consentement
  async getConsentStatus(): Promise<{
    profilingEnabled: boolean;
    processingLimited: boolean;
    limitScope?: string;
  }> {
    const [profileResult, sageResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('processing_limited, processing_limit_scope')
        .eq('id', this.userId)
        .single(),
      supabase
        .from('sage_user_profile')
        .select('ai_profiling_enabled')
        .eq('user_id', this.userId)
        .single(),
    ]);

    return {
      profilingEnabled: sageResult.data?.ai_profiling_enabled ?? true,
      processingLimited: profileResult.data?.processing_limited ?? false,
      limitScope: profileResult.data?.processing_limit_scope ?? undefined,
    };
  }
}
