import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirstName } from '@/hooks/useUserProfile';
import { SuggestionFeedback } from '@/components/feedback/SuggestionFeedback';

export type SageContext = 
  | 'welcome'
  | 'habits'
  | 'tasks'
  | 'journal'
  | 'finance'
  | 'goals'
  | 'focus'
  | 'celebration'
  | 'encouragement'
  | 'rest'
  | 'settings';

export type SageMood = 'neutral' | 'happy' | 'proud' | 'supportive' | 'celebratory';

interface SageCompanionProps {
  context: SageContext;
  mood?: SageMood;
  data?: {
    score?: number;
    completed?: number;
    total?: number;
    streak?: number;
    itemName?: string;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'hero' | 'card' | 'inline' | 'minimal';
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
  showFeedback?: boolean;
  suggestionId?: string;
}

type ContextMessageFn = (name: string, data?: SageCompanionProps['data']) => { message: string; emoji: string };

const contextMessages: Record<SageContext, ContextMessageFn> = {
  welcome: (name, data) => {
    const hour = new Date().getHours();
    const score = data?.score || 50;
    
    if (hour < 12) {
      if (score >= 70) return { message: `${name}, tu es en forme ! Prêt à démarrer fort ?`, emoji: '🌅' };
      return { message: `Bonjour ${name} ! Une nouvelle journée t'attend.`, emoji: '☀️' };
    }
    if (hour < 18) {
      if (data?.completed === data?.total && data?.total > 0) 
        return { message: `Impressionnant ${name} ! Tout est fait.`, emoji: '🏆' };
      return { message: `L'après-midi avance bien, ${name}. Continue !`, emoji: '💪' };
    }
    if (score >= 70) return { message: `Belle journée ${name} ! Tu peux être fier.`, emoji: '🌟' };
    return { message: `La journée se termine, ${name}. Demain sera encore mieux.`, emoji: '🌙' };
  },
  
  habits: (name, data) => {
    const done = data?.completed || 0;
    const total = data?.total || 0;
    if (done === total && total > 0) 
      return { message: `Toutes tes habitudes sont faites ! Journée parfaite.`, emoji: '✨' };
    if (done > total / 2) 
      return { message: `Déjà ${done}/${total}, ${name} ! Tu y es presque.`, emoji: '🎯' };
    if (done > 0)
      return { message: `${done} habitude${done > 1 ? 's' : ''} validée${done > 1 ? 's' : ''}, continue !`, emoji: '💫' };
    return { message: `Tes habitudes t'attendent, ${name}. Une à la fois !`, emoji: '🌱' };
  },
  
  tasks: (name, data) => {
    const remaining = (data?.total || 0) - (data?.completed || 0);
    if (remaining === 0) 
      return { message: `Tout est fait ! Tu gères, ${name}.`, emoji: '🎉' };
    if (remaining === 1) 
      return { message: `Plus qu'une seule tâche ! La ligne d'arrivée est proche.`, emoji: '🏁' };
    if (remaining <= 3) 
      return { message: `${remaining} tâches restantes. Tu y es presque !`, emoji: '💪' };
    return { message: `Une tâche à la fois, ${name}. Tu vas y arriver.`, emoji: '🎯' };
  },
  
  journal: (name) => ({
    message: `Ton espace personnel, ${name}. Écris ce qui te passe par la tête.`,
    emoji: '📝'
  }),
  
  finance: (name, data) => {
    const score = data?.score || 50;
    if (score >= 70) return { message: `Tes finances vont bien, ${name}. Continue ainsi !`, emoji: '💚' };
    if (score >= 40) return { message: `Quelques ajustements et tout ira mieux.`, emoji: '📊' };
    return { message: `Respirons et regardons ça ensemble calmement.`, emoji: '🧘' };
  },
  
  goals: (name, data) => {
    if (data?.completed && data.completed > 0) 
      return { message: `${data.completed} objectif${data.completed > 1 ? 's' : ''} atteint${data.completed > 1 ? 's' : ''} ! Continue ${name}.`, emoji: '🚀' };
    return { message: `Tes objectifs dessinent ton futur, ${name}.`, emoji: '🌟' };
  },
  
  focus: (name) => ({
    message: `Mode concentration activé. Je reste silencieux, ${name}.`,
    emoji: '🤫'
  }),
  
  celebration: (name, data) => ({
    message: `Bravo ${name} ! ${data?.itemName ? `"${data.itemName}"` : 'C\'est'} fait !`,
    emoji: '🎉'
  }),
  
  encouragement: (name) => ({
    message: `Journée difficile ? C'est normal, ${name}. Demain sera meilleur.`,
    emoji: '💙'
  }),
  
  rest: (name) => ({
    message: `Tu as bien travaillé, ${name}. Repose-toi bien ce soir.`,
    emoji: '😴'
  }),
  
  settings: (name) => ({
    message: `Personnalise ton expérience comme tu le souhaites, ${name}.`,
    emoji: '⚙️'
  }),
};

const moodStyles: Record<SageMood, string> = {
  neutral: 'from-primary/10 to-primary/5 border-primary/20',
  happy: 'from-success/10 to-success/5 border-success/20',
  proud: 'from-warning/10 to-warning/5 border-warning/20',
  supportive: 'from-info/10 to-info/5 border-info/20',
  celebratory: 'from-accent/10 to-accent/5 border-accent/20',
};

export function SageCompanion({
  context,
  mood = 'neutral',
  data,
  primaryAction,
  secondaryAction,
  variant = 'card',
  onRefresh,
  isLoading,
  className,
  showFeedback = false,
  suggestionId,
}: SageCompanionProps) {
  const firstName = useFirstName() || 'toi';
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { message, emoji } = contextMessages[context](firstName, data);
  
  // Effet de typing pour le variant hero
  useEffect(() => {
    if (variant !== 'hero') {
      setDisplayedText(message);
      return;
    }
    
    setIsTyping(true);
    setDisplayedText('');
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 25);
    
    return () => clearInterval(timer);
  }, [message, variant]);

  // Variant minimal : juste une ligne
  if (variant === 'minimal') {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        <span className="mr-1">{emoji}</span>
        {message}
      </div>
    );
  }

  // Variant inline : compact
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r",
        moodStyles[mood],
        "border",
        className
      )}>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm flex-1">
          <span className="mr-1">{emoji}</span>
          {message}
        </p>
        {onRefresh && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>
    );
  }

  // Variant hero : grand, centré, pour l'accueil
  if (variant === 'hero') {
    return (
      <div className={cn(
        "flex flex-col items-center text-center py-8 space-y-6",
        className
      )}>
        {/* Avatar Sage animé */}
        <div className="relative">
          <div className={cn(
            "h-20 w-20 rounded-full bg-gradient-to-br flex items-center justify-center",
            moodStyles[mood],
            "border-2 shadow-lg"
          )}>
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-2xl">{emoji}</span>
        </div>
        
        {/* Message */}
        <div className="max-w-md space-y-2">
          <p className="text-xl font-medium leading-relaxed">
            {displayedText}
            {isTyping && <span className="animate-pulse ml-0.5">|</span>}
          </p>
        </div>
        
        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-3 pt-2">
            {primaryAction && (
              <Button onClick={primaryAction.onClick} className="gap-2">
                {primaryAction.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {secondaryAction && (
              <Button variant="ghost" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant card : default
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className={cn(
            "h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0",
            moodStyles[mood],
            "border"
          )}>
            <Brain className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Sage</span>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              {onRefresh && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
                  <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                </Button>
              )}
            </div>
            
            <p className="text-sm leading-relaxed">
              <span className="mr-1">{emoji}</span>
              {message}
            </p>
            
            {showFeedback && suggestionId && (
              <div className="pt-2">
                <SuggestionFeedback
                  suggestionId={suggestionId}
                  suggestionType="insight"
                  compact
                />
              </div>
            )}
            
            {(primaryAction || secondaryAction) && (
              <div className="flex items-center gap-2 pt-1">
                {primaryAction && (
                  <Button size="sm" onClick={primaryAction.onClick}>
                    {primaryAction.label}
                  </Button>
                )}
                {secondaryAction && (
                  <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
