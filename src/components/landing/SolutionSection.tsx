import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Target, TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';

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

export function SolutionSection() {
  const solutions = [
    {
      icon: Brain,
      title: 'Un cerveau unifié',
      description: 'Plus de fragmentation. Tout ce qui compte pour toi est connecté dans un seul système intelligent.'
    },
    {
      icon: Target,
      title: 'Une direction claire',
      description: 'Tu sais exactement qui tu veux devenir et chaque action te rapproche de cette vision.'
    },
    {
      icon: TrendingUp,
      title: 'Une progression visible',
      description: 'Des métriques concrètes qui montrent ta transformation jour après jour.'
    },
    {
      icon: Zap,
      title: 'Une IA qui agit',
      description: 'Pas de conseils génériques. Des interventions personnalisées au bon moment.'
    },
    {
      icon: Shield,
      title: 'Un filet de sécurité',
      description: 'Le système détecte tes dérives avant qu\'elles ne deviennent des problèmes.'
    },
    {
      icon: BarChart3,
      title: 'Des patterns révélés',
      description: 'Comprends enfin pourquoi tu sabotes tes propres objectifs.'
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              La Solution
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Minded fait ce que
              <br />
              <span className="text-gradient-primary">
                tu n'arrives pas à faire seul
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un système d'intelligence comportementale qui observe, analyse et intervient 
              pour t'aider à maintenir le cap vers qui tu veux devenir.
            </p>
          </motion.div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <solution.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{solution.title}</h3>
                    <p className="text-muted-foreground">{solution.description}</p>
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
