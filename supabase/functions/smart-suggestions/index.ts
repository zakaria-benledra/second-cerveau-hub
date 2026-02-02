import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ 
        error: 'AI not configured',
        suggestions: [] 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Récupérer les intérêts de l'utilisateur
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select(`
        interest_id,
        intensity,
        interests!inner(name, category, keywords)
      `)
      .eq('user_id', user.id);

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, location_city, location_country, onboarding_goals')
      .eq('id', user.id)
      .single();

    // Récupérer le learning profile pour personnalisation
    const { data: learningProfile } = await supabase
      .from('user_learning_profile')
      .select('preferred_tone, positive_feedback_rate')
      .eq('user_id', user.id)
      .single();

    if (!userInterests || userInterests.length < 2) {
      return new Response(JSON.stringify({ 
        suggestions: [],
        message: 'Ajoute au moins 2 centres d\'intérêt pour des suggestions combinées'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Extraire les noms d'intérêts
    const interestNames = userInterests.map((i: any) => i.interests.name);
    const location = [profile?.location_city, profile?.location_country].filter(Boolean).join(', ');
    const goals = (profile?.onboarding_goals as Record<string, number>) || {};
    
    // Adapter le ton selon le learning profile
    const tone = learningProfile?.preferred_tone || 'balanced';
    const toneInstruction = tone === 'supportive' 
      ? 'Sois chaleureux et encourageant.'
      : tone === 'challenging' 
        ? 'Propose des défis stimulants.'
        : 'Équilibre encouragement et challenge.';

    // Déterminer le focus principal
    let focusPrincipal = 'équilibre vie/travail';
    if (goals.mentalBalance > 70) focusPrincipal = 'bien-être et relaxation';
    else if (goals.discipline > 70) focusPrincipal = 'productivité et discipline';
    else if (goals.finance > 70) focusPrincipal = 'gestion financière';

    const prompt = `Tu es un assistant qui crée des suggestions d'activités personnalisées et originales.

UTILISATEUR :
- Prénom : ${profile?.first_name || 'Utilisateur'}
- Localisation : ${location || 'Non spécifiée'}
- Intérêts : ${interestNames.join(', ')}
- Focus principal : ${focusPrincipal}

STYLE : ${toneInstruction}

MISSION :
Génère exactement 3 suggestions d'activités qui COMBINENT au moins 2 intérêts de l'utilisateur.
Chaque suggestion doit être originale, actionnable et adaptée à la localisation si possible.

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "suggestions": [
    {
      "title": "Titre court et accrocheur",
      "description": "Description de 2-3 phrases expliquant l'activité",
      "interests_combined": ["intérêt1", "intérêt2"],
      "difficulty": "facile|moyen|challengeant",
      "duration": "30min|1h|2h|demi-journée"
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          suggestions: [] 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted',
          suggestions: [] 
        }), { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      console.error('AI gateway error:', aiResponse.status);
      return new Response(JSON.stringify({ 
        error: 'AI error',
        suggestions: [] 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{"suggestions":[]}';
    
    // Parser la réponse JSON
    let suggestions = [];
    try {
      // Nettoyer le contenu de tout markdown
      const cleanContent = content.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      suggestions = parsed.suggestions || [];
    } catch (e) {
      console.error('Parse error:', e, 'Content:', content);
      suggestions = [];
    }

    return new Response(JSON.stringify({ 
      suggestions,
      interests: interestNames,
      location 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart suggestions error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
