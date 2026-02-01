import { usePWA } from '@/hooks/usePWA';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      Mode hors ligne - Certaines fonctionnalités peuvent être limitées
    </div>
  );
}
