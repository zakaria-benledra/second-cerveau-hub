import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Interest {
  id: string;
  name: string;
  category: string;
  icon: string;
  keywords: string[];
}

interface UserInterest {
  id: string;
  interest_id: string;
  intensity: number;
}

// 8 catégories principales avec icônes
const CATEGORIES = [
  { key: 'sport', label: 'Sport & Fitness', emoji: '🏃' },
  { key: 'culture', label: 'Culture & Arts', emoji: '🎨' },
  { key: 'lifestyle', label: 'Voyage & Découverte', emoji: '✈️' },
  { key: 'divertissement', label: 'Tech & Gaming', emoji: '🎮' },
  { key: 'social', label: 'Social & Loisirs', emoji: '🎉' },
  { key: 'professionnel', label: 'Apprentissage', emoji: '📚' },
  { key: 'bien-être', label: 'Bien-être & Santé', emoji: '🧘' },
  { key: 'santé', label: 'Finance & Carrière', emoji: '💰' },
];

export function InterestsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch available interests
  const { data: interests = [] } = useQuery({
    queryKey: ['available-interests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('category');
      if (error) throw error;
      return data as Interest[];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Fetch user's interests
  const { data: userInterests = [], isLoading } = useQuery({
    queryKey: ['user-interests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_interests')
        .select('id, interest_id, intensity')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data as UserInterest[];
    },
    enabled: !!user?.id,
  });

  // Initialize selected interests from DB
  useEffect(() => {
    if (userInterests.length > 0 && interests.length > 0) {
      const interestIds = new Set(userInterests.map((ui) => ui.interest_id));
      setSelectedInterests(interestIds);
      
      // Determine which categories are selected
      const cats = new Set<string>();
      interests.forEach((i) => {
        if (interestIds.has(i.id)) {
          cats.add(i.category);
        }
      });
      setSelectedCategories(cats);
    }
  }, [userInterests, interests]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (interestIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get workspace_id
      const { data: membership } = await supabase
        .from('memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      const workspaceId = membership?.workspace_id;

      // Delete existing
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      // Insert new ones
      if (interestIds.length > 0) {
        const inserts = interestIds.map((id) => ({
          user_id: user.id,
          interest_id: id,
          workspace_id: workspaceId,
          intensity: 5,
        }));

        const { error } = await supabase.from('user_interests').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-interests'] });
      queryClient.invalidateQueries({ queryKey: ['smart-suggestions'] });
      setHasChanges(false);
      toast({ title: `${selectedInterests.size} intérêts sauvegardés ✅` });
    },
    onError: () => {
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    },
  });

  const toggleCategory = (categoryKey: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
        // Also remove interests from this category
        setSelectedInterests((prevI) => {
          const nextI = new Set(prevI);
          interests
            .filter((i) => i.category === categoryKey)
            .forEach((i) => nextI.delete(i.id));
          return nextI;
        });
      } else {
        next.add(categoryKey);
      }
      return next;
    });
    setHasChanges(true);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interestId)) {
        next.delete(interestId);
      } else {
        next.add(interestId);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(Array.from(selectedInterests));
  };

  // Group interests by category
  const interestsByCategory = interests.reduce<Record<string, Interest[]>>((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {});

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Mes centres d'intérêt
        </CardTitle>
        <CardDescription>
          Sélectionne tes passions pour personnaliser les suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Catégories */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Catégories</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.has(cat.key);
              const count = interestsByCategory[cat.key]?.filter((i) => 
                selectedInterests.has(i.id)
              ).length || 0;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{cat.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sous-intérêts par catégorie sélectionnée */}
        {Array.from(selectedCategories).map((catKey) => {
          const catInterests = interestsByCategory[catKey] || [];
          const catInfo = CATEGORIES.find((c) => c.key === catKey);

          if (catInterests.length === 0) return null;

          return (
            <div key={catKey} className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <span>{catInfo?.emoji}</span>
                {catInfo?.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {catInterests.map((interest) => {
                  const isSelected = selectedInterests.has(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-sm",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <span>{interest.icon}</span>
                      <span>{interest.name}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Résumé et sauvegarde */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>{selectedInterests.size} intérêt{selectedInterests.size > 1 ? 's' : ''} sélectionné{selectedInterests.size > 1 ? 's' : ''}</span>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
