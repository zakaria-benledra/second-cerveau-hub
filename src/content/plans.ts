import { Sparkles, Rocket, Crown, type LucideIcon } from 'lucide-react';

export interface PricingPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  tagline: string;
  price: number;
  period: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
  stats: { label: string; value: string; period: string };
  cta: string;
  popular: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Explorer',
    tagline: 'Découvre ton potentiel caché',
    price: 0,
    period: 'Gratuit pour toujours',
    description: 'Commence à observer qui tu es vraiment.',
    icon: Sparkles,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/20',
    features: [
      'Tableau de bord d\'identité',
      'Suivi de 3 habitudes',
      '7 jours d\'observation IA',
      'Journal intelligent (limité)',
      'Rapport hebdomadaire basique',
    ],
    stats: { label: 'Conscience de soi', value: '+45%', period: 'en 2 semaines' },
    cta: 'Commencer Gratuitement',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Transformer',
    tagline: 'Deviens qui tu veux être',
    price: 19,
    period: '/mois',
    description: 'Le système complet pour ta transformation.',
    icon: Rocket,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/50',
    features: [
      'Tout de Explorer +',
      'Habitudes illimitées',
      'Coach IA personnalisé 24/7',
      'Analyse financière complète',
      'Alertes de dérive proactives',
      'Interventions personnalisées',
      'Sync Google Calendar',
      'Export de données',
      'Support prioritaire',
    ],
    stats: { label: 'Discipline moyenne', value: '+67%', period: 'en 3 mois' },
    cta: 'Commencer Ma Transformation',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Maîtriser',
    tagline: 'Excellence et leadership',
    price: 49,
    period: '/utilisateur/mois',
    description: 'Pour les équipes qui visent l\'excellence.',
    icon: Crown,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    features: [
      'Tout de Transformer +',
      'Workspaces d\'équipe',
      'Dashboard équipe',
      'Analytics agrégés',
      'Admin & permissions',
      'SSO & SAML',
      'API complète',
      'Onboarding dédié',
      'Account manager',
    ],
    stats: { label: 'Performance globale', value: '+89%', period: 'en 6 mois' },
    cta: 'Contacter l\'Équipe',
    popular: false,
  },
];
