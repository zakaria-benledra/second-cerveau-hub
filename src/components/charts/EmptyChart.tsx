import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyChartProps {
  message?: string;
  height?: number;
  className?: string;
}

export function EmptyChart({ 
  message = "Pas encore de données",
  height = 200,
  className 
}: EmptyChartProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed",
        className
      )}
      style={{ height }}
    >
      <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Les statistiques apparaîtront après quelques jours d'utilisation
      </p>
    </div>
  );
}
