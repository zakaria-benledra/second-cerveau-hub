import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  firstName: string;
  interests: string[];
  priorities: { discipline: number; finance: number; mental: number };
  currentScore: number;
  streak: number;
}

interface GenerationRequest {
  programType: 'discipline' | 'mental' | 'finance' | 'balanced' | 'custom';
  durationDays: number;
  intensity: 'light' | 'moderate' | 'intense';
  focusAreas?: string[];
  customGoal?: string;
}

const SYSTEM_PROMPT = `Tu es Sage, un coach de vie expert en développement personnel, psychologie comportementale et neurosciences.

Tu génères des programmes de transformation personnalisés basés sur les méthodologies prouvées :
- Atomic Habits (James Clear) - Habitudes atomiques, stacking, friction
- Getting Things Done (David Allen) - Capture, clarification, organisation
- Deep Work (Cal Newport) - Focus, élimination des distractions
- Mindfulness (Jon Kabat-Zinn) - Pleine conscience, méditation
- Ikigai - Sens et purpose
- Pomodoro Technique - Gestion du temps par sprints

RÈGLES STRICTES :
1. Chaque habitude DOIT avoir une explication scientifique
2. Chaque tâche DOIT avoir un contexte et un timing précis
3. Les conseils DOIVENT être personnalisés selon le profil
4. JAMAIS de conseils médicaux, financiers ou juridiques spécifiques
5. Progression graduelle - pas de surcharge le jour 1

FORMAT DE RÉPONSE : JSON valide uniquement, pas de markdown.`;

function buildPrompt(profile: UserProfile, request: GenerationRequest): string {
  const priorityFocus = Object.entries(profile.priorities)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  return `
PROFIL UTILISATEUR :
- Prénom : ${profile.firstName}
- Intérêts : ${profile.interests.join(', ') || 'Non spécifié'}
- Priorité #1 : ${priorityFocus[0]}
- Score actuel : ${profile.currentScore}%
- Streak : ${profile.streak} jours

DEMANDE :
- Type de programme : ${request.programType}
- Durée : ${request.durationDays} jours
- Intensité : ${request.intensity}
- Focus spécifiques : ${request.focusAreas?.join(', ') || 'Aucun'}
- Objectif personnalisé : ${request.customGoal || 'Amélioration générale'}

GÉNÈRE un programme complet au format JSON avec cette structure EXACTE :
{
  "title": "Titre accrocheur et personnalisé",
  "subtitle": "Sous-titre motivant",
  "description": "Description détaillée du programme (2-3 phrases)",
  "methodologies": ["atomic_habits", "pomodoro", ...],
  "scientific_references": [
    {"source": "Étude/Livre", "title": "Titre", "key_insight": "Insight clé"}
  ],
  "global_explanation": "Explication globale de l'approche (paragraphe)",
  "expected_outcomes": ["Résultat attendu 1", "Résultat 2", ...],
  "daily_schedule": [
    {
      "day": 1,
      "theme": "Thème du jour",
      "focus": "Focus principal",
      "morning_routine": "Routine matinale suggérée",
      "sage_message": "Message motivant de Sage pour ce jour",
      "reflection_prompt": "Question de réflexion du soir"
    }
  ],
  "habits": [
    {
      "name": "Nom de l'habitude",
      "frequency": "daily",
      "recommended_time": "morning",
      "duration_minutes": 10,
      "introduction_day": 1,
      "why_this_practice": "Pourquoi cette pratique est importante (2-3 phrases)",
      "scientific_basis": "Base scientifique (étude ou principe)",
      "methodology_source": "Source méthodologique",
      "how_to_guide": [
        {"step": 1, "title": "Étape 1", "description": "Description", "tip": "Conseil"}
      ],
      "best_practices": ["Bonne pratique 1", "Bonne pratique 2"],
      "common_mistakes": ["Erreur courante 1"],
      "immediate_benefits": ["Bénéfice immédiat"],
      "medium_term_benefits": ["Bénéfice à 2-4 semaines"],
      "long_term_benefits": ["Bénéfice à 1+ mois"],
      "personalized_tips": ["Conseil personnalisé basé sur le profil"],
      "adaptation_suggestions": "Comment adapter si c'est difficile",
      "difficulty_level": 2,
      "xp_reward": 15
    }
  ],
  "tasks": [
    {
      "title": "Titre de la tâche",
      "description": "Description détaillée",
      "scheduled_day": 1,
      "priority": "medium",
      "estimated_minutes": 30,
      "context": "Contexte et pourquoi maintenant"
    }
  ],
  "milestones": [
    {
      "day": 7,
      "title": "Premier milestone",
      "celebration": "Comment célébrer",
      "xp_bonus": 50
    }
  ],
  "total_xp_available": 500
}

IMPORTANT :
- Génère au moins ${Math.min(5, Math.ceil(request.durationDays / 7))} habitudes
- Génère au moins ${Math.ceil(request.durationDays / 3)} tâches réparties sur la durée
- Génère un daily_schedule pour CHAQUE jour (${request.durationDays} jours)
- Les habitudes sont introduites progressivement (pas toutes le jour 1)
- Personnalise selon le prénom "${profile.firstName}"
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const request: GenerationRequest = body.request || {
      programType: 'balanced',
      durationDays: 21,
      intensity: 'moderate',
    };

    // Fetch user profile data
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: prefsData } = await supabase
      .from('preferences')
      .select('interests, onboarding_priorities')
      .eq('user_id', user.id)
      .single();

    const { data: gamificationData } = await supabase
      .from('gamification_profiles')
      .select('current_streak')
      .eq('id', user.id)
      .single();

    const { data: scoresData } = await supabase
      .from('scores_daily')
      .select('global_score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const profile: UserProfile = {
      firstName: profileData?.first_name || profileData?.display_name?.split(' ')[0] || 'Ami',
      interests: prefsData?.interests || [],
      priorities: prefsData?.onboarding_priorities || { discipline: 50, finance: 50, mental: 50 },
      currentScore: scoresData?.global_score || 50,
      streak: gamificationData?.current_streak || 0,
    };

    console.log("Generating program for:", profile.firstName, "Type:", request.programType);

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(profile, request) },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let programData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      programData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse program data from AI");
    }

    // Archive any existing active program
    await supabase
      .from('ai_generated_programs')
      .update({ status: 'archived' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Create the program
    const { data: program, error: programError } = await supabase
      .from('ai_generated_programs')
      .insert({
        user_id: user.id,
        title: programData.title,
        subtitle: programData.subtitle,
        description: programData.description,
        duration_days: request.durationDays,
        program_type: request.programType,
        methodologies: programData.methodologies || [],
        scientific_references: programData.scientific_references || [],
        global_explanation: programData.global_explanation,
        expected_outcomes: programData.expected_outcomes || [],
        daily_schedule: programData.daily_schedule || [],
        user_profile_snapshot: profile,
        generation_prompt: buildPrompt(profile, request),
        status: 'active',
        current_day: 1,
        total_xp_available: programData.total_xp_available || 500,
        total_xp_earned: 0,
      })
      .select()
      .single();

    if (programError) {
      console.error("Failed to create program:", programError);
      throw programError;
    }

    // Create wiki entries for habits
    const wikiEntries = (programData.habits || []).map((habit: any) => ({
      program_id: program.id,
      user_id: user.id,
      element_type: 'habit',
      title: habit.name,
      short_description: habit.why_this_practice?.substring(0, 100),
      why_this_practice: habit.why_this_practice,
      scientific_basis: habit.scientific_basis,
      methodology_source: habit.methodology_source,
      how_to_guide: habit.how_to_guide || [],
      best_practices: habit.best_practices || [],
      common_mistakes: habit.common_mistakes || [],
      immediate_benefits: habit.immediate_benefits || [],
      medium_term_benefits: habit.medium_term_benefits || [],
      long_term_benefits: habit.long_term_benefits || [],
      personalized_tips: habit.personalized_tips || [],
      adaptation_suggestions: habit.adaptation_suggestions,
      scheduled_day: habit.introduction_day || 1,
      recommended_time: habit.recommended_time || 'morning',
      duration_minutes: habit.duration_minutes || 10,
      frequency: habit.frequency || 'daily',
      difficulty_level: habit.difficulty_level || 2,
      xp_reward: habit.xp_reward || 10,
      streak_bonus_xp: 5,
    }));

    if (wikiEntries.length > 0) {
      await supabase.from('program_elements_wiki').insert(wikiEntries);
    }

    // Create actual habits in habits table
    const habitsToCreate = (programData.habits || []).map((habit: any) => ({
      user_id: user.id,
      name: habit.name,
      description: habit.why_this_practice,
      target_frequency: habit.frequency || 'daily',
      is_active: true,
      icon: '🎯',
      created_from_program: program.id,
    }));

    if (habitsToCreate.length > 0) {
      await supabase.from('habits').insert(habitsToCreate);
    }

    // Create tasks
    const tasksToCreate = (programData.tasks || []).map((task: any) => ({
      user_id: user.id,
      title: task.title,
      description: task.description,
      status: 'todo',
      priority: task.priority || 'medium',
      created_from_program: program.id,
    }));

    if (tasksToCreate.length > 0) {
      await supabase.from('tasks').insert(tasksToCreate);
    }

    // Create initial daily progress entry
    await supabase.from('daily_program_progress').insert({
      program_id: program.id,
      user_id: user.id,
      day_number: 1,
      progress_date: new Date().toISOString().split('T')[0],
      daily_focus: programData.daily_schedule?.[0]?.focus || 'Jour 1 - Démarrage',
      sage_message_of_day: programData.daily_schedule?.[0]?.sage_message || 'Bienvenue dans ton nouveau programme !',
      reflection_prompt: programData.daily_schedule?.[0]?.reflection_prompt,
    });

    console.log("Program created successfully:", program.id);

    return new Response(JSON.stringify({
      success: true,
      program: {
        id: program.id,
        title: program.title,
        subtitle: program.subtitle,
        description: program.description,
        duration_days: program.duration_days,
        habits_created: habitsToCreate.length,
        tasks_created: tasksToCreate.length,
        wiki_entries: wikiEntries.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-ai-program error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
