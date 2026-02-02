import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Minus, ThumbsDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SuggestionFeedbackProps {
  suggestionId: string;
  suggestionType: 'coach' | 'journal' | 'proposal' | 'insight';
  context?: Record<string, unknown>;
  onFeedback?: (rating: number) => void;
  compact?: boolean;
}

export function SuggestionFeedback({ 
  suggestionId, 
  suggestionType, 
  context = {},
  onFeedback,
  compact = false 
}: SuggestionFeedbackProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleFeedback = async (rating: -1 | 0 | 1) => {
    if (!user?.id || submitted) return;
    
    setSelectedRating(rating);
    
    await supabase.from('suggestion_feedback').insert({
      user_id: user.id,
      suggestion_id: suggestionId,
      suggestion_type: suggestionType,
      rating,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
    });
    
    setSubmitted(true);
    onFeedback?.(rating);
  };

  if (submitted) {
    return (
      <div data-testid="feedback-success" className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in">
        <Check className="h-3.5 w-3.5 text-success" />
        <span>Merci !</span>
      </div>
    );
  }

  const buttonClass = compact 
    ? "h-6 w-6 p-0" 
    : "h-7 px-2 text-xs";

  return (
    <div className="flex items-center gap-1">
      {!compact && <span className="text-xs text-muted-foreground mr-1">Utile ?</span>}
      <Button 
        data-testid="feedback-positive"
        variant="ghost" 
        size="sm" 
        onClick={() => handleFeedback(1)} 
        className={cn(buttonClass, "hover:bg-success/10 hover:text-success")}
        title="Utile"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        {!compact && <span className="ml-1">Oui</span>}
      </Button>
      <Button 
        data-testid="feedback-neutral"
        variant="ghost" 
        size="sm" 
        onClick={() => handleFeedback(0)} 
        className={cn(buttonClass, "hover:bg-warning/10 hover:text-warning")}
        title="Moyen"
      >
        <Minus className="h-3.5 w-3.5" />
        {!compact && <span className="ml-1">Moyen</span>}
      </Button>
      <Button 
        data-testid="feedback-negative"
        variant="ghost" 
        size="sm" 
        onClick={() => handleFeedback(-1)} 
        className={cn(buttonClass, "hover:bg-destructive/10 hover:text-destructive")}
        title="Pas pour moi"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        {!compact && <span className="ml-1">Non</span>}
      </Button>
    </div>
  );
}
