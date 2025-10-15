import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { api } from '../../lib/apiClient';

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
      toast('Password has been reset successfully');
      setStage('done');
      nav('/auth/signin');
    } catch (error: any) {
      console.error('[resetPasswordConfirm]', error);
      toast(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'checking') {
    return (
      <section className="container-app py-10">
        <div className="card p-6 max-w-md mx-auto">Verifying reset link...</div>
      </section>
    );
  }

  if (stage === 'error') {
    return (
      <section className="container-app py-10">
        <div className="card p-6 max-w-md mx-auto space-y-2">
          <div>Invalid or expired reset link. Please request a new reset link.</div>
          {reason && <div className="text-xs text-white/70">Reason: {reason}</div>}
        </div>
      </section>
    );
  }

  if (stage === 'done') {
    return (
      <section className="container-app py-10">
        <div className="card p-6 max-w-md mx-auto">
          <div>Password has been reset successfully.</div>
          <div>You can now sign in with your new password.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-app py-10">
      <div className="card p-6 max-w-md mx-auto">
        <h3 className="text-xl font-semibold mb-4">Reset Password</h3>

        <p className="text-sm text-white/80 mb-4">
          Account: <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={submit} className="space-y-3">
          {/* Password */}
          <label className="label" htmlFor="pass">New Password</label>
          <input
            id="pass"
            className={`input ${showPassErr ? 'ring-2 ring-red-400/70' : ''}`}
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onBlur={() => setTouchedPass(true)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          {showPassErr && (
            <div className="text-xs text-red-300">Password must be at least 6 characters long</div>
          )}

          {/* Confirm */}
          <label className="label" htmlFor="pass2">Confirm Password</label>
          <input
            id="pass2"
            className={`input ${showPass2Err ? 'ring-2 ring-red-400/70' : ''}`}
            type="password"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            onBlur={() => setTouchedPass2(true)}
            placeholder="Retype your password"
            autoComplete="new-password"
          />
          {showPass2Err && (
            <div className="text-xs text-red-300">Passwords do not match</div>
          )}

          <button className="btn-primary w-full" type="submit" disabled={!canSubmit}>
            {loading ? 'Saving...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </section>
  );
}