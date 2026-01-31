import { Badge } from '@/components/ui/badge';
import { Brain, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type EngineStatus = 'idle' | 'analyzing' | 'ready' | 'error';

interface AIEngineStatusProps {
  status?: EngineStatus;
  lastUpdate?: Date | string;
  interventionsPending?: number;
  className?: string;
}

const statusConfig: Record<EngineStatus, {
  label: string;
  icon: typeof Brain;
  className: string;
}> = {
  idle: {
    label: 'En veille',
    icon: Brain,
    className: 'bg-muted text-muted-foreground',
  },
  analyzing: {
    label: 'Analyse...',
    icon: Zap,
    className: 'bg-primary/20 text-primary animate-pulse',
  },
  ready: {
    label: 'Actif',
    icon: CheckCircle2,
    className: 'bg-success/20 text-success',
  },
  error: {
    label: 'Erreur',
    icon: AlertCircle,
    className: 'bg-destructive/20 text-destructive',
  },
};

export function AIEngineStatus({
  status = 'idle',
  lastUpdate,
  interventionsPending = 0,
  className,
}: AIEngineStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const date = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)}j`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className={cn("gap-1.5", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      
      {interventionsPending > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          {interventionsPending} action{interventionsPending > 1 ? 's' : ''}
        </Badge>
      )}
      
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          {formatLastUpdate()}
        </span>
      )}
    </div>
  );
}
