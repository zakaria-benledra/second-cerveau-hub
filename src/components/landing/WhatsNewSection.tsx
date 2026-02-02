import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, WifiOff, Zap, Calendar, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

const NEW_FEATURES = [
  {
    icon: Zap,
    title: "Cache IA Ultra-rapide",
    description: "Réponses instantanées grâce au cache intelligent. L'IA répond en moins de 50ms.",
    improvement: "-99% latence"
  },
  {
    icon: WifiOff,
    title: "Mode Offline Complet",
    description: "Accède à tes données et suggestions même sans connexion internet.",
    improvement: "+24h autonomie"
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Alertes comportementales personnalisées : burnout, streaks, victoires.",
    improvement: "+25% engagement"
  },
  {
    icon: Calendar,
    title: "Journal avec Date Picker",
    description: "Écris des entrées pour n'importe quelle date passée avec suggestions contextuelles.",
    improvement: "Nouvelle feature"
  },
];

export function WhatsNewSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-transparent to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Version 40
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Nouveautés <span className="text-gradient-primary">V40</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Minded évolue constamment pour t'offrir la meilleure expérience
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {NEW_FEATURES.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <Badge className="bg-success/20 text-success border-success/30">
                      {feature.improvement}
                    </Badge>
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
