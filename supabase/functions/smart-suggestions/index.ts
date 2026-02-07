import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

// Simple hash function for context comparison
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  const corsHeaders = getCorsHeaders(req);

  const startTime = Date.now();

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

    // Parse request body for weather inclusion
    const body = await req.json().catch(() => ({}));
    const { includeWeather, weather } = body;

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

    // === CACHE CHECK ===
    const cacheKey = 'smart_suggestions';
    const contextHash = simpleHash(JSON.stringify({
      interests: userInterests?.map((i: any) => i.interest_id).sort(),
      goals: profile?.onboarding_goals,
    }));

    const { data: cached } = await supabase
      .from('ai_suggestions_cache')
      .select('suggestions')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .eq('context_hash', contextHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      const cacheTime = Date.now() - startTime;
      console.log(`Cache HIT - ${cacheTime}ms`);
      return new Response(JSON.stringify({
        ...cached.suggestions,
        cached: true,
        responseTime: cacheTime,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Récupérer le learning profile pour personnalisation
    const { data: learningProfile } = await supabase
      .from('user_learning_profile')
      .select('preferred_tone, positive_feedback_rate')
      .eq('user_id', user.id)
      .single();

    // === ENRICHISSEMENT HISTORIQUE ===
    // Récupérer les 5 dernières entrées journal
    const { data: recentJournal } = await supabase
      .from('journal_entries')
      .select('mood, reflections, energy, date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Récupérer les habitudes les plus complétées (10 dernières)
    const { data: topHabits } = await supabase
      .from('habit_logs')
      .select('habits(name)')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(10);

    // Récupérer les scores récents pour le contexte
    const { data: recentScores } = await supabase
      .from('scores_daily')
      .select('global_score, momentum_index, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7);

    // Récupérer les victoires récentes
    const { data: recentWins } = await supabase
      .from('wins')
      .select('title, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Construire le contexte enrichi
    const recentMoods = recentJournal?.map(j => j.mood).filter(Boolean) || [];
    const recentReflections = recentJournal?.map(j => j.reflections?.slice(0, 100)).filter(Boolean) || [];
    const activeHabits = [...new Set(topHabits?.map((h: any) => h.habits?.name).filter(Boolean))] as string[];
    const avgScore = recentScores?.length 
      ? Math.round(recentScores.reduce((a, s) => a + (s.global_score || 0), 0) / recentScores.length)
      : null;
    const momentum = recentScores?.[0]?.momentum_index;
    const winCategories = [...new Set(recentWins?.map(w => w.category).filter(Boolean))];

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

    // === BUILD WEATHER CONTEXT ===
    let weatherContext = '';
    if (includeWeather && weather) {
      weatherContext = `

MÉTÉO ACTUELLE :
- Condition : ${weather.condition}
- Température : ${weather.temperature}°C
- Description : ${weather.description}

RÈGLES D'ADAPTATION MÉTÉO :
- Si pluie/orage : privilégier activités indoor (lecture, méditation, jeux de société, cuisine)
- Si beau temps (clear/sunny) : suggérer activités outdoor (randonnée, sport extérieur, pique-nique)
- Si froid (<10°C) : activités indoor ou sport indoor (yoga, musculation)
- Si chaud (>25°C) : activités aquatiques, sorties matinales, activités à l'ombre
- Si nuageux : activités polyvalentes (visites culturelles, balades légères)
`;
    }

    // === PROMPT ENRICHI AVEC HISTORIQUE ===
    const prompt = `Tu es un assistant qui crée des suggestions d'activités personnalisées et originales.

UTILISATEUR :
- Prénom : ${profile?.first_name || 'Utilisateur'}
- Localisation : ${location || 'Non spécifiée'}
- Intérêts : ${interestNames.join(', ')}
- Focus principal : ${focusPrincipal}

HISTORIQUE RÉCENT (7 jours) :
- Humeurs récentes : ${recentMoods.length > 0 ? recentMoods.join(', ') : 'non disponible'}
- Score moyen : ${avgScore !== null ? avgScore + '/100' : 'non disponible'}
- Momentum : ${momentum !== undefined ? (momentum > 50 ? 'positif (' + momentum + ')' : 'en baisse (' + momentum + ')') : 'non disponible'}
- Habitudes actives : ${activeHabits.length > 0 ? activeHabits.slice(0, 5).join(', ') : 'aucune'}
- Dernière réflexion : "${recentReflections[0] || 'aucune'}"
- Catégories de victoires : ${winCategories.length > 0 ? winCategories.join(', ') : 'aucune récente'}
${weatherContext}
STYLE : ${toneInstruction}

MISSION :
${includeWeather ? `Génère exactement 3 suggestions d'activités ADAPTÉES À LA MÉTÉO qui combinent au moins 2 intérêts de l'utilisateur.` : `Génère exactement 3 suggestions d'activités qui COMBINENT au moins 2 intérêts de l'utilisateur.`}
Chaque suggestion doit :
- Être originale et actionnable
- Tenir compte de l'historique récent (humeur, momentum, habitudes)
- Être adaptée à la localisation si possible
${includeWeather ? '- TENIR COMPTE DE LA MÉTÉO pour proposer des activités indoor/outdoor adaptées' : ''}
- Proposer quelque chose de cohérent avec les victoires récentes si applicables

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "suggestions": [
    {
      "title": "Titre court et accrocheur",
      "description": "Description de 2-3 phrases expliquant l'activité et POURQUOI elle est pertinente pour l'utilisateur",
      "interests_combined": ["intérêt1", "intérêt2"],
      "difficulty": "facile|moyen|challengeant",
      "duration": "30min|1h|2h|demi-journée"${includeWeather ? `,
      "indoor": true ou false,
      "weather_reason": "Pourquoi cette activité est adaptée à la météo actuelle"` : ''}
    }
  ]${includeWeather ? `,
  "weatherSuggestions": [
    {
      "activity": "Nom de l'activité adaptée à la météo",
      "reason": "Explication courte de pourquoi c'est adapté",
      "indoor": true ou false,
      "interests": ["intérêt1", "intérêt2"]
    }
  ]` : ''}
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

    const responsePayload = { 
      suggestions,
      interests: interestNames,
      location 
    };

    // === CACHE WRITE ===
    // Get user's workspace for cache entry
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    await supabase.from('ai_suggestions_cache').upsert({
      user_id: user.id,
      workspace_id: membership?.workspace_id,
      cache_key: cacheKey,
      suggestions: responsePayload,
      context_hash: contextHash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour TTL
    }, { onConflict: 'user_id,cache_key' });

    const totalTime = Date.now() - startTime;
    console.log(`Cache MISS - Generated in ${totalTime}ms`);

    return new Response(JSON.stringify({
      ...responsePayload,
      cached: false,
      responseTime: totalTime,
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
