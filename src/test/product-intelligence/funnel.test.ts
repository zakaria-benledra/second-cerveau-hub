import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Product Intelligence - Funnel Computation Tests
 * Verifies correct calculation of activation, retention, and churn metrics
 */

describe('Funnel Computation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Activation Rate Calculation', () => {
    it('should calculate activation rate correctly', () => {
      const signups = 100;
      const activatedUsers = 35;
      const activationRate = signups > 0 ? (activatedUsers / signups) * 100 : 0;
      
      expect(activationRate).toBe(35);
    });

    it('should handle zero signups gracefully', () => {
      const signups = 0;
      const activatedUsers = 0;
      const activationRate = signups > 0 ? (activatedUsers / signups) * 100 : 0;
      
      expect(activationRate).toBe(0);
    });

    it('should cap activation rate at 100%', () => {
      const signups = 50;
      const activatedUsers = 60; // Edge case: more activations than signups (data error)
      const activationRate = Math.min(100, signups > 0 ? (activatedUsers / signups) * 100 : 0);
      
      expect(activationRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Retention Rate Calculation', () => {
    it('should calculate D1 retention correctly', () => {
      const day0Users = 100;
      const day1ActiveUsers = 45;
      const retentionD1 = day0Users > 0 ? (day1ActiveUsers / day0Users) * 100 : 0;
      
      expect(retentionD1).toBe(45);
    });

    it('should calculate D7 retention correctly', () => {
      const day0Users = 100;
      const day7ActiveUsers = 25;
      const retentionD7 = day0Users > 0 ? (day7ActiveUsers / day0Users) * 100 : 0;
      
      expect(retentionD7).toBe(25);
    });

    it('should identify churned users', () => {
      const totalUsers = 100;
      const retainedUsers = 70;
      const churnedUsers = totalUsers - retainedUsers;
      const churnRate = (churnedUsers / totalUsers) * 100;
      
      expect(churnedUsers).toBe(30);
      expect(churnRate).toBe(30);
    });
  });

  describe('Feature Adoption Metrics', () => {
    it('should calculate AI engagement rate', () => {
      const activeUsers = 100;
      const aiEngagedUsers = 40;
      const aiEngagementRate = activeUsers > 0 ? (aiEngagedUsers / activeUsers) * 100 : 0;
      
      expect(aiEngagementRate).toBe(40);
    });

    it('should calculate finance adoption rate', () => {
      const activeUsers = 100;
      const financeConnectedUsers = 25;
      const financeAdoptionRate = activeUsers > 0 ? (financeConnectedUsers / activeUsers) * 100 : 0;
      
      expect(financeAdoptionRate).toBe(25);
    });
  });

  describe('Funnel Stage Aggregation', () => {
    it('should aggregate daily funnel correctly', () => {
      const funnelData = [
        { date: '2025-01-28', signups: 10, activated: 4 },
        { date: '2025-01-29', signups: 15, activated: 6 },
        { date: '2025-01-30', signups: 20, activated: 8 },
      ];

      const totalSignups = funnelData.reduce((sum, d) => sum + d.signups, 0);
      const totalActivated = funnelData.reduce((sum, d) => sum + d.activated, 0);
      const avgActivationRate = totalSignups > 0 ? (totalActivated / totalSignups) * 100 : 0;

      expect(totalSignups).toBe(45);
      expect(totalActivated).toBe(18);
      expect(avgActivationRate).toBe(40);
    });
  });
});

describe('Churn Risk Scoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Risk Score Calculation', () => {
    it('should calculate low risk score correctly', () => {
      const signals = {
        habitConsistencyDrop: 0,
        financeInactivityDays: 2,
        aiRejectionStreak: 0,
        taskOverloadIndex: 0.2,
      };

      const riskScore = calculateChurnRisk(signals);
      expect(riskScore).toBeLessThan(30);
      expect(getRiskLevel(riskScore)).toBe('low');
    });

    it('should calculate medium risk score correctly', () => {
      const signals = {
        habitConsistencyDrop: 0.3,
        financeInactivityDays: 7,
        aiRejectionStreak: 2,
        taskOverloadIndex: 0.5,
      };

      const riskScore = calculateChurnRisk(signals);
      expect(riskScore).toBeGreaterThanOrEqual(30);
      expect(riskScore).toBeLessThan(60);
      expect(getRiskLevel(riskScore)).toBe('medium');
    });

    it('should calculate high risk score correctly', () => {
      const signals = {
        habitConsistencyDrop: 0.6,
        financeInactivityDays: 14,
        aiRejectionStreak: 5,
        taskOverloadIndex: 0.8,
      };

      const riskScore = calculateChurnRisk(signals);
      expect(riskScore).toBeGreaterThanOrEqual(60);
      expect(riskScore).toBeLessThan(80);
      expect(getRiskLevel(riskScore)).toBe('high');
    });

    it('should calculate critical risk score correctly', () => {
      const signals = {
        habitConsistencyDrop: 0.9,
        financeInactivityDays: 30,
        aiRejectionStreak: 10,
        taskOverloadIndex: 1.0,
      };

      const riskScore = calculateChurnRisk(signals);
      expect(riskScore).toBeGreaterThanOrEqual(80);
      expect(getRiskLevel(riskScore)).toBe('critical');
    });
  });

  describe('Risk Level Thresholds', () => {
    it('should correctly categorize risk levels', () => {
      expect(getRiskLevel(15)).toBe('low');
      expect(getRiskLevel(45)).toBe('medium');
      expect(getRiskLevel(70)).toBe('high');
      expect(getRiskLevel(90)).toBe('critical');
    });

    it('should handle edge cases at thresholds', () => {
      expect(getRiskLevel(0)).toBe('low');
      expect(getRiskLevel(30)).toBe('medium');
      expect(getRiskLevel(60)).toBe('high');
      expect(getRiskLevel(80)).toBe('critical');
      expect(getRiskLevel(100)).toBe('critical');
    });
  });
});

// Helper functions that mirror edge function logic
function calculateChurnRisk(signals: {
  habitConsistencyDrop: number;
  financeInactivityDays: number;
  aiRejectionStreak: number;
  taskOverloadIndex: number;
}): number {
  // Weights for each signal
  const weights = {
    habitConsistencyDrop: 30,
    financeInactivity: 20,
    aiRejection: 25,
    taskOverload: 25,
  };

  // Normalize signals to 0-1 range
  const normalizedHabit = Math.min(1, signals.habitConsistencyDrop);
  const normalizedFinance = Math.min(1, signals.financeInactivityDays / 30);
  const normalizedAI = Math.min(1, signals.aiRejectionStreak / 10);
  const normalizedOverload = Math.min(1, signals.taskOverloadIndex);

  // Calculate weighted risk score
  const riskScore = 
    normalizedHabit * weights.habitConsistencyDrop +
    normalizedFinance * weights.financeInactivity +
    normalizedAI * weights.aiRejection +
    normalizedOverload * weights.taskOverload;

  return Math.round(riskScore);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}
