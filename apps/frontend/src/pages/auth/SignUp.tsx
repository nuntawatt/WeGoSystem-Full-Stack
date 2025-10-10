// Sign up page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { useAuth } from '../../hooks/useAuth';

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('โปรดกรอกชื่อ');
    if (!email.trim()) return toast('โปรดกรอกอีเมล');
    if (pw.length < 6) return toast('รหัสผ่านอย่างน้อย 6 ตัวอักษร');

    try {
      setLoading(true);
      await signUp(email, pw);
      toast('สมัครสำเร็จ! 🎉');
      nav('/profile');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('duplicate')) {
        toast('อีเมลนี้มีบัญชีอยู่แล้ว • กด "Sign in" หรือ "Reset password"');
      } else if (message.includes('email')) {
        toast('อีเมลไม่ถูกต้อง');
      } else if (message.includes('password')) {
        toast('รหัสผ่านน้อยเกินไป (อย่างน้อย 6 ตัวอักษร)');
      } else {
        toast(`สมัครไม่สำเร็จ: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-10">
      <div className="card p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              placeholder="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                className="input pr-10"
                placeholder="Password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-white/70 hover:text-white"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  // eye-off
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                    <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // eye
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4.5-8 11-8 11 8 11 8-4.5 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Sign up'}
          </button>

          <p className="text-sm opacity-80 text-center">
            Already have an account? <Link className="underline" to="/auth/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
