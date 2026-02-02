import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Fetch user role from user_roles table
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.warn('User role fetch:', error.code);
          return null;
        }
        
        return data?.role || null;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user?.id && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has admin or owner role
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ShieldAlert className="h-16 w-16 mx-auto mb-6 text-destructive" />
          <h1 className="text-2xl font-bold mb-3">Accès refusé</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les administrateurs peuvent y accéder.
          </p>
          <Button asChild variant="outline">
            <a href="/identity">Retour à l'accueil</a>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
