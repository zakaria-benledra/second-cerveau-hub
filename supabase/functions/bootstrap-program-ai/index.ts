import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// SYSTEM PROMPT POUR GÉNÉRATION DE PROGRAMME
// ============================================
const SAGE_SYSTEM_PROMPT = `Tu es Sage, un expert en développement personnel et coaching de vie. Tu connais en profondeur:

MÉTHODOLOGIES MAÎTRISÉES:
- Atomic Habits (James Clear) - Habitudes atomiques, stacking, friction
- Getting Things Done (David Allen) - GTD, capture, clarification
- Deep Work (Cal Newport) - Focus, élimination distractions
- The Power of Habit (Charles Duhigg) - Boucle Cue-Routine-Reward
- Mindfulness-Based Stress Reduction (Jon Kabat-Zinn) - Pleine conscience
- The Miracle Morning (Hal Elrod) - Rituels matinaux SAVERS
- Flow (Mihaly Csikszentmihalyi) - État de flow optimal
- Ikigai (Ken Mogi) - Raison d'être

SOURCES SCIENTIFIQUES:
- Tu cites des études de Harvard, Stanford, MIT quand pertinent
- Tu références des méta-analyses et recherches en neurosciences
- Tu expliques les mécanismes biologiques (cortisol, dopamine, neuroplasticité)

RÈGLES STRICTES:
1. Chaque habitude DOIT avoir une explication POURQUOI scientifique
2. Chaque élément DOIT avoir un guide COMMENT détaillé
3. PERSONNALISE selon les intérêts de l'utilisateur
4. Utilise le prénom de l'utilisateur dans les messages
5. Adapte le ton selon la préférence (encouraging/direct/gentle)
6. Réponds UNIQUEMENT en JSON valide, sans backticks markdown

Tu dois générer un programme COMPLET et DÉTAILLÉ qui fonctionne vraiment.`;

// ============================================
// TYPES
// ============================================
interface GeneratedHabit {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  recommended_time: 'morning' | 'afternoon' | 'evening';
  duration_minutes: number;
  difficulty_level: number;
  xp_reward: number;
  // Wiki complet
  why_important: string;
  scientific_basis: string;
  methodology_source: string;
  how_to_steps: string[];
  best_practices: string[];
  common_mistakes: string[];
  immediate_benefits: string[];
  long_term_benefits: string[];
  personalized_tip: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  day_offset: number;
  estimated_minutes: number;
  why_now: string;
  how_to_complete: string;
}

interface GeneratedGoal {
  title: string;
  description: string;
  target: number;
  unit: string;
}

interface DailyMessage {
  day: number;
  morning_message: string;
  evening_message: string;
  tip_of_day: string;
  reflection_prompt: string;
}

interface GeneratedProgram {
  title: string;
  subtitle: string;
  description: string;
  methodology: string;
  scientific_basis: string;
  expected_outcomes: string[];
  habits: GeneratedHabit[];
  tasks: GeneratedTask[];
  goals: GeneratedGoal[];
  daily_messages: DailyMessage[];
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured - this is your internal AI');
    }

    const { programId, userId } = await req.json();

    if (!programId || !userId) {
      throw new Error('programId and userId are required');
    }

    console.log(`[BootstrapAI] Starting for user ${userId}, program ${programId}`);

    // 1. Récupérer les infos du programme sélectionné
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found: ${programId}`);
    }

    console.log(`[BootstrapAI] Program: ${program.name}`);

    // 2. Récupérer le profil COMPLET de l'utilisateur
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const firstName = userProfile?.first_name || userProfile?.display_name?.split(' ')[0] || 'Ami';
    const interests = userProfile?.interests || [];
    const sageTone = userProfile?.preferred_sage_tone || 'encouraging';
    const personalizationLevel = userProfile?.personalization_level || 'balanced';
    
    const goalDiscipline = userPreferences?.goal_discipline || 50;
    const goalMental = userPreferences?.goal_mental_balance || 50;
    const goalFinance = userPreferences?.goal_financial_stability || 50;

    console.log(`[BootstrapAI] User: ${firstName}, interests: ${interests.join(', ')}, tone: ${sageTone}`);

    // 3. Récupérer workspace
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    const workspaceId = membership?.workspace_id;

    // 4. Archiver l'ancien programme actif (si existe)
    const { data: existingProgram } = await supabase
      .from('user_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingProgram) {
      console.log(`[BootstrapAI] Archiving previous program`);
      
      await supabase.from('program_archives').insert({
        user_id: userId,
        workspace_id: workspaceId,
        program_id: existingProgram.program_id,
        original_user_program_id: existingProgram.id,
        started_at: existingProgram.started_at,
        final_status: 'replaced',
        days_completed: existingProgram.current_day - 1,
        total_xp_earned: existingProgram.total_xp_earned || 0,
      });

      await supabase
        .from('user_programs')
        .update({ status: 'abandoned' })
        .eq('id', existingProgram.id);
    }

    // 5. APPELER L'IA INTERNE pour générer le programme personnalisé
    console.log(`[BootstrapAI] Calling internal AI to generate personalized content...`);

    const userPrompt = buildUserPrompt({
      programName: program.name,
      programDescription: program.description,
      programCategory: program.category,
      programDuration: program.duration_days,
      firstName,
      interests,
      sageTone,
      goalDiscipline,
      goalMental,
      goalFinance,
      personalizationLevel,
    });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SAGE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[BootstrapAI] AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('IA surchargée, réessaie dans quelques secondes');
      }
      if (aiResponse.status === 402) {
        throw new Error('Crédits IA épuisés');
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content from AI');
    }

    // Parser le JSON
    let generatedProgram: GeneratedProgram;
    try {
      // Nettoyer les backticks markdown si présents
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();
      
      generatedProgram = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[BootstrapAI] Parse error:', content.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }

    console.log(`[BootstrapAI] AI generated: ${generatedProgram.habits?.length || 0} habits, ${generatedProgram.tasks?.length || 0} tasks`);

    // 6. Créer le programme utilisateur
    const { data: userProgram, error: createError } = await supabase
      .from('user_programs')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        program_id: programId,
        status: 'active',
        current_day: 1,
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log(`[BootstrapAI] Created user program: ${userProgram.id}`);

    // 7. Créer les habitudes avec Wiki
    const createdHabits = [];
    for (const habit of generatedProgram.habits || []) {
      const { data: createdHabit, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          name: habit.name,
          description: habit.description,
          target_frequency: habit.frequency,
          is_active: true,
          created_from_program: programId,
        })
        .select()
        .single();

      if (!error && createdHabit) {
        createdHabits.push(createdHabit);

        // ===== CRÉATION WIKI AVEC VALIDATION =====
        console.log(`[BootstrapAI] Creating wiki for habit: ${habit.name}`);
        
        // Valider et transformer les données avec fallbacks
        const safeHowToSteps = Array.isArray(habit.how_to_steps) 
          ? habit.how_to_steps.map((step: string, i: number) => ({ 
              step: i + 1, 
              description: typeof step === 'string' ? step : String(step) 
            }))
          : [{ step: 1, description: 'Pratique cette habitude chaque jour.' }];

        const wikiData = {
          program_id: programId,
          user_id: userId,
          element_type: 'habit',
          linked_item_id: createdHabit.id,
          title: habit.name || 'Habitude',
          short_description: habit.description || '',
          why_this_practice: habit.why_important || `Cette habitude développe ta discipline et améliore ton bien-être quotidien.`,
          scientific_basis: habit.scientific_basis || `Basé sur les recherches en neurosciences comportementales et les principes des habitudes atomiques (James Clear).`,
          methodology_source: habit.methodology_source || 'Atomic Habits - James Clear',
          how_to_guide: safeHowToSteps,
          best_practices: Array.isArray(habit.best_practices) && habit.best_practices.length > 0 
            ? habit.best_practices 
            : ['Commence petit', 'Sois régulier', 'Associe à une habitude existante'],
          common_mistakes: Array.isArray(habit.common_mistakes) && habit.common_mistakes.length > 0
            ? habit.common_mistakes 
            : ['Vouloir trop en faire au début', 'Sauter des jours', 'Se décourager après un échec'],
          immediate_benefits: Array.isArray(habit.immediate_benefits) && habit.immediate_benefits.length > 0
            ? habit.immediate_benefits 
            : ['Sentiment d\'accomplissement', 'Début de routine'],
          long_term_benefits: Array.isArray(habit.long_term_benefits) && habit.long_term_benefits.length > 0
            ? habit.long_term_benefits 
            : ['Transformation durable', 'Nouvelle identité', 'Automatisation du comportement'],
          personalized_tips: habit.personalized_tip 
            ? [habit.personalized_tip] 
            : [`Adapte cette pratique à ton rythme, ${firstName}`],
          recommended_time: habit.recommended_time || 'morning',
          duration_minutes: typeof habit.duration_minutes === 'number' ? habit.duration_minutes : 10,
          frequency: habit.frequency || 'daily',
          difficulty_level: typeof habit.difficulty_level === 'number' ? habit.difficulty_level : 2,
          xp_reward: typeof habit.xp_reward === 'number' ? habit.xp_reward : 15,
        };

        console.log(`[BootstrapAI] Wiki data prepared:`, JSON.stringify(wikiData).substring(0, 200));
        
        const { data: wikiResult, error: wikiError } = await supabase
          .from('program_elements_wiki')
          .insert(wikiData)
          .select()
          .single();
        
        if (wikiError) {
          console.error(`[BootstrapAI] ❌ WIKI INSERT ERROR for "${habit.name}":`, JSON.stringify(wikiError));
          // On continue quand même, l'habitude est créée
        } else {
          console.log(`[BootstrapAI] ✅ Wiki created for "${habit.name}", id: ${wikiResult?.id}`);
        }
      }
    }

    // 8. Créer les tâches
    const createdTasks = [];
    const startDate = new Date();
    
    for (const task of generatedProgram.tasks || []) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + task.day_offset);

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          title: task.title,
          description: `${task.description}\n\n📖 Pourquoi maintenant: ${task.why_now}\n\n✅ Comment faire: ${task.how_to_complete}`,
          priority: task.priority,
          status: 'todo',
          due_date: dueDate.toISOString().split('T')[0],
          created_from_program: programId,
        })
        .select()
        .single();

      if (!error && createdTask) {
        createdTasks.push(createdTask);

        // ===== CRÉATION WIKI POUR TÂCHE =====
        console.log(`[BootstrapAI] Creating wiki for task: ${task.title}`);
        
        const taskWikiData = {
          program_id: programId,
          user_id: userId,
          element_type: 'task',
          linked_item_id: createdTask.id,
          title: task.title,
          short_description: task.description || '',
          why_this_practice: task.why_now || `Cette tâche est essentielle pour progresser dans ton programme.`,
          scientific_basis: `La méthode GTD (Getting Things Done) montre que capturer et exécuter les tâches réduit la charge mentale de 40%.`,
          methodology_source: 'Getting Things Done - David Allen',
          how_to_guide: task.how_to_complete 
            ? [{ step: 1, description: task.how_to_complete }]
            : [{ step: 1, description: 'Réserve du temps dédié sans distractions.' }, { step: 2, description: 'Divise en sous-étapes si nécessaire.' }],
          best_practices: ['Bloque du temps dans ton calendrier', 'Élimine les distractions', 'Commence par la partie la plus difficile'],
          common_mistakes: ['Procrastiner', 'Multitâcher', 'Viser la perfection'],
          immediate_benefits: ['Avancer sur ton programme', 'Réduire le stress'],
          long_term_benefits: ['Atteindre tes objectifs', 'Construire ta discipline'],
          personalized_tips: [`Cette tâche est prévue pour le jour ${task.day_offset + 1} de ton programme, ${firstName}`],
          recommended_time: 'morning',
          duration_minutes: typeof task.estimated_minutes === 'number' ? task.estimated_minutes : 30,
          frequency: 'once',
          difficulty_level: task.priority === 'high' ? 3 : 2,
          xp_reward: 20,
        };

        const { error: taskWikiError } = await supabase
          .from('program_elements_wiki')
          .insert(taskWikiData);
        
        if (taskWikiError) {
          console.error(`[BootstrapAI] ❌ TASK WIKI ERROR for "${task.title}":`, JSON.stringify(taskWikiError));
        } else {
          console.log(`[BootstrapAI] ✅ Wiki created for task "${task.title}"`);
        }
      }
    }

    // 9. Créer les objectifs
    const createdGoals = [];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + program.duration_days);
    
    for (const goal of generatedProgram.goals || []) {
      const { data: createdGoal, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          title: goal.title,
          description: goal.description,
          target: goal.target,
          unit: goal.unit,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          created_from_program: programId,
        })
        .select()
        .single();

      if (!error && createdGoal) {
        createdGoals.push(createdGoal);
      }
    }

    // 10. Sauvegarder les messages Sage quotidiens
    for (const msg of generatedProgram.daily_messages || []) {
      try {
        await supabase.from('program_daily_messages').insert({
          program_id: programId,
          user_id: userId,
          day_number: msg.day,
          morning_message: msg.morning_message,
          evening_message: msg.evening_message,
          daily_tip: msg.tip_of_day,
          reflection_prompt: msg.reflection_prompt,
        });
      } catch {
        // Ignorer si table n'existe pas
      }
    }

    // 11. Créer l'entrée journal de bienvenue
    const day1 = generatedProgram.daily_messages?.[0];
    await supabase.from('journal_entries').insert({
      user_id: userId,
      workspace_id: workspaceId,
      entry_date: new Date().toISOString().split('T')[0],
      mood: 'good',
      energy_level: 'high',
      content: `🚀 J'ai commencé le programme "${generatedProgram.title || program.name}" !\n\n${day1?.morning_message || 'C\'est parti !'}`,
      domain: 'personal',
      created_from_program: programId,
    });

    // 12. Sauvegarder le programme généré
    try {
      await supabase.from('ai_generated_programs').insert({
        user_id: userId,
        title: generatedProgram.title,
        subtitle: generatedProgram.subtitle,
        description: generatedProgram.description,
        duration_days: program.duration_days,
        program_type: program.category,
        methodologies: [generatedProgram.methodology],
        scientific_references: [{ source: generatedProgram.methodology, key_insight: generatedProgram.scientific_basis }],
        global_explanation: generatedProgram.scientific_basis,
        expected_outcomes: generatedProgram.expected_outcomes,
        daily_schedule: generatedProgram.daily_messages,
        user_profile_snapshot: { firstName, interests, goals: { goalDiscipline, goalMental, goalFinance } },
        status: 'active',
        current_day: 1,
      });
    } catch {
      // Ignorer si table n'existe pas
    }

    console.log(`[BootstrapAI] SUCCESS! Created ${createdHabits.length} habits, ${createdTasks.length} tasks, ${createdGoals.length} goals`);

    return new Response(
      JSON.stringify({
        success: true,
        userProgramId: userProgram.id,
        programName: generatedProgram.title || program.name,
        itemsCreated: createdHabits.length + createdTasks.length + createdGoals.length,
        details: {
          habits: createdHabits.length,
          tasks: createdTasks.length,
          goals: createdGoals.length,
          wikiEntries: createdHabits.length,
        },
        personalization: {
          level: personalizationLevel,
          interests,
          userName: firstName,
          tone: sageTone,
        },
        generatedContent: {
          title: generatedProgram.title,
          subtitle: generatedProgram.subtitle,
          methodology: generatedProgram.methodology,
          expectedOutcomes: generatedProgram.expected_outcomes,
        },
        archivedPrevious: !!existingProgram,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BootstrapAI] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// BUILD USER PROMPT
// ============================================
function buildUserPrompt(params: {
  programName: string;
  programDescription: string;
  programCategory: string;
  programDuration: number;
  firstName: string;
  interests: string[];
  sageTone: string;
  goalDiscipline: number;
  goalMental: number;
  goalFinance: number;
  personalizationLevel: string;
}): string {
  const toneInstructions: Record<string, string> = {
    encouraging: 'Sois chaleureux, motivant, célèbre chaque petit progrès. Utilise des emojis modérément.',
    direct: 'Sois concis, factuel, sans fioritures. Challenge l\'utilisateur.',
    gentle: 'Sois doux, empathique, sans pression. Rassure et accompagne.',
  };

  return `
GÉNÈRE UN PROGRAMME COMPLET pour cette personne:

=== PROFIL UTILISATEUR ===
- Prénom: ${params.firstName}
- Centres d'intérêt: ${params.interests.length > 0 ? params.interests.join(', ') : 'Non spécifiés - reste général'}
- Ton préféré de Sage: ${params.sageTone} (${toneInstructions[params.sageTone] || toneInstructions.encouraging})
- Niveau personnalisation: ${params.personalizationLevel}

=== OBJECTIFS (importance sur 100) ===
- Discipline & Productivité: ${params.goalDiscipline}%
- Équilibre Mental & Bien-être: ${params.goalMental}%
- Stabilité Financière: ${params.goalFinance}%

=== PROGRAMME SÉLECTIONNÉ ===
- Nom: ${params.programName}
- Description: ${params.programDescription}
- Catégorie: ${params.programCategory}
- Durée: ${params.programDuration} jours

=== CE QUE TU DOIS GÉNÉRER (JSON) ===

{
  "title": "Titre personnalisé du programme pour ${params.firstName}",
  "subtitle": "Sous-titre accrocheur avec la promesse de résultat",
  "description": "Description engageante de 2-3 phrases expliquant le programme",
  "methodology": "Nom de la méthodologie principale (ex: Atomic Habits)",
  "scientific_basis": "Paragraphe expliquant POURQUOI ce programme fonctionne, avec références scientifiques",
  "expected_outcomes": [
    "${params.firstName} aura développé...",
    "${params.firstName} maîtrisera...",
    "${params.firstName} ressentira..."
  ],
  "habits": [
    {
      "name": "Nom de l'habitude",
      "description": "Description courte (1-2 phrases)",
      "frequency": "daily",
      "recommended_time": "morning",
      "duration_minutes": 10,
      "difficulty_level": 2,
      "xp_reward": 15,
      "why_important": "Paragraphe détaillé expliquant POURQUOI cette habitude est cruciale. Inclure des mécanismes psychologiques/biologiques.",
      "scientific_basis": "Études scientifiques qui prouvent l'efficacité. Citer Harvard, Stanford, ou des chercheurs spécifiques.",
      "methodology_source": "Atomic Habits - James Clear, Chapitre X",
      "how_to_steps": [
        "1. Première étape concrète",
        "2. Deuxième étape",
        "3. Troisième étape",
        "4. Comment ancrer l'habitude"
      ],
      "best_practices": ["Conseil 1", "Conseil 2", "Conseil 3"],
      "common_mistakes": ["Erreur 1 à éviter", "Erreur 2 à éviter"],
      "immediate_benefits": ["Bénéfice visible dès la 1ère semaine"],
      "long_term_benefits": ["Bénéfice après 1 mois+"],
      "personalized_tip": "Conseil personnalisé pour ${params.firstName} basé sur ses intérêts (${params.interests.join(', ') || 'général'})"
    }
  ],
  "tasks": [
    {
      "title": "Titre de la tâche",
      "description": "Description détaillée",
      "priority": "high",
      "day_offset": 0,
      "estimated_minutes": 20,
      "why_now": "Pourquoi cette tâche doit être faite à ce moment du programme",
      "how_to_complete": "Instructions pas à pas pour réussir cette tâche"
    }
  ],
  "goals": [
    {
      "title": "Compléter 80% des habitudes",
      "description": "Maintenir un taux de complétion élevé sur toute la durée",
      "target": 80,
      "unit": "percent"
    }
  ],
  "daily_messages": [
    {
      "day": 1,
      "morning_message": "Message de Sage pour le matin du jour 1 (utilise le prénom ${params.firstName})",
      "evening_message": "Message de réflexion du soir",
      "tip_of_day": "Conseil du jour basé sur la science",
      "reflection_prompt": "Question de journal pour ce soir"
    },
    {
      "day": 7,
      "morning_message": "Message de célébration de la 1ère semaine",
      "evening_message": "Bilan de la semaine",
      "tip_of_day": "Conseil pour maintenir le momentum",
      "reflection_prompt": "Qu'est-ce qui a changé en 7 jours?"
    }
  ]
}

=== RÈGLES IMPORTANTES ===
1. Génère EXACTEMENT 5-7 habitudes adaptées au type de programme
2. Génère 5-8 tâches réparties sur les ${params.programDuration} jours
3. Génère 2-3 objectifs mesurables
4. Génère des daily_messages pour les jours clés: 1, 7, 14, 21, ${params.programDuration}
5. PERSONNALISE tout selon les intérêts: ${params.interests.join(', ') || 'aucun spécifié'}
6. Adapte l'intensité selon les objectifs (discipline: ${params.goalDiscipline}%, mental: ${params.goalMental}%)
7. Chaque habitude doit avoir des explications SCIENTIFIQUES détaillées
8. Le ton doit être: ${params.sageTone}

GÉNÈRE MAINTENANT LE JSON COMPLET:`;
}
