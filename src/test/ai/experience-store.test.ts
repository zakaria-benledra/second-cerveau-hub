import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock learning-loop first
vi.mock('@/ai/learning-loop', () => ({
  getConsentSnapshot: vi.fn(),
  isLearningEnabled: vi.fn(),
}));

// Mock supabase client
const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'sage_experiences') {
        return {
          insert: mockInsert,
          select: mockSelect,
        };
      }
      if (table === 'sage_policy_weights') {
        return {
          upsert: mockUpsert,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {
        insert: mockInsert,
        upsert: mockUpsert,
        select: mockSelect,
      };
    }),
  },
}));

import { ExperienceStore } from '@/ai/experience-store';
import { getConsentSnapshot, isLearningEnabled } from '@/ai/learning-loop';

describe('ExperienceStore consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not save experience when consent disabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: false,
      policy_learning: false,
      behavioral_tracking: false,
      data_export: false,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(false);

    const store = new ExperienceStore('user-123');

    await store.saveExperience({
      contextVector: [1, 2, 3],
      action: 'nudge',
      reward: 1,
      metricsBefore: {},
      metricsAfter: {},
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('saves experience when consent enabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: true,
      policy_learning: true,
      behavioral_tracking: true,
      data_export: true,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(true);

    const store = new ExperienceStore('user-456');

    await store.saveExperience({
      contextVector: [1, 2, 3],
      action: 'celebrate',
      reward: 2,
      metricsBefore: { momentum: 0.5 },
      metricsAfter: { momentum: 0.7 },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-456',
      context_vector: [1, 2, 3],
      action_type: 'celebrate',
      reward: 2,
      metrics_before: { momentum: 0.5 },
      metrics_after: { momentum: 0.7 },
    });
  });

  it('does not save weights when consent disabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: false,
      policy_learning: false,
      behavioral_tracking: false,
      data_export: false,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(false);

    const store = new ExperienceStore('user-789');

    await store.saveWeights({
      nudge: [0.1, 0.2, 0.3],
      celebrate: [0.4, 0.5, 0.6],
    });

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('saves weights when consent enabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: true,
      policy_learning: true,
      behavioral_tracking: true,
      data_export: true,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(true);

    const store = new ExperienceStore('user-abc');

    await store.saveWeights({
      nudge: [0.1, 0.2],
    });

    expect(mockUpsert).toHaveBeenCalled();
  });
});
