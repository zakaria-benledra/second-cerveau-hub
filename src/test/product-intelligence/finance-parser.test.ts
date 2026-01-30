import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Finance Parser Tests
 * Verifies CSV parsing, transaction categorization, and data integrity
 */

describe('Finance CSV Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSV Line Parsing', () => {
    it('should parse standard CSV line correctly', () => {
      const line = '2025-01-15,Grocery Store,-45.50,expense';
      const parsed = parseCSVLine(line);
      
      expect(parsed).toEqual({
        date: '2025-01-15',
        description: 'Grocery Store',
        amount: -45.50,
        type: 'expense',
      });
    });

    it('should handle quoted fields with commas', () => {
      const line = '2025-01-15,"Coffee, Tea & More",-12.00,expense';
      const parsed = parseCSVLine(line);
      
      expect(parsed.description).toBe('Coffee, Tea & More');
    });

    it('should handle positive amounts as income', () => {
      const line = '2025-01-15,Salary Deposit,3500.00,income';
      const parsed = parseCSVLine(line);
      
      expect(parsed.amount).toBe(3500.00);
      expect(parsed.type).toBe('income');
    });

    it('should validate date format', () => {
      const validDate = isValidDateFormat('2025-01-15');
      const invalidDate = isValidDateFormat('15/01/2025');
      
      expect(validDate).toBe(true);
      expect(invalidDate).toBe(false);
    });

    it('should handle empty description', () => {
      const line = '2025-01-15,,-25.00,expense';
      const parsed = parseCSVLine(line);
      
      expect(parsed.description).toBe('');
    });
  });

  describe('Amount Parsing', () => {
    it('should parse negative amounts correctly', () => {
      expect(parseAmount('-45.50')).toBe(-45.50);
    });

    it('should parse positive amounts correctly', () => {
      expect(parseAmount('100.00')).toBe(100.00);
    });

    it('should handle amounts with currency symbols', () => {
      expect(parseAmount('$100.00')).toBe(100.00);
      expect(parseAmount('€50.00')).toBe(50.00);
      expect(parseAmount('-$25.50')).toBe(-25.50);
    });

    it('should handle amounts with thousand separators', () => {
      expect(parseAmount('1,000.00')).toBe(1000.00);
      expect(parseAmount('10,500.75')).toBe(10500.75);
    });

    it('should return 0 for invalid amounts', () => {
      expect(parseAmount('invalid')).toBe(0);
      expect(parseAmount('')).toBe(0);
    });
  });

  describe('Transaction Type Detection', () => {
    it('should detect expense from negative amount', () => {
      const type = detectTransactionType(-50.00, 'Restaurant');
      expect(type).toBe('expense');
    });

    it('should detect income from positive amount', () => {
      const type = detectTransactionType(3000.00, 'Salary');
      expect(type).toBe('income');
    });

    it('should detect income from salary keywords', () => {
      const type = detectTransactionType(3000.00, 'SALARY DEPOSIT');
      expect(type).toBe('income');
    });

    it('should detect income from transfer keywords', () => {
      const descriptions = ['VIREMENT RECU', 'TRANSFER RECEIVED', 'DEPOSIT'];
      descriptions.forEach(desc => {
        const type = detectTransactionType(500.00, desc);
        expect(type).toBe('income');
      });
    });
  });

  describe('Category Matching', () => {
    it('should match grocery category', () => {
      const category = matchCategory('CARREFOUR MARKET');
      expect(category).toBe('groceries');
    });

    it('should match restaurant category', () => {
      const category = matchCategory('McDonalds Restaurant');
      expect(category).toBe('food_dining');
    });

    it('should match transport category', () => {
      const descriptions = ['UBER', 'SNCF', 'RATP', 'TOTAL STATION'];
      const categories = descriptions.map(matchCategory);
      
      expect(categories).toContain('transport');
    });

    it('should return uncategorized for unknown merchants', () => {
      const category = matchCategory('RANDOM MERCHANT XYZ');
      expect(category).toBe('uncategorized');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple transactions', () => {
      const csvContent = `date,description,amount,type
2025-01-15,Grocery Store,-45.50,expense
2025-01-16,Salary,3000.00,income
2025-01-17,Restaurant,-25.00,expense`;

      const transactions = parseCSVBatch(csvContent);
      
      expect(transactions).toHaveLength(3);
      expect(transactions[0].amount).toBe(-45.50);
      expect(transactions[1].type).toBe('income');
    });

    it('should skip header row', () => {
      const csvContent = `date,description,amount,type
2025-01-15,Test,-10.00,expense`;

      const transactions = parseCSVBatch(csvContent);
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Test');
    });

    it('should skip invalid rows gracefully', () => {
      const csvContent = `date,description,amount,type
2025-01-15,Valid,-10.00,expense
invalid-row
2025-01-16,Also Valid,-20.00,expense`;

      const transactions = parseCSVBatch(csvContent);
      
      expect(transactions).toHaveLength(2);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate transactions', () => {
      const existing = [
        { date: '2025-01-15', description: 'Store', amount: -50, external_id: 'abc123' }
      ];
      
      const newTransaction = { date: '2025-01-15', description: 'Store', amount: -50 };
      const isDuplicate = checkDuplicate(newTransaction, existing);
      
      expect(isDuplicate).toBe(true);
    });

    it('should not flag non-duplicates', () => {
      const existing = [
        { date: '2025-01-15', description: 'Store', amount: -50, external_id: 'abc123' }
      ];
      
      const newTransaction = { date: '2025-01-15', description: 'Store', amount: -60 };
      const isDuplicate = checkDuplicate(newTransaction, existing);
      
      expect(isDuplicate).toBe(false);
    });
  });
});

// Helper functions that mirror edge function logic
function parseCSVLine(line: string): { date: string; description: string; amount: number; type: string } {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  return {
    date: parts[0] || '',
    description: parts[1] || '',
    amount: parseAmount(parts[2] || '0'),
    type: parts[3] || 'expense',
  };
}

function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$€£,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function detectTransactionType(amount: number, description: string): 'income' | 'expense' {
  const incomeKeywords = ['SALARY', 'VIREMENT', 'TRANSFER', 'DEPOSIT', 'RECU'];
  const upperDesc = description.toUpperCase();
  
  if (incomeKeywords.some(kw => upperDesc.includes(kw))) return 'income';
  if (amount > 0) return 'income';
  return 'expense';
}

function matchCategory(description: string): string {
  const upperDesc = description.toUpperCase();
  
  const categoryRules: Record<string, string[]> = {
    groceries: ['CARREFOUR', 'LECLERC', 'AUCHAN', 'LIDL', 'MONOPRIX', 'FRANPRIX'],
    food_dining: ['RESTAURANT', 'MCDONALD', 'BURGER', 'PIZZA', 'CAFE', 'STARBUCKS'],
    transport: ['UBER', 'SNCF', 'RATP', 'TOTAL', 'SHELL', 'BP STATION'],
    utilities: ['EDF', 'ENGIE', 'ORANGE', 'SFR', 'FREE', 'BOUYGUES'],
  };

  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some(kw => upperDesc.includes(kw))) {
      return category;
    }
  }

  return 'uncategorized';
}

function parseCSVBatch(csvContent: string): Array<{ date: string; description: string; amount: number; type: string }> {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const transactions: Array<{ date: string; description: string; amount: number; type: string }> = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    try {
      const parsed = parseCSVLine(lines[i]);
      if (parsed.date && isValidDateFormat(parsed.date)) {
        transactions.push(parsed);
      }
    } catch {
      // Skip invalid rows
    }
  }

  return transactions;
}

function checkDuplicate(
  transaction: { date: string; description: string; amount: number },
  existing: Array<{ date: string; description: string; amount: number; external_id?: string }>
): boolean {
  return existing.some(e => 
    e.date === transaction.date && 
    e.description === transaction.description && 
    e.amount === transaction.amount
  );
}
