import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Sparkles, Target, ChevronRight, BookOpen, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSageLive } from '@/hooks/useSageLive';
import { useActiveAIProgram } from '@/hooks/useAIProgram';

const moodConfig = {
  happy: { gradient: 'from-success/30 to-success/5', border: 'border-success/40', avatar: '😊' },
  proud: { gradient: 'from-warning/30 to-warning/5', border: 'border-warning/40', avatar: '🔥' },
  supportive: { gradient: 'from-info/30 to-info/5', border: 'border-info/40', avatar: '💙' },
  concerned: { gradient: 'from-orange-500/30 to-orange-500/5', border: 'border-orange-500/40', avatar: '🤔' },
  excited: { gradient: 'from-primary/30 to-primary/5', border: 'border-primary/40', avatar: '🚀' },
  calm: { gradient: 'from-muted to-background', border: 'border-border', avatar: '🧘' },
  neutral: { gradient: 'from-primary/20 to-primary/5', border: 'border-primary/30', avatar: '🧠' },
  focused: { gradient: 'from-primary/25 to-primary/5', border: 'border-primary/35', avatar: '🎯' },
};

export function SageFloatingCompanion() {
  // TOUJOURS OUVERT PAR DÉFAUT
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  
  const sage = useSageLive();
  const { data: program } = useActiveAIProgram();

  const mood = moodConfig[sage.mood as keyof typeof moodConfig] || moodConfig.neutral;

  // Ne pas afficher sur certaines pages
  const hiddenPaths = ['/auth', '/', '/pricing', '/onboarding'];
  if (hiddenPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith('/auth'))) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isExpanded ? 'expanded' : 'minimized'}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
      >
        {!isExpanded ? (
          // === BADGE MINIMISÉ ===
          <motion.button
            onClick={() => setIsExpanded(true)}
            className={cn(
              "relative h-16 w-16 rounded-2xl shadow-2xl flex items-center justify-center",
              "bg-gradient-to-br from-primary to-primary/70",
              "hover:shadow-primary/30 transition-all duration-300"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{mood.avatar}</span>
          </motion.button>
        ) : (
          // === CARTE EXPANDÉE ===
          <Card className={cn(
            "w-80 md:w-96 shadow-2xl overflow-hidden border-2",
            `bg-gradient-to-br ${mood.gradient} ${mood.border}`
          )}>
            <CardContent className="p-4 space-y-4">
              {/* Header avec avatar animé */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center text-2xl",
                      "bg-gradient-to-br from-primary to-primary/70 shadow-lg"
                    )}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    {mood.avatar}
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">Sage</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Ton coach personnel IA
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-background/50"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Message principal */}
              <div className="space-y-1">
                {sage.greeting && (
                  <p className="font-semibold text-base">{sage.greeting}</p>
                )}
                <p className="text-sm text-foreground/80">{sage.message}</p>
              </div>

              {/* Conseil contextuel */}
              {sage.tip && (
                <div className={cn(
                  "p-3 rounded-xl",
                  "bg-background/60 backdrop-blur-sm border border-border/50"
                )}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sage.tip}</p>
                  </div>
                </div>
              )}

              {/* Programme actif */}
              {program && (
                <motion.div 
                  className="p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() => navigate('/program')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[180px]">
                        {program.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Jour {program.current_day}/{program.duration_days}
                    </Badge>
                  </div>
                  <Progress 
                    value={(program.current_day / program.duration_days) * 100} 
                    className="h-1.5" 
                  />
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs bg-background/50 hover:bg-background/80"
                  onClick={() => navigate('/program')}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  {program ? 'Mon programme' : 'Créer programme'}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 text-xs"
                  onClick={() => {
                    // Naviguer vers l'action la plus pertinente
                    if (sage.actionPath) {
                      navigate(sage.actionPath);
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                >
                  {sage.actionLabel || 'Action suivante'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
