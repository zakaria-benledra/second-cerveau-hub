import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  id: string;
  first_name?: string;
  interests?: string[];
  personalization_level?: string;
  ai_preferences?: {
    suggestion_frequency?: string;
    exploration_enabled?: boolean;
  };
}

interface ProgramTemplate {
  id: string;
  template_type: string;
  day_to_create: number;
  title: string;
  description: string;
  category: string;
  frequency?: string;
  priority?: string;
  personalization_tags: string[];
  difficulty: string;
  target_value?: number;
  is_required?: boolean;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { programId, userId } = await req.json();

    if (!programId || !userId) {
      throw new Error('programId and userId are required');
    }

    console.log(`[Bootstrap] Starting for user ${userId}, program ${programId}`);

    // 1. Récupérer le profil utilisateur pour personnalisation
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const profile: UserProfile = userProfile || { id: userId };
    const userInterests = profile.interests || [];
    const personalizationLevel = profile.personalization_level || 'balanced';

    console.log(`[Bootstrap] User interests: ${userInterests.join(', ')}`);
    console.log(`[Bootstrap] Personalization level: ${personalizationLevel}`);

    // Get user's workspace
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    const workspaceId = membership?.workspace_id;

    // 2. Archiver l'ancien programme actif (si existe)
    const { data: existingProgram } = await supabase
      .from('user_programs')
      .select('*, programs(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingProgram) {
      console.log(`[Bootstrap] Archiving existing program: ${existingProgram.programs?.name}`);

      // Récupérer les éléments créés par l'ancien programme
      const { data: createdItems } = await supabase
        .from('program_created_items')
        .select('*')
        .eq('user_program_id', existingProgram.id);

      // Calculer le taux de complétion
      const { data: progressData } = await supabase
        .from('user_program_progress')
        .select('*')
        .eq('user_program_id', existingProgram.id);

      const completedDays = progressData?.filter((p: { main_mission_completed: boolean }) => p.main_mission_completed).length || 0;
      const totalDays = existingProgram.programs?.duration_days || 1;
      const completionRate = Math.round((completedDays / totalDays) * 100);

      // Créer l'archive
      await supabase.from('program_archives').insert({
        user_id: userId,
        workspace_id: workspaceId,
        program_id: existingProgram.program_id,
        original_user_program_id: existingProgram.id,
        started_at: existingProgram.started_at,
        final_status: 'replaced',
        days_completed: existingProgram.current_day - 1,
        total_xp_earned: existingProgram.total_xp_earned || 0,
        completion_rate: completionRate,
        performance_data: {
          streak_at_end: existingProgram.streak_days || 0,
          progress_entries: progressData?.length || 0,
        },
        created_habits: createdItems?.filter((i: { item_type: string }) => i.item_type === 'habit').map((i: { item_id: string }) => i.item_id) || [],
        created_tasks: createdItems?.filter((i: { item_type: string }) => i.item_type === 'task').map((i: { item_id: string }) => i.item_id) || [],
        created_goals: createdItems?.filter((i: { item_type: string }) => i.item_type === 'goal').map((i: { item_id: string }) => i.item_id) || [],
        ai_analysis: {
          user_interests_at_time: userInterests,
          personalization_level: personalizationLevel,
        },
      });

      // Marquer l'ancien programme comme remplacé
      await supabase
        .from('user_programs')
        .update({ status: 'abandoned' })
        .eq('id', existingProgram.id);
    }

    // 3. Créer le nouveau programme utilisateur
    const { data: newUserProgram, error: programError } = await supabase
      .from('user_programs')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        program_id: programId,
        status: 'active',
        current_day: 1,
      })
      .select('*, programs(*)')
      .single();

    if (programError) throw programError;

    console.log(`[Bootstrap] Created user program: ${newUserProgram.id}`);

    // 4. Récupérer les templates du programme
    const { data: templates } = await supabase
      .from('program_templates')
      .select('*')
      .eq('program_id', programId)
      .order('day_to_create');

    if (!templates || templates.length === 0) {
      console.log(`[Bootstrap] No templates found for program ${programId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          userProgramId: newUserProgram.id,
          programName: newUserProgram.programs?.name,
          itemsCreated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Filtrer et personnaliser les templates
    const filteredTemplates = templates.filter((template: ProgramTemplate) => {
      // Jour 1 = toujours créer
      if (template.day_to_create === 1) return true;

      // Pour les autres jours, vérifier la personnalisation
      const templateTags = template.personalization_tags || [];
      
      // Si conservative, ne créer que les éléments "required"
      if (personalizationLevel === 'conservative') {
        return template.is_required !== false;
      }
      
      // Si exploratory, créer tous les éléments
      if (personalizationLevel === 'exploratory') {
        return true;
      }
      
      // Balanced: créer si tags matchent les intérêts ou si required
      if (template.is_required !== false) return true;
      
      const hasMatchingInterest = templateTags.some((tag: string) => 
        userInterests.some((interest: string) => 
          interest.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      );
      
      return hasMatchingInterest;
    });

    console.log(`[Bootstrap] Filtered templates: ${filteredTemplates.length}/${templates.length}`);

    // 6. Créer les éléments (habitudes, tâches, objectifs)
    const createdItems: { type: string; id: string; templateId: string }[] = [];

    for (const template of filteredTemplates as ProgramTemplate[]) {
      try {
        let itemId: string | null = null;

        if (template.template_type === 'habit') {
          // Créer l'habitude
          const { data: habit, error } = await supabase
            .from('habits')
            .insert({
              user_id: userId,
              workspace_id: workspaceId,
              title: template.title,
              description: template.description,
              category: template.category || 'general',
              frequency: template.frequency || 'daily',
              is_active: true,
              streak: 0,
              created_from_program: programId,
            })
            .select()
            .single();

          if (!error && habit) {
            itemId = habit.id;
            console.log(`[Bootstrap] Created habit: ${template.title}`);
          }
        } 
        else if (template.template_type === 'task') {
          // Créer la tâche (programmée pour le jour approprié)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (template.day_to_create - 1));

          const { data: task, error } = await supabase
            .from('tasks')
            .insert({
              user_id: userId,
              workspace_id: workspaceId,
              title: template.title,
              description: template.description,
              priority: template.priority || 'medium',
              status: 'todo',
              due_date: dueDate.toISOString().split('T')[0],
              created_from_program: programId,
            })
            .select()
            .single();

          if (!error && task) {
            itemId = task.id;
            console.log(`[Bootstrap] Created task: ${template.title}`);
          }
        }
        else if (template.template_type === 'goal') {
          // Créer l'objectif
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + (newUserProgram.programs?.duration_days || 30));

          const { data: goal, error } = await supabase
            .from('goals')
            .insert({
              user_id: userId,
              workspace_id: workspaceId,
              title: template.title,
              description: template.description,
              target_value: template.target_value || 100,
              current_value: 0,
              target_date: targetDate.toISOString().split('T')[0],
              status: 'in_progress',
              created_from_program: programId,
            })
            .select()
            .single();

          if (!error && goal) {
            itemId = goal.id;
            console.log(`[Bootstrap] Created goal: ${template.title}`);
          }
        }

        // Enregistrer le lien programme -> élément
        if (itemId) {
          await supabase.from('program_created_items').insert({
            user_id: userId,
            workspace_id: workspaceId,
            user_program_id: newUserProgram.id,
            item_type: template.template_type,
            item_id: itemId,
            template_id: template.id,
          });

          createdItems.push({
            type: template.template_type,
            id: itemId,
            templateId: template.id,
          });
        }
      } catch (itemError) {
        console.error(`[Bootstrap] Error creating ${template.template_type}: ${itemError}`);
      }
    }

    // 7. Créer une entrée de bienvenue dans le journal
    await supabase.from('journal_entries').insert({
      user_id: userId,
      workspace_id: workspaceId,
      entry_date: new Date().toISOString().split('T')[0],
      mood: 'good',
      energy_level: 'high',
      content: `🚀 J'ai commencé le programme "${newUserProgram.programs?.name}" !

Objectif : ${newUserProgram.programs?.description}

Je suis motivé(e) pour les ${newUserProgram.programs?.duration_days} prochains jours !`,
      domain: 'personal',
      created_from_program: programId,
    });

    console.log(`[Bootstrap] Completed! Created ${createdItems.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        userProgramId: newUserProgram.id,
        programName: newUserProgram.programs?.name,
        itemsCreated: createdItems.length,
        details: {
          habits: createdItems.filter(i => i.type === 'habit').length,
          tasks: createdItems.filter(i => i.type === 'task').length,
          goals: createdItems.filter(i => i.type === 'goal').length,
        },
        personalization: {
          level: personalizationLevel,
          matchedInterests: userInterests,
        },
        archivedPrevious: !!existingProgram,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Bootstrap] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
