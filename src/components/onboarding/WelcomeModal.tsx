import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useUserProfile';
import { useConfetti } from '@/hooks/useConfetti';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sparkles, ArrowRight, Brain } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

// Routes où le modal ne doit pas bloquer
const BYPASS_ROUTES = ['/settings', '/auth'];

export function WelcomeModal({ open, onComplete, onSkip }: WelcomeModalProps) {
  const [firstName, setFirstName] = useState('');
  const [step, setStep] = useState(1);
  const updateProfile = useUpdateProfile();
  const { fire } = useConfetti();
  const { trackConversion, trackEngagement } = useAnalytics();
  const location = useLocation();

  // Ne pas afficher sur certaines routes
  const shouldBypass = BYPASS_ROUTES.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    if (open && !shouldBypass) {
      trackEngagement('onboarding_started');
    }
  }, [open, shouldBypass, trackEngagement]);

  const handleSubmit = async () => {
    if (!firstName.trim()) return;
    
    await updateProfile.mutateAsync({
      first_name: firstName.trim(),
      display_name: firstName.trim(),
      onboarding_completed: true,
    });
    
    trackConversion('onboarding_completed', { firstName: firstName.trim() });
    setStep(2);
    fire('fireworks');
    setTimeout(onComplete, 2500);
  };

  const handleSkip = () => {
    trackEngagement('onboarding_skipped');
    onSkip?.();
    onComplete();
  };

  // Ne pas afficher si bypass
  if (shouldBypass) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === 1 ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                Bienvenue sur Minded 👋
              </DialogTitle>
              <DialogDescription className="text-base">
                Je suis Sage, ton coach personnel. 
                Je vais t'accompagner dans ta transformation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Comment dois-je t'appeler ?</Label>
                <Input
                  id="firstName"
                  placeholder="Ton prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="text-lg py-6"
                  autoFocus
                />
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={!firstName.trim() || updateProfile.isPending}
                className="w-full"
                size="lg"
              >
                {updateProfile.isPending ? 'Un instant...' : (
                  <>
                    C'est parti !
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground"
                size="sm"
              >
                Plus tard
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-4 animate-slide-up-fade">
            <div className="text-6xl animate-celebration-shake">🎉</div>
            <DialogTitle className="text-2xl">
              Enchanté {firstName} !
            </DialogTitle>
            <DialogDescription className="text-base">
              On va faire de grandes choses ensemble.
            </DialogDescription>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Préparation de ton espace...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
