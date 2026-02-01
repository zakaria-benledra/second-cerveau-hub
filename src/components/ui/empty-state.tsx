import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'card' | 'inline';
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  secondaryAction,
  variant = 'card',
  className,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className={cn(className)}>{content}</div>;
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}
