import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('AI Coach Rate Limiting', () => {
  const MIN_REFETCH_INTERVAL = 30000; // 30 seconds

  let lastFetchTime = 0;
  let toastWarningCalled = false;
  let refetchCalled = false;

  const mockToast = {
    warning: vi.fn((message: string) => {
      toastWarningCalled = true;
    }),
  };

  const mockRefetch = vi.fn(() => {
    refetchCalled = true;
    return Promise.resolve();
  });

  // Simulates the rate-limited refetch logic from useAICoach
  const refetchBriefingThrottled = () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    if (timeSinceLastFetch < MIN_REFETCH_INTERVAL) {
      const remainingSeconds = Math.ceil((MIN_REFETCH_INTERVAL - timeSinceLastFetch) / 1000);
      mockToast.warning(`Veuillez attendre ${remainingSeconds}s avant de rafraîchir`);
      return Promise.resolve();
    }

    lastFetchTime = now;
    return mockRefetch();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    lastFetchTime = 0;
    toastWarningCalled = false;
    refetchCalled = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first refetch immediately', async () => {
    await refetchBriefingThrottled();

    expect(refetchCalled).toBe(true);
    expect(toastWarningCalled).toBe(false);
  });

  it('should block refetch within 30 seconds and show warning', async () => {
    // First call - should succeed
    await refetchBriefingThrottled();
    expect(refetchCalled).toBe(true);

    // Reset mock
    refetchCalled = false;

    // Advance time by 10 seconds (not enough)
    vi.advanceTimersByTime(10000);

    // Second call - should be blocked
    await refetchBriefingThrottled();

    expect(refetchCalled).toBe(false);
    expect(toastWarningCalled).toBe(true);
    expect(mockToast.warning).toHaveBeenCalledWith(
      expect.stringMatching(/Veuillez attendre \d+s avant de rafraîchir/)
    );
  });

  it('should allow refetch after 30 seconds', async () => {
    // First call
    await refetchBriefingThrottled();
    expect(refetchCalled).toBe(true);

    // Reset mock
    refetchCalled = false;

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);

    // Second call - should succeed
    await refetchBriefingThrottled();

    expect(refetchCalled).toBe(true);
    expect(mockToast.warning).not.toHaveBeenCalledTimes(2);
  });

  it('should show correct remaining seconds in warning', async () => {
    // First call
    await refetchBriefingThrottled();

    // Advance time by 15 seconds
    vi.advanceTimersByTime(15000);

    // Second call - should be blocked with ~15 seconds remaining
    await refetchBriefingThrottled();

    expect(mockToast.warning).toHaveBeenCalledWith('Veuillez attendre 15s avant de rafraîchir');
  });

  it('should handle rapid successive calls', async () => {
    // First call - allowed
    await refetchBriefingThrottled();
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Rapid successive calls - all should be blocked
    await refetchBriefingThrottled();
    await refetchBriefingThrottled();
    await refetchBriefingThrottled();

    expect(mockRefetch).toHaveBeenCalledTimes(1); // Still only 1
    expect(mockToast.warning).toHaveBeenCalledTimes(3); // 3 warnings
  });

  it('should reset timer after successful refetch', async () => {
    // First call at t=0
    await refetchBriefingThrottled();
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Wait 30 seconds
    vi.advanceTimersByTime(30000);

    // Second call at t=30s - allowed, resets timer
    await refetchBriefingThrottled();
    expect(mockRefetch).toHaveBeenCalledTimes(2);

    // Try again at t=30s + 10s = t=40s - should be blocked
    vi.advanceTimersByTime(10000);
    await refetchBriefingThrottled();

    expect(mockRefetch).toHaveBeenCalledTimes(2); // Still 2
    expect(mockToast.warning).toHaveBeenCalled();
  });
});
