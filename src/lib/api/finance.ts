import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type FinanceTransaction = Tables<'finance_transactions'>;
export type FinanceCategory = Tables<'finance_categories'>;
export type Budget = Tables<'budgets'>;

// Categories
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('finance_categories')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCategory(category: Omit<TablesInsert<'finance_categories'>, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Transactions
export async function fetchTransactions(month?: string) {
  let query = supabase
    .from('finance_transactions')
    .select('*, finance_categories(*)')
    .order('date', { ascending: false });
  
  if (month) {
    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTransaction(transaction: Omit<TablesInsert<'finance_transactions'>, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({ ...transaction, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Budgets
export async function fetchBudgets() {
  const { data, error } = await supabase
    .from('budgets')
    .select('*, finance_categories(*)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createBudget(budget: Omit<TablesInsert<'budgets'>, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .insert({ ...budget, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBudget(id: string, updates: Partial<Budget>) {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Monthly Summary
export async function getMonthlySpending(month: string) {
  const startDate = `${month}-01`;
  const year = parseInt(month.split('-')[0]);
  const monthNum = parseInt(month.split('-')[1]);
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('finance_transactions')
    .select('amount, type, category_id')
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (error) throw error;

  const totalExpenses = data
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalIncome = data
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalExpenses,
    totalIncome,
    netSavings: totalIncome - totalExpenses,
    transactionCount: data.length,
  };
}
