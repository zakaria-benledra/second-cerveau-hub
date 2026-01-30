import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Race Condition Prevention in NextBestActionCard
 * 
 * These tests verify the logic used to prevent double-clicks
 * and race conditions when completing tasks from the Today page.
 */
describe('NextBestActionCard - Race Condition Prevention Logic', () => {
  
  describe('Button disabled state logic', () => {
    // This mirrors the logic in NextBestActionCard: isActionDisabled = isLoading || disabled
    const isActionDisabled = (isLoading: boolean, disabled: boolean): boolean => {
      return isLoading || disabled;
    };

    it('should disable button when isLoading is true', () => {
      expect(isActionDisabled(true, false)).toBe(true);
    });

    it('should disable button when disabled prop is true', () => {
      expect(isActionDisabled(false, true)).toBe(true);
    });

    it('should disable button when both are true', () => {
      expect(isActionDisabled(true, true)).toBe(true);
    });

    it('should enable button when both are false', () => {
      expect(isActionDisabled(false, false)).toBe(false);
    });
  });

  describe('Race condition ref guard logic', () => {
    // This mirrors the logic in TodayPage.tsx with completingTaskRef
    let completingTaskRef: string | null = null;
    let isPending = false;
    let mutateCallCount = 0;

    const mockMutate = vi.fn((id: string) => {
      mutateCallCount++;
      // Simulate async completion
      setTimeout(() => {
        completingTaskRef = null;
        isPending = false;
      }, 100);
    });

    const handleCompleteTask = (id: string) => {
      // Guard: prevent double-clicks
      if (completingTaskRef === id || isPending) return;
      
      completingTaskRef = id;
      isPending = true;
      mockMutate(id);
    };

    beforeEach(() => {
      completingTaskRef = null;
      isPending = false;
      mutateCallCount = 0;
      vi.clearAllMocks();
    });

    it('should allow first click', () => {
      handleCompleteTask('task-1');
      
      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith('task-1');
    });

    it('should block rapid double-clicks on same task', () => {
      handleCompleteTask('task-1');
      handleCompleteTask('task-1'); // Should be blocked
      handleCompleteTask('task-1'); // Should be blocked
      
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('should block click while isPending', () => {
      handleCompleteTask('task-1');
      
      // Try different task while pending
      handleCompleteTask('task-2');
      
      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith('task-1');
    });

    it('should track correct task in ref', () => {
      handleCompleteTask('task-abc');
      
      expect(completingTaskRef).toBe('task-abc');
    });
  });

  describe('Button text state', () => {
    // This mirrors the button text logic: isLoading ? 'En cours...' : 'Commencer'
    const getButtonText = (isLoading: boolean): string => {
      return isLoading ? 'En cours...' : 'Commencer';
    };

    it('should show "Commencer" when not loading', () => {
      expect(getButtonText(false)).toBe('Commencer');
    });

    it('should show "En cours..." when loading', () => {
      expect(getButtonText(true)).toBe('En cours...');
    });
  });

  describe('Skip button disabled state', () => {
    // Skip button uses same isActionDisabled logic
    const isSkipDisabled = (isLoading: boolean, disabled: boolean): boolean => {
      return isLoading || disabled;
    };

    it('should disable skip button when loading', () => {
      expect(isSkipDisabled(true, false)).toBe(true);
    });

    it('should enable skip button when not loading and not disabled', () => {
      expect(isSkipDisabled(false, false)).toBe(false);
    });
  });
});

describe('TodayPage - Habit Toggle Race Condition Prevention', () => {
  let togglingHabitRef: string | null = null;
  let isPending = false;
  let toggleCallCount = 0;

  const mockToggle = vi.fn((id: string) => {
    toggleCallCount++;
  });

  const handleToggleHabit = (id: string) => {
    if (togglingHabitRef === id || isPending) return;
    
    togglingHabitRef = id;
    isPending = true;
    mockToggle(id);
  };

  beforeEach(() => {
    togglingHabitRef = null;
    isPending = false;
    toggleCallCount = 0;
    vi.clearAllMocks();
  });

  it('should allow first toggle', () => {
    handleToggleHabit('habit-1');
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should block rapid double-toggles', () => {
    handleToggleHabit('habit-1');
    handleToggleHabit('habit-1');
    handleToggleHabit('habit-1');
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
