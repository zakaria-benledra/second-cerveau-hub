import { Link } from 'react-router-dom';

interface QuickStatsFooterProps {
  completedHabitsCount: number;
  completedTasksCount: number;
  newInboxCount: number;
}

export function QuickStatsFooter({
  completedHabitsCount,
  completedTasksCount,
  newInboxCount,
}: QuickStatsFooterProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
        <Link 
          to="/history?metric=habits&range=7" 
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <span>✅</span>
          <span className="font-semibold text-success">{completedHabitsCount}</span>
          habitudes validées
        </Link>
        
        <span className="text-border hidden sm:inline">•</span>
        
        <Link 
          to="/history?metric=tasks&range=7"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <span>🚀</span>
          <span className="font-semibold text-primary">{completedTasksCount}</span>
          tâches accomplies
        </Link>
        
        {newInboxCount > 0 && (
          <>
            <span className="text-border hidden sm:inline">•</span>
            <Link 
              to="/inbox"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <span>📬</span>
              <span className="font-semibold text-warning">{newInboxCount}</span>
              nouveaux messages
            </Link>
          </>
        )}
      </div>
      
      {completedHabitsCount > 0 && completedTasksCount > 0 && (
        <p className="text-xs text-success mt-2">
          Super journée ! 🌟
        </p>
      )}
    </div>
  );
}
