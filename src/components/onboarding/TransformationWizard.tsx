import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Eye, 
  Rocket, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  LineChart,
  Shield,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useCompleteOnboarding } from '@/hooks/useOnboarding';

interface TransformationWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Bienvenue' },
  { id: 'goals', title: 'Tes Objectifs' },
  { id: 'observe', title: 'Observation' },
  { id: 'ready', title: 'Prêt' },
];

export function TransformationWizard({ onComplete }: TransformationWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [goals, setGoals] = useState({
    discipline: 50,
    financialStability: 50,
    mentalBalance: 50,
  });

  const completeOnboarding = useCompleteOnboarding();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding.mutateAsync(goals);
    onComplete();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                index <= currentStep 
                  ? "w-12 bg-gradient-to-r from-primary to-accent" 
                  : "w-6 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-3xl p-8 md:p-12"
          >
            {currentStep === 0 && <WelcomeStep />}
            {currentStep === 1 && <GoalsStep goals={goals} setGoals={setGoals} />}
            {currentStep === 2 && <ObserveStep />}
            {currentStep === 3 && <ReadyStep />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && 'invisible')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="gap-2">
              Continuer
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={completeOnboarding.isPending}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Rocket className="h-4 w-4" />
              Commencer Ma Transformation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
        <Brain className="h-10 w-10 text-primary" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Bienvenue dans ton Second Cerveau
      </h1>
      
      <div className="space-y-4 text-muted-foreground max-w-lg mx-auto">
        <p className="text-lg">
          <span className="text-foreground font-semibold">Ceci n'est pas une app de productivité.</span>
        </p>
        <p>
          C'est un <span className="text-primary font-medium">système d'intelligence décisionnelle</span> qui 
          observe tes comportements, mesure ta progression et te guide vers 
          la personne que tu veux devenir.
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 pt-6">
        <div className="flex flex-col items-center gap-2 text-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <span className="text-muted-foreground">Observer</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        <div className="flex flex-col items-center gap-2 text-sm">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
            <LineChart className="h-5 w-5 text-accent" />
          </div>
          <span className="text-muted-foreground">Mesurer</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        <div className="flex flex-col items-center gap-2 text-sm">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-success" />
          </div>
          <span className="text-muted-foreground">Transformer</span>
        </div>
      </div>
    </div>
  );
}

interface GoalsStepProps {
  goals: { discipline: number; financialStability: number; mentalBalance: number };
  setGoals: React.Dispatch<React.SetStateAction<{ discipline: number; financialStability: number; mentalBalance: number }>>;
}

function GoalsStep({ goals, setGoals }: GoalsStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/20 to-accent/20 mb-2">
          <Target className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Qui veux-tu devenir ?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Indique tes priorités de transformation. Le système s'adaptera pour t'aider à atteindre ces objectifs.
        </p>
      </div>

      <div className="space-y-8 max-w-md mx-auto">
        <GoalSlider
          icon={<Shield className="h-5 w-5" />}
          label="Discipline"
          description="Constance dans tes habitudes et engagements"
          value={goals.discipline}
          onChange={(value) => setGoals(prev => ({ ...prev, discipline: value }))}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        
        <GoalSlider
          icon={<LineChart className="h-5 w-5" />}
          label="Stabilité Financière"
          description="Maîtrise de tes finances et épargne"
          value={goals.financialStability}
          onChange={(value) => setGoals(prev => ({ ...prev, financialStability: value }))}
          color="text-success"
          bgColor="bg-success/10"
        />
        
        <GoalSlider
          icon={<Heart className="h-5 w-5" />}
          label="Équilibre Mental"
          description="Bien-être émotionnel et clarté mentale"
          value={goals.mentalBalance}
          onChange={(value) => setGoals(prev => ({ ...prev, mentalBalance: value }))}
          color="text-accent"
          bgColor="bg-accent/10"
        />
      </div>
    </div>
  );
}

interface GoalSliderProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  bgColor: string;
}

function GoalSlider({ icon, label, description, value, onChange, color, bgColor }: GoalSliderProps) {
  const getLevel = (val: number) => {
    if (val < 33) return 'Faible priorité';
    if (val < 66) return 'Priorité moyenne';
    return 'Haute priorité';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor, color)}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{label}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className={cn("text-sm font-medium", color)}>{getLevel(value)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={100}
        step={1}
        className="py-2"
      />
    </div>
  );
}

function ObserveStep() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-info/20 to-primary/20 mb-4">
        <Eye className="h-10 w-10 text-info" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold">
        Le Système Va T'Observer
      </h2>
      
      <div className="space-y-4 text-muted-foreground max-w-lg mx-auto">
        <p className="text-lg">
          Pendant les <span className="text-foreground font-semibold">7 prochains jours</span>, agis normalement.
        </p>
        <p>
          Le système collectera silencieusement des données sur tes habitudes, 
          tes tâches et ton comportement pour établir une <span className="text-primary font-medium">baseline personnalisée</span>.
        </p>
      </div>

      <div className="glass-hover rounded-2xl p-6 max-w-md mx-auto mt-8 text-left">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" />
          Ce que nous mesurons
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Ta constance dans les habitudes quotidiennes</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>Tes patterns de dépenses et d'épargne</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Tes fluctuations d'humeur et d'énergie</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>Ton rythme d'exécution des tâches</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ReadyStep() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-success/20 to-accent/20 mb-4 animate-pulse">
        <Rocket className="h-10 w-10 text-success" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold">
        Prêt à Commencer ?
      </h2>
      
      <div className="space-y-4 text-muted-foreground max-w-lg mx-auto">
        <p>
          Tu vas maintenant accéder à ton <span className="text-foreground font-semibold">tableau de bord d'identité</span>.
        </p>
        <p>
          C'est ici que tu verras ta transformation prendre forme, 
          jour après jour, décision après décision.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
        <div className="glass-hover rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">7</div>
          <div className="text-xs text-muted-foreground">Jours d'observation</div>
        </div>
        <div className="glass-hover rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-success">∞</div>
          <div className="text-xs text-muted-foreground">Potentiel de croissance</div>
        </div>
        <div className="glass-hover rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">1</div>
          <div className="text-xs text-muted-foreground">Toi, transformé</div>
        </div>
      </div>
    </div>
  );
}
