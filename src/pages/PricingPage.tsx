import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllPlans, useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Crown, Users, Zap, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const { data: plans } = useAllPlans();
  const { data: subscription } = useSubscription();

  const currentPlanId = subscription?.plan_id || 'free';

  const planIcons: Record<string, typeof Zap> = {
    free: Zap,
    premium: Crown,
    team: Users,
  };

  const planColors: Record<string, string> = {
    free: 'from-muted-foreground to-muted-foreground/80',
    premium: 'from-primary to-primary/80',
    team: 'from-amber-500 to-orange-500',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="mt-4 text-center">
            <h1 className="text-3xl font-bold">Choisir ton plan</h1>
            <p className="text-muted-foreground mt-2">Investis dans ta transformation</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Toggle Mensuel/Annuel */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={cn(!isYearly && "font-semibold")}>Mensuel</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={cn("flex items-center gap-2", isYearly && "font-semibold")}>
            Annuel
            <Badge variant="secondary" className="text-xs">-17%</Badge>
          </span>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans?.map((plan) => {
            const Icon = planIcons[plan.id] || Zap;
            const isCurrentPlan = plan.id === currentPlanId;
            const price = isYearly ? plan.price_yearly : plan.price_monthly;
            const period = isYearly ? '/an' : '/mois';

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  plan.id === 'premium' && "border-primary shadow-lg scale-105",
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {plan.id === 'premium' && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    Populaire
                  </div>
                )}

                <CardHeader>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-3",
                    planColors[plan.id]
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Prix */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Gratuit' : `${(price / 100).toFixed(2)}€`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">{period}</span>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full"
                    variant={plan.id === 'premium' ? 'default' : 'outline'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Plan actuel'
                    ) : plan.id === 'free' ? (
                      'Commencer gratuitement'
                    ) : (
                      `Passer à ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-muted-foreground text-sm">
                Oui, tu peux annuler ton abonnement à tout moment. Tu garderas l'accès jusqu'à la fin de ta période de facturation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Mes données sont-elles sécurisées ?</h3>
              <p className="text-muted-foreground text-sm">
                Absolument. Toutes tes données sont chiffrées et stockées de manière sécurisée. Nous ne vendons jamais tes données.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Y a-t-il une période d'essai ?</h3>
              <p className="text-muted-foreground text-sm">
                Tu peux utiliser le plan gratuit aussi longtemps que tu le souhaites. C'est notre façon de te laisser découvrir Minded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
