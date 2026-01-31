import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, ShoppingBag, PiggyBank, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinanceDisciplineCardProps {
  score: number;                // financial_discipline_score
  budgetAdherence: number;      // budget_adherence
  impulsiveSpending: number;    // impulsive_spending
  savingsRate: number;          // savings_rate
  className?: string;
}

export function FinanceDisciplineCard({ 
  score, 
  budgetAdherence, 
  impulsiveSpending, 
  savingsRate,
  className 
}: FinanceDisciplineCardProps) {
  return (
    <Card className={cn("glass-subtle", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Discipline Financière
          </div>
          <span className={cn(
            "text-lg font-bold",
            score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive'
          )}>
            {Math.round(score)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Adherence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Budget OK
            </div>
            <span className={cn(
              "text-xs font-medium",
              budgetAdherence >= 70 ? 'text-success' : budgetAdherence >= 40 ? 'text-warning' : 'text-destructive'
            )}>
              {Math.round(budgetAdherence)}%
            </span>
          </div>
          <Progress value={budgetAdherence} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">
            {budgetAdherence >= 80 ? '✓ Excellent' : budgetAdherence >= 60 ? '⚠ À surveiller' : '✗ Dépassé'}
          </span>
        </div>
        
        {/* Impulsive Spending */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              Impulsivité
            </div>
            <span className={cn(
              "text-xs font-medium",
              impulsiveSpending > 30 ? 'text-destructive' : 'text-success'
            )}>
              {Math.round(impulsiveSpending)}%
            </span>
          </div>
          <Progress value={impulsiveSpending} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">
            {impulsiveSpending < 20 ? '✓ Maîtrisé' : impulsiveSpending < 40 ? '⚠ Modéré' : '✗ Élevé'}
          </span>
        </div>
        
        {/* Savings Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PiggyBank className="h-3 w-3" />
              Épargne
            </div>
            <span className={cn(
              "text-xs font-medium",
              savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-destructive'
            )}>
              {Math.round(savingsRate)}%
            </span>
          </div>
          <Progress value={savingsRate} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">
            {savingsRate >= 20 ? '✓ Objectif atteint' : savingsRate >= 10 ? '⚠ En progrès' : '✗ À améliorer'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
