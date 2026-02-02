import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { approveProposal, rejectProposal } from '@/lib/api/ai-coach';

describe('ai-coach returns run_id for learning loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approveProposal returns run_id', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          action: { id: 'action-123', type: 'task_reschedule' },
          message: 'Proposition approuvée et action exécutée',
          run_id: 'test-run-id-approve',
        },
      },
      error: null,
    });

    const result = await approveProposal('proposal-123');

    expect(result.run_id).toBeDefined();
    expect(result.run_id).toBe('test-run-id-approve');
    expect(result.action).toBeDefined();
    expect(result.message).toContain('approuvée');
  });

  it('rejectProposal returns run_id', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          message: 'Proposition rejetée',
          run_id: 'test-run-id-reject',
        },
      },
      error: null,
    });

    const result = await rejectProposal('proposal-456', 'Not relevant');

    expect(result.run_id).toBeDefined();
    expect(result.run_id).toBe('test-run-id-reject');
    expect(result.message).toContain('rejetée');
  });

  it('approveProposal calls ai-coach with correct payload', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          action: {},
          message: 'OK',
          run_id: 'run-123',
        },
      },
      error: null,
    });

    await approveProposal('my-proposal-id');

    expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
      body: {
        action: 'approve_proposal',
        user_id: 'test-user-id',
        payload: { proposal_id: 'my-proposal-id' },
      },
    });
  });

  it('rejectProposal includes reason in payload', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          message: 'OK',
          run_id: 'run-456',
        },
      },
      error: null,
    });

    await rejectProposal('my-proposal-id', 'Too aggressive');

    expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
      body: {
        action: 'reject_proposal',
        user_id: 'test-user-id',
        payload: { proposal_id: 'my-proposal-id', reason: 'Too aggressive' },
      },
    });
  });

  it('throws error when proposal approval fails', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        success: false,
        error: 'Proposition non trouvée',
      },
      error: null,
    });

    await expect(approveProposal('invalid-id')).rejects.toThrow('Proposition non trouvée');
  });
});
