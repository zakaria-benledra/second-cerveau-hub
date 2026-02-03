import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Target, Rocket, ChevronRight, ChevronLeft,
  Sparkles, LineChart, Shield, Heart, BookOpen, Compass, Map
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
  { id: 'path', title: 'Ton Parcours' },
  { id: 'ready', title: 'Prêt' },
];

type PathChoice = 'program' | 'explore' | null;

export function TransformationWizard({ onComplete }: TransformationWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [goals, setGoals] = useState({
    discipline: 50,
    financialStability: 50,
    mentalBalance: 50,
  });
  const [pathChoice, setPathChoice] = useState<PathChoice>(null);

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

  const canProceed = () => {
    if (currentStep === 2) return pathChoice !== null;
    return true;
  };

  const handleComplete = async () => {
    await completeOnboarding.mutateAsync(goals);
    onComplete();
    
    // Rediriger selon le choix
    if (pathChoice === 'program') {
      navigate('/program');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep ? "w-8 bg-primary" : 
                index < currentStep ? "w-2 bg-primary/60" : "w-2 bg-muted"
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
          >
            {currentStep === 0 && <WelcomeStep />}
            {currentStep === 1 && <GoalsStep goals={goals} setGoals={setGoals} />}
            {currentStep === 2 && <PathStep pathChoice={pathChoice} setPathChoice={setPathChoice} />}
            {currentStep === 3 && <ReadyStep pathChoice={pathChoice} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continuer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={completeOnboarding.isPending}>
              <Rocket className="h-4 w-4 mr-2" />
              {pathChoice === 'program' ? 'Choisir mon programme' : 'Explorer Minded'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ===== STEP 1: WELCOME =====
function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
        <Brain className="h-10 w-10 text-primary-foreground" />
      </div>
      
      <h1 className="text-3xl font-bold">
        Bienvenue sur Minded
      </h1>
      
      <div className="space-y-2 text-muted-foreground">
        <p className="text-lg">
          Ton système d'intelligence personnelle.
        </p>
        <p>
          Minded combine <span className="text-primary font-medium">productivité</span>, 
          <span className="text-success font-medium"> bien-être</span> et 
          <span className="text-accent font-medium"> finances</span> avec une IA 
          qui apprend de toi et te guide vers la meilleure version de toi-même.
        </p>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Habitudes</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <LineChart className="h-6 w-6 text-success" />
          </div>
          <span className="text-xs text-muted-foreground">Scores</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <span className="text-xs text-muted-foreground">Transformation</span>
        </div>
      </div>
    </div>
  );
}

// ===== STEP 2: GOALS =====
interface GoalsStepProps {
  goals: { discipline: number; financialStability: number; mentalBalance: number };
  setGoals: React.Dispatch<React.SetStateAction<{ discipline: number; financialStability: number; mentalBalance: number }>>;
}

function GoalsStep({ goals, setGoals }: GoalsStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">
          Qui veux-tu devenir ?
        </h2>
        <p className="text-muted-foreground">
          Définis tes priorités. Sage, ton coach IA, s'adaptera pour t'aider à les atteindre.
        </p>
      </div>

      <div className="space-y-6">
        <GoalSlider
          icon={<Shield className="h-5 w-5" />}
          label="Discipline"
          description="Habitudes, routines, productivité"
          value={goals.discipline}
          onChange={(value) => setGoals(prev => ({ ...prev, discipline: value }))}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        
        <GoalSlider
          icon={<LineChart className="h-5 w-5" />}
          label="Stabilité Financière"
          description="Budget, épargne, investissements"
          value={goals.financialStability}
          onChange={(value) => setGoals(prev => ({ ...prev, financialStability: value }))}
          color="text-success"
          bgColor="bg-success/10"
        />
        
        <GoalSlider
          icon={<Heart className="h-5 w-5" />}
          label="Équilibre Mental"
          description="Bien-être, journal, gratitude"
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
    if (val < 33) return 'Faible';
    if (val < 66) return 'Moyenne';
    return 'Haute';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor, color)}>
            {icon}
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-sm font-medium", color)}>{getLevel(value)}</span>
          <span className="text-xs text-muted-foreground ml-1">{value}%</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={100}
        step={5}
        className="py-2"
      />
    </div>
  );
}

// ===== STEP 3: PATH CHOICE =====
interface PathStepProps {
  pathChoice: PathChoice;
  setPathChoice: (choice: PathChoice) => void;
}

function PathStep({ pathChoice, setPathChoice }: PathStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-xl bg-accent/10 flex items-center justify-center">
          <Compass className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold">
          Comment veux-tu commencer ?
        </h2>
        <p className="text-muted-foreground">
          Tu pourras toujours changer d'avis plus tard.
        </p>
      </div>

      <div className="space-y-4">
        {/* Option Programme */}
        <button
          onClick={() => setPathChoice('program')}
          className={cn(
            "w-full p-6 rounded-2xl border-2 text-left transition-all",
            pathChoice === 'program'
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              pathChoice === 'program' ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            )}>
              <Map className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Programme Guidé</p>
              <p className="text-xs text-primary font-medium">Recommandé</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Choisis un programme de 21-30 jours. L'IA génère des habitudes et tâches 
            personnalisées avec explications scientifiques.
          </p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Habitudes IA</span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Wiki complet</span>
          </div>
        </button>

        {/* Option Exploration */}
        <button
          onClick={() => setPathChoice('explore')}
          className={cn(
            "w-full p-6 rounded-2xl border-2 text-left transition-all",
            pathChoice === 'explore'
              ? "border-accent bg-accent/5 shadow-lg shadow-accent/20"
              : "border-border hover:border-accent/50 hover:bg-muted/50"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              pathChoice === 'explore' ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
            )}>
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Exploration Libre</p>
              <p className="text-xs text-accent font-medium">Pour les curieux</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Découvre l'app à ton rythme. Crée tes propres habitudes et tâches. 
            Tu pourras activer un programme plus tard.
          </p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Liberté totale</span>
            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Ton rythme</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ===== STEP 4: READY =====
interface ReadyStepProps {
  pathChoice: PathChoice;
}

function ReadyStep({ pathChoice }: ReadyStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
        <Rocket className="h-10 w-10 text-primary-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold">
        {pathChoice === 'program' ? 'Prêt à te transformer ?' : 'Prêt à explorer ?'}
      </h1>
      
      <div className="space-y-3 text-muted-foreground">
        {pathChoice === 'program' ? (
          <>
            <p>
              Tu vas maintenant choisir ton programme de transformation.
            </p>
            <p className="text-sm">
              L'IA Sage va générer des habitudes et tâches personnalisées avec 
              explications scientifiques, guides pratiques et conseils adaptés à ton profil.
            </p>
          </>
        ) : (
          <>
            <p>
              Tu vas accéder à ton tableau de bord.
            </p>
            <p className="text-sm">
              Explore les fonctionnalités, crée tes premières habitudes et 
              découvre comment Minded peut t'aider au quotidien.
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl">{pathChoice === 'program' ? '🎯' : '🧭'}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {pathChoice === 'program' ? 'Programme' : 'Dashboard'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <span className="text-xs text-muted-foreground">Sage IA</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <span className="text-xl">∞</span>
          </div>
          <span className="text-xs text-muted-foreground">Potentiel</span>
        </div>
      </div>
    </div>
  );
}
