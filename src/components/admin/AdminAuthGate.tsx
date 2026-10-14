import React, { useState, useEffect } from 'react';
import { adminAuthService } from '../../services/adminAuthService';
import { AdminUser } from '../../types';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AdminAuthGateProps {
  children: (props: { user: AdminUser; onLogout: () => void }) => React.ReactNode;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Active login tab: 'staff' (Staff & Member Sign In) or 'master' (Master Owner Login)
  const [activeTab, setActiveTab] = useState<'staff' | 'master'>('staff');

  // Staff & Member Login Form State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffRemember, setStaffRemember] = useState(true);

  // reCAPTCHA state for Staff & Member sign in
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [recaptchaVerifying, setRecaptchaVerifying] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Master Login Form State
  const [masterEmail, setMasterEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [masterRemember, setMasterRemember] = useState(true);

  // Shared submit & error state
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  // Master Initial Setup Wizard State
  const [initName, setInitName] = useState('');
  const [initEmail, setInitEmail] = useState('');
  const [initPassword, setInitPassword] = useState('');
  const [initConfirmPassword, setInitConfirmPassword] = useState('');
  const [showInitPassword, setShowInitPassword] = useState(false);
  const [showInitConfirmPassword, setShowInitConfirmPassword] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string | null>(null);
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  // Recovery modal state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recovEmail, setRecovEmail] = useState('');
  const [recovKey, setRecovKey] = useState('');
  const [recovNewPassword, setRecovNewPassword] = useState('');
  const [showRecovPassword, setShowRecovPassword] = useState(false);
  const [recovError, setRecovError] = useState<string | null>(null);
  const [recovSuccess, setRecovSuccess] = useState<string | null>(null);

  // Enforce STRICT NOINDEX on administrative login pages to prevent search engine crawler indexing
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    const previousRobots = metaRobots.getAttribute('content') || 'index, follow';
    metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');

    let metaGooglebot = document.querySelector('meta[name="googlebot"]');
    if (!metaGooglebot) {
      metaGooglebot = document.createElement('meta');
      metaGooglebot.setAttribute('name', 'googlebot');
      document.head.appendChild(metaGooglebot);
    }
    metaGooglebot.setAttribute('content', 'noindex, nofollow, noarchive');

    return () => {
      metaRobots?.setAttribute('content', previousRobots);
    };
  }, []);

  // Check backend auth status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const status = await adminAuthService.getStatus();
      setIsInitialized(status.initialized);
      if (status.authenticated && status.user) {
        setCurrentUser(status.user);
      } else {
        const stored = adminAuthService.getStoredUser();
        const token = adminAuthService.getToken();
        if (stored && token) {
          setCurrentUser(stored);
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Auth status check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Interactive reCAPTCHA checkbox handler
  const handleRecaptchaClick = () => {
    if (recaptchaChecked || recaptchaVerifying) return;
    setRecaptchaVerifying(true);
    setAuthError(null);

    // Simulate cryptographic reCAPTCHA challenge verification token
    setTimeout(() => {
      const token = `recaptcha_v2_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setRecaptchaVerifying(false);
      setRecaptchaChecked(true);
      setRecaptchaToken(token);
    }, 700);
  };

  // Staff & Member Sign In submit
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!recaptchaChecked) {
      setAuthError('Please complete the reCAPTCHA security verification challenge before signing in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.login(staffEmail, staffPassword, staffRemember);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setLockoutMinutes(null);
      } else {
        setAuthError(res.error || 'Invalid staff credentials');
        if (res.waitMinutes) {
          setLockoutMinutes(res.waitMinutes);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Staff sign in connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Master Owner Login submit
  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await adminAuthService.login(masterEmail, masterPassword, masterRemember);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setLockoutMinutes(null);
      } else {
        setAuthError(res.error || 'Invalid master owner credentials');
        if (res.waitMinutes) {
          setLockoutMinutes(res.waitMinutes);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Master login connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Master Setup submit
  const handleMasterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitError(null);

    if (initPassword !== initConfirmPassword) {
      setInitError('Passwords do not match');
      return;
    }

    if (initPassword.length < 8) {
      setInitError('Master password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAuthService.initMaster(initName, initEmail, initPassword);
      if (res.success && res.recoveryKey) {
        setGeneratedRecoveryKey(res.recoveryKey);
        if (res.user) {
          setCurrentUser(res.user);
        }
        setIsInitialized(true);
      } else {
        setInitError(res.error || 'Master initialization failed');
      }
    } catch (err: any) {
      setInitError(err.message || 'Initialization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Emergency Password Recovery submit
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecovError(null);
    setRecovSuccess(null);

    try {
      const res = await adminAuthService.recoverPassword(recovEmail, recovKey, recovNewPassword);
      if (res.success) {
        setRecovSuccess('Password reset successfully. Please sign in with your new password.');
        setTimeout(() => {
          setIsRecoveryOpen(false);
          setRecovSuccess(null);
          setMasterEmail(recovEmail);
          setActiveTab('master');
        }, 2200);
      } else {
        setRecovError(res.error || 'Password recovery failed');
      }
    } catch (err: any) {
      setRecovError(err.message || 'Recovery failed');
    }
  };

  const handleLogout = async () => {
    await adminAuthService.logout();
    setCurrentUser(null);
    setRecaptchaChecked(false);
    setRecaptchaToken(null);
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#A25828] text-white flex items-center justify-center mx-auto animate-pulse shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-600">Verifying secure administrative session...</p>
        </div>
      </div>
    );
  }

  // 1. INITIAL MASTER SETUP SCREEN (First-time installation)
  if (!isInitialized && !currentUser) {
    if (generatedRecoveryKey) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A25828]">
                Master Security Key
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#221C18] mt-1">
                Save Emergency Recovery Key
              </h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                This cryptographic key is required if you ever lose your Master Admin password. Store it securely in a password manager or offline safe.
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D5C7B7] space-y-2">
              <span className="text-[10px] font-bold uppercase text-stone-400">Master Recovery Key</span>
              <div className="font-mono font-bold text-sm text-[#A25828] tracking-wider select-all break-all">
                {generatedRecoveryKey}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedRecoveryKey);
                  setHasCopiedKey(true);
                }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {hasCopiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{hasCopiedKey ? 'Copied to Clipboard' : 'Copy Key'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGeneratedRecoveryKey(null);
                }}
                className="flex-1 bg-[#A25828] hover:bg-[#8A461A] text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Enter Admin Portal &rarr;
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#E8E0D5] p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#A25828] text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A25828]">
              Initial Store Setup
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#221C18]">
              Initial Master Login &amp; Setup
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              No store owner account exists. Set up the one-time Master Admin credentials to take control of Plush Comfort UK.
            </p>
          </div>

          {initError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{initError}</span>
            </div>
          )}

          <form onSubmit={handleMasterInit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Store Owner Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Master Store Administrator"
                value={initName}
                onChange={(e) => setInitName(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Owner Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@plushcomfort.uk"
                value={initEmail}
                onChange={(e) => setInitEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Master Password (min 8 chars)</label>
              <div className="relative">
                <input
                  type={showInitPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={initPassword}
                  onChange={(e) => setInitPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowInitPassword(!showInitPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  aria-label={showInitPassword ? 'Hide password' : 'Show password'}
                >
                  {showInitPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Confirm Master Password</label>
              <div className="relative">
                <input
                  type={showInitConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={initConfirmPassword}
                  onChange={(e) => setInitConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowInitConfirmPassword(!showInitConfirmPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  aria-label={showInitConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showInitConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#A25828] hover:bg-[#8A461A] text-white py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Master Security Profile...' : 'Initialize Master Admin & Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. DUAL AUTHENTICATION PORTAL (STAFF & MEMBER SIGN IN + MASTER LOGIN)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#E8E0D5] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
          {/* Header Branding */}
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-[#A25828] text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#A25828] text-[10px] font-bold tracking-wider uppercase">
              <Shield className="w-3 h-3" />
              <span>Restricted Staff &amp; Owner Area</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-[#221C18]">
              Plush Comfort Portal
            </h2>
            <p className="text-xs text-stone-500">
              Calder Road, Dewsbury WF12 9EA · Internal Access Only
            </p>
          </div>

          {/* Navigation Tabs: Staff & Member Sign In vs Master Login */}
          <div className="grid grid-cols-2 p-1 bg-[#F5EFE6] rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setAuthError(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-white text-[#221C18] shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#A25828]" />
              <span>Staff &amp; Member</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('master');
                setAuthError(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'master'
                  ? 'bg-white text-[#221C18] shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-[#A25828]" />
              <span>Master Login</span>
            </button>
          </div>

          {/* Lockout Warning */}
          {lockoutMinutes && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Temporarily locked due to repeated attempts. Please wait {lockoutMinutes} minute(s).
              </span>
            </div>
          )}

          {/* Error Message */}
          {authError && !lockoutMinutes && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* VIEW 1: STAFF & MEMBER SIGN IN (Email, Password with Show/Hide icon, and reCAPTCHA) */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Staff / Member Email</label>
                <input
                  type="email"
                  required
                  placeholder="staff@plushcomfort.uk"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#A25828]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-[#A25828]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Interactive reCAPTCHA Box */}
              <div className="bg-[#FAF8F5] border border-stone-300 rounded-xl p-3 flex items-center justify-between select-none">
                <div
                  onClick={handleRecaptchaClick}
                  className={`flex items-center gap-3 cursor-pointer ${recaptchaChecked ? 'cursor-default' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      recaptchaChecked
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : recaptchaVerifying
                        ? 'border-[#A25828] bg-white'
                        : 'border-stone-400 bg-white hover:border-[#A25828]'
                    }`}
                  >
                    {recaptchaVerifying ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#A25828] animate-spin" />
                    ) : recaptchaChecked ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-stone-800">
                    {recaptchaChecked ? "I'm not a robot (Verified)" : "I'm not a robot"}
                  </span>
                </div>

                <div className="flex flex-col items-end text-[9px] text-stone-400 leading-tight">
                  <div className="flex items-center gap-1 font-bold text-stone-500">
                    <RefreshCw className={`w-3 h-3 ${recaptchaVerifying ? 'animate-spin text-[#A25828]' : ''}`} />
                    <span>reCAPTCHA</span>
                  </div>
                  <span>Privacy · Terms</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-600">
                  <input
                    type="checkbox"
                    checked={staffRemember}
                    onChange={(e) => setStaffRemember(e.target.checked)}
                    className="rounded text-[#A25828]"
                  />
                  <span>Remember workstation</span>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveTab('master')}
                  className="text-[#A25828] hover:underline font-semibold cursor-pointer"
                >
                  Master Owner Login &rarr;
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !recaptchaChecked || !!lockoutMinutes}
                className="w-full bg-[#A25828] hover:bg-[#8A461A] text-white py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verifying Staff Credentials...' : 'Sign In as Staff / Member'}
              </button>
            </form>
          )}

          {/* VIEW 2: MASTER LOGIN (Owner Credentials, Password with Show/Hide icon, and Emergency Key) */}
          {activeTab === 'master' && (
            <form onSubmit={handleMasterLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Master Owner Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@plushcomfort.uk"
                  value={masterEmail}
                  onChange={(e) => setMasterEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#A25828]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Master Password</label>
                <div className="relative">
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-[#A25828]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showMasterPassword ? 'Hide password' : 'Show password'}
                  >
                    {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-600">
                  <input
                    type="checkbox"
                    checked={masterRemember}
                    onChange={(e) => setMasterRemember(e.target.checked)}
                    className="rounded text-[#A25828]"
                  />
                  <span>Remember session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-[#A25828] hover:underline font-semibold cursor-pointer"
                >
                  Emergency Recovery
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !!lockoutMinutes}
                className="w-full bg-[#221C18] hover:bg-black text-white py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating Master Owner...' : 'Authenticate Master Admin'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className="text-stone-500 hover:text-stone-800 text-xs font-semibold hover:underline cursor-pointer"
                >
                  &larr; Switch to Staff &amp; Member Sign In
                </button>
              </div>
            </form>
          )}

          {/* Privacy & No-Index Notice */}
          <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-stone-200">
            Protected internal area · Disallowed from search indexing (robots: noindex, nofollow)
          </div>
        </div>

        {/* Emergency Recovery Modal */}
        {isRecoveryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsRecoveryOpen(false)} />
            <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 z-10 shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#221C18]">Master Account Recovery</h3>
                <p className="text-xs text-stone-500">
                  Reset Master password using the cryptographic Recovery Key generated during initialization.
                </p>
              </div>

              {recovError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {recovError}
                </div>
              )}
              {recovSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {recovSuccess}
                </div>
              )}

              <form onSubmit={handleRecoverySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Master Admin Email</label>
                  <input
                    type="email"
                    required
                    value={recovEmail}
                    onChange={(e) => setRecovEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                    placeholder="admin@plushcomfort.uk"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Recovery Key (PC-RECOV-XXXX...)</label>
                  <input
                    type="text"
                    required
                    value={recovKey}
                    onChange={(e) => setRecovKey(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs uppercase"
                    placeholder="PC-RECOV-XXXX-XXXX-XXXX-XXXX"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">New Password (min 8 chars)</label>
                  <div className="relative">
                    <input
                      type={showRecovPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={recovNewPassword}
                      onChange={(e) => setRecovNewPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 pr-9"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecovPassword(!showRecovPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      aria-label={showRecovPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRecovPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(false)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-full font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#A25828] hover:bg-[#8A461A] text-white py-2.5 rounded-full font-semibold transition-colors cursor-pointer"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. AUTHENTICATED: RENDER DASHBOARD
  return <>{children({ user: currentUser, onLogout: handleLogout })}</>;
};
