import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showSuccess, showError } from '../../lib/swal';
import { api } from '../../lib/apiClient';
import { Lock, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

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
  const [pass2, setPass2] = useState('');
  const [touchedPass, setTouchedPass] = useState(false);
  const [touchedPass2, setTouchedPass2] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
        <div className="card p-8 max-w-md w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#147D70] mx-auto" />
          <p className="text-sm font-bold text-[#202124]">Verifying Security Token...</p>
          <p className="text-xs text-[#858B89]">Validating your authorization link</p>
        </div>
      </section>
    );
  }

  if (stage === 'error') {
    return (
      <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">Invalid or Expired Link</h3>
            <p className="text-xs text-[#858B89] mt-1">
              This password reset link is invalid or has expired. Please request a fresh authorization link.
            </p>
            {reason && <p className="text-[11px] text-red-500 font-mono mt-2">{reason}</p>}
          </div>
          <button
            onClick={() => nav('/auth/forgot-password')}
            className="btn-primary w-full text-xs"
          >
            Request New Reset Code
          </button>
        </div>
      </section>
    );
  }

  if (stage === 'done') {
    return (
      <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF5D5] text-[#11665C] flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-[#147D70]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">Password Reset Successfully</h3>
            <p className="text-xs text-[#858B89] mt-1">
              Your new password is now active. You can proceed to sign in with your updated credentials.
            </p>
          </div>
          <button
            onClick={() => nav('/auth/signin')}
            className="btn-primary w-full text-xs"
          >
            Proceed to Sign In
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#147D70] shadow-sm mb-2">
            <Lock className="w-5 h-5 text-[#D9F36A]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#202124] tracking-tight">
            Set New Password
          </h2>
          <p className="text-xs text-[#858B89]">
            Account: <strong className="text-[#202124]">{email}</strong>
          </p>
        </div>

        <div className="card p-7 sm:p-8 bg-white shadow-sm space-y-5">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="pass" className="label">New Password (min 6 characters)</label>
              <input
                id="pass"
                className={`input ${showPassErr ? 'border-red-400 focus:border-red-500' : ''}`}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onBlur={() => setTouchedPass(true)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
              />
              {showPassErr && (
                <p className="text-[11px] text-red-500 mt-1">Password must be at least 6 characters long</p>
              )}
            </div>

            <div>
              <label htmlFor="pass2" className="label">Confirm New Password</label>
              <input
                id="pass2"
                className={`input ${showPass2Err ? 'border-red-400 focus:border-red-500' : ''}`}
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                onBlur={() => setTouchedPass2(true)}
                placeholder="Retype new password"
                autoComplete="new-password"
                required
              />
              {showPass2Err && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button 
              className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-2" 
              type="submit" 
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving New Password...</span>
                </>
              ) : (
                <>
                  <span>Save Password & Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#D9F36A]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
