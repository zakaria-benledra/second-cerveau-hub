import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PersonaSnapshot {
  persona: string;
  tagline: string;
  disciplineLevel: number;
  consistencyLevel: number;
  stabilityLevel: number;
  date: string;
}

interface IdentityDelta {
  discipline: number;
  consistency: number;
  stability: number;
  momentum: number;
}

interface IdentityComparison {
  past: PersonaSnapshot | null;
  current: PersonaSnapshot | null;
  delta: IdentityDelta;
  transformationInsight: string;
  transformationType: 'major_growth' | 'steady_progress' | 'stable' | 'decline' | 'critical_decline';
  daysCompared: number;
}

function calculatePersona(globalScore: number, consistencyFactor: number, momentumIndex: number, burnoutIndex: number): { persona: string; tagline: string } {
  if (globalScore > 80 && consistencyFactor > 0.75) {
    return { persona: "Maître de Discipline", tagline: "Tu incarnes la discipline au quotidien" };
  } else if (globalScore > 60 && momentumIndex > 0.5) {
    return { persona: "Bâtisseur en Progression", tagline: "Tu construis de nouvelles habitudes solides" };
  } else if (globalScore < 50 && burnoutIndex > 0.7) {
    return { persona: "En Reconstruction", tagline: "Tu reprends le contrôle progressivement" };
  } else if (consistencyFactor > 0.8) {
    return { persona: "Roc de Stabilité", tagline: "Ta cohérence est exemplaire" };
  } else if (globalScore > 70) {
    return { persona: "Performeur Régulier", tagline: "Tu maintiens un bon niveau de performance" };
  }
  return { persona: "Explorer", tagline: "Tu explores tes capacités" };
}

export function useIdentityComparison(daysAgo = 30) {
  return useQuery<IdentityComparison>({
    queryKey: ['identity', 'comparison', daysAgo],
    queryFn: async () => {
      const today = new Date();
      const past = new Date();
      past.setDate(past.getDate() - daysAgo);

      const todayStr = today.toISOString().split('T')[0];
      const pastStr = past.toISOString().split('T')[0];

      // Fetch both scores in parallel
      const [currentResult, pastResult] = await Promise.all([
        supabase
          .from('scores_daily')
          .select('*')
          .eq('date', todayStr)
          .maybeSingle(),
        supabase
          .from('scores_daily')
          .select('*')
          .eq('date', pastStr)
          .maybeSingle()
      ]);

      const currentScores = currentResult.data;
      const pastScores = pastResult.data;

      // Build current snapshot
      let current: PersonaSnapshot | null = null;
      if (currentScores) {
        const { persona, tagline } = calculatePersona(
          currentScores.global_score ?? 50,
          currentScores.consistency_factor ?? 0.5,
          currentScores.momentum_index ?? 0,
          currentScores.burnout_index ?? 0
        );
        current = {
          persona,
          tagline,
          disciplineLevel: Math.round(currentScores.global_score ?? 50),
          consistencyLevel: Math.round((currentScores.consistency_factor ?? 0.5) * 100),
          stabilityLevel: Math.round((1 - (currentScores.burnout_index ?? 0)) * 100),
          date: todayStr
        };
      }

      // Build past snapshot
      let pastSnapshot: PersonaSnapshot | null = null;
      if (pastScores) {
        const { persona, tagline } = calculatePersona(
          pastScores.global_score ?? 50,
          pastScores.consistency_factor ?? 0.5,
          pastScores.momentum_index ?? 0,
          pastScores.burnout_index ?? 0
        );
        pastSnapshot = {
          persona,
          tagline,
          disciplineLevel: Math.round(pastScores.global_score ?? 50),
          consistencyLevel: Math.round((pastScores.consistency_factor ?? 0.5) * 100),
          stabilityLevel: Math.round((1 - (pastScores.burnout_index ?? 0)) * 100),
          date: pastStr
        };
      }

      // Calculate deltas
      const delta: IdentityDelta = {
        discipline: (current?.disciplineLevel ?? 50) - (pastSnapshot?.disciplineLevel ?? 50),
        consistency: (current?.consistencyLevel ?? 50) - (pastSnapshot?.consistencyLevel ?? 50),
        stability: (current?.stabilityLevel ?? 50) - (pastSnapshot?.stabilityLevel ?? 50),
        momentum: ((currentScores?.momentum_index ?? 0) - (pastScores?.momentum_index ?? 0)) * 100
      };

      // Determine transformation type and generate insight
      let transformationType: IdentityComparison['transformationType'] = 'stable';
      let insight = '';

      const avgDelta = (delta.discipline + delta.consistency + delta.stability) / 3;

      if (delta.discipline > 15 || avgDelta > 12) {
        transformationType = 'major_growth';
        insight = `🚀 Transformation majeure : ta discipline a bondi de ${delta.discipline > 0 ? '+' : ''}${Math.round(delta.discipline)}% en ${daysAgo} jours. Tu n'es plus la même personne.`;
      } else if (delta.discipline > 5 || avgDelta > 5) {
        transformationType = 'steady_progress';
        insight = `📈 Progression constante : +${Math.round(delta.discipline)}% de discipline. Chaque jour te rapproche de qui tu veux devenir.`;
      } else if (delta.discipline > -5 && delta.discipline <= 5) {
        transformationType = 'stable';
        if (current && current.disciplineLevel > 70) {
          insight = `⚖️ Stabilité maîtrisée : tu maintiens un excellent niveau depuis ${daysAgo} jours. C'est la marque des grands.`;
        } else {
          insight = `⚖️ Phase de consolidation : tes scores sont stables. C'est le moment d'initier un changement.`;
        }
      } else if (delta.discipline >= -15) {
        transformationType = 'decline';
        insight = `⚠️ Attention : ta discipline a baissé de ${Math.abs(Math.round(delta.discipline))}%. Identifie ce qui a changé et ajuste.`;
      } else {
        transformationType = 'critical_decline';
        insight = `🚨 Alerte critique : chute de ${Math.abs(Math.round(delta.discipline))}% en ${daysAgo} jours. Intervention IA recommandée pour remonter.`;
      }

      // Add persona change insight if applicable
      if (pastSnapshot && current && pastSnapshot.persona !== current.persona) {
        if (transformationType === 'major_growth' || transformationType === 'steady_progress') {
          insight += ` Tu es passé de "${pastSnapshot.persona}" à "${current.persona}".`;
        } else if (transformationType === 'decline' || transformationType === 'critical_decline') {
          insight += ` Tu es passé de "${pastSnapshot.persona}" à "${current.persona}". Reconquiers ton niveau.`;
        }
      }

      return {
        past: pastSnapshot,
        current,
        delta,
        transformationInsight: insight,
        transformationType,
        daysCompared: daysAgo
      };
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}
