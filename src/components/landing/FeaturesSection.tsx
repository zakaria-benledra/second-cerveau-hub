import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Wallet, 
  Zap, 
  BarChart3,
  Calendar,
  Bell,
  BookOpen,
  Shield,
  Sparkles,
  Users
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  }
};

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'Minded',
      description: 'Un système intelligent qui apprend de tes comportements et te guide vers ta meilleure version.',
      highlight: true
    },
    {
      icon: Target,
      title: 'Suivi d\'Identité',
      description: 'Définis qui tu veux devenir. Mesure ton évolution quotidienne vers cette vision.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Comportementaux',
      description: 'Comprends tes patterns, identifie tes dérives et corrige ta trajectoire en temps réel.'
    },
    {
      icon: Wallet,
      title: 'Discipline Financière',
      description: 'Importe tes relevés bancaires. L\'IA catégorise et analyse automatiquement tes dépenses.'
    },
    {
      icon: Zap,
      title: 'Habitudes & Routines',
      description: 'Construis des habitudes solides avec streaks, challenges et micro-récompenses.'
    },
    {
      icon: BarChart3,
      title: 'Intelligence Prédictive',
      description: 'Anticipe les risques de dérive avant qu\'ils ne deviennent des problèmes.'
    },
    {
      icon: Calendar,
      title: 'Calendrier Unifié',
      description: 'Synchronise Google Calendar. Vois tes engagements et tes disponibilités réelles.'
    },
    {
      icon: Bell,
      title: 'Notifications Smart',
      description: 'Alertes proactives au bon moment. Pas de spam, que des interventions utiles.'
    },
    {
      icon: BookOpen,
      title: 'Journal Intelligent',
      description: 'Capture tes pensées. L\'IA détecte tes émotions et tes patterns mentaux.'
    },
    {
      icon: Shield,
      title: 'Anti-Dérive',
      description: 'Système de détection précoce qui te rattrape avant que tu ne décroches.'
    },
    {
      icon: Sparkles,
      title: 'IA Coach',
      description: 'Un coach disponible 24/7 qui connaît ton historique et tes objectifs.'
    },
    {
      icon: Users,
      title: 'Accountability',
      description: 'Rapports hebdomadaires qui te montrent ta vraie progression.'
    }
  ];

  return (
    <section id="features" className="py-24 px-4">
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
              Fonctionnalités
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Tout ce dont tu as besoin
              <br />
              <span className="text-gradient-primary">
                dans un seul système
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plus besoin de jongler entre 10 apps. Minded unifie tout 
              ce qui compte pour ta transformation.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  className={`h-full group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                    feature.highlight 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
                      : 'bg-card/50 backdrop-blur-sm border-border/50'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${
                      feature.highlight ? 'gradient-primary' : 'bg-primary/10'
                    }`}>
                      <feature.icon className={`h-5 w-5 ${
                        feature.highlight ? 'text-primary-foreground' : 'text-primary'
                      }`} />
                    </div>
                    <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
