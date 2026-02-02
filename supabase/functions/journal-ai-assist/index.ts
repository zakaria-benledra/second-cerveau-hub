import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const reflectionPrompts: Record<string, string[]> = {
  travail: [
    "Qu'est-ce qui t'a le plus motivé dans ton travail aujourd'hui ?",
    "Quel obstacle as-tu rencontré et comment l'as-tu géré ?",
    "Quelle compétence aimerais-tu développer cette semaine ?",
    "Si tu pouvais changer une chose dans ta journée de travail, ce serait quoi ?"
  ],
  santé: [
    "Comment ton corps s'est-il senti aujourd'hui ?",
    "Qu'as-tu fait pour prendre soin de toi ?",
    "Quel petit geste santé pourrais-tu ajouter demain ?",
    "Comment ton sommeil a-t-il affecté ta journée ?"
  ],
  finance: [
    "As-tu fait un achat que tu pourrais éviter ?",
    "Qu'est-ce qui te rapproche de tes objectifs financiers ?",
    "Quel investissement (temps, argent, énergie) a été le plus rentable ?",
    "Comment te sens-tu par rapport à ta situation financière actuelle ?"
  ],
  relation: [
    "Quelle interaction t'a le plus marqué aujourd'hui ?",
    "Y a-t-il quelqu'un à qui tu aimerais exprimer ta gratitude ?",
    "Comment as-tu contribué au bien-être de quelqu'un ?",
    "Quelle relation aimerais-tu renforcer cette semaine ?"
  ],
  identité: [
    "Quel moment t'a fait te sentir vraiment toi-même ?",
    "Qu'as-tu appris sur toi aujourd'hui ?",
    "Quelle valeur as-tu honorée aujourd'hui ?",
    "Vers quelle version de toi veux-tu tendre ?"
  ]
}

const moodBasedPrompts: Record<string, string[]> = {
  great: [
    "Qu'est-ce qui a rendu cette journée exceptionnelle ?",
    "Comment peux-tu reproduire cette énergie demain ?",
    "Qui aimerais-tu partager cette joie avec ?"
  ],
  good: [
    "Quel a été le meilleur moment de ta journée ?",
    "Qu'est-ce qui t'a donné de l'énergie ?",
    "De quoi es-tu fier aujourd'hui ?"
  ],
  neutral: [
    "Qu'est-ce qui aurait pu rendre ta journée meilleure ?",
    "Y a-t-il quelque chose que tu repousses ?",
    "Quel petit changement pourrait faire une différence demain ?"
  ],
  low: [
    "Qu'est-ce qui t'a pesé aujourd'hui ?",
    "De quoi aurais-tu besoin pour te sentir mieux ?",
    "Quelle est une chose positive, même petite, de cette journée ?"
  ],
  bad: [
    "Qu'est-ce qui t'a le plus affecté ?",
    "Qu'est-ce qui pourrait t'aider à traverser ce moment ?",
    "Qui pourrait t'apporter du soutien ?",
    "Quelle leçon cette difficulté pourrait-elle contenir ?"
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { entry_id, domain, mood_score, content, action } = body

    // Get workspace
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    const workspaceId = membership?.workspace_id

    if (action === 'get_suggestions') {
      // === ENRICHISSEMENT HISTORIQUE ===
      // Récupérer les 5 dernières entrées journal
      const { data: recentJournal } = await supabase
        .from('journal_entries')
        .select('mood, reflections, energy, date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Récupérer les habitudes actives
      const { data: topHabits } = await supabase
        .from('habit_logs')
        .select('habits(name)')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(10)

      // Récupérer les intérêts utilisateur
      const { data: userInterests } = await supabase
        .from('user_interests')
        .select('interests(name)')
        .eq('user_id', user.id)

      // Construire le contexte enrichi
      const recentMoods = recentJournal?.map(j => j.mood).filter(Boolean) || []
      const recentReflections = recentJournal?.map(j => j.reflections?.slice(0, 100)).filter(Boolean) || []
      const activeHabits = [...new Set(topHabits?.map((h: any) => h.habits?.name).filter(Boolean))]
      const interests = userInterests?.map((i: any) => i.interests?.name).filter(Boolean) || []

      // Generate 4 contextual suggestions with enriched context
      const suggestions: string[] = []

      // 1. Add domain-specific prompt (introspection) - personalized with history
      if (domain && reflectionPrompts[domain]) {
        const domainPrompts = reflectionPrompts[domain]
        let selectedPrompt = domainPrompts[Math.floor(Math.random() * domainPrompts.length)]
        
        // Enrich with habits context if available
        if (activeHabits.length > 0 && domain === 'santé') {
          selectedPrompt = `Avec tes habitudes (${activeHabits.slice(0, 2).join(', ')}), ${selectedPrompt.toLowerCase()}`
        }
        suggestions.push(selectedPrompt)
      } else {
        suggestions.push("Qu'est-ce qui t'a le plus marqué aujourd'hui ?")
      }

      // 2. Add mood-based prompt (emotional) - consider mood trend
      const moodKey = mood_score >= 80 ? 'great' 
        : mood_score >= 60 ? 'good'
        : mood_score >= 40 ? 'neutral'
        : mood_score >= 20 ? 'low'
        : 'bad'
      
      const moodPrompts = moodBasedPrompts[moodKey]
      let moodPrompt = moodPrompts[Math.floor(Math.random() * moodPrompts.length)]
      
      // Add trend awareness
      if (recentMoods.length >= 3) {
        const moodTrend = recentMoods.slice(0, 3)
        const allSame = moodTrend.every(m => m === moodTrend[0])
        if (allSame && moodKey === 'good') {
          moodPrompt = "Tu sembles en bonne forme ces derniers jours. Qu'est-ce qui maintient cette énergie positive ?"
        } else if (allSame && (moodKey === 'low' || moodKey === 'bad')) {
          moodPrompt = "Cette période semble difficile. Quel petit changement pourrait faire une différence ?"
        }
      }
      suggestions.push(moodPrompt)

      // 3. Add action-oriented prompt - connected to interests
      let actionPrompt: string
      if (interests.length > 0) {
        const randomInterest = interests[Math.floor(Math.random() * interests.length)]
        actionPrompt = `Comment pourrais-tu intégrer ${randomInterest} dans ton plan pour demain ?`
      } else {
        const actionPrompts = [
          "Quelle action concrète pourrais-tu faire demain suite à cette réflexion ?",
          "Quel petit pas pourrais-tu faire dès maintenant ?",
          "Comment pourrais-tu transformer cette pensée en action ?",
          "Quel engagement prends-tu avec toi-même pour demain ?"
        ]
        actionPrompt = actionPrompts[Math.floor(Math.random() * actionPrompts.length)]
      }
      suggestions.push(actionPrompt)

      // 4. Add pattern recognition prompt - based on recent reflections
      let connectionPrompt: string
      if (recentReflections.length >= 2) {
        connectionPrompt = "En relisant tes dernières réflexions, quel pattern ou thème récurrent observes-tu ?"
      } else if (activeHabits.length > 0) {
        connectionPrompt = `Comment tes habitudes (${activeHabits.slice(0, 2).join(', ')}) influencent-elles ton état d'esprit ?`
      } else {
        const connectionPrompts = [
          "Comment cette réflexion se connecte-t-elle à tes objectifs de vie ?",
          "Quelle habitude cette pensée pourrait-elle renforcer ?",
          "En quoi cela te rapproche de la personne que tu veux devenir ?",
          "Quel pattern ou schéma récurrent observes-tu ?"
        ]
        connectionPrompt = connectionPrompts[Math.floor(Math.random() * connectionPrompts.length)]
      }
      suggestions.push(connectionPrompt)

      // Store suggestions with enriched context
      for (const suggestion of suggestions) {
        await supabase.from('journal_ai_assists').insert({
          entry_id: entry_id || null,
          user_id: user.id,
          workspace_id: workspaceId,
          suggestion,
          suggestion_type: 'reflection',
          accepted: false
        })
      }

      return new Response(JSON.stringify({
        success: true,
        suggestions,
        context: {
          recentMoods: recentMoods.slice(0, 3),
          activeHabits: activeHabits.slice(0, 3),
          interests: interests.slice(0, 3)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'accept_suggestion') {
      const { suggestion_id } = body
      
      await supabase
        .from('journal_ai_assists')
        .update({ accepted: true })
        .eq('id', suggestion_id)
        .eq('user_id', user.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'reformulate') {
      // Simple reformulation suggestions (without external AI)
      const reformulations = [
        `Tu pourrais aussi écrire : "J'ai ressenti que ${content?.slice(0, 50)}..."`,
        `Une autre façon de le dire : "Ce qui m'a marqué, c'est ${content?.slice(0, 30)}..."`,
        `Version structurée : SITUATION → ÉMOTION → APPRENTISSAGE`
      ]

      return new Response(JSON.stringify({
        success: true,
        reformulations: reformulations.slice(0, 2)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Journal AI Assist error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
