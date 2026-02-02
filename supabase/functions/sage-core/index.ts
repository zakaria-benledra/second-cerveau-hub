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

    // 3. Fetch consent snapshot for audit
    const consentSnapshot = await getConsentSnapshot(supabase, user.id);
    const learningEnabled = consentSnapshot.ai_profiling && consentSnapshot.policy_learning;

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
      additionalContext,
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
async function buildContext(supabase: any, userId: string): Promise<UserContext> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Fetch data in parallel
  const [habitsResult, tasksResult, scoresResult, dnaResult] = await Promise.all([
    supabase.from('habit_logs').select('completed').eq('user_id', userId).eq('date', today),
    supabase.from('tasks').select('status, due_date').eq('user_id', userId).is('deleted_at', null),
    supabase.from('daily_stats').select('*').eq('user_id', userId).eq('date', today).single(),
    supabase.from('behavioral_dna').select('dna_data').eq('user_id', userId).single(),
  ]);

  const habits = habitsResult.data || [];
  const tasks = tasksResult.data || [];
  const scores = scoresResult.data;
  const dna = dnaResult.data?.dna_data;

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
  additionalContext?: any;
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
  additionalContext?: any;
}): string {
  const { skill, action, context, memory, additionalContext } = params;

  return `
# CONTEXTE ACTUEL
- Habitudes: ${context.habits.completed}/${context.habits.total} (streak: ${context.habits.streak}j)
- Tâches: ${context.tasks.done} faites, ${context.tasks.pending} en cours, ${context.tasks.overdue} en retard
- Score momentum: ${context.scores.momentum}%
- Risque décrochage: ${context.behavioral.dropoutRisk}%
- Heure: ${context.temporal.hour}h (${context.temporal.isWeekend ? 'weekend' : 'semaine'})

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
    
    // Validate required fields
    const requiredFields = ['observation', 'interpretation', 'micro_action'];
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
