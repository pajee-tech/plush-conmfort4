import React, { useState, useEffect } from 'react';
import { AdminUser, ActiveSession, UserRole } from '../../types';
import { adminAuthService } from '../../services/adminAuthService';
import {
  UserPlus,
  Shield,
  Laptop,
  Smartphone,
  LogOut,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  KeyRound,
  Lock,
} from 'lucide-react';

export const UsersRolesManager: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('editor');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, sList] = await Promise.all([
        adminAuthService.getUsers(),
        adminAuthService.getActiveSessions(),
      ]);
      setUsers(uList);
      setSessions(sList);
    } catch (err) {
      console.error('Failed to load users & sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;

    const res = await adminAuthService.createUser({
      email: newEmail,
      name: newName,
      password: newPassword,
      role: newRole,
      permissions: [newRole],
    });

    if (res.success) {
      showNotice(`Successfully created user ${newName} (${newRole}).`);
      setIsCreateModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      loadData();
    } else {
      alert(res.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) return;

    const success = await adminAuthService.deleteUser(id);
    if (success) {
      showNotice(`Deleted user ${name}.`);
      loadData();
    } else {
      alert('Failed to delete user.');
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!confirm('Log out of all other devices and browser tabs?')) return;

    const res = await adminAuthService.logoutOtherDevices();
    if (res.success) {
      showNotice(res.revokedCount ? `Successfully logged out ${res.revokedCount} other device(s).` : 'Logged out other devices successfully.');
      loadData();
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const success = await adminAuthService.revokeSession(sessionId);
    if (success) {
      showNotice('Device session revoked.');
      loadData();
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'master_admin':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">Master Admin</span>;
      case 'admin':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">Administrator</span>;
      case 'editor':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">Editor (Products/Content)</span>;
      case 'marketer':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">Marketer (SEO/Design)</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] space-y-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A25828]">
                RBAC Access Control
              </span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Master Admin Portal
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#221C18] mt-1">
              User Accounts &amp; Permissions
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Create Admin, Editor, and Marketer staff accounts. Manage active login sessions and enforce backend permissions.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#A25828] hover:bg-[#8A461A] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Staff User</span>
          </button>
        </div>

        {notification && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role &amp; Permissions</th>
                  <th className="py-3 px-4">Account Created</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-900 block">{u.name}</span>
                      <span className="text-[11px] text-stone-400 font-mono">{u.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'master_admin' ? (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-semibold italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Active Sessions Management */}
        <div className="pt-6 border-t border-stone-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-serif font-bold text-base text-[#221C18]">Active Device Sessions</h4>
              <p className="text-[11px] text-stone-500">
                Review authenticated browser sessions. Invalidate stale or untrusted sessions to maintain security.
              </p>
            </div>
            <button
              onClick={handleLogoutOtherDevices}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out Other Devices</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  s.isCurrent ? 'border-[#A25828] bg-[#FAF2EB]/40' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                    {s.device.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-xs">{s.device}</span>
                      {s.isCurrent && (
                        <span className="bg-[#A25828] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Current Device
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono block">IP: {s.ip}</span>
                    <span className="text-[10px] text-stone-400 block">
                      Signed in: {new Date(s.signedInAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-2 py-1"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-lg text-[#221C18]">Create Staff User</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@plushcomfort.uk"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Initial Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Staff Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-semibold"
                >
                  <option value="admin">Administrator (Catalogue, Orders, Content, Settings)</option>
                  <option value="editor">Editor (Products, Categories, and Buying Guides)</option>
                  <option value="marketer">Marketer (SEO, Mega Menu, and Design)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-stone-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#A25828] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#8A461A]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
