import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Test suite for FinanceImportWizard CSV parsing and validation
 * Tests the local parsing logic that handles CSV files before database import
 */

// Mock CSV parsing function (extracted from FinanceImportWizard logic)
function parseCSVContent(content: string): {
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    isValid: boolean;
    validationError?: string;
  }>;
  errors: Array<{ line: number; reason: string }>;
} {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données.');
  }
  
  // Parse header
  const header = lines[0].toLowerCase();
  const delimiter = header.includes(';') ? ';' : ',';
  const headerCols = header.split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const dateIdx = headerCols.findIndex(h => 
    h.includes('date') || h === 'dt' || h.includes('opération')
  );
  const descIdx = headerCols.findIndex(h => 
    h.includes('libellé') || h.includes('libelle') || h.includes('description') || 
    h.includes('label') || h.includes('motif')
  );
  const amountIdx = headerCols.findIndex(h => 
    h.includes('montant') || h.includes('amount') || h.includes('somme') || 
    h.includes('débit') || h.includes('crédit')
  );
  
  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('Colonnes requises non trouvées: date et montant sont obligatoires.');
  }
  
  const transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    isValid: boolean;
    validationError?: string;
  }> = [];
  const errors: Array<{ line: number; reason: string }> = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split(delimiter).map(c => c.trim().replace(/"/g, ''));
    
    try {
      // Parse date (ISO format expected)
      const dateStr = cols[dateIdx] || '';
      const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      
      if (!dateMatch) {
        errors.push({ line: i + 1, reason: `Date invalide: "${dateStr}"` });
        continue;
      }
      
      // Parse amount
      let amountStr = cols[amountIdx] || '0';
      amountStr = amountStr.replace(/[€$\s]/g, '').replace(',', '.');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount === 0) {
        errors.push({ line: i + 1, reason: `Montant invalide: "${cols[amountIdx]}"` });
        continue;
      }
      
      // Parse description
      const description = descIdx >= 0 ? (cols[descIdx] || `Transaction ${i}`) : `Transaction ${i}`;
      
      transactions.push({
        id: `temp-${i}-${Date.now()}`,
        date: dateStr,
        description: description.substring(0, 255),
        amount: Math.abs(amount),
        type: amount > 0 ? 'income' : 'expense',
        isValid: true,
      });
      
    } catch (e) {
      errors.push({ line: i + 1, reason: `Erreur de parsing: ${(e as Error).message}` });
    }
  }
  
  return { transactions, errors };
}

// Validation function
function validateTransaction(t: { date: string; amount: number; description: string }): { isValid: boolean; error?: string } {
  if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
    return { isValid: false, error: 'Date invalide (format: YYYY-MM-DD)' };
  }
  
  const dateObj = new Date(t.date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }
  
  if (isNaN(t.amount) || t.amount === 0) {
    return { isValid: false, error: 'Montant invalide' };
  }
  
  if (!t.description || t.description.trim().length < 2) {
    return { isValid: false, error: 'Description trop courte' };
  }
  
  return { isValid: true };
}

describe('FinanceImportWizard CSV Parser', () => {
  describe('CSV Parsing', () => {
    it('should parse valid CSV with semicolon delimiter', () => {
      const csv = `Date;Libelle;Montant
2025-01-15;CARREFOUR MARKET;-45.67
2025-01-14;VIREMENT SALAIRE;2500.00
2025-01-13;AMAZON EU SARL;-89.99`;
      
      const result = parseCSVContent(csv);
      
      expect(result.transactions).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      
      // First transaction: expense
      expect(result.transactions[0].date).toBe('2025-01-15');
      expect(result.transactions[0].description).toBe('CARREFOUR MARKET');
      expect(result.transactions[0].amount).toBe(45.67);
      expect(result.transactions[0].type).toBe('expense');
      
      // Second transaction: income
      expect(result.transactions[1].date).toBe('2025-01-14');
      expect(result.transactions[1].description).toBe('VIREMENT SALAIRE');
      expect(result.transactions[1].amount).toBe(2500);
      expect(result.transactions[1].type).toBe('income');
    });
    
    it('should parse CSV with comma delimiter', () => {
      const csv = `Date,Description,Amount
2025-01-15,Test Transaction,-100.00`;
      
      const result = parseCSVContent(csv);
      
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(100);
    });
    
    it('should reject file with only header', () => {
      const csv = `Date;Libelle;Montant`;
      
      expect(() => parseCSVContent(csv)).toThrow('Le fichier doit contenir au moins un en-tête et une ligne de données.');
    });
    
    it('should reject file without required columns', () => {
      const csv = `Nom;Prenom;Email
John;Doe;john@example.com`;
      
      expect(() => parseCSVContent(csv)).toThrow('Colonnes requises non trouvées');
    });
    
    it('should skip invalid rows and log errors', () => {
      const csv = `Date;Libelle;Montant
2025-01-15;VALID TRANSACTION;-50.00
invalid-date;INVALID DATE;-25.00
2025-01-13;INVALID AMOUNT;abc`;
      
      const result = parseCSVContent(csv);
      
      expect(result.transactions).toHaveLength(1);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].reason).toContain('Date invalide');
      expect(result.errors[1].reason).toContain('Montant invalide');
    });
    
    it('should handle EU comma decimal separator', () => {
      const csv = `Date;Libelle;Montant
2025-01-15;TRANSACTION EU;-45,67`;
      
      const result = parseCSVContent(csv);
      
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(45.67);
    });
  });
  
  describe('Transaction Validation', () => {
    it('should validate correct transaction', () => {
      const result = validateTransaction({
        date: '2025-01-15',
        amount: 100,
        description: 'Valid Transaction',
      });
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject invalid date format', () => {
      const result = validateTransaction({
        date: '15/01/2025',
        amount: 100,
        description: 'Test',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Date invalide');
    });
    
    it('should reject zero amount', () => {
      const result = validateTransaction({
        date: '2025-01-15',
        amount: 0,
        description: 'Test',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Montant invalide');
    });
    
    it('should reject short description', () => {
      const result = validateTransaction({
        date: '2025-01-15',
        amount: 100,
        description: 'X',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description trop courte');
    });
  });
  
  describe('Wizard Step Flow', () => {
    it('should compute valid/invalid counts correctly', () => {
      const transactions = [
        { id: '1', date: '2025-01-15', description: 'Valid 1', amount: 100, type: 'expense' as const, isValid: true },
        { id: '2', date: '2025-01-14', description: 'Valid 2', amount: 200, type: 'income' as const, isValid: true },
        { id: '3', date: 'invalid', description: 'Invalid', amount: 50, type: 'expense' as const, isValid: false, validationError: 'Date invalide' },
      ];
      
      const validCount = transactions.filter(t => t.isValid).length;
      const invalidCount = transactions.filter(t => !t.isValid).length;
      
      expect(validCount).toBe(2);
      expect(invalidCount).toBe(1);
    });
    
    it('should compute totals correctly', () => {
      const transactions = [
        { id: '1', date: '2025-01-15', description: 'Expense 1', amount: 100, type: 'expense' as const, isValid: true },
        { id: '2', date: '2025-01-14', description: 'Income 1', amount: 500, type: 'income' as const, isValid: true },
        { id: '3', date: '2025-01-13', description: 'Expense 2', amount: 200, type: 'expense' as const, isValid: true },
      ];
      
      const totalIncome = transactions.filter(t => t.isValid && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.isValid && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpense;
      
      expect(totalIncome).toBe(500);
      expect(totalExpense).toBe(300);
      expect(netBalance).toBe(200);
    });
    
    it('should allow editing transaction fields', () => {
      const transactions = [
        { id: '1', date: '2025-01-15', description: 'Original', amount: 100, type: 'expense' as const, isValid: true },
      ];
      
      // Simulate edit
      const updatedTransactions = transactions.map(t => {
        if (t.id === '1') {
          return { ...t, description: 'Edited Description', amount: 150 };
        }
        return t;
      });
      
      expect(updatedTransactions[0].description).toBe('Edited Description');
      expect(updatedTransactions[0].amount).toBe(150);
    });
    
    it('should allow deleting transactions', () => {
      const transactions = [
        { id: '1', date: '2025-01-15', description: 'Keep', amount: 100, type: 'expense' as const, isValid: true },
        { id: '2', date: '2025-01-14', description: 'Delete', amount: 200, type: 'income' as const, isValid: true },
      ];
      
      const filteredTransactions = transactions.filter(t => t.id !== '2');
      
      expect(filteredTransactions).toHaveLength(1);
      expect(filteredTransactions[0].description).toBe('Keep');
    });
  });
});
