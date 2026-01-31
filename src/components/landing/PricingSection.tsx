import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

export function PricingSection() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Explorer',
      icon: Zap,
      subtitle: 'Découvre le système',
      price: 'Gratuit',
      period: '',
      description: 'Parfait pour commencer ta transformation et tester le système.',
      features: [
        'Tableau de bord d\'identité',
        'Suivi de 3 habitudes',
        '7 jours d\'observation IA',
        'Journal intelligent (limité)',
        'Rapport hebdomadaire basique'
      ],
      cta: 'Commencer gratuitement',
      popular: false,
      variant: 'outline' as const
    },
    {
      name: 'Transformer',
      icon: Crown,
      subtitle: 'Pour les ambitieux',
      price: '19€',
      period: '/mois',
      description: 'Le système complet pour une transformation profonde et durable.',
      features: [
        'Tout de Explorer +',
        'Habitudes illimitées',
        'IA Coach disponible 24/7',
        'Analyse financière complète',
        'Alertes de dérive proactives',
        'Interventions personnalisées',
        'Sync Google Calendar',
        'Export de données',
        'Support prioritaire'
      ],
      cta: 'Commencer l\'essai gratuit',
      popular: true,
      variant: 'default' as const
    },
    {
      name: 'Maîtriser',
      icon: Building2,
      subtitle: 'Pour les équipes',
      price: '49€',
      period: '/utilisateur/mois',
      description: 'Déployez Second Brain pour votre équipe ou organisation.',
      features: [
        'Tout de Transformer +',
        'Dashboard équipe',
        'Analytics agrégés',
        'Admin & permissions',
        'SSO & SAML',
        'API complète',
        'Onboarding dédié',
        'Account manager'
      ],
      cta: 'Contacter les ventes',
      popular: false,
      variant: 'outline' as const
    }
  ];

  return (
    <section id="pricing" className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Tarifs
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Investis dans ta
              <br />
              <span className="text-gradient-primary">
                transformation
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Commence gratuitement. Évolue quand tu es prêt 
              pour la transformation complète.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  className={`p-8 h-full flex flex-col relative ${
                    plan.popular 
                      ? 'border-primary shadow-xl shadow-primary/10 scale-105' 
                      : 'bg-card/50 backdrop-blur-sm border-border/50'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary">
                      Le plus populaire
                    </Badge>
                  )}
                  
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        plan.popular ? 'gradient-primary' : 'bg-primary/10'
                      }`}>
                        <plan.icon className={`h-5 w-5 ${
                          plan.popular ? 'text-primary-foreground' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-success" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.variant}
                    className={`w-full ${plan.popular ? 'gradient-primary' : ''}`}
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Note */}
          <motion.p 
            variants={itemVariants} 
            className="text-center text-sm text-muted-foreground mt-12"
          >
            Annulation à tout moment • Pas d'engagement • Données exportables
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
