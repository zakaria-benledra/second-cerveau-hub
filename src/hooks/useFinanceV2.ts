import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type FinanceDocument = Tables<'finance_documents'>;
export type FinanceVisualSnapshot = Tables<'finance_visual_snapshots'>;

// Finance Documents
export function useFinanceDocuments() {
  return useQuery({
    queryKey: ['finance-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as FinanceDocument[];
    },
  });
}

// Finance Visual Snapshots
export function useFinanceSnapshots(type?: string) {
  return useQuery({
    queryKey: ['finance-snapshots', type],
    queryFn: async () => {
      let query = supabase
        .from('finance_visual_snapshots')
        .select('*')
        .order('date', { ascending: false });

      if (type) {
        query = query.eq('snapshot_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinanceVisualSnapshot[];
    },
  });
}

// Export finance data
export function useExportFinanceData() {
  return useMutation({
    mutationFn: async (params: {
      format: 'csv' | 'json';
      start_date?: string;
      end_date?: string;
      category_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('export-finance-data', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
}

// Monthly spending breakdown
export function useMonthlyBreakdown(month?: string) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  return useQuery({
    queryKey: ['finance-monthly-breakdown', targetMonth],
    queryFn: async () => {
      const startDate = `${targetMonth}-01`;
      const [year, monthNum] = targetMonth.split('-').map(Number);
      const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('amount, type, category_id, finance_categories(name, color)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Aggregate by category
      const categoryMap = new Map<string, { name: string; color: string; amount: number }>();
      let totalIncome = 0;
      let totalExpenses = 0;

      data?.forEach((t) => {
        const amount = Number(t.amount);
        if (t.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
          const cat = t.finance_categories as any;
          if (cat?.name) {
            const existing = categoryMap.get(cat.name) || { name: cat.name, color: cat.color || '#888', amount: 0 };
            existing.amount += amount;
            categoryMap.set(cat.name, existing);
          }
        }
      });

      return {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        categories: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
      };
    },
  });
}

// Daily spending trend
export function useDailySpendingTrend(days = 30) {
  return useQuery({
    queryKey: ['finance-daily-trend', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('date, amount, type')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const dateMap = new Map<string, { income: number; expenses: number }>();

      data?.forEach((t) => {
        const existing = dateMap.get(t.date) || { income: 0, expenses: 0 };
        if (t.type === 'income') {
          existing.income += Number(t.amount);
        } else {
          existing.expenses += Number(t.amount);
        }
        dateMap.set(t.date, existing);
      });

      return Array.from(dateMap.entries())
        .map(([date, values]) => ({
          date,
          income: values.income,
          expenses: values.expenses,
          net: values.income - values.expenses,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}

// Budget vs Actual
export function useBudgetVsActual(month?: string) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const { data: breakdown } = useMonthlyBreakdown(targetMonth);

  return useQuery({
    queryKey: ['budget-vs-actual', targetMonth],
    queryFn: async () => {
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*, finance_categories(name, color)');

      if (error) throw error;

      return budgets?.map((b) => {
        const cat = b.finance_categories as any;
        const spent = breakdown?.categories.find((c) => c.name === cat?.name)?.amount || 0;
        const limit = Number(b.monthly_limit);

        return {
          id: b.id,
          category: cat?.name || 'Unknown',
          color: cat?.color || '#888',
          budget: limit,
          spent,
          remaining: limit - spent,
          percentUsed: limit > 0 ? (spent / limit) * 100 : 0,
          overBudget: spent > limit,
        };
      });
    },
    enabled: !!breakdown,
  });
}
