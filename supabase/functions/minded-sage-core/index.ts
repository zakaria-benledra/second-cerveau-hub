import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SageRequest {
  skill: "nudge" | "journal" | "program" | "coach" | "analyze";
  context?: Record<string, unknown>;
  user_input?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from JWT
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { skill, context, user_input } = await req.json() as SageRequest;

    // Get user profile and context from database
    const { data: profile } = await supabaseClient
      .from("minded_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: habits } = await supabaseClient
      .from("minded_habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const { data: recentLogs } = await supabaseClient
      .from("minded_habit_logs")
      .select("*, habit:minded_habits(*)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20);

    const { data: scores } = await supabaseClient
      .from("minded_daily_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .limit(7);

    // Build context for Claude
    const userContext = {
      profile: profile || {},
      habits: habits || [],
      recentActivity: recentLogs || [],
      weeklyScores: scores || [],
      currentStreak: profile?.current_streak || 0,
      level: profile?.level || 1,
    };

    // System prompts per skill
    const systemPrompts: Record<string, string> = {
      nudge: `Tu es Sage, un coach comportemental bienveillant et motivant de l'app Minded.
Ton rôle est de donner des micro-nudges personnalisés basés sur les habitudes et l'activité de l'utilisateur.
Sois concis (2-3 phrases max), encourageant, et actionnable.
Utilise les données de contexte pour personnaliser ton message.
Réponds en français.`,

      journal: `Tu es Sage, un coach comportemental de l'app Minded.
Aide l'utilisateur à réfléchir sur sa journée avec des questions introspectives.
Guide-le vers des insights sur ses patterns comportementaux.
Sois empathique et non-jugeant.
Réponds en français.`,

      program: `Tu es Sage, l'IA comportementale de Minded.
Crée un programme personnalisé de 28 jours basé sur l'objectif de l'utilisateur.
Structure ta réponse en JSON avec:
- name: nom du programme
- description: description courte
- duration_days: 28
- intensity: "light" | "moderate" | "intense"
- focus_areas: tableau des domaines (productivité, sport, créativité, relations, sommeil, alimentation, apprentissage)
- daily_habits: tableau d'habitudes suggérées avec {name, description, frequency, category}
- milestones: étapes clés à atteindre
Réponds UNIQUEMENT avec le JSON, sans texte autour.`,

      coach: `Tu es Sage, un coach comportemental expert de l'app Minded.
Tu aides l'utilisateur à développer de meilleures habitudes et à atteindre ses objectifs.
Analyse son contexte (habitudes, scores, activité récente) pour donner des conseils personnalisés.
Sois conversationnel, encourageant mais honnête.
Réponds en français.`,

      analyze: `Tu es Sage, l'IA analytique de Minded.
Analyse les patterns comportementaux de l'utilisateur basé sur ses données.
Identifie:
- Points forts et constance
- Domaines à améliorer
- Tendances sur la semaine
- Recommandations concrètes
Sois précis et actionnable.
Réponds en français.`,
    };

    const systemPrompt = systemPrompts[skill] || systemPrompts.coach;

    // Build user message
    let userMessage = "";
    if (skill === "program" && context?.objective) {
      userMessage = `Crée un programme personnalisé pour cet objectif: "${context.objective}"

Contexte utilisateur:
- Niveau actuel: ${userContext.level}
- Streak actuel: ${userContext.currentStreak} jours
- Habitudes actives: ${userContext.habits.length}`;
    } else if (user_input) {
      userMessage = `${user_input}

Contexte utilisateur:
${JSON.stringify(userContext, null, 2)}`;
    } else {
      userMessage = `Contexte utilisateur actuel:
${JSON.stringify(userContext, null, 2)}

Génère un ${skill === "nudge" ? "nudge motivant" : skill === "analyze" ? "analyse comportementale" : "conseil personnalisé"}.`;
    }

    // Call Claude API via REST
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const message = await claudeResponse.json();
    const responseText = message.content?.[0]?.text || "";

    // Parse response based on skill
    let result: Record<string, unknown>;

    if (skill === "program") {
      try {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = { program: JSON.parse(jsonMatch[0]), success: true };
        } else {
          result = { error: "Invalid program format", raw: responseText };
        }
      } catch {
        result = { error: "Failed to parse program", raw: responseText };
      }
    } else {
      result = {
        message: responseText,
        skill,
        success: true,
      };
    }

    // Log the interaction for learning
    await supabaseClient.from("minded_sage_runs").insert({
      user_id: user.id,
      skill,
      input_context: { context, user_input },
      output_response: result,
      model_used: "claude-3-haiku",
      tokens_used: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sage error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
