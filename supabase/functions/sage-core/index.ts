import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeInput, validateSkill, logSecurityEvent, ALLOWED_SKILLS } from '../_shared/prompt-security.ts';
import { createLogger, getOrCreateTraceId, generateSpanId } from '../_shared/logger.ts';
import { alertManager } from '../_shared/alerts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Action types for the policy engine
const ACTION_TYPES = [
  'nudge',           // Gentle reminder
  'reframe',         // Perspective shift
  'challenge',       // Push harder
  'celebrate',       // Positive reinforcement
  'protect',         // Prevent overload
  'observe',         // Just watch, don't act
] as const;

type ActionType = typeof ACTION_TYPES[number];

interface UserContext {
  habits: { completed: number; total: number; streak: number };
  tasks: { done: number; pending: number; overdue: number };
  scores: { daily: number; weekly: number; momentum: number };
  temporal: { hour: number; dayOfWeek: number; isWeekend: boolean };
  behavioral: { dropoutRisk: number; lastActive: string | null };
  goals: { discipline: number; financialStability: number; mentalBalance: number; priority: string };
}

interface SageMemory {
  profile: {
    northStarIdentity: string;
    values: string[];
    communicationStyle: string;
  };
  facts: Array<{ fact: string; category: string; confidence: number }>;
  patterns: Array<{ pattern: string; confidence: number; actionable: boolean }>;
  recentFeedback: Array<{ helpful: boolean; actionType: string }>;
}

interface SafetyCheck {
  allowed: boolean;
  reason?: string;
}

interface PolicyDecision {
  action: ActionType;
  confidence: number;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = getOrCreateTraceId(req);
  const spanId = generateSpanId();
  const logger = createLogger('sage-core')
    .setContext({ traceId, spanId })
    .startTimer();
  
  let userId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logger.warn('Authentication failed', { error: authError?.message });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    userId = user.id;
    logger.setContext({ userId });

    const { skill, additionalContext } = await req.json();

    logger.info('Request received', { skill, event: 'REQUEST_START' });

    // ===== SECURITY: Validate skill parameter =====
    const skillValidation = sanitizeInput(skill);
    
    if (!skillValidation.isValid) {
      logSecurityEvent('INJECTION_ATTEMPT', user.id, {
        input: String(skill).slice(0, 100),
        reason: skillValidation.blockedReason,
        riskScore: skillValidation.riskScore,
      });
      
      // Send security alert for injection attempts
      await alertManager.securityIncident('sage-core', `Prompt injection attempt detected: ${skillValidation.blockedReason}`, {
        userId: user.id,
        traceId,
      });
      
      return new Response(JSON.stringify({ 
        error: 'Invalid request',
        code: 'SECURITY_BLOCK',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateSkill(skillValidation.sanitizedValue)) {
      logSecurityEvent('INVALID_SKILL', user.id, {
        providedSkill: skillValidation.sanitizedValue,
        allowedSkills: ALLOWED_SKILLS,
      });
      
      return new Response(JSON.stringify({ 
        error: 'Unknown skill type',
        code: 'INVALID_SKILL',
        allowed: [...ALLOWED_SKILLS],
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use validated skill from here
    const validatedSkill = skillValidation.sanitizedValue;

    // Sanitize additionalContext if present
    if (additionalContext && typeof additionalContext === 'object') {
      const contextStr = JSON.stringify(additionalContext);
      const contextValidation = sanitizeInput(contextStr, 2000);
      if (!contextValidation.isValid) {
        logSecurityEvent('SUSPICIOUS_INPUT', user.id, {
          field: 'additionalContext',
          reason: contextValidation.blockedReason,
        });
        // Don't block, just log
      }
    }
    // ===== END SECURITY BLOCK =====

    // 1. Build Context
    const context = await buildContext(supabase, user.id);

    // 2. Load Memory
    const memory = await loadMemory(supabase, user.id);

    // 2b. Enrich with recent history for chat mode
    let enrichedHistory = null;
    if (validatedSkill === 'chat') {
      enrichedHistory = await fetchEnrichedHistory(supabase, user.id);
    }

    // 3. Fetch consent snapshot for audit
    const consentSnapshot = await getConsentSnapshot(supabase, user.id);
    const learningEnabled = consentSnapshot.ai_profiling && consentSnapshot.policy_learning;

    // 3b. Fetch learning profile for adaptive AI
    const learningProfile = await loadLearningProfile(supabase, user.id);

    // 4. Check Safety
    const safetyCheck = checkSafety(context, memory);
    if (!safetyCheck.allowed) {
      await logRun(supabase, user.id, {
        skill: validatedSkill,
        action_type: 'blocked',
        safety_blocked: true,
        safety_reason: safetyCheck.reason,
        latency_ms: Date.now() - startTime,
        consent_snapshot: consentSnapshot,
        learning_enabled: learningEnabled,
        context_vector: [],
      });

      return new Response(JSON.stringify({
        blocked: true,
        reason: safetyCheck.reason,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Policy Engine - Choose Action
    const contextVector = contextToVector(context);
    const weights = await loadWeights(supabase, user.id);
    const decision = chooseAction(contextVector, weights);

    // 6. Call LLM via Lovable AI Gateway
    const llmResponse = await callLovableAI({
      skill: validatedSkill,
      action: decision.action,
      context,
      memory,
      learningProfile,
      additionalContext,
      enrichedHistory,
    });

    if (llmResponse.error) {
      // Handle rate limiting or payment issues
      if (llmResponse.status === 429 || llmResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: llmResponse.error,
          retry_after: llmResponse.status === 429 ? 60 : null,
        }), {
          status: llmResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(llmResponse.error);
    }

    // 7. Validate Response
    const validatedResponse = validateResponse(llmResponse.content || '');

    // 8. Log Run with consent and context vector for learning loop
    const runId = await logRun(supabase, user.id, {
      skill: validatedSkill,
      model_engine: 'lovable-ai',
      json_valid: validatedResponse.valid,
      retry_count: validatedResponse.retries,
      latency_ms: Date.now() - startTime,
      action_type: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      consent_snapshot: consentSnapshot,
      learning_enabled: learningEnabled,
      context_vector: contextVector,
    });

    logger.info('Request completed', { 
      skill: validatedSkill, 
      action: decision.action,
      confidence: decision.confidence,
      event: 'REQUEST_COMPLETE',
    });

    return new Response(JSON.stringify({
      run_id: runId,
      action: decision.action,
      confidence: decision.confidence,
      response: validatedResponse.data,
      latency_ms: Date.now() - startTime,
      trace_id: traceId,
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
        'x-span-id': spanId,
      },
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('SageCore failed', err, {
      event: 'REQUEST_FAILED',
    });
    
    // Send alert for AI service errors
    await alertManager.aiError('sage-core', err, {
      userId,
      traceId,
    });
    
    return new Response(JSON.stringify({ 
      error: err.message,
      trace_id: traceId,
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
        'x-span-id': spanId,
      },
    });
  }
});

// ============================================
// CONTEXT BUILDER
// ============================================
async function buildContext(supabase: any, userId: string): Promise<UserContext & { personalization: { level: string; preferences: any } }> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Fetch data in parallel (including user preferences for goals and personalization level)
  const [habitsResult, tasksResult, scoresResult, dnaResult, prefsResult, profileResult] = await Promise.all([
    supabase.from('habit_logs').select('completed').eq('user_id', userId).eq('date', today),
    supabase.from('tasks').select('status, due_date').eq('user_id', userId).is('deleted_at', null),
    supabase.from('daily_stats').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('behavioral_dna').select('dna_data').eq('user_id', userId).single(),
    supabase.from('user_preferences').select('goal_discipline, goal_financial_stability, goal_mental_balance').eq('user_id', userId).single(),
    supabase.from('profiles').select('personalization_level, ai_preferences').eq('id', userId).single(),
  ]);

  const habits = habitsResult.data || [];
  const tasks = tasksResult.data || [];
  const scores = scoresResult.data;
  const dna = dnaResult.data?.dna_data;
  const prefs = prefsResult.data;
  const profile = profileResult.data;
  
  // Personalization settings
  const personalizationLevel = profile?.personalization_level || 'balanced';
  const aiPreferences = profile?.ai_preferences || {
    suggestion_frequency: 'normal',
    exploration_enabled: true,
    explain_suggestions: true,
  };
  
  // Extract goals with defaults
  const discipline = prefs?.goal_discipline ?? 50;
  const financialStability = prefs?.goal_financial_stability ?? 50;
  const mentalBalance = prefs?.goal_mental_balance ?? 50;
  
  // Determine user's priority based on their goals
  let priority = 'équilibre général';
  if (mentalBalance > discipline && mentalBalance > financialStability) {
    priority = 'bien-être et équilibre mental';
  } else if (discipline > financialStability && discipline > 60) {
    priority = 'discipline et productivité';
  } else if (financialStability > 60) {
    priority = 'stabilité financière';
  }

  // Calculate habit metrics
  const habitsCompleted = habits.filter((h: any) => h.completed).length;
  const habitsTotal = habits.length;

  // Calculate task metrics
  const tasksDone = tasks.filter((t: any) => t.status === 'done').length;
  const tasksPending = tasks.filter((t: any) => t.status !== 'done' && t.status !== 'archived').length;
  const tasksOverdue = tasks.filter((t: any) => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  // Get streak from habits table
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false })
    .limit(1)
    .single();

  return {
    habits: {
      completed: habitsCompleted,
      total: habitsTotal || 1,
      streak: streakData?.current_streak || 0,
    },
    tasks: {
      done: tasksDone,
      pending: tasksPending,
      overdue: tasksOverdue,
    },
    scores: {
      daily: scores?.clarity_score || 50,
      weekly: 50, // Would need weekly aggregation
      momentum: calculateMomentum(habitsCompleted, habitsTotal, tasksDone, tasksPending),
    },
    temporal: {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
    },
    behavioral: {
      dropoutRisk: dna?.predictions?.dropoutRisk72h || 0,
      lastActive: scores?.updated_at || null,
    },
    goals: {
      discipline,
      financialStability,
      mentalBalance,
      priority,
    },
    personalization: {
      level: personalizationLevel,
      preferences: aiPreferences,
    },
  };
}

function calculateMomentum(habitsCompleted: number, habitsTotal: number, tasksDone: number, tasksPending: number): number {
  const habitRate = habitsTotal > 0 ? habitsCompleted / habitsTotal : 0;
  const taskRate = (tasksDone + tasksPending) > 0 ? tasksDone / (tasksDone + tasksPending) : 0;
  return Math.round((habitRate * 0.6 + taskRate * 0.4) * 100);
}

// ============================================
// MEMORY MANAGER
// ============================================
async function loadMemory(supabase: any, userId: string): Promise<SageMemory> {
  const [profileResult, factsResult, patternsResult, feedbackResult] = await Promise.all([
    supabase.from('sage_user_profile').select('*').eq('user_id', userId).single(),
    supabase.from('sage_memory_facts').select('*').eq('user_id', userId).order('confidence', { ascending: false }).limit(20),
    supabase.from('sage_memory_patterns').select('*').eq('user_id', userId).gte('confidence', 0.6).order('confidence', { ascending: false }).limit(10),
    supabase.from('sage_feedback').select('helpful, action_type').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
  ]);

  const profile = profileResult.data;
  const facts = factsResult.data || [];
  const patterns = patternsResult.data || [];
  const feedback = feedbackResult.data || [];

  return {
    profile: {
      northStarIdentity: profile?.north_star_identity || 'Une personne disciplinée et épanouie',
      values: profile?.values || ['discipline', 'équilibre', 'progression'],
      communicationStyle: profile?.communication_style || 'direct',
    },
    facts: facts.map((f: any) => ({
      fact: f.fact,
      category: f.category,
      confidence: f.confidence,
    })),
    patterns: patterns.map((p: any) => ({
      pattern: p.pattern,
      confidence: p.confidence,
      actionable: p.actionable,
    })),
    recentFeedback: feedback.map((f: any) => ({
      helpful: f.helpful,
      actionType: f.action_type,
    })),
  };
}

// ============================================
// ENRICHED HISTORY FOR CHAT MODE
// ============================================
interface EnrichedHistory {
  recentMoods: string[];
  recentReflections: string[];
  activeHabits: string[];
  avgScore: number | null;
  momentum: number | null;
  recentWins: string[];
}

async function fetchEnrichedHistory(supabase: any, userId: string): Promise<EnrichedHistory> {
  const [journalResult, habitsResult, scoresResult, winsResult] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('mood, reflections, date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('habit_logs')
      .select('habits(name)')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(10),
    supabase
      .from('scores_daily')
      .select('global_score, momentum_index, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('wins')
      .select('title, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const journal = journalResult.data || [];
  const habits = habitsResult.data || [];
  const scores = scoresResult.data || [];
  const wins = winsResult.data || [];

  return {
    recentMoods: journal.map((j: any) => j.mood).filter(Boolean),
    recentReflections: journal.map((j: any) => j.reflections?.slice(0, 100)).filter(Boolean),
    activeHabits: [...new Set(habits.map((h: any) => h.habits?.name).filter(Boolean))] as string[],
    avgScore: scores.length > 0 
      ? Math.round(scores.reduce((a: number, s: any) => a + (s.global_score || 0), 0) / scores.length)
      : null,
    momentum: scores[0]?.momentum_index ?? null,
    recentWins: wins.map((w: any) => w.title).filter(Boolean),
  };
}

// ============================================
// SAFETY ENGINE
// ============================================
function checkSafety(context: UserContext, memory: SageMemory): SafetyCheck {
  const { hour } = context.temporal;
  const constraints = memory.profile as any;
  
  // Check quiet hours (default: 22h-7h)
  const quietHours = constraints?.constraints?.quiet_hours || [22, 7];
  const isQuietTime = hour >= quietHours[0] || hour < quietHours[1];
  
  if (isQuietTime) {
    return {
      allowed: false,
      reason: 'quiet_hours',
    };
  }

  // Check overload protection
  if (context.tasks.overdue > 5 && context.behavioral.dropoutRisk > 70) {
    return {
      allowed: false,
      reason: 'overload_protection',
    };
  }

  // Check intervention fatigue (too many interventions recently)
  const recentInterventions = memory.recentFeedback.length;
  if (recentInterventions > 10) {
    const helpfulRate = memory.recentFeedback.filter(f => f.helpful).length / recentInterventions;
    if (helpfulRate < 0.3) {
      return {
        allowed: false,
        reason: 'intervention_fatigue',
      };
    }
  }

  return { allowed: true };
}

// ============================================
// CONSENT SNAPSHOT
// ============================================
interface ConsentSnapshot {
  ai_profiling: boolean;
  behavioral_tracking: boolean;
  policy_learning: boolean;
  data_export: boolean;
}

async function getConsentSnapshot(supabase: any, userId: string): Promise<ConsentSnapshot> {
  const { data } = await supabase
    .from('user_consents')
    .select('purpose, granted')
    .eq('user_id', userId);

  const consents = data || [];

  return {
    ai_profiling: consents.find((c: any) => c.purpose === 'ai_profiling')?.granted ?? false,
    behavioral_tracking: consents.find((c: any) => c.purpose === 'behavioral_tracking')?.granted ?? false,
    policy_learning: consents.find((c: any) => c.purpose === 'policy_learning')?.granted ?? false,
    data_export: consents.find((c: any) => c.purpose === 'data_export')?.granted ?? false,
  };
}

// ============================================
// LEARNING PROFILE LOADER
// ============================================
interface LearningProfileData {
  feedbackRate: number;
  preferredTone: string;
  responseLengthPref: string;
  totalInteractions: number;
  bestEngagementTime: string | null;
}

async function loadLearningProfile(supabase: any, userId: string): Promise<LearningProfileData> {
  const { data } = await supabase
    .from('user_learning_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    feedbackRate: data?.positive_feedback_rate ?? 0.5,
    preferredTone: data?.preferred_tone ?? 'balanced',
    responseLengthPref: data?.response_length_pref ?? 'medium',
    totalInteractions: data?.total_interactions ?? 0,
    bestEngagementTime: data?.best_engagement_time ?? null,
  };
}

// ============================================
// CONTEXT TO VECTOR
// ============================================
function contextToVector(context: UserContext): number[] {
  return [
    context.habits.completed / Math.max(context.habits.total, 1),
    Math.min(context.habits.streak / 30, 1),
    context.tasks.done / Math.max(context.tasks.done + context.tasks.pending, 1),
    1 - Math.min(context.tasks.overdue / 5, 1),
    context.scores.momentum / 100,
    context.behavioral.dropoutRisk / 100,
    Math.sin((context.temporal.hour / 24) * 2 * Math.PI),
    Math.cos((context.temporal.hour / 24) * 2 * Math.PI),
    context.temporal.isWeekend ? 1 : 0,
  ];
}

// ============================================
// POLICY ENGINE
// ============================================
async function loadWeights(supabase: any, userId: string): Promise<Record<string, number[]>> {
  const { data } = await supabase
    .from('sage_policy_weights')
    .select('*')
    .eq('user_id', userId);

  const weights: Record<string, number[]> = {};
  
  // Default weights if none exist
  if (!data || data.length === 0) {
    return getDefaultWeights();
  }

  for (const row of data) {
    weights[row.action_type] = row.weights || [];
  }
  
  return weights;
}

function getDefaultWeights(): Record<string, number[]> {
  // Default weights for each action type
  // Vector: [habit_rate, streak_norm, task_rate, overdue_inv, momentum, dropout_risk, hour_sin, hour_cos, weekend]
  return {
    nudge: [0.3, 0.2, 0.3, 0.1, 0.2, -0.3, 0.1, 0.0, -0.1],
    reframe: [0.1, 0.1, 0.2, 0.3, 0.1, 0.4, 0.0, 0.1, 0.0],
    challenge: [0.4, 0.3, 0.2, 0.0, 0.3, -0.4, 0.0, 0.0, -0.2],
    celebrate: [0.5, 0.4, 0.4, 0.0, 0.5, -0.2, 0.1, 0.1, 0.1],
    protect: [-0.2, -0.1, -0.1, 0.4, -0.1, 0.5, -0.2, 0.0, 0.3],
    observe: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  };
}

function chooseAction(vector: number[], weights: Record<string, number[]>): PolicyDecision {
  const scores: Record<string, number> = {};
  
  for (const [action, w] of Object.entries(weights)) {
    let score = 0;
    for (let i = 0; i < Math.min(vector.length, w.length); i++) {
      score += vector[i] * w[i];
    }
    scores[action] = score;
  }

  // Softmax to get probabilities
  const maxScore = Math.max(...Object.values(scores));
  const expScores: Record<string, number> = {};
  let sumExp = 0;
  
  for (const [action, score] of Object.entries(scores)) {
    expScores[action] = Math.exp(score - maxScore);
    sumExp += expScores[action];
  }

  const probabilities: Record<string, number> = {};
  for (const [action, exp] of Object.entries(expScores)) {
    probabilities[action] = exp / sumExp;
  }

  // Select best action
  let bestAction: ActionType = 'observe';
  let bestScore = -Infinity;
  
  for (const [action, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAction = action as ActionType;
    }
  }

  return {
    action: bestAction,
    confidence: probabilities[bestAction],
    reasoning: generateReasoning(bestAction, vector),
  };
}

function generateReasoning(action: ActionType, vector: number[]): string {
  const reasons: string[] = [];
  
  if (vector[0] > 0.7) reasons.push('high habit completion');
  if (vector[0] < 0.3) reasons.push('low habit completion');
  if (vector[1] > 0.5) reasons.push('strong streak');
  if (vector[3] < 0.5) reasons.push('overdue tasks');
  if (vector[5] > 0.5) reasons.push('dropout risk detected');
  if (vector[4] > 0.7) reasons.push('good momentum');
  
  return reasons.length > 0 ? reasons.join(', ') : 'baseline decision';
}

// ============================================
// LOVABLE AI GATEWAY
// ============================================
async function callLovableAI(params: {
  skill: string;
  action: ActionType;
  context: UserContext;
  memory: SageMemory;
  learningProfile?: LearningProfileData;
  additionalContext?: any;
  enrichedHistory?: EnrichedHistory | null;
}): Promise<{ content?: string; error?: string; status?: number }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    return { error: 'LOVABLE_API_KEY not configured', status: 500 };
  }

  const prompt = buildPrompt(params);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Tu es SageCore, le moteur d'intelligence comportementale de Minded. Tu génères des interventions comportementales basées sur les données utilisateur. Réponds TOUJOURS en JSON valide avec la structure exacte demandée. Sois direct, non moralisateur, et adapté au style de communication de l'utilisateur.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { error: 'Rate limit exceeded. Please try again later.', status: 429 };
      }
      if (response.status === 402) {
        return { error: 'AI credits exhausted. Please add funds to continue.', status: 402 };
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return { error: `AI gateway error: ${response.status}`, status: response.status };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return { error: 'Empty response from AI', status: 500 };
    }

    return { content };
  } catch (error) {
    console.error('Lovable AI call error:', error);
    return { error: error instanceof Error ? error.message : 'AI call failed', status: 500 };
  }
}

function buildPrompt(params: {
  skill: string;
  action: ActionType;
  context: UserContext;
  memory: SageMemory;
  learningProfile?: LearningProfileData;
  additionalContext?: any;
  enrichedHistory?: EnrichedHistory | null;
}): string {
  const { skill, action, context, memory, learningProfile, additionalContext, enrichedHistory } = params;

  // Build adaptive tone instruction based on learning profile
  let toneInstruction = '';
  const feedbackRate = learningProfile?.feedbackRate ?? 0.5;
  const preferredTone = learningProfile?.preferredTone ?? 'balanced';
  const interactions = learningProfile?.totalInteractions ?? 0;
  const responseLengthPref = learningProfile?.responseLengthPref ?? 'medium';

  if (feedbackRate < 0.3 && interactions >= 5) {
    toneInstruction = 'L\'utilisateur est souvent insatisfait. Sois concis, prudent, et pose des questions de clarification avant de suggérer.';
  } else if (feedbackRate > 0.7 && interactions >= 10) {
    toneInstruction = 'L\'utilisateur apprécie beaucoup tes suggestions. Sois proactif, détaillé et confiant.';
  } else {
    toneInstruction = 'Approche équilibrée.';
  }

  if (preferredTone === 'supportive') {
    toneInstruction += ' Adopte un ton chaleureux, encourageant et bienveillant.';
  } else if (preferredTone === 'challenging') {
    toneInstruction += ' Challenge l\'utilisateur avec des questions profondes et des objectifs ambitieux.';
  }

  if (responseLengthPref === 'short') {
    toneInstruction += ' Sois très concis (2-3 phrases max).';
  } else if (responseLengthPref === 'detailed') {
    toneInstruction += ' Fournis des explications détaillées et des exemples.';
  }

  // === CHAT MODE: Free conversation with history ===
  if (skill === 'chat') {
    const chatHistory = additionalContext?.history || [];
    const userMessage = additionalContext?.message || '';
    
    // Build enriched history section
    const historySection = enrichedHistory ? `
# HISTORIQUE RÉCENT (7 jours)
- Humeurs récentes: ${enrichedHistory.recentMoods.length > 0 ? enrichedHistory.recentMoods.join(', ') : 'non disponible'}
- Score moyen: ${enrichedHistory.avgScore !== null ? enrichedHistory.avgScore + '/100' : 'non disponible'}
- Momentum: ${enrichedHistory.momentum !== null ? (enrichedHistory.momentum > 50 ? 'positif (' + enrichedHistory.momentum + ')' : 'en baisse (' + enrichedHistory.momentum + ')') : 'non disponible'}
- Habitudes actives: ${enrichedHistory.activeHabits.length > 0 ? enrichedHistory.activeHabits.slice(0, 5).join(', ') : 'aucune'}
- Dernière réflexion: "${enrichedHistory.recentReflections[0] || 'aucune'}"
- Victoires récentes: ${enrichedHistory.recentWins.length > 0 ? enrichedHistory.recentWins.join(', ') : 'aucune récente'}` : '';
    
    return `
# MODE CONVERSATION

Tu es Sage, le coach IA de l'application Minded. Tu discutes avec l'utilisateur de manière naturelle et bienveillante.
IMPORTANT: Utilise les données concrètes ci-dessous pour personnaliser tes réponses. Mentionne des chiffres, habitudes ou événements spécifiques quand pertinent.

# CONTEXTE UTILISATEUR
- Habitudes: ${context.habits.completed}/${context.habits.total} complétées (streak: ${context.habits.streak}j)
- Tâches: ${context.tasks.done} faites, ${context.tasks.pending} en cours, ${context.tasks.overdue} en retard
- Score momentum: ${context.scores.momentum}%
- Priorité: ${context.goals.priority}
${historySection}

# PROFIL
- Identité visée: ${memory.profile.northStarIdentity}
- Valeurs: ${memory.profile.values.join(', ')}

# PATTERNS DÉTECTÉS
${memory.patterns.slice(0, 3).map(p => `- ${p.pattern}`).join('\n') || '(aucun)'}

# FAITS CONNUS
${memory.facts.slice(0, 3).map(f => `- ${f.fact}`).join('\n') || '(aucun)'}

# STYLE
${toneInstruction}

# HISTORIQUE DE CONVERSATION
${chatHistory.map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Sage'}: ${m.content}`).join('\n') || '(début de conversation)'}

# MESSAGE DE L'UTILISATEUR
${userMessage}

# FORMAT DE RÉPONSE (JSON)
{
  "observation": "Ce que tu comprends de la demande",
  "micro_action": {
    "type": "nudge",
    "message": "Ta réponse conversationnelle (2-4 phrases, naturelle, chaleureuse, avec des données spécifiques)"
  }
}

Réponds maintenant de manière naturelle et personnalisée avec des données concrètes:`;
  }

  return `
# CONTEXTE ACTUEL
- Habitudes: ${context.habits.completed}/${context.habits.total} (streak: ${context.habits.streak}j)
- Tâches: ${context.tasks.done} faites, ${context.tasks.pending} en cours, ${context.tasks.overdue} en retard
- Score momentum: ${context.scores.momentum}%
- Risque décrochage: ${context.behavioral.dropoutRisk}%
- Heure: ${context.temporal.hour}h (${context.temporal.isWeekend ? 'weekend' : 'semaine'})

# OBJECTIFS DE TRANSFORMATION (définis à l'inscription)
- Priorité principale: ${context.goals.priority}
- Focus discipline: ${context.goals.discipline}%
- Focus bien-être mental: ${context.goals.mentalBalance}%
- Focus stabilité financière: ${context.goals.financialStability}%
${context.goals.mentalBalance >= 70 ? '→ IMPORTANT: Insiste sur le journal, la méditation, le bien-être' : ''}
${context.goals.discipline >= 70 ? '→ IMPORTANT: Focalise sur les habitudes et la productivité' : ''}
${context.goals.financialStability >= 70 ? '→ IMPORTANT: Priorise les conseils finance et budget' : ''}

# NIVEAU DE PERSONNALISATION: ${(context as any).personalization?.level?.toUpperCase() || 'BALANCED'}
${(context as any).personalization?.level === 'conservative' ? '→ STYLE: Sois général et non intrusif. Évite les suggestions trop personnelles. Respecte la vie privée.' : ''}
${(context as any).personalization?.level === 'exploratory' ? '→ STYLE: Sois proactif et audacieux. Propose des idées nouvelles et des défis. Pousse hors de la zone de confort.' : ''}
${(context as any).personalization?.level === 'balanced' ? '→ STYLE: Équilibre personnalisation et respect de la vie privée. Suggestions modérées.' : ''}
${(context as any).personalization?.preferences?.explain_suggestions ? '→ IMPORTANT: Explique brièvement pourquoi tu fais chaque suggestion.' : ''}

# APPRENTISSAGE UTILISATEUR (basé sur ${interactions} interactions)
- Taux de satisfaction: ${Math.round(feedbackRate * 100)}%
- Meilleur moment d'engagement: ${learningProfile?.bestEngagementTime || 'non déterminé'}
- Instruction adaptative: ${toneInstruction}

# PROFIL UTILISATEUR
- Identité visée: ${memory.profile.northStarIdentity}
- Valeurs: ${memory.profile.values.join(', ')}
- Style: ${memory.profile.communicationStyle}

# PATTERNS DÉTECTÉS
${memory.patterns.map(p => `- ${p.pattern} (confiance: ${Math.round(p.confidence * 100)}%)`).join('\n') || '(aucun pattern détecté)'}

# FAITS CONNUS
${memory.facts.slice(0, 5).map(f => `- ${f.fact}`).join('\n') || '(aucun fait mémorisé)'}

# ACTION CHOISIE PAR LE POLICY ENGINE
${action.toUpperCase()}

# SKILL DEMANDÉ
${skill}

${additionalContext ? `# CONTEXTE ADDITIONNEL\n${JSON.stringify(additionalContext, null, 2)}` : ''}

# FORMAT DE RÉPONSE (JSON STRICTE)
{
  "observation": "Description factuelle de la situation actuelle",
  "interpretation": "Ce que cela signifie pour l'utilisateur",
  "hypothesis": "Pourquoi cette situation se produit",
  "micro_action": {
    "type": "${action}",
    "message": "Message personnalisé à afficher",
    "cta": "Texte du bouton d'action (optionnel)",
    "target": "Identifiant cible de l'action (optionnel)"
  },
  "limit": "Ce que Sage ne doit PAS faire dans ce cas"
}

Génère maintenant l'intervention comportementale:`;
}

// ============================================
// RESPONSE VALIDATION
// ============================================
function validateResponse(response: string): { valid: boolean; data: any; retries: number } {
  // Try to extract JSON from the response
  let jsonString = response;
  
  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // For chat mode: just need micro_action with message
    if (parsed.micro_action?.message) {
      // Add defaults for missing optional fields
      return { 
        valid: true, 
        data: {
          observation: parsed.observation || 'Chat response',
          interpretation: parsed.interpretation || '',
          hypothesis: parsed.hypothesis || '',
          micro_action: parsed.micro_action,
          limit: parsed.limit || '',
        }, 
        retries: 0 
      };
    }
    
    // For standard mode: validate required fields
    const requiredFields = ['observation', 'micro_action'];
    const hasRequired = requiredFields.every(field => field in parsed);
    
    if (!hasRequired) {
      console.warn('Missing required fields in response');
      return { valid: false, data: createFallbackResponse(), retries: 1 };
    }

    return { valid: true, data: parsed, retries: 0 };
  } catch (e) {
    console.warn('Failed to parse AI response:', e);
    return { valid: false, data: createFallbackResponse(), retries: 1 };
  }
}

function createFallbackResponse(): any {
  return {
    observation: "Données analysées",
    interpretation: "Continue sur ta lancée",
    hypothesis: "Ton rythme actuel est adapté",
    micro_action: {
      type: "observe",
      message: "Je t'observe pour mieux te connaître.",
    },
    limit: "Ne pas interrompre le flow",
  };
}

// ============================================
// LOGGING
// ============================================
async function logRun(supabase: any, userId: string, data: any): Promise<string | null> {
  try {
    const { data: run, error } = await supabase
      .from('sage_runs')
      .insert({ 
        user_id: userId, 
        ...data,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to log run:', error);
      return null;
    }
    
    return run?.id;
  } catch (e) {
    console.error('Log run error:', e);
    return null;
  }
}
