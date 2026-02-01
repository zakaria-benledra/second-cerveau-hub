import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher après 30 secondes si installable et pas déjà dismiss
    const dismissedStorage = localStorage.getItem('pwa-install-dismissed');
    if (isInstallable && !dismissedStorage) {
      const timer = setTimeout(() => setIsVisible(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setIsVisible(false);
    }
  };

  if (!isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-primary/20 bg-background/95 backdrop-blur-lg shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex-1 pr-8">
              <p className="font-semibold">Installer Minded</p>
              <p className="text-sm text-muted-foreground mb-3">
                Ajoute l'app sur ton écran d'accueil pour un accès rapide.
              </p>
              <Button size="sm" onClick={handleInstall}>
                <Download className="h-4 w-4 mr-2" />
                Installer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
