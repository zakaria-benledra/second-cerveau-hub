import { ReactNode } from 'react';
import { useFirstName } from '@/hooks/useUserProfile';
import { useStreak } from '@/hooks/useStreak';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { GlobalScoreBadge } from '@/components/layout/GlobalScoreBadge';
import { PlanBadge } from '@/components/PlanBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GlobalHeaderProps {
  // Mode d'affichage
  variant?: 'greeting' | 'page' | 'minimal';
  // Titre personnalisé (override le greeting)
  title?: string;
  // Sous-titre
  subtitle?: string;
  // Afficher le streak
  showStreak?: boolean;
  // Afficher le bouton retour
  showBack?: boolean;
  // Contenu à droite
  rightContent?: ReactNode;
  // Icône avec le titre
  icon?: ReactNode;
  // Classes additionnelles
  className?: string;
}

export function GlobalHeader({
  variant = 'greeting',
  title,
  subtitle,
  showStreak = true,
  showBack = false,
  rightContent,
  icon,
  className,
}: GlobalHeaderProps) {
  const firstName = useFirstName();
  const { data: streakData } = useStreak();
  const navigate = useNavigate();
  
  const formattedDate = format(new Date(), "EEEE d MMMM", { locale: fr });
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const displayTitle = title || (variant === 'greeting' 
    ? `${getGreeting()}${firstName ? ` ${firstName}` : ''} 👋`
    : title);

  const displaySubtitle = subtitle || (variant === 'greeting' ? formattedDate : subtitle);

  return (
    <header className={cn("flex items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        
        <div className="space-y-0.5">
          <h1 className={cn(
            "font-semibold tracking-tight",
            variant === 'greeting' ? 'text-2xl' : 'text-xl'
          )}>
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground capitalize">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <GlobalScoreBadge />
        <PlanBadge />
        {showStreak && streakData && streakData.currentStreak > 0 && (
          <StreakBadge days={streakData.currentStreak} />
        )}
        {rightContent}
      </div>
    </header>
  );
}
