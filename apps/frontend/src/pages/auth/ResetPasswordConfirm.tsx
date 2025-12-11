import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showSuccess, showError } from '../../lib/swal';
import { api } from '../../lib/apiClient';
import { Lock, Check, AlertCircle, Loader2 } from 'lucide-react';

function pick(paramStr: string, key: string) {
  const p = new URLSearchParams(paramStr);
  return p.get(key) || '';
}

export default function ResetPasswordConfirm() {
  const nav = useNavigate();
  const loc = useLocation();

  const [token] = useState(() => pick(loc.search, 'token'));
  const [email, setEmail] = useState('');
  type Stage = 'checking' | 'ready' | 'done' | 'error';
  const [stage, setStage] = useState<Stage>('checking');
  const [reason, setReason] = useState('');

  const [pass, setPass] = useState('');

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [pass2, setPass2] = useState('');
  const [touchedPass, setTouchedPass] = useState(false);
  const [touchedPass2, setTouchedPass2] = useState(false);
  const [loading, setLoading] = useState(false);

  // validation
  const tooShort = pass.length > 0 && pass.length < 6;
  const mismatch = pass2.length > 0 && pass !== pass2;
  const showPassErr = touchedPass && tooShort;
  const showPass2Err = touchedPass2 && mismatch;
  const canSubmit = pass.length >= 6 && pass2.length >= 6 && pass === pass2 && !!token && !loading;

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          setStage('error');
          setReason('No reset token provided');
          return;
        }

        const response = await api.post('/auth/verify-reset-token', { token });
        setEmail(response.data.email);
        setStage('ready');
      } catch (error: any) {
        console.error('[verifyResetToken]', error);
        setStage('error');
        setReason(error?.response?.data?.message || 'Invalid or expired token');
      }
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      await api.post('/auth/reset-password-confirm', {
        token,
        password: pass
      });
      showSuccess('รีเซ็ตรหัสผ่านสำเร็จ!', 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      setStage('done');
      nav('/auth/signin');
    } catch (error: any) {
      console.error('[resetPasswordConfirm]', error);
      showError('รีเซ็ตไม่สำเร็จ', error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'checking') {
    return (
      <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
        <div className="container-app">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 max-w-md mx-auto flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-slate-600 dark:text-slate-300">Verifying reset link...</span>
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'error') {
    return (
      <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
        <div className="container-app">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 max-w-md mx-auto space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Invalid or expired reset link</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Please request a new reset link.</p>
            {reason && <p className="text-xs text-slate-500 dark:text-slate-400">Reason: {reason}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'done') {
    return (
      <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
        <div className="container-app">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 max-w-md mx-auto space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              <span className="font-medium">Password has been reset successfully</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">You can now sign in with your new password.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
      <div className="container-app">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-sm">
              <Lock className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-serif font-medium text-slate-800 dark:text-white">Reset Password</h3>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            Account: <span className="font-medium text-slate-800 dark:text-white">{email}</span>
          </p>

          <form onSubmit={submit} className="space-y-4">
            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="pass">New Password</label>
              <input
                id="pass"
                className={`w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${showPassErr ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-teal-500'}`}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onBlur={() => setTouchedPass(true)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {showPassErr && (
                <p className="text-xs text-red-500 dark:text-red-400">Password must be at least 6 characters long</p>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="pass2">Confirm Password</label>
              <input
                id="pass2"
                className={`w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${showPass2Err ? 'border-red-400 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-teal-500'}`}
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                onBlur={() => setTouchedPass2(true)}
                placeholder="Retype your password"
                autoComplete="new-password"
              />
              {showPass2Err && (
                <p className="text-xs text-red-500 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            <button 
              className="w-full py-3 mt-4 font-medium text-white bg-teal-700 hover:bg-teal-600 rounded-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
              type="submit" 
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save New Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}