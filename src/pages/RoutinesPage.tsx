import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * DEPRECATED: Routines have been consolidated into Habits.
 * This page redirects to /habits automatically.
 */
export default function RoutinesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to habits page after a brief delay
    const timer = setTimeout(() => {
      navigate('/habits', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass-strong max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Routines consolidées</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Les routines ont été fusionnées avec les habitudes pour une expérience simplifiée.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Redirection vers Habitudes...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
