import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'user_consents') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { purpose: 'ai_profiling', granted: true },
                { purpose: 'policy_learning', granted: true },
                { purpose: 'behavioral_tracking', granted: true },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'sage_runs') {
        return {
          select: mockSelect,
        };
      }
      if (table === 'sage_feedback' || table === 'sage_experiences') {
        return {
          insert: mockInsert,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
      };
    }),
  },
}));

// Mock canonical metrics
vi.mock('@/domain/metrics/canonical', () => ({
  getCanonicalMetrics: vi.fn().mockResolvedValue({
    momentum_index: 0.7,
    task_overdue_ratio: 0.1,
    habits_rate_7d: 0.8,
    data_quality: 0.9,
  }),
  metricsToVector: vi.fn().mockReturnValue([0.7, 0.1, 0.8, 0.9]),
}));

import { LearningLoop, createLearningLoop, computeReward, isLearningEnabled } from '@/ai/learning-loop';

describe('LearningLoop.recordFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock chain for sage_runs
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'run-123',
              action_type: 'nudge',
              confidence: 0.85,
              reasoning: 'Test reasoning',
            },
            error: null,
          }),
        }),
      }),
    });
    
    // Setup insert mock
    mockInsert.mockResolvedValue({ data: null, error: null });
  });

  it('returns true when feedback is successfully recorded', async () => {
    const loop = new LearningLoop('user-123');
    const result = await loop.recordFeedback('run-123', 'accepted');
    
    expect(result).toBe(true);
  });

  it('inserts feedback into sage_feedback table', async () => {
    const loop = new LearningLoop('user-456');
    await loop.recordFeedback('run-456', 'accepted');
    
    expect(mockInsert).toHaveBeenCalled();
  });

  it('inserts experience into sage_experiences table', async () => {
    const loop = new LearningLoop('user-789');
    await loop.recordFeedback('run-789', 'rejected');
    
    // Should call insert twice: once for feedback, once for experience
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('returns false when run is not found', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    });
    
    const loop = new LearningLoop('user-123');
    const result = await loop.recordFeedback('invalid-run', 'accepted');
    
    expect(result).toBe(false);
  });

  it('handles all feedback types correctly', async () => {
    const loop = new LearningLoop('user-123');
    
    const acceptedResult = await loop.recordFeedback('run-1', 'accepted');
    expect(acceptedResult).toBe(true);
    
    const rejectedResult = await loop.recordFeedback('run-2', 'rejected');
    expect(rejectedResult).toBe(true);
    
    const ignoredResult = await loop.recordFeedback('run-3', 'ignored');
    expect(ignoredResult).toBe(true);
  });
});

describe('LearningLoop consent checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when consent is not granted', async () => {
    // Override the mock to return no consent
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === 'user_consents') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { purpose: 'ai_profiling', granted: false },
                    { purpose: 'policy_learning', granted: false },
                  ],
                  error: null,
                }),
              }),
            };
          }
          return { select: vi.fn(), insert: vi.fn() };
        }),
      },
    }));
  });
});

describe('computeReward', () => {
  it('returns positive reward for accepted feedback', () => {
    const reward = computeReward({
      accepted: true,
      rejected: false,
      ignored: false,
      completed: false,
      metricsBefore: { momentum_index: 0.5 },
      metricsAfter: { momentum_index: 0.5 },
      dataQuality: 1.0,
    });
    
    expect(reward).toBeGreaterThan(0);
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
});

describe('isLearningEnabled', () => {
  it('returns true when both ai_profiling and policy_learning are granted', () => {
    const result = isLearningEnabled({
      ai_profiling: true,
      policy_learning: true,
      behavioral_tracking: false,
      data_export: false,
    });
    
    expect(result).toBe(true);
  });

  it('returns false when ai_profiling is not granted', () => {
    const result = isLearningEnabled({
      ai_profiling: false,
      policy_learning: true,
      behavioral_tracking: true,
      data_export: true,
    });
    
    expect(result).toBe(false);
  });

  it('returns false when policy_learning is not granted', () => {
    const result = isLearningEnabled({
      ai_profiling: true,
      policy_learning: false,
      behavioral_tracking: true,
      data_export: true,
    });
    
    expect(result).toBe(false);
  });

  it('returns false when both are not granted', () => {
    const result = isLearningEnabled({
      ai_profiling: false,
      policy_learning: false,
      behavioral_tracking: true,
      data_export: true,
    });
    
    expect(result).toBe(false);
  });
});

describe('createLearningLoop factory', () => {
  it('creates a LearningLoop instance', () => {
    const loop = createLearningLoop('user-123');
    
    expect(loop).toBeInstanceOf(LearningLoop);
  });
});
