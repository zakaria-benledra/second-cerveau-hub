import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Flame, Target } from 'lucide-react';

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Thomas M.',
      role: 'Entrepreneur',
      avatar: 'TM',
      quote: 'En 3 mois, je suis passé de 2 habitudes maintenues à 7. L\'IA m\'a rattrapé plusieurs fois avant que je ne décroche. C\'est comme avoir un coach qui te connaît vraiment.',
      stats: [
        { icon: TrendingUp, label: 'Discipline', value: '+67%' },
        { icon: Flame, label: 'Streak max', value: '47 jours' }
      ],
      rating: 5
    },
    {
      name: 'Marie L.',
      role: 'Designer Freelance',
      avatar: 'ML',
      quote: 'J\'ai enfin compris pourquoi je sabotais mes objectifs financiers. Les patterns révélés par Minded m\'ont permis d\'économiser plus en 2 mois qu\'en toute l\'année précédente.',
      stats: [
        { icon: Target, label: 'Économies', value: '+2 400€' },
        { icon: TrendingUp, label: 'Cohérence', value: '+89%' }
      ],
      rating: 5
    },
    {
      name: 'Alexandre D.',
      role: 'Manager Tech',
      avatar: 'AD',
      quote: 'Les alertes de dérive sont incroyables. L\'IA a détecté que je décrochais toujours après les vacances et m\'a proposé un plan de reprise. Depuis, plus de spirale post-vacances.',
      stats: [
        { icon: Flame, label: 'Décrochages', value: '-81%' },
        { icon: Target, label: 'Objectifs atteints', value: '12/12' }
      ],
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-4">
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
              Témoignages
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
              Ils ont transformé
              <br />
              <span className="text-gradient-primary">
                leur trajectoire
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des personnes comme toi qui ont choisi de passer de "faire des listes" 
              à "devenir quelqu'un".
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-shadow">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Stats */}
                  <div className="flex gap-4 pt-4 border-t border-border/50">
                    {testimonial.stats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <stat.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="font-bold text-success">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <motion.div 
            variants={itemVariants} 
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">2,847</p>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">+67%</p>
                <p className="text-sm text-muted-foreground">Discipline moyenne</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">4.9/5</p>
                <p className="text-sm text-muted-foreground">Note utilisateurs</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
