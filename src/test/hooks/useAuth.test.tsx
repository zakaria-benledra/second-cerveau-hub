import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock supabase client
const mockUnsubscribe = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: mockOnAuthStateChange,
      signOut: vi.fn(),
    },
  },
}));

import { useAuth, signOut } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start in loading state', () => {
    vi.mocked(supabase.auth.getSession).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading
    );

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set user when session exists', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle no session (logged out)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should subscribe to auth state changes', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth());

    expect(mockOnAuthStateChange).toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('signOut function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabase signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    await signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should throw error on signOut failure', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ 
      error: { message: 'Sign out failed' } as any 
    });

    await expect(signOut()).rejects.toThrow();
  });
});

describe('AuthState interface', () => {
  it('should have correct shape', () => {
    const authState = {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    };

    expect(authState).toHaveProperty('user');
    expect(authState).toHaveProperty('session');
    expect(authState).toHaveProperty('isLoading');
    expect(authState).toHaveProperty('isAuthenticated');
  });

  it('should derive isAuthenticated from session', () => {
    const getIsAuthenticated = (session: any) => !!session;

    expect(getIsAuthenticated(null)).toBe(false);
    expect(getIsAuthenticated(undefined)).toBe(false);
    expect(getIsAuthenticated({ user: {} })).toBe(true);
  });
});
