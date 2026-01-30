import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Wallet,
  Activity,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DriftSignal {
  id: string;
  type: 'warning' | 'danger' | 'info';
  category: 'habit' | 'task' | 'finance' | 'energy' | 'overload';
  title: string;
  description: string;
  action?: {
    label: string;
    path: string;
  };
}

interface DriftSignalsCardProps {
  signals: DriftSignal[];
}

const categoryIcons = {
  habit: Activity,
  task: Clock,
  finance: Wallet,
  energy: Activity,
  overload: AlertTriangle,
};

const typeStyles = {
  warning: {
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    icon: 'text-warning',
  },
  danger: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
    icon: 'text-destructive',
  },
  info: {
    border: 'border-info/30',
    bg: 'bg-info/10',
    icon: 'text-info',
  },
};

export function DriftSignalsCard({ signals }: DriftSignalsCardProps) {
  const hasSignals = signals.length > 0;
  const dangerCount = signals.filter(s => s.type === 'danger').length;
  const warningCount = signals.filter(s => s.type === 'warning').length;

  return (
    <Card className={cn(
      'glass-hover transition-all duration-300',
      !hasSignals && 'border-success/30 bg-success/5'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              hasSignals ? 'bg-warning/15' : 'bg-success/15'
            )}>
              {hasSignals ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
            <CardTitle className="text-base">Signaux de Dérive</CardTitle>
          </div>
          {hasSignals ? (
            <div className="flex gap-1">
              {dangerCount > 0 && (
                <Badge className="bg-destructive/15 text-destructive border-0 text-xs">
                  {dangerCount} critique
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="bg-warning/15 text-warning border-0 text-xs">
                  {warningCount} alerte
                </Badge>
              )}
            </div>
          ) : (
            <Badge className="bg-success/15 text-success border-0 text-xs">
              Tout va bien
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {!hasSignals ? (
          <div className="text-center py-4">
            <p className="text-sm text-success font-medium">
              Aucune dérive détectée
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Continuez sur cette lancée !
            </p>
          </div>
        ) : (
          <>
            {signals.slice(0, 3).map((signal) => {
              const Icon = categoryIcons[signal.category];
              const style = typeStyles[signal.type];
              
              return (
                <div
                  key={signal.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all duration-200',
                    style.border,
                    style.bg,
                    signal.action && 'hover:shadow-md cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5', style.icon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {signal.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {signal.description}
                      </p>
                      {signal.action && (
                        <Link 
                          to={signal.action.path}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          {signal.action.label}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    {signal.type === 'danger' && (
                      <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}

            {signals.length > 3 && (
              <Link 
                to="/scores"
                className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
              >
                Voir tous les signaux
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
