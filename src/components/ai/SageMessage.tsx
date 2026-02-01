import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SageAvatar } from './SageAvatar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAICoach } from '@/hooks/useAICoach';
import { RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SageMessageProps {
  context?: {
    score?: number;
    streak?: number;
    tasksLeft?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
  onActionClick?: () => void;
  actionLabel?: string;
}

export function SageMessage({ context, onActionClick, actionLabel }: SageMessageProps) {
  const { data: profile } = useUserProfile();
  const { briefing, briefingLoading, refetchBriefing } = useAICoach();
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  
  const firstName = profile?.first_name || 'toi';
  
  // Message par défaut selon contexte
  const getDefaultMessage = () => {
    const hour = new Date().getHours();
    const score = context?.score || 50;
    
    if (hour < 12) {
      if (score >= 70) return `${firstName}, tu es en forme ce matin ! 🌅 Profites-en pour attaquer ta tâche la plus importante.`;
      return `Bonjour ${firstName} ! ☀️ Une nouvelle journée, de nouvelles opportunités. Par quoi veux-tu commencer ?`;
    } else if (hour < 18) {
      if (context?.tasksLeft === 0) return `Impressionnant ${firstName} ! 🎯 Tu as tout terminé. Tu peux être fier de toi.`;
      if (score >= 70) return `Belle après-midi ${firstName} ! Tu avances bien, continue comme ça 💪`;
      return `L'après-midi avance, ${firstName}. Reste focus, tu peux encore accomplir de belles choses !`;
    } else {
      if (score >= 70) return `Quelle journée ${firstName} ! 🌟 Tu as assuré. Repose-toi bien, tu l'as mérité.`;
      return `La journée se termine, ${firstName}. Demain est un nouveau départ ! 🌙`;
    }
  };
  
  // Use first recommendation message or default
  const recommendationMessage = briefing?.recommendations?.[0] 
    ? ('message' in briefing.recommendations[0] ? briefing.recommendations[0].message : getDefaultMessage())
    : null;
  const message = recommendationMessage || getDefaultMessage();
  
  // Effet de typing
  useEffect(() => {
    if (briefingLoading) {
      setIsTyping(true);
      setDisplayedText('');
      return;
    }
    
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20); // Vitesse de typing
    
    return () => clearInterval(timer);
  }, [message, briefingLoading]);

  const getMood = () => {
    if (briefingLoading) return 'thinking';
    if (context?.score && context.score >= 80) return 'celebrating';
    if (context?.score && context.score >= 60) return 'happy';
    return 'neutral';
  };

  return (
    <Card className="glass-subtle hover:glass transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar Sage */}
          <div className="flex flex-col items-center gap-1">
            <SageAvatar size="md" mood={getMood()} animate={!briefingLoading} />
            <span className="text-xs text-muted-foreground font-medium">
              Sage
            </span>
          </div>
          
          {/* Message */}
          <div className="flex-1 space-y-3">
            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
              {briefingLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Je réfléchis...
                </div>
              ) : (
                <p className="text-sm leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="animate-pulse ml-0.5">|</span>}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {onActionClick && actionLabel && (
                <Button size="sm" onClick={onActionClick} className="gap-1">
                  {actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetchBriefing()}
                disabled={briefingLoading}
                className="text-muted-foreground"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", briefingLoading && "animate-spin")} />
                Autre conseil
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
