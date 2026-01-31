import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Quote,
  Zap,
  Shield,
  Brain,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { PRICING_PLANS } from '@/content';


const testimonials = [
  {
    name: 'Marc D.',
    role: 'Entrepreneur',
    avatar: 'MD',
    quote: 'Je pensais être discipliné. Le système m\'a montré mes angles morts. En 3 mois, je suis passé de 34% à 78% de discipline.',
    before: 34,
    after: 78,
    metric: 'Discipline',
    duration: '3 mois',
  },
  {
    name: 'Sophie L.',
    role: 'Manager',
    avatar: 'SL',
    quote: 'L\'IA m\'a aidée à comprendre pourquoi je procrastinais. Maintenant, j\'exécute avec clarté et sérénité.',
    before: 41,
    after: 86,
    metric: 'Cohérence',
    duration: '4 mois',
  },
  {
    name: 'Thomas R.',
    role: 'Développeur',
    avatar: 'TR',
    quote: 'Mon rapport à l\'argent a complètement changé. Je comprends enfin mes patterns et je construis ma stabilité.',
    before: 28,
    after: 72,
    metric: 'Stabilité Financière',
    duration: '5 mois',
  },
];

const faqs = [
  {
    question: 'Comment le système mesure-t-il ma transformation ?',
    answer: 'Le système observe tes actions quotidiennes (habitudes, tâches, finances, journal) et calcule des scores comportementaux. Ces scores évoluent en temps réel et reflètent ta progression vers qui tu veux devenir, pas juste ta productivité.',
  },
  {
    question: 'Combien de temps avant de voir des résultats ?',
    answer: 'Les premiers insights apparaissent dès la première semaine. Une baseline fiable se construit en 7 jours. Les transformations mesurables (scores en hausse, patterns qui changent) se voient généralement en 3-4 semaines d\'utilisation régulière.',
  },
  {
    question: 'C\'est quoi la différence avec une app de productivité ?',
    answer: 'Les apps de productivité te demandent de faire plus. Minded te demande de devenir plus. On ne mesure pas tes to-dos, on mesure ta discipline, ta cohérence, ta stabilité. On ne te donne pas des rappels, on te donne des interventions intelligentes quand tu dérives.',
  },
  {
    question: 'L\'IA va-t-elle prendre des décisions à ma place ?',
    answer: 'Jamais. L\'IA observe, analyse et propose. Toi, tu décides. Chaque intervention IA peut être acceptée, modifiée ou refusée. Le système apprend de tes choix pour devenir plus pertinent, mais tu restes maître de ta transformation.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer: 'Absolument. Tes données comportementales sont chiffrées et isolées. Elles ne sont jamais vendues, partagées ou utilisées pour de la publicité. Tu peux exporter ou supprimer tes données à tout moment.',
  },
  {
    question: 'Puis-je annuler à tout moment ?',
    answer: 'Oui, sans engagement. Tu peux downgrader vers le plan gratuit quand tu veux. Ton historique et tes scores restent accessibles. On croit en la valeur qu\'on apporte, pas aux contrats qui piègent.',
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      // Could open a contact modal or redirect to contact page
      window.location.href = 'mailto:contact@secondcerveau.com?subject=Plan Maîtriser';
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <Brain className="h-3 w-3 mr-1" />
              Système d'Intelligence Décisionnelle
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Investis dans Qui Tu Deviens
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Pas un abonnement app.
              <span className="text-primary font-semibold"> Un investissement transformation.</span>
            </p>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              Chaque euro investi te rapproche de la personne que tu veux devenir. 
              Mesurable. Quantifiable. Irréversible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PRICING_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "relative h-full flex flex-col transition-all duration-300 hover:scale-[1.02]",
                    plan.popular 
                      ? "border-2 border-primary shadow-lg shadow-primary/10" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-md">
                        <Zap className="h-3 w-3 mr-1" />
                        Le plus populaire
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.bgColor)}>
                      <plan.icon className={cn("h-6 w-6", plan.color)} />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className={cn("text-sm font-medium", plan.color)}>{plan.tagline}</p>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">{plan.period}</span>
                        )}
                      </div>
                      {plan.price === 0 && (
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-3">
                      {plan.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Impact Stats */}
                    <div className={cn(
                      "rounded-lg p-3 mb-6 border",
                      plan.bgColor,
                      plan.borderColor
                    )}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn("h-4 w-4", plan.color)} />
                        <span className="text-sm text-muted-foreground">{plan.stats.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={cn("text-2xl font-bold", plan.color)}>
                          {plan.stats.value}
                        </span>
                        <span className="text-xs text-muted-foreground">{plan.stats.period}</span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.color)} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <Button 
                      className={cn(
                        "w-full",
                        plan.popular 
                          ? "bg-primary hover:bg-primary/90" 
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                      variant={plan.popular ? "default" : "secondary"}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Transformations Réelles</h2>
            <p className="text-muted-foreground">
              Des personnes comme toi qui ont décidé de mesurer et façonner leur identité
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    {/* Before/After Score */}
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">
                          {testimonial.before}%
                        </div>
                        <div className="text-xs text-muted-foreground">Avant</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-primary" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {testimonial.after}%
                        </div>
                        <div className="text-xs text-muted-foreground">Après</div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="mb-3">
                      {testimonial.metric} • {testimonial.duration}
                    </Badge>
                    
                    {/* Quote */}
                    <div className="relative mb-4">
                      <Quote className="absolute -top-1 -left-1 h-6 w-6 text-primary/20" />
                      <p className="text-sm text-muted-foreground pl-5 italic">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    
                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Questions sur la Transformation</h2>
            <p className="text-muted-foreground">
              Tout ce que tu dois savoir avant de commencer ton parcours
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-border/50 rounded-lg px-4 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">
            Prêt à Mesurer Qui Tu Deviens ?
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Commence gratuitement. Pas de carte bancaire. Pas d'engagement. 
            Juste toi et le système qui t'observe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              <Rocket className="h-5 w-5" />
              Commencer Gratuitement
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              Voir le Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
