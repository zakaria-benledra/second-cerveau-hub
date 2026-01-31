import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ArrowRight, X, Check, TrendingUp, TrendingDown } from 'lucide-react';

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

export function TransformationSection() {
  const beforeAfter = [
    {
      before: 'Tu fais des to-do lists qui s\'accumulent',
      after: 'Tu exécutes ce qui compte vraiment'
    },
    {
      before: 'Tu recommences chaque lundi',
      after: 'Tu maintiens ta trajectoire sur des mois'
    },
    {
      before: 'Tu ne sais pas si tu progresses',
      after: 'Tu vois ta transformation en chiffres'
    },
    {
      before: 'Tu es seul face à tes décrochages',
      after: 'Une IA te rattrape avant la chute'
    },
    {
      before: 'Tes finances sont un mystère',
      after: 'Chaque euro est aligné avec tes objectifs'
    },
    {
      before: 'Tu subis tes journées',
      after: 'Tu deviens qui tu veux être'
    }
  ];

  const stats = [
    { label: 'Discipline moyenne', before: '34%', after: '78%', change: '+129%' },
    { label: 'Habitudes maintenues', before: '2.3', after: '6.8', change: '+196%' },
    { label: 'Décrochages/mois', before: '4.2', after: '0.8', change: '-81%' },
    { label: 'Satisfaction globale', before: '4/10', after: '8.2/10', change: '+105%' }
  ];

  return (
    <section className="py-24 px-4">
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
              Transformation
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Avant / Après
              <br />
              <span className="text-gradient-primary">
                Minded
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La différence entre essayer seul et avoir un système 
              d'intelligence comportementale à tes côtés.
            </p>
          </motion.div>

          {/* Before/After Comparison */}
          <motion.div variants={itemVariants} className="mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <Card className="p-6 bg-destructive/5 border-destructive/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Avant</h3>
                    <p className="text-sm text-muted-foreground">Sans Minded</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {beforeAfter.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3 text-destructive" />
                      </div>
                      <span className="text-muted-foreground">{item.before}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* After */}
              <Card className="p-6 bg-success/5 border-success/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Après</h3>
                    <p className="text-sm text-muted-foreground">Avec Minded</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {beforeAfter.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-foreground">{item.after}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>

          {/* Stats Comparison */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold text-center mb-8">
              Résultats moyens après 3 mois
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="p-5 text-center bg-card/50 backdrop-blur-sm">
                  <p className="text-sm text-muted-foreground mb-3">{stat.label}</p>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-lg text-muted-foreground line-through">{stat.before}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{stat.after}</span>
                  </div>
                  <span className="text-sm font-semibold text-success">{stat.change}</span>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
