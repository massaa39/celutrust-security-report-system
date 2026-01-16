/**
 * モック認証システム（デモ用）
 * 本番環境では実際のSupabaseを使用してください
 */

export interface MockUser {
  id: string;
  email: string;
  role: 'employee' | 'admin';
  full_name: string;
  created_at: string;
}

export interface MockSession {
  user: MockUser;
  access_token: string;
}

const STORAGE_KEY = 'mock_users';
const SESSION_KEY = 'mock_session';

// LocalStorageからユーザーデータを取得
function getUsers(): MockUser[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// LocalStorageにユーザーデータを保存
function saveUsers(users: MockUser[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// セッションを保存
function saveSession(session: MockSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// セッションを取得
function getSession(): MockSession | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

// UUIDの簡易生成
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const mockAuth = {
  // サインアップ
  signUp: async (email: string, _password: string, fullName: string): Promise<MockSession> => {
    const users = getUsers();

    // 既存ユーザーチェック
    if (users.some((u) => u.email === email)) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    // 新規ユーザー作成
    const newUser: MockUser = {
      id: generateUUID(),
      email,
      role: 'employee',
      full_name: fullName,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // セッション作成
    const session: MockSession = {
      user: newUser,
      access_token: generateUUID(),
    };
    saveSession(session);

    // アクティビティログ（LocalStorageに保存）
    const logs = JSON.parse(localStorage.getItem('mock_activity_logs') || '[]');
    logs.push({
      id: generateUUID(),
      user_id: newUser.id,
      action: 'signup',
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('mock_activity_logs', JSON.stringify(logs));

    return session;
  },

  // サインイン
  signIn: async (email: string, _password: string): Promise<MockSession> => {
    const users = getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // 本番環境では実際のパスワード検証を行う
    // デモ用なので全てのパスワードを受け入れる

    const session: MockSession = {
      user,
      access_token: generateUUID(),
    };
    saveSession(session);

    // アクティビティログ
    const logs = JSON.parse(localStorage.getItem('mock_activity_logs') || '[]');
    logs.push({
      id: generateUUID(),
      user_id: user.id,
      action: 'login',
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('mock_activity_logs', JSON.stringify(logs));

    return session;
  },

  // サインアウト
  signOut: async (): Promise<void> => {
    const session = getSession();

    if (session) {
      // アクティビティログ
      const logs = JSON.parse(localStorage.getItem('mock_activity_logs') || '[]');
      logs.push({
        id: generateUUID(),
        user_id: session.user.id,
        action: 'logout',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('mock_activity_logs', JSON.stringify(logs));
    }

    saveSession(null);
  },

  // 現在のセッション取得
  getSession: async (): Promise<MockSession | null> => {
    return getSession();
  },

  // 初期管理者アカウント作成（開発用）
  createInitialAdminAccount: (): void => {
    const users = getUsers();

    if (!users.some((u) => u.email === 'admin@celutrust.co.jp')) {
      const adminUser: MockUser = {
        id: generateUUID(),
        email: 'admin@celutrust.co.jp',
        role: 'admin',
        full_name: '管理者',
        created_at: new Date().toISOString(),
      };
      users.push(adminUser);
      saveUsers(users);
      console.log('初期管理者アカウントを作成しました');
      console.log('メール: admin@celutrust.co.jp');
      console.log('パスワード: admin123（任意のパスワードでログイン可能）');
    }
  },
};

// 初期化時に管理者アカウントを作成
mockAuth.createInitialAdminAccount();
