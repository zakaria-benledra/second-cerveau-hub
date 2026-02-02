import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, CheckCircle2, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export const FinalCTASection = forwardRef<HTMLElement>(function FinalCTASection(_props, ref) {
  const navigate = useNavigate();

  const trustItems = [
    { icon: CheckCircle2, label: 'Gratuit pour commencer' },
    { icon: Zap, label: 'Setup en 2 minutes' },
    { icon: Shield, label: 'Données chiffrées' }
  ];

  return (
    <section ref={ref} className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      
      {/* Animated background elements */}
      <motion.div
        className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]"
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
              <Brain className="h-10 w-10 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Prêt à devenir
            <br />
            <span className="text-gradient-primary">
              qui tu veux être ?
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Rejoins les personnes qui ont choisi d'arrêter de faire des listes 
            et de commencer à transformer leur vie.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="mb-8">
            <Button
              size="xl"
              className="gradient-primary group text-lg px-8 py-6 h-auto"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Démarrer ma transformation
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            {trustItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-success" />
                <span>{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

FinalCTASection.displayName = 'FinalCTASection';
