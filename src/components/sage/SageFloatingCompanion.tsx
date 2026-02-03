import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Target, ChevronRight, BookOpen, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSageLive } from '@/hooks/useSageLive';
import { useActiveAIProgram } from '@/hooks/useAIProgram';

const moodConfig = {
  happy: { gradient: 'from-success/30 to-success/5', border: 'border-success/40', avatar: '😊', color: 'bg-success' },
  proud: { gradient: 'from-warning/30 to-warning/5', border: 'border-warning/40', avatar: '🔥', color: 'bg-warning' },
  supportive: { gradient: 'from-info/30 to-info/5', border: 'border-info/40', avatar: '💙', color: 'bg-info' },
  concerned: { gradient: 'from-orange-500/30 to-orange-500/5', border: 'border-orange-500/40', avatar: '🤔', color: 'bg-orange-500' },
  excited: { gradient: 'from-primary/30 to-primary/5', border: 'border-primary/40', avatar: '🚀', color: 'bg-primary' },
  calm: { gradient: 'from-muted to-background', border: 'border-border', avatar: '🧘', color: 'bg-muted' },
  neutral: { gradient: 'from-primary/20 to-primary/5', border: 'border-primary/30', avatar: '🧠', color: 'bg-primary' },
  focused: { gradient: 'from-primary/25 to-primary/5', border: 'border-primary/35', avatar: '🎯', color: 'bg-primary' },
};

export function SageFloatingCompanion() {
  // FERMÉ PAR DÉFAUT
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const sage = useSageLive();
  const { data: program } = useActiveAIProgram();

  const mood = moodConfig[sage.mood as keyof typeof moodConfig] || moodConfig.neutral;

  // Détecter si Sage a quelque chose d'important à dire
  useEffect(() => {
    // Notification si :
    // - Nouveau message important (mood = concerned, excited, proud)
    // - Programme actif avec mission du jour
    // - Score bas ou streak en danger
    const importantMoods = ['concerned', 'excited', 'proud'];
    const hasImportantMessage = importantMoods.includes(sage.mood);
    const hasProgram = !!program;
    
    if ((hasImportantMessage || hasProgram) && !isExpanded) {
      setHasNotification(true);
    }
  }, [sage.mood, program, location.pathname, isExpanded]);

  // Reset notification quand on ouvre
  useEffect(() => {
    if (isExpanded) {
      setHasNotification(false);
    }
  }, [isExpanded]);

  // Ne pas afficher sur certaines pages
  const hiddenPaths = ['/auth', '/', '/pricing', '/onboarding'];
  if (hiddenPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith('/auth'))) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // === BADGE MINIMISÉ AVEC NOTIFICATION ===
          <motion.div
            key="collapsed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "relative h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer",
              "bg-gradient-to-br from-primary to-primary/70",
              "hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{mood.avatar}</span>
            
            {/* Badge de notification */}
            {hasNotification && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center"
              >
                <Bell className="h-2.5 w-2.5 text-destructive-foreground" />
              </motion.div>
            )}
          </motion.div>
        ) : (
          // === CARTE EXPANDÉE ===
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <Card className={cn(
              "w-80 shadow-2xl border-2",
              mood.border,
              `bg-gradient-to-br ${mood.gradient}`
            )}>
              <CardContent className="p-4 space-y-3">
                {/* Header avec avatar animé */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className={cn("text-3xl p-2 rounded-xl", mood.color)}
                    >
                      {mood.avatar}
                    </motion.div>
                    <div>
                      <p className="font-bold text-sm">Sage</p>
                      <p className="text-xs text-muted-foreground">{sage.greeting || 'Ton coach IA'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 hover:bg-background/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Message principal */}
                <p className="text-sm leading-relaxed">
                  {sage.message || 'Comment puis-je t\'aider aujourd\'hui ?'}
                </p>

                {/* Conseil du jour */}
                {sage.tip && (
                  <div className="p-2 rounded-lg bg-background/50 text-xs">
                    <p>💡 {sage.tip}</p>
                  </div>
                )}

                {/* Programme actif */}
                {program && (
                  <div
                    className="flex items-center justify-between p-2 rounded-lg bg-background/50 cursor-pointer hover:bg-background/70 transition-colors"
                    onClick={() => {
                      navigate('/program');
                      setIsExpanded(false);
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium">{program.title}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        Jour {program.current_day}/{program.duration_days}
                      </Badge>
                    </div>
                    <Progress value={(program.current_day / program.duration_days) * 100} className="w-16 h-1.5" />
                  </div>
                )}

                {/* Actions rapides */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      navigate('/program');
                      setIsExpanded(false);
                    }}
                  >
                    {program ? 'Mon programme' : 'Démarrer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      navigate('/journal');
                      setIsExpanded(false);
                    }}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Journal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SageFloatingCompanion;
