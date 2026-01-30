import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  TrendingUp,
  History,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface KanbanHeaderProps {
  totalTasks: number;
  doingTasks: number;
  doneTasks: number;
  avgImpactScore: number;
  onCreateTask: () => void;
}

export function KanbanHeader({
  totalTasks,
  doingTasks,
  doneTasks,
  avgImpactScore,
  onCreateTask,
}: KanbanHeaderProps) {
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Title Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Flux Kanban
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tâches par impact comportemental
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            className="gradient-primary text-primary-foreground shadow-lg"
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Impact Score Average */}
        <div className="glass-hover px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Impact moyen</span>
            <span className="font-bold text-lg">{avgImpactScore}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-hover px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/20">
            <Zap className="h-4 w-4 text-warning" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">En cours</span>
            <span className="font-bold text-lg">{doingTasks}</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-hover px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${completionRate * 0.88} 88`}
                strokeLinecap="round"
                className="text-success"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Terminées</span>
            <span className="font-bold text-lg">{doneTasks}/{totalTasks}</span>
          </div>
        </div>

        {/* History Link */}
        <Link 
          to="/tasks"
          className="ml-auto glass-hover px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <History className="h-4 w-4" />
          Historique
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
