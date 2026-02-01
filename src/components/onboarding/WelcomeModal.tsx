import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/hooks/useUserProfile';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
}

export function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const [firstName, setFirstName] = useState('');
  const [step, setStep] = useState(1);
  const updateProfile = useUpdateProfile();

  const handleSubmit = async () => {
    if (!firstName.trim()) return;
    
    await updateProfile.mutateAsync({
      first_name: firstName.trim(),
      display_name: firstName.trim(),
      onboarding_completed: true,
    });
    
    setStep(2);
    setTimeout(onComplete, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                Bienvenue sur Minded 👋
              </DialogTitle>
              <DialogDescription className="text-base">
                Je suis Sage, ton coach personnel. Comment dois-je t'appeler ?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ton prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Ex: Marie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-lg py-6"
                  autoFocus
                />
              </div>
              
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                size="lg"
                disabled={!firstName.trim() || updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Un instant...' : (
                  <>
                    C'est parti !
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <DialogTitle className="text-2xl">
              Enchanté {firstName} !
            </DialogTitle>
            <DialogDescription className="text-base">
              On va faire de grandes choses ensemble.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
