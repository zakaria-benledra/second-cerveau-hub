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
      // Generate contextual suggestions
      const suggestions: string[] = []

      // Add domain-specific prompts
      if (domain && reflectionPrompts[domain]) {
        const domainPrompts = reflectionPrompts[domain]
        suggestions.push(domainPrompts[Math.floor(Math.random() * domainPrompts.length)])
      }

      // Add mood-based prompts
      const moodKey = mood_score >= 80 ? 'great' 
        : mood_score >= 60 ? 'good'
        : mood_score >= 40 ? 'neutral'
        : mood_score >= 20 ? 'low'
        : 'bad'
      
      const moodPrompts = moodBasedPrompts[moodKey]
      suggestions.push(moodPrompts[Math.floor(Math.random() * moodPrompts.length)])

      // Add a generic reflection
      const genericPrompts = [
        "Qu'est-ce que tu veux te rappeler de cette journée ?",
        "Si tu devais donner un titre à cette journée, ce serait quoi ?",
        "Quelle intention poses-tu pour demain ?"
      ]
      suggestions.push(genericPrompts[Math.floor(Math.random() * genericPrompts.length)])

      // Store suggestions
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
        suggestions
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
