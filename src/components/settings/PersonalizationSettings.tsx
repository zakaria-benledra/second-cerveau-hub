import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Brain, Shield, Sparkles, Zap } from 'lucide-react';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AIPreferences {
  suggestion_frequency?: string;
  exploration_enabled?: boolean;
  explain_suggestions?: boolean;
}

const LEVELS = [
  { 
    value: 'conservative', 
    label: 'Conservateur', 
    icon: Shield,
    description: 'Suggestions générales, respect maximal de la vie privée',
    color: 'text-info'
  },
  { 
    value: 'balanced', 
    label: 'Équilibré', 
    icon: Brain,
    description: 'Personnalisation modérée basée sur tes données',
    color: 'text-primary'
  },
  { 
    value: 'exploratory', 
    label: 'Exploratoire', 
    icon: Zap,
    description: 'IA proactive avec suggestions audacieuses',
    color: 'text-warning'
  },
];

export function PersonalizationSettings() {
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  
  const [level, setLevel] = useState('balanced');
  const [explainSuggestions, setExplainSuggestions] = useState(true);
  const [explorationEnabled, setExplorationEnabled] = useState(true);

  useEffect(() => {
    if (profile) {
      setLevel((profile as any).personalization_level || 'balanced');
      const prefs = (profile as any).ai_preferences as AIPreferences | undefined;
      setExplainSuggestions(prefs?.explain_suggestions ?? true);
      setExplorationEnabled(prefs?.exploration_enabled ?? true);
    }
  }, [profile]);

  const handleLevelChange = async (newLevel: string) => {
    setLevel(newLevel);
    try {
      await updateProfile.mutateAsync({
        personalization_level: newLevel,
      } as any);
      toast({ title: `Mode ${LEVELS.find(l => l.value === newLevel)?.label} activé` });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const currentPrefs = ((profile as any)?.ai_preferences || {}) as AIPreferences;
    const newPrefs = {
      ...currentPrefs,
      [key]: value,
    };
    
    if (key === 'explain_suggestions') setExplainSuggestions(value);
    if (key === 'exploration_enabled') setExplorationEnabled(value);
    
    try {
      await updateProfile.mutateAsync({
        ai_preferences: newPrefs,
      } as any);
    } catch (error) {
      console.error(error);
    }
  };

  const currentLevel = LEVELS.find(l => l.value === level) || LEVELS[1];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Personnalisation IA
        </CardTitle>
        <CardDescription>
          Contrôle comment Sage personnalise tes recommandations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Niveau de personnalisation */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Niveau de personnalisation</Label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => {
              const Icon = l.icon;
              const isSelected = level === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => handleLevelChange(l.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    isSelected 
                      ? "border-primary bg-primary/10" 
                      : "border-transparent bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <Icon className={cn("h-6 w-6", l.color)} />
                  <span className="text-xs font-medium">{l.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {currentLevel.description}
          </p>
        </div>

        {/* Options avancées */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Options avancées</Label>
            <Badge variant="outline" className="text-xs">
              {currentLevel.label}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm">Expliquer les suggestions</Label>
              <p className="text-xs text-muted-foreground">
                Afficher pourquoi Sage fait chaque recommandation
              </p>
            </div>
            <Switch
              checked={explainSuggestions}
              onCheckedChange={(v) => handlePreferenceChange('explain_suggestions', v)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm">Mode exploration</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir des suggestions hors de ta zone de confort
              </p>
            </div>
            <Switch
              checked={explorationEnabled}
              onCheckedChange={(v) => handlePreferenceChange('exploration_enabled', v)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
