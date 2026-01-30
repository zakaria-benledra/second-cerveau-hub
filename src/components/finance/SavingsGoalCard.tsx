import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PiggyBank, Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SavingsGoal } from '@/hooks/useSavingsGoals';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContribute: (goalId: string, amount: number) => void;
  onDelete: (goalId: string) => void;
  isContributing?: boolean;
}

export function SavingsGoalCard({ 
  goal, 
  onContribute, 
  onDelete,
  isContributing 
}: SavingsGoalCardProps) {
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const handleContribute = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onContribute(goal.id, numAmount);
      setAmount('');
      setIsContributeOpen(false);
    }
  };

  const daysRemaining = goal.target_date 
    ? differenceInDays(new Date(goal.target_date), new Date())
    : null;

  const progressColor = goal.progress >= 100 
    ? 'bg-success' 
    : goal.progress >= 50 
      ? 'bg-primary' 
      : 'bg-warning';

  return (
    <Card className="glass-hover hover-lift">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "p-2.5 rounded-xl",
                goal.color ? `bg-[${goal.color}]/15` : "bg-primary/15"
              )}
            >
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{goal.name}</h3>
              {goal.target_date && (
                <p className="text-xs text-muted-foreground">
                  {daysRemaining !== null && daysRemaining > 0 
                    ? `${daysRemaining} jours restants`
                    : daysRemaining === 0 
                      ? "Échéance aujourd'hui"
                      : "Échéance dépassée"
                  }
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-50 hover:opacity-100"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {goal.current_amount.toLocaleString('fr-FR')} €
              </p>
              <p className="text-xs text-muted-foreground">
                sur {goal.target_amount.toLocaleString('fr-FR')} €
              </p>
            </div>
            <Badge 
              variant="outline"
              className={cn(
                "tabular-nums",
                goal.progress >= 100 && "bg-success/15 text-success border-success/30"
              )}
            >
              {Math.round(goal.progress)}%
            </Badge>
          </div>

          <Progress 
            value={goal.progress} 
            className="h-2"
          />

          {goal.remaining > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Reste {goal.remaining.toLocaleString('fr-FR')} € à épargner
            </p>
          )}

          {goal.progress >= 100 ? (
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Objectif atteint !</span>
            </div>
          ) : (
            <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Contribuer à "{goal.name}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Montant en €"
                      className="glass-hover"
                    />
                  </div>
                  <Button 
                    onClick={handleContribute} 
                    className="w-full gradient-primary"
                    disabled={isContributing || !amount}
                  >
                    {isContributing ? 'Ajout...' : 'Confirmer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
