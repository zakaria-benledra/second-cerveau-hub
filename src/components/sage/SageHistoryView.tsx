import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Clock, History, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SuggestionFeedback } from '@/components/feedback/SuggestionFeedback';

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string | null;
  priority: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function SageHistoryView() {
  const { user } = useAuth();
  
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['sage-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_proposals')
        .select('id, title, description, type, status, priority, created_at, reviewed_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []) as Proposal[];
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-success" />;
      case 'rejected':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success" className="text-xs">Accepté</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Refusé</Badge>;
      default:
        return <Badge variant="warning" className="text-xs">En attente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des propositions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Historique des propositions
        </CardTitle>
        <CardDescription>
          Les suggestions de Sage et vos réponses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucune proposition encore</p>
            <p className="text-sm">Les suggestions de Sage apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div 
                key={proposal.id} 
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  proposal.status === 'accepted' && "bg-success/5 border-success/20",
                  proposal.status === 'rejected' && "bg-destructive/5 border-destructive/20",
                  !proposal.status && "bg-secondary/30 border-border/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(proposal.status)}
                      <h4 className="font-medium text-sm truncate">
                        {proposal.title || 'Proposition'}
                      </h4>
                    </div>
                    {proposal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {proposal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(proposal.created_at), 'dd MMM à HH:mm', { locale: fr })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {proposal.type}
                      </Badge>
                    </div>
                    {!proposal.status && (
                      <SuggestionFeedback
                        suggestionId={proposal.id}
                        suggestionType="proposal"
                        compact
                      />
                    )}
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(proposal.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
