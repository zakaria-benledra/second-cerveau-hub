import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const problems = [
  {
    icon: '📱',
    title: 'Tu as 10 apps',
    description: 'To-do lists, trackers d\'habitudes, budgets, journaux... Tout est éparpillé. Aucune vue d\'ensemble.'
  },
  {
    icon: '🔄',
    title: 'Tu recommences sans cesse',
    description: 'Nouveaux objectifs chaque lundi. Motivation qui disparaît le mercredi. Le cycle sans fin du "cette fois sera différente".'
  },
  {
    icon: '📊',
    title: 'Pas de vision globale',
    description: 'Tu ne vois pas si tu progresses VRAIMENT. Aucun lien entre ce que tu fais et qui tu deviens.'
  },
  {
    icon: '❌',
    title: 'Aucune intervention',
    description: 'Personne pour te rattraper quand tu dérives. Tu es seul face à ton auto-sabotage.'
  }
];

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
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const
    }
  }
};

export function ProblemSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-destructive/5 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-16"
          >
            <Badge 
              variant="outline" 
              className="mb-6 px-4 py-2 text-sm border-destructive/30 bg-destructive/5 text-destructive"
            >
              Le Problème
            </Badge>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Tu ne manques pas d'outils.
              <br />
              <span className="text-destructive">Tu manques de cohérence.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Les apps de productivité t'aident à faire des listes.
              <br className="hidden sm:block" />
              Elles ne t'aident pas à <span className="text-foreground font-medium">devenir discipliné</span>.
            </p>
          </motion.div>

          {/* Problems Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid md:grid-cols-2 gap-6"
          >
            {problems.map((problem, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-destructive/30 transition-colors group">
                  <div className="flex gap-4">
                    <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {problem.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-destructive transition-colors">
                        {problem.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
