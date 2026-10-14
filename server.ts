import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  generateSeoDataForRoute,
  injectSeoIntoHtml,
  generateXmlSitemap,
  generateRobotsTxt,
  runSeoAudit,
  autoFixMissingSeo,
} from './src/utils/seoEngine';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BLOG_POSTS,
  INITIAL_SETTINGS,
} from './src/data/initialData';
import { Product, Category, BlogPost, StoreSettings } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers with large limit for image upload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory - safely resolve for local and Vercel/serverless environments
const DATA_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'plush_comfort_data')
  : path.resolve(__dirname, 'data');
const UPLOADS_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'plush_comfort_uploads')
  : path.resolve(__dirname, 'public', 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (dirErr) {
  console.warn('Directory creation warning:', dirErr);
}

// Data file paths
const USERS_FILE = path.join(DATA_DIR, 'admin_users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'active_sessions.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const STORE_DESIGN_FILE = path.join(DATA_DIR, 'store_design.json');
const STORE_PRODUCTS_FILE = path.join(DATA_DIR, 'store_products.json');
const STORE_CATEGORIES_FILE = path.join(DATA_DIR, 'store_categories.json');

// Helper to read/write JSON safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Types
interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  recoveryKeyHash?: string;
  role: 'master_admin' | 'admin' | 'editor' | 'marketer';
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface StoredSession {
  id: string;
  token: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'master_admin' | 'admin' | 'editor' | 'marketer';
  permissions: string[];
  device: string;
  ip: string;
  signedInAt: string;
  lastActiveAt: string;
}

interface StoredAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  category: string;
  target: string;
  details: string;
  beforeAfter?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
}

// Password cryptography
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateRecoveryKey(): string {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `PC-RECOV-${parts.join('-')}`;
}

// Rate limiting state (in-memory with IP key)
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): { allowed: boolean; message?: string; waitMinutes?: number } {
  const record = loginRateLimits.get(ip);
  const now = Date.now();
  if (record && record.lockedUntil && record.lockedUntil > now) {
    const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Account temporarily locked due to repeated failed login attempts. Please try again in ${waitMinutes} minute(s).`,
      waitMinutes,
    };
  }
  return { allowed: true };
}

function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginRateLimits.get(ip) || { attempts: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
  }
  loginRateLimits.set(ip, record);
}

function resetFailedLogin(ip: string): void {
  loginRateLimits.delete(ip);
}

// Audit Log Helper
function recordAuditLog(log: Omit<StoredAuditLog, 'id' | 'timestamp'>): void {
  const logs = readJsonFile<StoredAuditLog[]>(AUDIT_LOGS_FILE, []);
  const newLog: StoredAuditLog = {
    ...log,
    id: `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog); // Prepend so most recent comes first
  // Keep up to 2000 logs
  if (logs.length > 2000) {
    logs.length = 2000;
  }
  writeJsonFile(AUDIT_LOGS_FILE, logs);
}

// Session Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: StoredSession;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const sessionIndex = sessions.findIndex((s) => s.token === token);

  if (sessionIndex === -1) {
    return res.status(401).json({ error: 'Session expired or invalidated. Please log in again.' });
  }

  // Update last active
  sessions[sessionIndex].lastActiveAt = new Date().toISOString();
  writeJsonFile(SESSIONS_FILE, sessions);

  req.user = sessions[sessionIndex];
  next();
}

function requireRole(allowedRoles: Array<'master_admin' | 'admin' | 'editor' | 'marketer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role === 'master_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions for this operation.' });
  };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Auth Status & Initialization Check
app.get('/api/auth/status', (req: Request, res: Response) => {
  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const masterAdmin = users.find((u) => u.role === 'master_admin');
  const isInitialized = !!masterAdmin;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let currentSession: StoredSession | undefined;
  if (token) {
    const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
    currentSession = sessions.find((s) => s.token === token);
  }

  res.json({
    initialized: isInitialized,
    authenticated: !!currentSession,
    user: currentSession
      ? {
          id: currentSession.userId,
          name: currentSession.userName,
          email: currentSession.userEmail,
          role: currentSession.role,
          permissions: currentSession.permissions,
        }
      : null,
  });
});

// 2. One-Time Master Admin Initialization
app.post('/api/auth/init-master', (req: Request, res: Response) => {
  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const existingMaster = users.find((u) => u.role === 'master_admin');

  if (existingMaster) {
    return res.status(403).json({
      error: 'Master Admin has already been initialized. Setup is permanently locked.',
    });
  }

  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Full name, email, and strong password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const recoveryKey = generateRecoveryKey();
  const recoveryKeyHash = hashPassword(recoveryKey, salt);

  const masterUser: StoredUser = {
    id: `usr-master-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    salt,
    recoveryKeyHash,
    role: 'master_admin',
    permissions: ['all'],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  };

  users.push(masterUser);
  writeJsonFile(USERS_FILE, users);

  // Create initial active session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  const session: StoredSession = {
    id: `sess-${Date.now()}`,
    token: sessionToken,
    userId: masterUser.id,
    userName: masterUser.name,
    userEmail: masterUser.email,
    role: masterUser.role,
    permissions: masterUser.permissions,
    device: userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
    ip,
    signedInAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  sessions.push(session);
  writeJsonFile(SESSIONS_FILE, sessions);

  // Record audit log
  recordAuditLog({
    userId: masterUser.id,
    userName: masterUser.name,
    userEmail: masterUser.email,
    userRole: 'master_admin',
    action: 'MASTER_INITIALIZED',
    category: 'auth',
    target: 'System Security',
    details: `Master Admin initialized successfully for ${masterUser.email}. Recovery key generated.`,
    ipAddress: ip,
    userAgent,
  });

  res.json({
    success: true,
    message: 'Master Admin initialized successfully.',
    recoveryKey, // Return to show user ONCE to copy/save
    token: sessionToken,
    user: {
      id: masterUser.id,
      name: masterUser.name,
      email: masterUser.email,
      role: masterUser.role,
      permissions: masterUser.permissions,
    },
  });
});

// 3. Login with Rate Limiting & Verification
app.post('/api/auth/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: rateCheck.message, waitMinutes: rateCheck.waitMinutes });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !user.isActive) {
    recordFailedLogin(ip);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    recordFailedLogin(ip);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Login successful - reset rate limiter
  resetFailedLogin(ip);

  // Update user lastLogin
  user.lastLoginAt = new Date().toISOString();
  writeJsonFile(USERS_FILE, users);

  // Create session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const session: StoredSession = {
    id: `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    token: sessionToken,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    permissions: user.permissions,
    device: userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
    ip,
    signedInAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  sessions.push(session);
  writeJsonFile(SESSIONS_FILE, sessions);

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGIN',
    category: 'auth',
    target: 'Admin Session',
    details: `${user.name} (${user.role}) logged in successfully.`,
    ipAddress: ip,
    userAgent,
  });

  res.json({
    success: true,
    token: sessionToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  });
});

// 4. Logout (Current Session)
app.post('/api/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentToken = req.headers['authorization']?.split(' ')[1];
  const user = req.user!;

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const remaining = sessions.filter((s) => s.token !== currentToken);
  writeJsonFile(SESSIONS_FILE, remaining);

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action: 'LOGOUT',
    category: 'auth',
    target: 'Admin Session',
    details: `${user.userName} logged out of current session.`,
    ipAddress: user.ip,
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

// 5. Log Out Other Devices
app.post('/api/auth/logout-other-devices', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentToken = req.headers['authorization']?.split(' ')[1];
  const user = req.user!;

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const remaining = sessions.filter(
    (s) => s.userId !== user.userId || s.token === currentToken
  );
  const countRemoved = sessions.length - remaining.length;
  writeJsonFile(SESSIONS_FILE, remaining);

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action: 'LOGOUT_OTHER_DEVICES',
    category: 'auth',
    target: 'Active Sessions',
    details: `${user.userName} terminated ${countRemoved} other active device session(s).`,
    ipAddress: user.ip,
  });

  res.json({
    success: true,
    message: `Successfully logged out ${countRemoved} other device(s).`,
    revokedCount: countRemoved,
  });
});

// 6. Active Sessions List
app.get('/api/auth/active-sessions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const currentToken = req.headers['authorization']?.split(' ')[1];
  const user = req.user!;

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const userSessions = sessions
    .filter((s) => s.userId === user.userId)
    .map((s) => ({
      id: s.id,
      device: s.device,
      ip: s.ip,
      signedInAt: s.signedInAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.token === currentToken,
    }));

  res.json({ sessions: userSessions });
});

// 7. Revoke Specific Session
app.delete('/api/auth/sessions/:sessionId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetId = req.params.sessionId;

  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const remaining = sessions.filter((s) => s.id !== targetId || s.userId !== user.userId);
  writeJsonFile(SESSIONS_FILE, remaining);

  res.json({ success: true, message: 'Session revoked.' });
});

// 8. Protected Account Recovery (via Master Recovery Key)
app.post('/api/auth/recover', (req: Request, res: Response) => {
  const { email, recoveryKey, newPassword } = req.body;

  if (!email || !recoveryKey || !newPassword) {
    return res.status(400).json({ error: 'Email, recovery key, and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || user.role !== 'master_admin') {
    return res.status(403).json({ error: 'Invalid recovery details or user not eligible.' });
  }

  const computedKeyHash = hashPassword(recoveryKey.trim(), user.salt);
  if (computedKeyHash !== user.recoveryKeyHash) {
    return res.status(403).json({ error: 'Invalid recovery key.' });
  }

  // Update password and generate new salt
  const newSalt = generateSalt();
  user.salt = newSalt;
  user.passwordHash = hashPassword(newPassword, newSalt);
  // Re-hash recovery key with new salt
  user.recoveryKeyHash = hashPassword(recoveryKey.trim(), newSalt);
  writeJsonFile(USERS_FILE, users);

  // Invalidate all sessions for security
  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const remainingSessions = sessions.filter((s) => s.userId !== user.id);
  writeJsonFile(SESSIONS_FILE, remainingSessions);

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'PASSWORD_RECOVERED',
    category: 'auth',
    target: 'Master Admin Account',
    details: `Master Admin password reset using valid recovery key. All active sessions invalidated.`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'Master Admin password reset successfully. Please log in with your new password.',
  });
});

// 9. Users Management (Master Admin ONLY)
app.get('/api/auth/users', authenticateToken, requireRole(['master_admin']), (req: AuthenticatedRequest, res: Response) => {
  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  // Return users without password hashes or salts
  const sanitized = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    permissions: u.permissions,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    isActive: u.isActive,
  }));
  res.json({ users: sanitized });
});

app.post('/api/auth/users', authenticateToken, requireRole(['master_admin']), (req: AuthenticatedRequest, res: Response) => {
  const { email, name, password, role, permissions } = req.body;
  const master = req.user!;

  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Email, name, password, and role are required.' });
  }

  if (!['admin', 'editor', 'marketer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin, editor, or marketer.' });
  }

  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    salt,
    role,
    permissions: Array.isArray(permissions) ? permissions : [role],
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  recordAuditLog({
    userId: master.userId,
    userName: master.userName,
    userEmail: master.userEmail,
    userRole: master.role,
    action: 'USER_CREATED',
    category: 'users',
    target: `User: ${newUser.email}`,
    details: `Master Admin created user ${newUser.name} with role ${newUser.role}.`,
    ipAddress: master.ip,
  });

  res.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      permissions: newUser.permissions,
      createdAt: newUser.createdAt,
      isActive: newUser.isActive,
    },
  });
});

app.put('/api/auth/users/:id', authenticateToken, requireRole(['master_admin']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const { name, role, permissions, isActive, password } = req.body;
  const master = req.user!;

  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const index = users.findIndex((u) => u.id === targetId);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const targetUser = users[index];
  if (targetUser.role === 'master_admin' && master.userId !== targetUser.id) {
    return res.status(403).json({ error: 'Cannot modify Master Admin account.' });
  }

  const beforeRole = targetUser.role;
  if (name) targetUser.name = name.trim();
  if (role && targetUser.role !== 'master_admin') targetUser.role = role;
  if (permissions) targetUser.permissions = permissions;
  if (typeof isActive === 'boolean' && targetUser.role !== 'master_admin') targetUser.isActive = isActive;
  if (password && password.length >= 8) {
    targetUser.salt = generateSalt();
    targetUser.passwordHash = hashPassword(password, targetUser.salt);
  }

  writeJsonFile(USERS_FILE, users);

  recordAuditLog({
    userId: master.userId,
    userName: master.userName,
    userEmail: master.userEmail,
    userRole: master.role,
    action: 'USER_UPDATED',
    category: 'users',
    target: `User: ${targetUser.email}`,
    details: `Master Admin updated user ${targetUser.name} (${beforeRole} -> ${targetUser.role}).`,
    ipAddress: master.ip,
  });

  res.json({ success: true, message: 'User updated successfully.' });
});

app.delete('/api/auth/users/:id', authenticateToken, requireRole(['master_admin']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const master = req.user!;

  const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
  const userToDelete = users.find((u) => u.id === targetId);

  if (!userToDelete) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (userToDelete.role === 'master_admin') {
    return res.status(403).json({ error: 'Cannot delete the Master Admin account.' });
  }

  const remainingUsers = users.filter((u) => u.id !== targetId);
  writeJsonFile(USERS_FILE, remainingUsers);

  // Invalidate any active sessions for this user
  const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
  const remainingSessions = sessions.filter((s) => s.userId !== targetId);
  writeJsonFile(SESSIONS_FILE, remainingSessions);

  recordAuditLog({
    userId: master.userId,
    userName: master.userName,
    userEmail: master.userEmail,
    userRole: master.role,
    action: 'USER_DELETED',
    category: 'users',
    target: `User: ${userToDelete.email}`,
    details: `Master Admin deleted user ${userToDelete.name} (${userToDelete.role}).`,
    ipAddress: master.ip,
  });

  res.json({ success: true, message: 'User deleted successfully.' });
});

// 10. Audit Logs API
app.get('/api/audit-logs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const logs = readJsonFile<StoredAuditLog[]>(AUDIT_LOGS_FILE, []);
  const { page = '1', limit = '20', search, category, action } = req.query;

  let filtered = [...logs];

  if (category && category !== 'all') {
    filtered = filtered.filter((l) => l.category === category);
  }

  if (action && action !== 'all') {
    filtered = filtered.filter((l) => l.action === action);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.target.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const total = filtered.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(startIndex, startIndex + limitNum);

  res.json({
    logs: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

app.get('/api/audit-logs/export', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const logs = readJsonFile<StoredAuditLog[]>(AUDIT_LOGS_FILE, []);

  // Format as clean CSV
  const header = ['Timestamp', 'User', 'Email', 'Role', 'Category', 'Action', 'Target', 'Details', 'IP Address'];
  const rows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${(l.userName || '').replace(/"/g, '""')}"`,
    `"${(l.userEmail || '').replace(/"/g, '""')}"`,
    `"${l.userRole || ''}"`,
    `"${l.category || ''}"`,
    `"${l.action || ''}"`,
    `"${(l.target || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
    `"${l.ipAddress || ''}"`,
  ]);

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="plush-comfort-audit-logs-${Date.now()}.csv"`);
  res.send(csv);
});

app.post('/api/audit-logs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { action, category, target, details, beforeAfter } = req.body;

  if (!action || !category || !target || !details) {
    return res.status(400).json({ error: 'Action, category, target, and details are required.' });
  }

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action,
    category,
    target,
    details,
    beforeAfter,
    ipAddress: user.ip,
  });

  res.json({ success: true });
});

// 11. Image / Media Upload API
app.post('/api/upload', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { data, filename, alt } = req.body;

  if (!data || !filename) {
    return res.status(400).json({ error: 'Base64 image data and filename are required.' });
  }

  // Validate base64 format
  const matches = data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: 'Invalid base64 image data format.' });
  }

  const ext = matches[1].replace('jpeg', 'jpg');
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Sanitize filename
  const cleanName = filename
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  const finalFilename = `${cleanName}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, finalFilename);

  fs.writeFileSync(filePath, buffer);

  const publicUrl = `/uploads/${finalFilename}`;

  recordAuditLog({
    userId: req.user!.userId,
    userName: req.user!.userName,
    userEmail: req.user!.userEmail,
    userRole: req.user!.role,
    action: 'IMAGE_UPLOAD',
    category: 'design',
    target: finalFilename,
    details: `Uploaded image ${finalFilename} (${Math.round(buffer.length / 1024)} KB) with alt: "${alt || 'None'}"`,
    ipAddress: req.user!.ip,
  });

  res.json({
    success: true,
    url: publicUrl,
    filename: finalFilename,
    size: buffer.length,
    alt: alt || '',
  });
});

// 12. Persistent Store Design API
app.get('/api/store/design', (req: Request, res: Response) => {
  const design = readJsonFile(STORE_DESIGN_FILE, null);
  res.json({ design });
});

app.put('/api/store/design', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const newDesign = req.body;

  const prevDesign = readJsonFile(STORE_DESIGN_FILE, null);
  writeJsonFile(STORE_DESIGN_FILE, newDesign);

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action: 'STORE_DESIGN_UPDATED',
    category: 'design',
    target: 'Store Design Studio',
    details: `${user.userName} updated store design configurations (Hero, MegaMenu, Footer, or Global Settings).`,
    beforeAfter: { design: { before: prevDesign ? 'Previous Settings' : 'Defaults', after: 'New Settings' } },
    ipAddress: user.ip,
  });

  res.json({ success: true, message: 'Store design updated and persisted.' });
});

// 13. Persistent Store Products API
app.get('/api/store/products', (req: Request, res: Response) => {
  const products = readJsonFile(STORE_PRODUCTS_FILE, null);
  res.json({ products });
});

app.post('/api/store/products', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { products, changeSummary } = req.body;

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Products array required.' });
  }

  writeJsonFile(STORE_PRODUCTS_FILE, products);

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action: 'PRODUCTS_SYNCED',
    category: 'products',
    target: `Catalogue (${products.length} products)`,
    details: changeSummary || `${user.userName} saved changes to store product catalogue.`,
    ipAddress: user.ip,
  });

  res.json({ success: true, message: 'Products persisted.' });
});

// 14. Persistent Store Categories API
app.get('/api/store/categories', (req: Request, res: Response) => {
  const categories = readJsonFile(STORE_CATEGORIES_FILE, null);
  res.json({ categories });
});

app.post('/api/store/categories', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { categories, changeSummary } = req.body;

  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'Categories array required.' });
  }

  writeJsonFile(STORE_CATEGORIES_FILE, categories);

  recordAuditLog({
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.role,
    action: 'CATEGORIES_SYNCED',
    category: 'categories',
    target: `Categories (${categories.length} categories)`,
    details: changeSummary || `${user.userName} updated product category configuration.`,
    ipAddress: user.ip,
  });

  res.json({ success: true, message: 'Categories persisted.' });
});

// ==========================================
// STORE DATA RESOLUTION HELPERS FOR SEO
// ==========================================
function getCurrentProducts(): Product[] {
  const fileProducts = readJsonFile<Product[] | null>(STORE_PRODUCTS_FILE, null);
  if (Array.isArray(fileProducts) && fileProducts.length > 0) {
    return fileProducts;
  }
  return INITIAL_PRODUCTS;
}

function getCurrentCategories(): Category[] {
  const fileCategories = readJsonFile<Category[] | null>(STORE_CATEGORIES_FILE, null);
  if (Array.isArray(fileCategories) && fileCategories.length > 0) {
    return fileCategories;
  }
  return INITIAL_CATEGORIES;
}

function getCurrentBlogPosts(): BlogPost[] {
  return INITIAL_BLOG_POSTS;
}

function getCurrentSettings(): StoreSettings {
  const fileDesign = readJsonFile<Partial<StoreSettings> | null>(STORE_DESIGN_FILE, null);
  return {
    ...INITIAL_SETTINGS,
    ...(fileDesign || {}),
  };
}

// ==========================================
// 15. SEO, SITEMAP & ROBOTS.TXT ENDPOINTS
// ==========================================

// Standard XML Sitemap Endpoint
app.get('/sitemap.xml', (req: Request, res: Response) => {
  try {
    const products = getCurrentProducts();
    const categories = getCurrentCategories();
    const blogPosts = getCurrentBlogPosts();
    const xml = generateXmlSitemap(products, categories, blogPosts, 'https://plushcomfort.uk');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap.xml:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Standard Robots.txt Endpoint
app.get('/robots.txt', (req: Request, res: Response) => {
  try {
    const txt = generateRobotsTxt('https://plushcomfort.uk');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(txt);
  } catch (err: any) {
    console.error('Error generating robots.txt:', err);
    res.status(500).send('User-agent: *\nAllow: /\n');
  }
});

// SEO Health Audit Report API
app.get('/api/seo/audit', (req: Request, res: Response) => {
  try {
    const products = getCurrentProducts();
    const categories = getCurrentCategories();
    const blogPosts = getCurrentBlogPosts();
    const audit = runSeoAudit(products, categories, blogPosts);
    res.json({ success: true, audit });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to run SEO audit' });
  }
});

// Auto-Fix Missing SEO Fields (Master Admin / Marketer / Editor)
app.post('/api/seo/auto-fix', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const products = getCurrentProducts();
    const categories = getCurrentCategories();

    const { updatedProducts, updatedCategories, fixCount } = autoFixMissingSeo(products, categories);

    writeJsonFile(STORE_PRODUCTS_FILE, updatedProducts);
    writeJsonFile(STORE_CATEGORIES_FILE, updatedCategories);

    recordAuditLog({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.role,
      action: 'SEO_METADATA_AUTO_FIXED',
      category: 'settings',
      target: `Storewide SEO (${fixCount} fields)`,
      details: `${user.userName} generated smart, high-converting SEO titles, descriptions, and alt tags for ${fixCount} missing catalogue fields.`,
      ipAddress: user.ip,
    });

    res.json({
      success: true,
      fixCount,
      message: `Successfully generated and applied SEO optimizations for ${fixCount} items across the catalogue.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to auto-fix SEO fields' });
  }
});

// ==========================================
// STATIC ASSETS, VITE & SERVER-SIDE SEO HTML DELIVERY
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  let vite: any = null;
  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    // Mount Vite asset middlewares (js, css, hmr, etc.)
    app.use(vite.middlewares);
  } else {
    // Serve production static assets from dist
    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));
  }

  // Fallback route handler that intercepts all navigation requests and delivers
  // fully server-rendered SEO titles, descriptions, canonicals, schema & semantic HTML
  app.get('*', async (req: Request, res: Response, next: NextFunction) => {
    // Skip static assets and API requests
    const url = req.originalUrl;
    if (url.startsWith('/api/') || url.startsWith('/@') || url.includes('.')) {
      return next();
    }

    try {
      const products = getCurrentProducts();
      const categories = getCurrentCategories();
      const blogPosts = getCurrentBlogPosts();
      const settings = getCurrentSettings();

      // Resolve SEO metadata, canonical, schema, and semantic SSR HTML for the requested route
      const seoData = generateSeoDataForRoute(req.path, products, categories, blogPosts, settings);

      let template = '';
      if (!isProduction && vite) {
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, rawTemplate);
      } else {
        const distIndex = path.resolve(__dirname, 'dist', 'index.html');
        if (fs.existsSync(distIndex)) {
          template = fs.readFileSync(distIndex, 'utf-8');
        } else {
          template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        }
      }

      // Inject accurate title, meta description, canonical, robots directive, OpenGraph, JSON-LD schema, and semantic content
      const renderedHtml = injectSeoIntoHtml(template, seoData, settings);

      // Return with correct HTTP status code (200 for valid page, 404 for missing piece)
      res.status(seoData.statusCode).setHeader('Content-Type', 'text/html; charset=utf-8').send(renderedHtml);
    } catch (err: any) {
      console.error('Error rendering SEO HTML for route:', url, err);
      if (vite) {
        vite.ssrFixStacktrace(err);
      }
      res.status(500).send('Server Error rendering page');
    }
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Plush Comfort] Server running with SEO Engine on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server if not running as a serverless function
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { app, startServer };
export default app;
