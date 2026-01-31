import { motion } from 'framer-motion';
import { Eye, Brain, Rocket } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const }
  }
};

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: Eye,
      title: 'Observation',
      duration: '7 jours',
      description: 'Le système t\'observe sans juger. Il établit ta baseline comportementale : tes patterns, tes forces, tes zones de fragilité.',
      details: [
        'Analyse de tes habitudes actuelles',
        'Détection de tes cycles de motivation',
        'Identification de tes déclencheurs de dérive'
      ]
    },
    {
      number: 2,
      icon: Brain,
      title: 'Analyse',
      duration: 'En continu',
      description: 'L\'IA croise toutes tes données pour révéler des patterns invisibles et prédire tes risques de décrochage.',
      details: [
        'Corrélations entre comportements',
        'Prédiction des moments de vulnérabilité',
        'Score de cohérence identitaire'
      ]
    },
    {
      number: 3,
      icon: Rocket,
      title: 'Transformation',
      duration: 'Permanent',
      description: 'Reçois des interventions personnalisées au bon moment. L\'IA te rattrape avant que tu ne dérives.',
      details: [
        'Alertes proactives de dérive',
        'Suggestions d\'actions correctives',
        'Célébration des victoires'
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-muted/30">
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
              Comment ça marche
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Un processus en 3 phases
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              De l'observation à la transformation, un système qui apprend 
              et s'adapte à ton profil unique.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />
            
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((step, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="relative"
                >
                  <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg h-full">
                    {/* Step Number */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                        <span className="text-sm text-primary font-medium">{step.duration}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                      {step.description}
                    </p>

                    {/* Details */}
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <span className="text-sm text-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
