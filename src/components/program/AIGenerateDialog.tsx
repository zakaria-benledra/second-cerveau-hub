import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Sparkles, Target, Flame, Heart, Wallet,
  Clock, Zap, Leaf, Loader2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: GenerationConfig) => Promise<void>;
  isGenerating: boolean;
}

export interface GenerationConfig {
  programType: 'discipline' | 'mental' | 'finance' | 'balanced' | 'custom';
  durationDays: number;
  intensity: 'light' | 'moderate' | 'intense';
  focusAreas: string[];
  customGoal: string;
}

const PROGRAM_TYPES = [
  { 
    id: 'discipline', 
    label: 'Discipline', 
    icon: Target, 
    description: 'Productivité, habitudes, routine',
    color: 'text-primary',
  },
  { 
    id: 'mental', 
    label: 'Mental', 
    icon: Brain, 
    description: 'Méditation, stress, clarté',
    color: 'text-info',
  },
  { 
    id: 'finance', 
    label: 'Finance', 
    icon: Wallet, 
    description: 'Budget, épargne, discipline',
    color: 'text-success',
  },
  { 
    id: 'balanced', 
    label: 'Équilibré', 
    icon: Heart, 
    description: 'Mix de tous les domaines',
    color: 'text-warning',
  },
];

const INTENSITY_OPTIONS = [
  { id: 'light', label: 'Léger', description: '15-30 min/jour', icon: Leaf },
  { id: 'moderate', label: 'Modéré', description: '30-60 min/jour', icon: Flame },
  { id: 'intense', label: 'Intense', description: '60+ min/jour', icon: Zap },
];

const FOCUS_AREAS = [
  'Routine matinale',
  'Productivité',
  'Méditation',
  'Lecture',
  'Sport',
  'Alimentation',
  'Sommeil',
  'Relations',
  'Créativité',
  'Apprentissage',
];

export function AIGenerateDialog({ 
  open, 
  onOpenChange, 
  onGenerate,
  isGenerating 
}: AIGenerateDialogProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<GenerationConfig>({
    programType: 'balanced',
    durationDays: 21,
    intensity: 'moderate',
    focusAreas: [],
    customGoal: '',
  });
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 1000);

    try {
      await onGenerate(config);
      setProgress(100);
    } finally {
      clearInterval(interval);
    }
  };

  const toggleFocusArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générer mon programme IA
          </DialogTitle>
          <DialogDescription>
            Sage va créer un programme 100% personnalisé pour toi
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          // === ÉTAT DE GÉNÉRATION ===
          <div className="py-8 space-y-6">
            <motion.div
              className="flex justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="h-16 w-16 text-primary" />
            </motion.div>
            
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Sage réfléchit...</h3>
              <p className="text-sm text-muted-foreground">
                Analyse de ton profil et création du programme personnalisé
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Génération en cours</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 10 ? 1 : 0.5 }}
              >
                <CheckCircle2 className={cn("h-4 w-4", progress > 10 && "text-success")} />
                Analyse du profil
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 30 ? 1 : 0.5 }}
              >
                <CheckCircle2 className={cn("h-4 w-4", progress > 30 && "text-success")} />
                Sélection des méthodologies
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 50 ? 1 : 0.5 }}
              >
                <CheckCircle2 className={cn("h-4 w-4", progress > 50 && "text-success")} />
                Création des habitudes
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 70 ? 1 : 0.5 }}
              >
                <CheckCircle2 className={cn("h-4 w-4", progress > 70 && "text-success")} />
                Génération du planning
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: progress > 90 ? 1 : 0.5 }}
              >
                <CheckCircle2 className={cn("h-4 w-4", progress > 90 && "text-success")} />
                Finalisation
              </motion.div>
            </div>
          </div>
        ) : (
          // === FORMULAIRE DE CONFIGURATION ===
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-4"
              >
                <div className="space-y-3">
                  <Label className="text-base font-medium">Type de programme</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROGRAM_TYPES.map(type => {
                      const Icon = type.icon;
                      const isSelected = config.programType === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setConfig(prev => ({ ...prev, programType: type.id as any }))}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className={cn("h-6 w-6 mb-2", type.color)} />
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Durée : {config.durationDays} jours
                  </Label>
                  <Slider
                    value={[config.durationDays]}
                    onValueChange={([v]) => setConfig(prev => ({ ...prev, durationDays: v }))}
                    min={7}
                    max={90}
                    step={7}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>7 jours</span>
                    <span>90 jours</span>
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Continuer
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-4"
              >
                <div className="space-y-3">
                  <Label className="text-base font-medium">Intensité</Label>
                  <RadioGroup
                    value={config.intensity}
                    onValueChange={(v) => setConfig(prev => ({ ...prev, intensity: v as any }))}
                    className="space-y-2"
                  >
                    {INTENSITY_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                            config.intensity === opt.id 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={opt.id} />
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Focus (optionnel)</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_AREAS.map(area => (
                      <Badge
                        key={area}
                        variant={config.focusAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFocusArea(area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continuer
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-4"
              >
                <div className="space-y-3">
                  <Label className="text-base font-medium">Objectif personnel (optionnel)</Label>
                  <Textarea
                    placeholder="Ex: Je veux développer une routine matinale solide pour être plus productif au travail..."
                    value={config.customGoal}
                    onChange={(e) => setConfig(prev => ({ ...prev, customGoal: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Résumé
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Programme : <span className="text-foreground capitalize">{config.programType}</span></li>
                    <li>• Durée : <span className="text-foreground">{config.durationDays} jours</span></li>
                    <li>• Intensité : <span className="text-foreground capitalize">{config.intensity}</span></li>
                    {config.focusAreas.length > 0 && (
                      <li>• Focus : <span className="text-foreground">{config.focusAreas.join(', ')}</span></li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleGenerate} className="flex-1 gap-2">
                    <Brain className="h-4 w-4" />
                    Générer mon programme
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}
