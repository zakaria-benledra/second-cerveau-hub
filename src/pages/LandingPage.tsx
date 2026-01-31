import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Shield, 
  Sparkles,
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Second Brain</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing">
              <Button variant="ghost">Tarifs</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary">
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Propulsé par l'Intelligence Artificielle</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ceci n'est pas une app de{' '}
            <span className="text-muted-foreground line-through">productivité</span>
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">
              C'est ton système de transformation
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Un Second Brain qui t'observe, apprend de toi, et te guide vers la personne que tu veux devenir. 
            Discipline, finances, habitudes — tout est connecté.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="xl" className="gradient-primary w-full sm:w-auto">
                Démarrer ma transformation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Voir les tarifs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
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

      {/* Benefits Section */}
      <section className="py-20 px-4">
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
                <Link to="/auth">
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à devenir qui tu veux être ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoins les personnes qui ont choisi de transformer leur vie avec un système intelligent.
          </p>
          <Link to="/auth">
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
