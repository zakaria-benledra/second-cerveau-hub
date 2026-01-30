import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  insight: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  source?: 'ai' | 'computed';
}

export function AIInsightCard({ 
  insight, 
  onRefresh, 
  isRefreshing,
  source = 'ai'
}: AIInsightCardProps) {
  return (
    <Card className="glass-subtle border-primary/10 overflow-hidden group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0',
              source === 'ai' ? 'gradient-primary' : 'bg-muted'
            )}>
              {source === 'ai' ? 'AI' : <Sparkles className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">
                  Insight du jour
                </p>
                {source === 'ai' && (
                  <span className="text-[10px] uppercase tracking-wide text-primary/70 font-semibold">
                    Coach IA
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  'h-3.5 w-3.5',
                  isRefreshing && 'animate-spin'
                )} />
              </Button>
            )}
            <Link 
              to="/ai-coach"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Voir plus
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
