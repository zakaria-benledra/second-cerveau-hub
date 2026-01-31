import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRequiredWorkspaceId } from '../_shared/workspace.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= EMOTION DETECTION =============
const EMOTION_KEYWORDS: Record<string, { keywords: string[]; emoji: string }> = {
  'Anxiété': {
    keywords: ['anxieux', 'anxiété', 'stressé', 'stress', 'inquiet', 'inquiétude', 'peur', 'angoisse', 'nerveux', 'tendu', 'panique'],
    emoji: '😰'
  },
  'Joie': {
    keywords: ['heureux', 'heureuse', 'joie', 'content', 'satisfait', 'épanoui', 'ravi', 'bonheur', 'sourire', 'enthousiaste', 'excité'],
    emoji: '😊'
  },
  'Tristesse': {
    keywords: ['triste', 'tristesse', 'déprimé', 'mélancolie', 'malheureux', 'abattu', 'découragé', 'déçu', 'seul', 'isolé'],
    emoji: '😢'
  },
  'Colère': {
    keywords: ['colère', 'énervé', 'frustré', 'irrité', 'agacé', 'furieux', 'rage', 'exaspéré', 'fâché'],
    emoji: '😠'
  },
  'Fatigue': {
    keywords: ['fatigué', 'fatigue', 'épuisé', 'crevé', 'exténué', 'vidé', 'lessivé', 'surmenage', 'burn', 'burnout'],
    emoji: '😩'
  },
  'Motivation': {
    keywords: ['motivé', 'motivation', 'déterminé', 'énergique', 'dynamique', 'productif', 'focus', 'concentré', 'performant'],
    emoji: '💪'
  },
  'Gratitude': {
    keywords: ['reconnaissant', 'gratitude', 'chanceux', 'béni', 'apprécier', 'grâce', 'merci', 'bénédiction'],
    emoji: '🙏'
  },
  'Confusion': {
    keywords: ['confus', 'perdu', 'désorienté', 'incertain', 'doute', 'hésitation', 'indécis', 'flou'],
    emoji: '😵'
  },
  'Sérénité': {
    keywords: ['calme', 'serein', 'paisible', 'zen', 'tranquille', 'détendu', 'relaxé', 'apaisé', 'équilibré'],
    emoji: '😌'
  },
  'Fierté': {
    keywords: ['fier', 'fierté', 'accompli', 'réussi', 'achievement', 'victoire', 'succès', 'accompli'],
    emoji: '🏆'
  }
};

// ============= DOMAIN DETECTION =============
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Travail': ['travail', 'boulot', 'bureau', 'collègue', 'réunion', 'projet', 'client', 'boss', 'carrière', 'entreprise', 'meeting', 'deadline', 'objectif', 'équipe'],
  'Santé': ['santé', 'sport', 'exercice', 'gym', 'médecin', 'sommeil', 'dormir', 'maladie', 'fitness', 'course', 'nutrition', 'régime', 'poids'],
  'Relations': ['famille', 'ami', 'amis', 'couple', 'relation', 'parents', 'enfants', 'conjoint', 'amour', 'dispute', 'réconciliation', 'mariage'],
  'Finances': ['argent', 'budget', 'dépense', 'économie', 'salaire', 'facture', 'dette', 'investissement', 'épargne', 'achat'],
  'Développement personnel': ['apprendre', 'lecture', 'livre', 'méditation', 'habitude', 'objectif', 'croissance', 'amélioration', 'routine', 'discipline'],
  'Créativité': ['créer', 'création', 'art', 'écrire', 'musique', 'dessin', 'projet personnel', 'idée', 'inspiration'],
  'Loisirs': ['vacances', 'voyage', 'film', 'série', 'jeu', 'hobby', 'sortie', 'restaurant', 'fête', 'weekend']
};

// ============= COGNITIVE PATTERNS =============
const COGNITIVE_PATTERNS: Record<string, { keywords: string[]; description: string; type: 'negative' | 'positive' | 'neutral' }> = {
  'Rumination': {
    keywords: ['encore', 'toujours', 'pourquoi', 'sans cesse', 'ressasse', 'revient', 'obsédé', 'arrête pas de penser', 'dans ma tête', 'tourne en boucle'],
    description: 'Tendance à ressasser des pensées négatives de façon répétitive',
    type: 'negative'
  },
  'Catastrophisme': {
    keywords: ['catastrophe', 'terrible', 'horrible', 'jamais', 'impossible', 'fin du monde', 'pire', 'désastre', 'foutu', 'fichu'],
    description: 'Tendance à anticiper le pire scénario possible',
    type: 'negative'
  },
  'Pensée positive': {
    keywords: ['opportunité', 'apprendre', 'grandir', 'solution', 'possible', 'espoir', 'confiance', 'optimiste', 'avancer', 'progresser'],
    description: 'Capacité à voir les aspects positifs et les opportunités',
    type: 'positive'
  },
  'Autodépréciation': {
    keywords: ['nul', 'incapable', 'échec', 'je suis pas', 'je ne peux pas', 'pas assez', 'idiot', 'stupide', 'mauvais'],
    description: 'Tendance à se critiquer de façon excessive',
    type: 'negative'
  },
  'Gratitude active': {
    keywords: ['chance', 'reconnaissant', 'apprécier', 'merci', 'grateful', 'bénédiction', 'heureux de', 'content de avoir'],
    description: 'Pratique régulière de reconnaissance des aspects positifs',
    type: 'positive'
  },
  'Comparaison sociale': {
    keywords: ['autres', 'lui il', 'elle elle', 'tout le monde', 'sauf moi', 'les gens', 'contrairement à', 'comme eux'],
    description: 'Tendance à se comparer aux autres',
    type: 'negative'
  },
  'Résilience': {
    keywords: ['rebondir', 'surmonter', 'affronter', 'accepter', 'adapter', 'résilience', 'force', 'courage', 'persévérer'],
    description: 'Capacité à faire face aux difficultés et à se relever',
    type: 'positive'
  },
  'Perfectionnisme': {
    keywords: ['parfait', 'erreur', 'faute', 'défaut', 'pas assez bien', 'doit être', 'devrait', 'correct'],
    description: 'Standards très élevés et difficulté à accepter l\'imperfection',
    type: 'neutral'
  }
};

// ============= ANALYSIS FUNCTIONS =============

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents for matching
    .replace(/['']/g, "'");
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const normalizedText = normalizeText(text);
  let count = 0;
  
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

function analyzeEmotions(entries: any[]): Array<{ name: string; frequency: number; emoji: string }> {
  const emotionCounts: Record<string, number> = {};
  
  for (const entry of entries) {
    const text = `${entry.content || ''} ${entry.title || ''}`;
    
    for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS)) {
      const matches = countKeywordMatches(text, config.keywords);
      if (matches > 0) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + matches;
      }
    }
  }
  
  return Object.entries(emotionCounts)
    .map(([name, frequency]) => ({
      name,
      frequency,
      emoji: EMOTION_KEYWORDS[name].emoji
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);
}

function analyzeThinkingDomains(entries: any[]): Array<{ name: string; count: number }> {
  const domainCounts: Record<string, number> = {};
  
  for (const entry of entries) {
    const text = `${entry.content || ''} ${entry.title || ''}`;
    
    // Also use the domain field if available
    if (entry.domain) {
      const domainName = entry.domain.charAt(0).toUpperCase() + entry.domain.slice(1);
      domainCounts[domainName] = (domainCounts[domainName] || 0) + 1;
    }
    
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matches = countKeywordMatches(text, keywords);
      if (matches > 0) {
        domainCounts[domain] = (domainCounts[domain] || 0) + matches;
      }
    }
  }
  
  return Object.entries(domainCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function analyzeCognitivePatterns(entries: any[]): Array<{ type: string; description: string; occurrences: number; sentiment: 'negative' | 'positive' | 'neutral' }> {
  const patternCounts: Record<string, number> = {};
  
  for (const entry of entries) {
    const text = `${entry.content || ''} ${entry.title || ''}`;
    
    for (const [pattern, config] of Object.entries(COGNITIVE_PATTERNS)) {
      const matches = countKeywordMatches(text, config.keywords);
      if (matches > 0) {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + matches;
      }
    }
  }
  
  return Object.entries(patternCounts)
    .map(([type, occurrences]) => ({
      type,
      description: COGNITIVE_PATTERNS[type].description,
      occurrences,
      sentiment: COGNITIVE_PATTERNS[type].type
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 6);
}

function analyzeMentalEvolution(entries: any[]): {
  clarity: Array<{ date: string; value: number }>;
  positivity: Array<{ date: string; value: number }>;
  stress: Array<{ date: string; value: number }>;
} {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Group by week for smoother trends
  const weeklyData: Map<string, { entries: any[]; weekStart: string }> = new Map();
  
  for (const entry of sortedEntries) {
    const date = new Date(entry.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { entries: [], weekStart: weekKey });
    }
    weeklyData.get(weekKey)!.entries.push(entry);
  }
  
  const clarity: Array<{ date: string; value: number }> = [];
  const positivity: Array<{ date: string; value: number }> = [];
  const stress: Array<{ date: string; value: number }> = [];
  
  for (const [weekKey, data] of weeklyData) {
    let weekClarity = 50;
    let weekPositivity = 50;
    let weekStress = 30;
    
    for (const entry of data.entries) {
      const text = `${entry.content || ''} ${entry.title || ''}`;
      
      // Clarity: based on entry clarity_score if available, or analyze text structure
      if (entry.clarity_score) {
        weekClarity = (weekClarity + entry.clarity_score) / 2;
      } else {
        // Longer, structured entries suggest more clarity
        const textLength = text.length;
        if (textLength > 500) weekClarity += 10;
        else if (textLength > 200) weekClarity += 5;
        else if (textLength < 50) weekClarity -= 10;
      }
      
      // Positivity: count positive vs negative emotions
      const positiveEmotions = ['Joie', 'Motivation', 'Gratitude', 'Sérénité', 'Fierté'];
      const negativeEmotions = ['Anxiété', 'Tristesse', 'Colère', 'Fatigue'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      for (const emotion of positiveEmotions) {
        positiveCount += countKeywordMatches(text, EMOTION_KEYWORDS[emotion].keywords);
      }
      for (const emotion of negativeEmotions) {
        negativeCount += countKeywordMatches(text, EMOTION_KEYWORDS[emotion].keywords);
      }
      
      const total = positiveCount + negativeCount;
      if (total > 0) {
        weekPositivity = (weekPositivity + (positiveCount / total) * 100) / 2;
      }
      
      // Stress: based on anxiety/fatigue/overload keywords
      const stressKeywords = ['stress', 'anxieux', 'tendu', 'pression', 'deadline', 'urgent', 'surcharge', 'débordé', 'épuisé'];
      const stressMatches = countKeywordMatches(text, stressKeywords);
      if (stressMatches > 0) {
        weekStress = Math.min(100, weekStress + stressMatches * 10);
      }
      
      // Use mood if available
      if (entry.mood) {
        if (entry.mood >= 4) weekPositivity = (weekPositivity + 80) / 2;
        else if (entry.mood <= 2) weekPositivity = (weekPositivity + 20) / 2;
      }
      
      // Use energy if available for stress
      if (entry.energy) {
        if (entry.energy <= 2) weekStress = (weekStress + 60) / 2;
        else if (entry.energy >= 4) weekStress = Math.max(0, (weekStress - 20) / 2);
      }
    }
    
    clarity.push({ date: weekKey, value: Math.round(Math.min(100, Math.max(0, weekClarity))) });
    positivity.push({ date: weekKey, value: Math.round(Math.min(100, Math.max(0, weekPositivity))) });
    stress.push({ date: weekKey, value: Math.round(Math.min(100, Math.max(0, weekStress))) });
  }
  
  return { clarity, positivity, stress };
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const days = body.days || 90; // Default to 90 days of analysis

    // Get workspace ID
    const workspaceId = await getRequiredWorkspaceId(supabase, user.id);

    // Fetch journal entries
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("id, title, content, mood, energy, domain, clarity_score, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (entriesError) {
      throw new Error(`Failed to fetch entries: ${entriesError.message}`);
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({
          recurringEmotions: [],
          thinkingDomains: [],
          cognitivePatterns: [],
          mentalEvolution: { clarity: [], positivity: [], stress: [] },
          meta: { entriesAnalyzed: 0, periodDays: days }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perform analysis
    const recurringEmotions = analyzeEmotions(entries);
    const thinkingDomains = analyzeThinkingDomains(entries);
    const cognitivePatterns = analyzeCognitivePatterns(entries);
    const mentalEvolution = analyzeMentalEvolution(entries);

    // Calculate summary insights
    const positivePatterns = cognitivePatterns.filter(p => p.sentiment === 'positive');
    const negativePatterns = cognitivePatterns.filter(p => p.sentiment === 'negative');
    
    const summary = {
      dominantEmotion: recurringEmotions[0]?.name || null,
      mainFocus: thinkingDomains[0]?.name || null,
      patternBalance: positivePatterns.length >= negativePatterns.length ? 'positive' : 'needs_attention',
      entriesAnalyzed: entries.length,
      periodDays: days
    };

    return new Response(
      JSON.stringify({
        recurringEmotions,
        thinkingDomains,
        cognitivePatterns,
        mentalEvolution,
        summary
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Journal analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
