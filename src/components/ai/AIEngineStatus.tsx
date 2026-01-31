import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AIEngineStatusProps {
  isActive: boolean;
  isLoading: boolean;
  lastUpdate?: string | Date;
  signalsCount?: number;
  className?: string;
}

export function AIEngineStatus({ 
  isActive, 
  isLoading, 
  lastUpdate,
  signalsCount = 0,
  className 
}: AIEngineStatusProps) {
  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (isActive) return <CheckCircle2 className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-info/15 text-info border-info/30';
    if (isActive) return 'bg-success/15 text-success border-success/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Jamais';
    const date = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Badge variant="outline" className={cn("gap-1.5", getStatusColor())}>
        <Brain className="h-3 w-3" />
        {getStatusIcon()}
        <span>
          {isLoading ? 'Analyse...' : isActive ? 'IA Active' : 'IA Inactive'}
        </span>
      </Badge>
      
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          Mis à jour {formatLastUpdate()}
        </span>
      )}
      
      {signalsCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {signalsCount} signal{signalsCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
