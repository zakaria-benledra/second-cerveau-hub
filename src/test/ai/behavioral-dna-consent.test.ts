import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock learning-loop first
vi.mock('@/ai/learning-loop', () => ({
  getConsentSnapshot: vi.fn(),
  isLearningEnabled: vi.fn(),
}));

// Mock supabase client
const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
});
const mockSelectSingle = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
});
const mockSelectList = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    gte: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    order: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'behavioral_dna') {
        return {
          insert: mockInsert,
          update: mockUpdate,
          select: mockSelectSingle,
        };
      }
      if (table === 'sage_experiences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'sage_policy_weights') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      // Default for audit_log, habit_logs, tasks, journal_entries, sage_feedback
      return {
        select: mockSelectList,
        insert: mockInsert,
        update: mockUpdate,
      };
    }),
  },
}));

import { BehavioralDNAEngine } from '@/ai/behavioral-dna';
import { getConsentSnapshot, isLearningEnabled } from '@/ai/learning-loop';

describe('BehavioralDNA consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not generate DNA when consent disabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: false,
      policy_learning: false,
      behavioral_tracking: false,
      data_export: false,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(false);

    const engine = new BehavioralDNAEngine('user-123');
    const result = await engine.generateDNA();

    expect(result).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('generates DNA when consent enabled', async () => {
    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: true,
      policy_learning: true,
      behavioral_tracking: true,
      data_export: true,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(true);

    const engine = new BehavioralDNAEngine('user-456');
    const result = await engine.generateDNA();

    expect(result).not.toBeNull();
    expect(result?.userId).toBe('user-456');
    expect(result?.chronotype).toBeDefined();
    expect(result?.disciplineProfile).toBeDefined();
    expect(result?.dropoutSignals).toBeDefined();
    expect(result?.predictions).toBeDefined();
  });

  it('returns null and logs message when profiling disabled', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.mocked(getConsentSnapshot).mockResolvedValue({
      ai_profiling: false,
      policy_learning: true,
      behavioral_tracking: true,
      data_export: true,
    });
    vi.mocked(isLearningEnabled).mockReturnValue(false);

    const engine = new BehavioralDNAEngine('user-789');
    const result = await engine.generateDNA();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('[BehavioralDNA] Profiling disabled by consent');

    consoleSpy.mockRestore();
  });
});
