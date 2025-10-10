import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { api } from '../../lib/apiClient';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return toast('กรุณากรอกอีเมล');

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email: trimmed });
      toast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว กรุณาเช็คอีเมลของคุณ');

      const u = new URLSearchParams({ hint: 'check-email', email: trimmed });
      nav(`/auth/reset?${u.toString()}`, { replace: true });
    } catch (err: any) {
      console.error('[reset password]', err?.code, err?.message);
      const message = err?.response?.data?.message || 'Failed to send reset password email';
      toast(message);
    } finally {
      setLoading(false);
    }
  };

  const valid = /\S+@\S+\.\S+/.test(email.trim());

  return (
    <section className="container-app py-10">
      <div className="card p-6 max-w-md mx-auto">
        <h3 className="text-xl font-semibold mb-4">Reset Password</h3>
        <form onSubmit={submit} className="space-y-3">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
          <button className="btn-primary w-full" type="submit" disabled={loading || !valid}>
            {loading ? 'Sending…' : 'Send'}
          </button>
          <p className="text-xs text-white/70">
            A password reset link will be sent to your email.
          </p>
        </form>
      </div>
    </section>
  );
}
