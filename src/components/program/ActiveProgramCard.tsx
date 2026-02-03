import { useActiveProgram } from '@/hooks/useActiveProgram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, ChevronRight, Sparkles, Rocket, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ActiveProgramCardProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function ActiveProgramCard({ variant = 'full', className }: ActiveProgramCardProps) {
  const { data: program, isLoading } = useActiveProgram();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!program) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-muted/50 to-muted/20",
          className
        )}
        onClick={() => navigate('/program')}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold">Aucun programme actif</h4>
              <p className="text-sm text-muted-foreground">
                Choisis un programme pour te transformer
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              Explorer
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-all duration-300",
          className
        )}
        onClick={() => navigate('/program')}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{program.programs.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{program.programs.name}</span>
                <Badge variant="secondary" className="text-xs">
                  J{program.current_day}/{program.programs.duration_days}
                </Badge>
              </div>
              <Progress value={program.progress} className="h-1.5 mt-1.5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl p-2 bg-background/50 rounded-xl backdrop-blur">
              {program.programs.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{program.programs.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                {program.programs.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            Jour {program.current_day}/{program.programs.duration_days}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{program.progress}%</span>
          </div>
          <Progress value={program.progress} className="h-2" />
        </div>

        {program.todayMission && (
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/15 shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{program.todayMission.title}</h4>
                {program.todayMission.sage_tip && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <Brain className="h-3 w-3 mt-0.5 shrink-0 text-accent" />
                    <span className="line-clamp-2">{program.todayMission.sage_tip}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button 
          variant="outline"
          className="w-full" 
          onClick={() => navigate('/program')}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Voir mon programme
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
