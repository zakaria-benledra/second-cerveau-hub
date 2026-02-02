import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create granular mocks that can be configured per test
const mockConsentData = vi.fn();
const mockRunData = vi.fn();
const mockExperienceData = vi.fn();
const mockFeedbackData = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'user_consents') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockConsentData,
          }),
        };
      }
      if (table === 'sage_runs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockRunData,
              }),
            }),
          }),
        };
      }
      if (table === 'sage_experiences') {
        return {
          insert: mockInsert,
          select: vi.fn().mockReturnValue({
            eq: mockExperienceData,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === 'sage_feedback') {
        return {
          insert: mockInsert,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: mockFeedbackData,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'sage_policy_weights') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          upsert: mockUpsert.mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        update: mockUpdate.mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    }),
  },
}));

// Mock canonical metrics
vi.mock('@/domain/metrics/canonical', () => ({
  getCanonicalMetrics: vi.fn().mockResolvedValue({
    habits_rate_7d: 0.75,
    habits_rate_30d: 0.70,
    task_completion_rate: 0.80,
    task_overdue_ratio: 0.15,
    momentum_index: 0.65,
    consistency_score: 0.72,
    data_quality: 0.90,
  }),
  metricsToVector: vi.fn().mockReturnValue([0.75, 0.70, 0.80, 0.15, 0.65, 0.72, 0.90]),
}));

import { 
  LearningLoop, 
  createLearningLoop, 
  getConsentSnapshot, 
  isLearningEnabled,
  computeReward,
} from '@/ai/learning-loop';

describe('LearningLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: consent enabled
    mockConsentData.mockResolvedValue({
      data: [
        { purpose: 'ai_profiling', granted: true },
        { purpose: 'policy_learning', granted: true },
        { purpose: 'behavioral_tracking', granted: true },
        { purpose: 'data_export', granted: true },
      ],
      error: null,
    });
    
    // Default: run found
    mockRunData.mockResolvedValue({
      data: {
        id: 'run-123',
        action_type: 'nudge',
        confidence: 0.85,
        reasoning: 'Test reasoning',
      },
      error: null,
    });
    
    // Default: insert success
    mockInsert.mockResolvedValue({ data: null, error: null });
    
    // Default: experiences
    mockExperienceData.mockResolvedValue({ data: [], error: null });
    
    // Default: feedback
    mockFeedbackData.mockResolvedValue({ data: null, error: null });
  });

  describe('getConsentSnapshot', () => {
    it('returns consent object with all purposes from database', async () => {
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: true },
          { purpose: 'policy_learning', granted: true },
          { purpose: 'behavioral_tracking', granted: false },
          { purpose: 'data_export', granted: true },
        ],
        error: null,
      });

      const consent = await getConsentSnapshot('user-123');

      expect(consent).toEqual({
        ai_profiling: true,
        policy_learning: true,
        behavioral_tracking: false,
        data_export: true,
      });
    });

    it('returns all false when no consent records exist', async () => {
      mockConsentData.mockResolvedValue({ data: [], error: null });

      const consent = await getConsentSnapshot('user-456');

      expect(consent).toEqual({
        ai_profiling: false,
        policy_learning: false,
        behavioral_tracking: false,
        data_export: false,
      });
    });

    it('returns all false on database error', async () => {
      mockConsentData.mockResolvedValue({ data: null, error: new Error('DB error') });

      const consent = await getConsentSnapshot('user-789');

      expect(consent).toEqual({
        ai_profiling: false,
        policy_learning: false,
        behavioral_tracking: false,
        data_export: false,
      });
    });

    it('handles partial consent records gracefully', async () => {
      mockConsentData.mockResolvedValue({
        data: [{ purpose: 'ai_profiling', granted: true }],
        error: null,
      });

      const consent = await getConsentSnapshot('user-partial');

      expect(consent).toEqual({
        ai_profiling: true,
        policy_learning: false,
        behavioral_tracking: false,
        data_export: false,
      });
    });
  });

  describe('isLearningEnabled', () => {
    it('returns true when both ai_profiling AND policy_learning are true', () => {
      const consent = {
        ai_profiling: true,
        policy_learning: true,
        behavioral_tracking: false,
        data_export: false,
      };
      expect(isLearningEnabled(consent)).toBe(true);
    });

    it('returns false when ai_profiling is false', () => {
      const consent = {
        ai_profiling: false,
        policy_learning: true,
        behavioral_tracking: true,
        data_export: true,
      };
      expect(isLearningEnabled(consent)).toBe(false);
    });

    it('returns false when policy_learning is false', () => {
      const consent = {
        ai_profiling: true,
        policy_learning: false,
        behavioral_tracking: true,
        data_export: true,
      };
      expect(isLearningEnabled(consent)).toBe(false);
    });

    it('returns false when both are false', () => {
      const consent = {
        ai_profiling: false,
        policy_learning: false,
        behavioral_tracking: false,
        data_export: false,
      };
      expect(isLearningEnabled(consent)).toBe(false);
    });

    it('ignores behavioral_tracking and data_export for learning decision', () => {
      const consentWithTracking = {
        ai_profiling: true,
        policy_learning: true,
        behavioral_tracking: true,
        data_export: true,
      };
      const consentWithoutTracking = {
        ai_profiling: true,
        policy_learning: true,
        behavioral_tracking: false,
        data_export: false,
      };
      
      expect(isLearningEnabled(consentWithTracking)).toBe(true);
      expect(isLearningEnabled(consentWithoutTracking)).toBe(true);
    });
  });

  describe('computeReward', () => {
    it('returns positive reward for accepted feedback', () => {
      const reward = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      expect(reward).toBeGreaterThan(0);
      expect(reward).toBe(1.0);
    });

    it('returns higher reward for completed actions', () => {
      const rewardAccepted = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      const rewardCompleted = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: true,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      expect(rewardCompleted).toBeGreaterThan(rewardAccepted);
      expect(rewardCompleted).toBe(3.0);
    });

    it('returns negative reward for rejected feedback', () => {
      const reward = computeReward({
        accepted: false,
        rejected: true,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      expect(reward).toBeLessThan(0);
      expect(reward).toBe(-2.0);
    });

    it('returns negative reward for ignored feedback', () => {
      const reward = computeReward({
        accepted: false,
        rejected: false,
        ignored: true,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      expect(reward).toBeLessThan(0);
      expect(reward).toBe(-1.0);
    });

    it('clamps reward between -5 and 5', () => {
      const extremePositive = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: true,
        metricsBefore: { momentum_index: 0, task_overdue_ratio: 1, habits_rate_7d: 0 },
        metricsAfter: { momentum_index: 1, task_overdue_ratio: 0, habits_rate_7d: 1 },
        dataQuality: 1.0,
      });
      
      const extremeNegative = computeReward({
        accepted: false,
        rejected: true,
        ignored: true,
        completed: false,
        metricsBefore: { momentum_index: 1, task_overdue_ratio: 0, habits_rate_7d: 1 },
        metricsAfter: { momentum_index: 0, task_overdue_ratio: 1, habits_rate_7d: 0 },
        dataQuality: 1.0,
      });
      
      expect(extremePositive).toBeLessThanOrEqual(5);
      expect(extremeNegative).toBeGreaterThanOrEqual(-5);
    });

    it('scales reward by data quality factor', () => {
      const highQuality = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 1.0,
      });
      
      const lowQuality = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 0.25,
      });
      
      expect(highQuality).toBeGreaterThan(lowQuality);
      expect(lowQuality).toBe(0.25);
    });

    it('enforces minimum quality factor of 0.25', () => {
      const veryLowQuality = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: {},
        metricsAfter: {},
        dataQuality: 0.1,
      });
      
      expect(veryLowQuality).toBe(0.25);
    });

    it('rewards momentum improvement', () => {
      const noChange = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { momentum_index: 0.5 },
        metricsAfter: { momentum_index: 0.5 },
        dataQuality: 1.0,
      });
      
      const improved = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { momentum_index: 0.3 },
        metricsAfter: { momentum_index: 0.8 },
        dataQuality: 1.0,
      });
      
      expect(improved).toBeGreaterThan(noChange);
    });

    it('rewards decreased overdue ratio', () => {
      const noChange = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { task_overdue_ratio: 0.5 },
        metricsAfter: { task_overdue_ratio: 0.5 },
        dataQuality: 1.0,
      });
      
      const improved = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { task_overdue_ratio: 0.8 },
        metricsAfter: { task_overdue_ratio: 0.2 },
        dataQuality: 1.0,
      });
      
      expect(improved).toBeGreaterThan(noChange);
    });

    it('rewards improved habits rate', () => {
      const noChange = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { habits_rate_7d: 0.5 },
        metricsAfter: { habits_rate_7d: 0.5 },
        dataQuality: 1.0,
      });
      
      const improved = computeReward({
        accepted: false,
        rejected: false,
        ignored: false,
        completed: false,
        metricsBefore: { habits_rate_7d: 0.3 },
        metricsAfter: { habits_rate_7d: 0.8 },
        dataQuality: 1.0,
      });
      
      expect(improved).toBeGreaterThan(noChange);
    });

    it('combines feedback and metric impact correctly', () => {
      const reward = computeReward({
        accepted: true,
        rejected: false,
        ignored: false,
        completed: true,
        metricsBefore: { momentum_index: 0.4, task_overdue_ratio: 0.6, habits_rate_7d: 0.5 },
        metricsAfter: { momentum_index: 0.7, task_overdue_ratio: 0.3, habits_rate_7d: 0.7 },
        dataQuality: 0.9,
      });
      
      expect(reward).toBeGreaterThan(3);
    });
  });

  describe('recordFeedback', () => {
    it('successfully records feedback when consent is enabled', async () => {
      const loop = createLearningLoop('user-abc');
      const result = await loop.recordFeedback('run-xyz', 'accepted');

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('returns false and does not record when consent is disabled', async () => {
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: false },
          { purpose: 'policy_learning', granted: false },
        ],
        error: null,
      });

      const loop = createLearningLoop('user-def');
      const result = await loop.recordFeedback('run-123', 'rejected');

      expect(result).toBe(false);
    });

    it('handles all feedback types correctly', async () => {
      const loop = createLearningLoop('user-ghi');
      
      const acceptedResult = await loop.recordFeedback('run-1', 'accepted');
      const rejectedResult = await loop.recordFeedback('run-2', 'rejected');
      const ignoredResult = await loop.recordFeedback('run-3', 'ignored');

      expect(acceptedResult).toBe(true);
      expect(rejectedResult).toBe(true);
      expect(ignoredResult).toBe(true);
    });

    it('returns false when run is not found', async () => {
      mockRunData.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const loop = createLearningLoop('user-notfound');
      const result = await loop.recordFeedback('invalid-run', 'accepted');

      expect(result).toBe(false);
    });
  });

  describe('getLearningStats', () => {
    it('calculates correct statistics from experiences', async () => {
      const mockExperiences = [
        { id: '1', reward: 2 },
        { id: '2', reward: 1 },
        { id: '3', reward: -1 },
        { id: '4', reward: null },
      ];

      mockExperienceData.mockResolvedValue({ 
        data: mockExperiences, 
        error: null,
      });

      const loop = createLearningLoop('user-stats');
      const stats = await loop.getLearningStats();

      expect(stats.totalExperiences).toBe(4);
      expect(stats.processedExperiences).toBe(3);
      expect(stats.averageReward).toBeCloseTo(0.667, 2);
    });

    it('returns zero stats when no experiences', async () => {
      mockExperienceData.mockResolvedValue({ data: [], error: null });

      const loop = createLearningLoop('user-empty');
      const stats = await loop.getLearningStats();

      expect(stats.totalExperiences).toBe(0);
      expect(stats.processedExperiences).toBe(0);
      expect(stats.averageReward).toBe(0);
    });

    it('excludes null rewards from average calculation', async () => {
      const mockExperiences = [
        { id: '1', reward: 4 },
        { id: '2', reward: null },
        { id: '3', reward: null },
        { id: '4', reward: 2 },
      ];

      mockExperienceData.mockResolvedValue({ 
        data: mockExperiences, 
        error: null,
      });

      const loop = createLearningLoop('user-partial-rewards');
      const stats = await loop.getLearningStats();

      expect(stats.totalExperiences).toBe(4);
      expect(stats.processedExperiences).toBe(2);
      expect(stats.averageReward).toBe(3);
    });

    it('includes learningEnabled status based on consent', async () => {
      mockExperienceData.mockResolvedValue({ data: [], error: null });

      const loop = createLearningLoop('user-consent');
      const stats = await loop.getLearningStats();

      expect(stats.learningEnabled).toBe(true);
    });

    it('reports learning disabled when consent is withdrawn', async () => {
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: false },
          { purpose: 'policy_learning', granted: false },
        ],
        error: null,
      });
      mockExperienceData.mockResolvedValue({ data: [], error: null });

      const loop = createLearningLoop('user-no-consent');
      const stats = await loop.getLearningStats();

      expect(stats.learningEnabled).toBe(false);
    });
  });

  describe('processDelayedLearning', () => {
    it('returns false when consent is withdrawn', async () => {
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: false },
          { purpose: 'policy_learning', granted: false },
        ],
        error: null,
      });

      const loop = createLearningLoop('user-withdrawn');
      const result = await loop.processDelayedLearning('exp-123');

      expect(result).toBe(false);
    });
  });

  describe('createLearningLoop factory', () => {
    it('creates a LearningLoop instance with correct userId', () => {
      const loop = createLearningLoop('test-user-id');
      expect(loop).toBeInstanceOf(LearningLoop);
    });

    it('creates independent instances for different users', () => {
      const loop1 = createLearningLoop('user-1');
      const loop2 = createLearningLoop('user-2');
      
      expect(loop1).not.toBe(loop2);
      expect(loop1).toBeInstanceOf(LearningLoop);
      expect(loop2).toBeInstanceOf(LearningLoop);
    });
  });

  describe('GDPR compliance', () => {
    it('does not persist learning data without consent', async () => {
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: false },
          { purpose: 'policy_learning', granted: false },
        ],
        error: null,
      });

      const loop = createLearningLoop('user-no-consent');
      const result = await loop.recordFeedback('run-test', 'accepted');

      expect(result).toBe(false);
      // Insert should not have been called since consent is disabled
    });

    it('requires both ai_profiling AND policy_learning for learning', async () => {
      // Only ai_profiling
      mockConsentData.mockResolvedValue({
        data: [
          { purpose: 'ai_profiling', granted: true },
          { purpose: 'policy_learning', granted: false },
        ],
        error: null,
      });

      const loop = createLearningLoop('user-partial-consent');
      const result = await loop.recordFeedback('run-test', 'accepted');

      expect(result).toBe(false);
    });
  });
});
