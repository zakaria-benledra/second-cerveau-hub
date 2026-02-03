import { useActiveProgram } from '@/hooks/useActiveProgram';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export function ProgramBadge() {
  const { data: program } = useActiveProgram();
  const navigate = useNavigate();
  
  if (!program) return null;
  
  return (
    <div
      onClick={() => navigate('/program')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
    >
      <span className="text-lg">{program.programs.icon}</span>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{program.programs.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            J{program.current_day}
          </Badge>
        </div>
        <Progress value={program.progress} className="h-1 w-20 mt-1" />
      </div>
    </div>
  );
}
