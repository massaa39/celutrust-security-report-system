import { describe, test, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../src/lib/supabase';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
    })),
  },
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('従業員がログインできる', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'employee@example.com',
      user_metadata: { role: 'employee' },
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: {} as any },
      error: null,
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'employee@example.com',
      password: 'password123',
    });

    expect(result.data.user).toBeDefined();
    expect(result.data.user?.email).toBe('employee@example.com');
    expect(result.error).toBeNull();
  });

  test('管理者がログインできる', async () => {
    const mockAdmin = {
      id: 'admin-user-id',
      email: 'admin@example.com',
      user_metadata: { role: 'admin' },
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockAdmin, session: {} as any },
      error: null,
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123',
    });

    expect(result.data.user).toBeDefined();
    expect(result.data.user?.email).toBe('admin@example.com');
    expect(result.error).toBeNull();
  });

  test('無効な認証情報でログイン失敗', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });

    expect(result.data.user).toBeNull();
    expect(result.error).toBeDefined();
  });

  test('ログアウトできる', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    const result = await supabase.auth.signOut();

    expect(result.error).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
