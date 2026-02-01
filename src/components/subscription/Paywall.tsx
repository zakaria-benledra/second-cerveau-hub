import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllPlans } from '@/hooks/useSubscription';
import { Crown, Check, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  limitType?: 'habits' | 'tasks' | 'goals';
}

export function Paywall({ open, onClose, feature, limitType }: PaywallProps) {
  const navigate = useNavigate();
  const { data: plans } = useAllPlans();
  
  const premiumPlan = plans?.find(p => p.id === 'premium');

  const getMessage = () => {
    if (feature) return `Passe à Premium pour débloquer "${feature}"`;
    if (limitType === 'habits') return "Tu as atteint la limite d'habitudes du plan gratuit";
    if (limitType === 'tasks') return "Tu as atteint la limite de tâches du plan gratuit";
    if (limitType === 'goals') return "Tu as atteint la limite d'objectifs du plan gratuit";
    return "Passe à Premium pour débloquer tout le potentiel de Minded";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl">
            Passe à Premium ✨
          </DialogTitle>
          <DialogDescription className="text-base">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>

        {premiumPlan && (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">
                  {(premiumPlan.price_monthly / 100).toFixed(2)}€
                </span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ou {(premiumPlan.price_yearly / 100).toFixed(2)}€/an (2 mois offerts)
              </p>
            </div>

            <div className="space-y-2">
              {premiumPlan.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => {
                  onClose();
                  navigate('/pricing');
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Voir les offres
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Rester en gratuit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook pour afficher facilement le paywall
export function usePaywall() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{ feature?: string; limitType?: 'habits' | 'tasks' | 'goals' }>({});

  const showPaywall = (options?: typeof config) => {
    setConfig(options || {});
    setIsOpen(true);
  };

  const PaywallComponent = () => (
    <Paywall
      open={isOpen}
      onClose={() => setIsOpen(false)}
      {...config}
    />
  );

  return { showPaywall, PaywallComponent };
}
