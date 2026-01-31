import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  Wallet
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'Second Brain',
      description: 'Un système intelligent qui apprend de tes comportements et t\'aide à devenir la meilleure version de toi-même.'
    },
    {
      icon: Target,
      title: 'Suivi d\'Identité',
      description: 'Définis qui tu veux devenir et mesure ton évolution quotidienne vers cette vision.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Comportementaux',
      description: 'Comprends tes patterns, identifie tes dérives et corrige ta trajectoire en temps réel.'
    },
    {
      icon: Wallet,
      title: 'Discipline Financière',
      description: 'Importe tes relevés bancaires et laisse l\'IA catégoriser et analyser tes dépenses.'
    },
    {
      icon: Zap,
      title: 'Habitudes & Routines',
      description: 'Construis des habitudes solides avec un système de streaks et de challenges personnalisés.'
    },
    {
      icon: BarChart3,
      title: 'Intelligence Prédictive',
      description: 'Anticipe les risques de dérive avant qu\'ils ne deviennent des problèmes.'
    }
  ];

  const benefits = [
    'Transformation personnelle mesurable',
    'IA Coach disponible 24/7',
    'Alertes proactives de dérive',
    'Intégration calendrier Google',
    'Analyse financière automatisée',
    'Rapports hebdomadaires personnalisés'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground text-lg">
              Un processus simple en 3 étapes pour transformer ta vie.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Observation</h3>
              <p className="text-muted-foreground">
                Pendant 7 jours, le système t'observe sans juger pour établir ta baseline.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyse</h3>
              <p className="text-muted-foreground">
                L'IA identifie tes patterns, forces et zones de dérive potentielle.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Transformation</h3>
              <p className="text-muted-foreground">
                Reçois des interventions personnalisées pour devenir qui tu veux être.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un système complet de transformation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Chaque fonctionnalité est conçue pour t'aider à mesurer, comprendre et améliorer ta vie.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pourquoi Second Brain ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Les apps de productivité te disent quoi faire. Second Brain te montre qui tu deviens. 
                C'est la différence entre gérer des tâches et transformer ta vie.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="text-center">
                <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">7 jours d'observation</h3>
                <p className="text-muted-foreground mb-6">
                  Pendant la première semaine, le système t'observe sans juger. 
                  Il établit ta baseline pour ensuite mesurer ta vraie progression.
                </p>
                <Link to="/auth?mode=signup">
                  <Button className="gradient-primary">
                    Commencer l'observation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à devenir qui tu veux être ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoins les personnes qui ont choisi de transformer leur vie avec un système intelligent.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="xl" className="gradient-primary">
              Démarrer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/40">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Second Brain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Second Brain. Tous droits réservés.
          </p>
          <div className="flex gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
