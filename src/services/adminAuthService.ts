import { AdminUser, ActiveSession, AuditLog, UserRole } from '../types';

const TOKEN_KEY = 'plush_comfort_admin_token';
const USER_KEY = 'plush_comfort_admin_user';
const VAULT_USERS_KEY = 'plush_comfort_admin_users_vault';
const VAULT_SESSIONS_KEY = 'plush_comfort_active_sessions_vault';
const VAULT_LOGS_KEY = 'plush_comfort_audit_logs_vault';
const RATE_LIMIT_KEY = 'plush_comfort_login_rate_limit';

interface StoredVaultUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  recoveryKeyHash?: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isEmpty: boolean;
  isHtml: boolean;
  networkError?: boolean;
}

/**
 * Robust HTTP Response parser that prevents "Unexpected end of JSON input"
 * and catches HTML error pages or empty responses before calling JSON.parse.
 */
async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!text || text.trim() === '') {
      return {
        ok: false,
        status: res.status,
        isEmpty: true,
        isHtml: false,
        error: `Endpoint returned an empty response body (HTTP ${res.status}). Endpoint: ${url}`,
      };
    }

    const trimmed = text.trim();
    if (
      contentType.includes('text/html') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<head')
    ) {
      return {
        ok: false,
        status: res.status,
        isEmpty: false,
        isHtml: true,
        error: `Endpoint returned HTML instead of JSON (HTTP ${res.status}). Endpoint: ${url}`,
      };
    }

    try {
      const data = JSON.parse(trimmed);
      return {
        ok: res.ok,
        status: res.status,
        data,
        isEmpty: false,
        isHtml: false,
        error: !res.ok ? (data.error || `Request failed with HTTP ${res.status}`) : undefined,
      };
    } catch (parseErr: any) {
      return {
        ok: false,
        status: res.status,
        isEmpty: false,
        isHtml: false,
        error: `Unable to parse server JSON response: ${parseErr.message}`,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      isEmpty: false,
      isHtml: false,
      networkError: true,
      error: `Network error connecting to API: ${err.message || 'Server unreachable'}`,
    };
  }
}

/**
 * Universal browser-native cryptographic password hashing (PBKDF2-HMAC-SHA256, 10,000 iterations).
 * Used for secure cryptographic verification when server API is in static hosting mode.
 */
async function hashPasswordWebCrypto(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateCryptographicSalt(): string {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRecoveryKey(): string {
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
  return `PC-RECOV-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// Client vault storage helpers
function getVaultUsers(): StoredVaultUser[] {
  try {
    const raw = localStorage.getItem(VAULT_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVaultUsers(users: StoredVaultUser[]): void {
  localStorage.setItem(VAULT_USERS_KEY, JSON.stringify(users));
}

function getVaultSessions(): ActiveSession[] {
  try {
    const raw = localStorage.getItem(VAULT_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVaultSessions(sessions: ActiveSession[]): void {
  localStorage.setItem(VAULT_SESSIONS_KEY, JSON.stringify(sessions));
}

function getVaultLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(VAULT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendVaultLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getVaultLogs();
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  if (logs.length > 2000) logs.length = 2000;
  localStorage.setItem(VAULT_LOGS_KEY, JSON.stringify(logs));
}

function checkClientRateLimit(): { allowed: boolean; message?: string; waitMinutes?: number } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { allowed: true };
    const { attempts, lockedUntil } = JSON.parse(raw);
    const now = Date.now();
    if (lockedUntil && lockedUntil > now) {
      const waitMinutes = Math.ceil((lockedUntil - now) / 60000);
      return {
        allowed: false,
        message: `Account temporarily locked due to repeated failed attempts. Please try again in ${waitMinutes} minute(s).`,
        waitMinutes,
      };
    }
  } catch {}
  return { allowed: true };
}

function recordClientFailedLogin(): void {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    const data = raw ? JSON.parse(raw) : { attempts: 0 };
    data.attempts = (data.attempts || 0) + 1;
    if (data.attempts >= 5) {
      data.lockedUntil = now + 15 * 60 * 1000;
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {}
}

function resetClientFailedLogin(): void {
  localStorage.removeItem(RATE_LIMIT_KEY);
}

export const adminAuthService = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, remember = false): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getStoredUser(): AdminUser | null {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: AdminUser, remember = false): void {
    const json = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, json);
    if (remember) {
      localStorage.setItem(USER_KEY, json);
    }
  },

  async getStatus(): Promise<{ initialized: boolean; authenticated: boolean; user: AdminUser | null }> {
    const token = this.getToken();
    const storedUser = this.getStoredUser();

    // 1. Try real backend API
    const res = await safeFetchJson<{ initialized: boolean; authenticated: boolean; user: AdminUser | null }>(
      '/api/auth/status',
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    if (res.ok && res.data) {
      return res.data;
    }

    // 2. Fallback to client cryptographic vault if backend is in static mode or unreachable
    const vaultUsers = getVaultUsers();
    const masterAdmin = vaultUsers.find((u) => u.role === 'master_admin');
    const isInitialized = !!masterAdmin;

    let authenticated = false;
    let currentUser: AdminUser | null = null;

    if (token && storedUser) {
      const activeSessions = getVaultSessions();
      const validSession = activeSessions.find((s) => s.id === token && s.userId === storedUser.id);
      if (validSession) {
        authenticated = true;
        currentUser = storedUser;
      } else if (vaultUsers.some((u) => u.id === storedUser.id)) {
        authenticated = true;
        currentUser = storedUser;
      }
    }

    return {
      initialized: isInitialized,
      authenticated,
      user: currentUser,
    };
  },

  async initMaster(name: string, email: string, password: string): Promise<{
    success: boolean;
    recoveryKey?: string;
    token?: string;
    user?: AdminUser;
    error?: string;
  }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Attempt backend API first
    const res = await safeFetchJson<{
      success: boolean;
      recoveryKey?: string;
      token?: string;
      user?: AdminUser;
      error?: string;
    }>('/api/auth/init-master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
    });

    if (res.ok && res.data?.success) {
      this.setToken(res.data.token!, true);
      this.setStoredUser(res.data.user!, true);
      return res.data;
    }

    // If backend returned a clear rejection (e.g. Master already initialized)
    if (res.data && !res.data.success && !res.isEmpty && !res.isHtml) {
      return { success: false, error: res.data.error || 'Initialization failed' };
    }

    // 2. Client Cryptographic Fallback (Web Crypto PBKDF2 with SHA-256)
    try {
      const vaultUsers = getVaultUsers();
      if (vaultUsers.some((u) => u.role === 'master_admin')) {
        return { success: false, error: 'Master Admin account has already been initialized.' };
      }

      const salt = generateCryptographicSalt();
      const passwordHash = await hashPasswordWebCrypto(password, salt);
      const recoveryKey = generateRecoveryKey();
      const recoveryKeyHash = await hashPasswordWebCrypto(recoveryKey, salt);

      const newUserId = `usr-master-${Date.now()}`;
      const newUser: StoredVaultUser = {
        id: newUserId,
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        salt,
        recoveryKeyHash,
        role: 'master_admin',
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      vaultUsers.push(newUser);
      saveVaultUsers(vaultUsers);

      const sessionToken = `sess-${Date.now()}-${generateCryptographicSalt()}`;
      const safeUser: AdminUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
        lastLoginAt: newUser.lastLoginAt,
        isActive: true,
      };

      const session: ActiveSession = {
        id: sessionToken,
        userId: safeUser.id,
        userName: safeUser.name,
        userEmail: safeUser.email,
        role: safeUser.role,
        device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        ip: '127.0.0.1 (Local Session)',
        signedInAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      };

      const sessions = getVaultSessions();
      sessions.push(session);
      saveVaultSessions(sessions);

      this.setToken(sessionToken, true);
      this.setStoredUser(safeUser, true);

      appendVaultLog({
        userId: safeUser.id,
        userName: safeUser.name,
        userEmail: safeUser.email,
        userRole: safeUser.role,
        action: 'MASTER_ADMIN_INITIALIZED',
        category: 'auth',
        target: safeUser.email,
        details: `Master Admin initialized with credentials for ${safeUser.name}.`,
      });

      return {
        success: true,
        recoveryKey,
        token: sessionToken,
        user: safeUser,
      };
    } catch (err: any) {
      return { success: false, error: `Cryptographic initialization failed: ${err.message}` };
    }
  },

  async login(email: string, password: string, remember = false): Promise<{
    success: boolean;
    token?: string;
    user?: AdminUser;
    error?: string;
    waitMinutes?: number;
  }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Attempt backend API first
    const res = await safeFetchJson<{
      success: boolean;
      token?: string;
      user?: AdminUser;
      error?: string;
      waitMinutes?: number;
    }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (res.ok && res.data?.success) {
      this.setToken(res.data.token!, remember);
      this.setStoredUser(res.data.user!, remember);
      return res.data;
    }

    // If backend provided a specific error (e.g. invalid credentials or rate limit lockout)
    if (res.data && !res.data.success && !res.isEmpty && !res.isHtml) {
      return {
        success: false,
        error: res.data.error || 'Invalid credentials',
        waitMinutes: res.data.waitMinutes,
      };
    }

    // 2. Client Cryptographic Fallback
    const rateLimit = checkClientRateLimit();
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: rateLimit.message,
        waitMinutes: rateLimit.waitMinutes,
      };
    }

    try {
      const vaultUsers = getVaultUsers();
      const user = vaultUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user || !user.isActive) {
        recordClientFailedLogin();
        return { success: false, error: 'Invalid email or password.' };
      }

      const inputHash = await hashPasswordWebCrypto(password, user.salt);
      if (inputHash !== user.passwordHash) {
        recordClientFailedLogin();
        return { success: false, error: 'Invalid email or password.' };
      }

      resetClientFailedLogin();
      user.lastLoginAt = new Date().toISOString();
      saveVaultUsers(vaultUsers);

      const sessionToken = `sess-${Date.now()}-${generateCryptographicSalt()}`;
      const safeUser: AdminUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: true,
      };

      const session: ActiveSession = {
        id: sessionToken,
        userId: safeUser.id,
        userName: safeUser.name,
        userEmail: safeUser.email,
        role: safeUser.role,
        device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        ip: '127.0.0.1 (Local Session)',
        signedInAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      };

      const sessions = getVaultSessions();
      sessions.push(session);
      saveVaultSessions(sessions);

      this.setToken(sessionToken, remember);
      this.setStoredUser(safeUser, remember);

      appendVaultLog({
        userId: safeUser.id,
        userName: safeUser.name,
        userEmail: safeUser.email,
        userRole: safeUser.role,
        action: 'ADMIN_LOGIN_SUCCESS',
        category: 'auth',
        target: safeUser.email,
        details: `${safeUser.name} signed in successfully.`,
      });

      return {
        success: true,
        token: sessionToken,
        user: safeUser,
      };
    } catch (err: any) {
      return { success: false, error: `Authentication error: ${err.message}` };
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    const storedUser = this.getStoredUser();

    if (token) {
      safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      // Invalidate client session
      const sessions = getVaultSessions().filter((s) => s.id !== token);
      saveVaultSessions(sessions);

      if (storedUser) {
        appendVaultLog({
          userId: storedUser.id,
          userName: storedUser.name,
          userEmail: storedUser.email,
          userRole: storedUser.role,
          action: 'ADMIN_LOGOUT',
          category: 'auth',
          target: storedUser.email,
          details: `${storedUser.name} logged out.`,
        });
      }
    }
    this.clearToken();
  },

  async logoutOtherDevices(): Promise<{ success: boolean; revokedCount?: number; error?: string }> {
    const token = this.getToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const res = await safeFetchJson<{ success: boolean; revokedCount?: number; error?: string }>(
      '/api/auth/logout-other-devices',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok && res.data) {
      return res.data;
    }

    const sessions = getVaultSessions();
    const current = sessions.find((s) => s.id === token);
    const remaining = current ? [current] : [];
    const revokedCount = Math.max(0, sessions.length - remaining.length);
    saveVaultSessions(remaining);

    return { success: true, revokedCount };
  },

  async getActiveSessions(): Promise<ActiveSession[]> {
    const token = this.getToken();
    if (!token) return [];

    const res = await safeFetchJson<{ sessions: ActiveSession[] }>('/api/auth/active-sessions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok && res.data?.sessions) {
      return res.data.sessions.map((s) => ({ ...s, isCurrent: s.id === token }));
    }

    return getVaultSessions().map((s) => ({ ...s, isCurrent: s.id === token }));
  },

  async revokeSession(sessionId: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    const res = await safeFetchJson(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) return true;

    const sessions = getVaultSessions().filter((s) => s.id !== sessionId);
    saveVaultSessions(sessions);
    return true;
  },

  async recoverPassword(
    email: string,
    recoveryKey: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try backend
    const res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(
      '/api/auth/recover',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, recoveryKey: recoveryKey.trim(), newPassword }),
      }
    );

    if (res.ok && res.data) {
      return res.data;
    }

    // 2. Client fallback
    try {
      const users = getVaultUsers();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return { success: false, error: 'No account found with this email address.' };
      }

      const cleanKey = recoveryKey.trim().toUpperCase();
      const keyHash = await hashPasswordWebCrypto(cleanKey, user.salt);
      if (user.recoveryKeyHash && user.recoveryKeyHash !== keyHash) {
        return { success: false, error: 'Invalid recovery key.' };
      }

      user.passwordHash = await hashPasswordWebCrypto(newPassword, user.salt);
      saveVaultUsers(users);

      appendVaultLog({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_RECOVERED',
        category: 'auth',
        target: user.email,
        details: `Password recovered using master recovery key for ${user.email}.`,
      });

      return { success: true, message: 'Password has been reset successfully. Please log in.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getUsers(): Promise<AdminUser[]> {
    const token = this.getToken();
    if (!token) return [];

    const res = await safeFetchJson<{ users: AdminUser[] }>('/api/auth/users', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok && res.data?.users) {
      return res.data.users;
    }

    return getVaultUsers().map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      permissions: u.permissions,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      isActive: u.isActive,
    }));
  },

  async createUser(user: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    permissions: string[];
  }): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const token = this.getToken();

    const res = await safeFetchJson<{ success: boolean; user?: AdminUser; error?: string }>(
      '/api/auth/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      }
    );

    if (res.ok && res.data) {
      return res.data;
    }

    try {
      const users = getVaultUsers();
      if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
        return { success: false, error: 'A user with this email address already exists.' };
      }

      const salt = generateCryptographicSalt();
      const passwordHash = await hashPasswordWebCrypto(user.password, salt);
      const newUser: StoredVaultUser = {
        id: `usr-${Date.now()}`,
        email: user.email.trim().toLowerCase(),
        name: user.name.trim(),
        passwordHash,
        salt,
        role: user.role,
        permissions: user.permissions,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      users.push(newUser);
      saveVaultUsers(users);

      const safeUser: AdminUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
        isActive: true,
      };

      const storedUser = this.getStoredUser();
      if (storedUser) {
        appendVaultLog({
          userId: storedUser.id,
          userName: storedUser.name,
          userEmail: storedUser.email,
          userRole: storedUser.role,
          action: 'USER_CREATED',
          category: 'users',
          target: safeUser.email,
          details: `${storedUser.name} created user ${safeUser.name} with role ${safeUser.role}.`,
        });
      }

      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async updateUser(id: string, updates: Partial<AdminUser> & { password?: string }): Promise<boolean> {
    const token = this.getToken();

    const res = await safeFetchJson(`/api/auth/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (res.ok) return true;

    try {
      const users = getVaultUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return false;

      if (updates.name) users[idx].name = updates.name;
      if (updates.role) users[idx].role = updates.role;
      if (updates.permissions) users[idx].permissions = updates.permissions;
      if (updates.isActive !== undefined) users[idx].isActive = updates.isActive;
      if (updates.password) {
        users[idx].passwordHash = await hashPasswordWebCrypto(updates.password, users[idx].salt);
      }

      saveVaultUsers(users);
      return true;
    } catch {
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    const token = this.getToken();

    const res = await safeFetchJson(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) return true;

    const users = getVaultUsers().filter((u) => u.id !== id);
    saveVaultUsers(users);
    return true;
  },

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    action?: string;
  } = {}): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const token = this.getToken();
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.action) query.set('action', params.action);

    const res = await safeFetchJson<{
      logs: AuditLog[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/audit-logs?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok && res.data) {
      return res.data;
    }

    // Client fallback filter & paginate
    let logs = getVaultLogs();
    if (params.category && params.category !== 'all') {
      logs = logs.filter((l) => l.category === params.category);
    }
    if (params.action && params.action !== 'all') {
      logs = logs.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 15;
    const total = logs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = logs.slice(start, start + limit);

    return { logs: paginated, total, page, totalPages };
  },

  async exportAuditLogsCsv(): Promise<void> {
    const token = this.getToken();
    try {
      const res = await fetch('/api/audit-logs/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok && (res.headers.get('content-type') || '').includes('csv')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plush-comfort-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    } catch {}

    // Fallback: build CSV from client vault logs
    const logs = getVaultLogs();
    const rows = [
      ['Timestamp', 'User Name', 'User Email', 'Role', 'Action', 'Category', 'Target', 'Details'],
      ...logs.map((l) => [
        l.timestamp,
        `"${(l.userName || '').replace(/"/g, '""')}"`,
        l.userEmail,
        l.userRole,
        l.action,
        l.category,
        `"${(l.target || '').replace(/"/g, '""')}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plush-comfort-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  async logAudit(
    action: string,
    category: any,
    target: string,
    details: string,
    beforeAfter?: Record<string, { before: any; after: any }>
  ): Promise<void> {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token) {
      safeFetchJson('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, category, target, details, beforeAfter }),
      }).catch(() => {});
    }

    if (user) {
      appendVaultLog({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action,
        category,
        target,
        details,
        beforeAfter,
      });
    }
  },

  async uploadImage(
    base64Data: string,
    filename: string,
    alt?: string
  ): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    const token = this.getToken();

    const res = await safeFetchJson<{ success: boolean; url?: string; filename?: string; error?: string }>(
      '/api/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: base64Data, filename, alt }),
      }
    );

    if (res.ok && res.data) {
      return res.data;
    }

    // Client fallback: Return base64 URL directly so image is usable immediately
    return {
      success: true,
      url: base64Data,
      filename,
    };
  },
};
