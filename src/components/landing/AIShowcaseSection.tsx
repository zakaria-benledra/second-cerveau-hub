import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Zap, Brain, CheckCircle2, ArrowRight, WifiOff, Sliders, Lightbulb, MessageSquare, User } from 'lucide-react';

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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

const AI_STATS = [
  { value: "<50ms", label: "Temps de réponse IA", icon: Zap },
  { value: "24h", label: "Cache offline", icon: WifiOff },
  { value: "3", label: "Niveaux personnalisation", icon: Sliders },
  { value: "∞", label: "Suggestions par jour", icon: Lightbulb },
];

export function AIShowcaseSection() {
  const interventions = [
    {
      type: 'drift_alert',
      icon: AlertTriangle,
      badge: 'Alerte Dérive',
      badgeVariant: 'destructive' as const,
      title: 'Détection de pattern négatif',
      message: '⚠️ Thomas, tu as sauté ta routine matinale 3 jours consécutifs. Historiquement, c\'est le début d\'une spirale de 2 semaines de décrochage.',
      action: 'Je te propose : demain, réveil 30min plus tard mais routine maintenue. Ça te convient ?',
      impact: '-67% de risque de décrochage'
    },
    {
      type: 'spending_alert',
      icon: TrendingDown,
      badge: 'Finance',
      badgeVariant: 'secondary' as const,
      title: 'Anomalie de dépenses',
      message: '📊 Tes dépenses "Restaurants" ont augmenté de 180% cette semaine. Tu as dit vouloir économiser pour ton voyage.',
      action: 'Cette dépense est-elle alignée avec ton objectif ? Je peux t\'aider à recalculer ton budget.',
      impact: '340€ économisés ce mois'
    },
    {
      type: 'momentum',
      icon: Zap,
      badge: 'Momentum',
      badgeVariant: 'default' as const,
      title: 'Streak en danger',
      message: '🔥 Tu es à 14 jours de streak sur "Méditation". Plus que 2h pour valider aujourd\'hui.',
      action: 'Une session de 5 minutes suffit. Je t\'envoie un rappel dans 30 minutes ?',
      impact: 'Streak préservé à 98%'
    },
    {
      type: 'insight',
      icon: Brain,
      badge: 'Insight',
      badgeVariant: 'outline' as const,
      title: 'Pattern découvert',
      message: '💡 J\'ai remarqué que tu es 3x plus productif les jours où tu fais du sport avant 9h.',
      action: 'Veux-tu que je bloque automatiquement tes matins pour le sport ?',
      impact: '+45% de productivité'
    }
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              IA en Action
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Une IA qui <span className="text-gradient-primary">agit</span>,
              <br />
              pas qui conseille
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Voici des exemples réels d'interventions que Minded 
              peut déclencher pour te garder sur la bonne trajectoire.
            </p>
          </motion.div>

          {/* AI Stats */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6 mb-12">
            {AI_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Demo Conversation */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-12">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-semibold">Exemple de conversation Sage</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="bg-secondary rounded-xl px-4 py-2">
                    <p className="text-sm">Comment améliorer ma productivité ?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-primary/10 rounded-xl px-4 py-2 border border-primary/20">
                    <p className="text-sm">Basé sur ton historique, tu es plus productif le matin. Je suggère de bloquer 2h sans interruption avant 10h pour tes tâches prioritaires. Tu veux que je crée une routine "Focus matinal" ?</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Interventions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {interventions.map((intervention, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 h-full bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <intervention.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={intervention.badgeVariant}>
                          {intervention.badge}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{intervention.title}</span>
                      </div>
                      
                      <p className="text-foreground mb-4 leading-relaxed">
                        {intervention.message}
                      </p>
                      
                      <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="text-primary font-medium">Action proposée : </span>
                          {intervention.action}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{intervention.impact}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Ces interventions sont générées automatiquement en analysant tes données.
            </p>
            <a 
              href="#pricing" 
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Voir les plans <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
