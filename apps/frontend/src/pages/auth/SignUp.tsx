// Sign up page
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('โปรดกรอกชื่อ', 'error');
    if (!email.trim()) return toast('โปรดกรอกอีเมล', 'error');
    if (pw.length < 6) return toast('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');

    try {
  setLoading(true);
  await signUp(email, pw, name.trim());
      toast('ยินดีต้อนรับสู่ WeGo 🎉', 'success');
      nav('/profile');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('duplicate')) {
        toast('อีเมลนี้มีบัญชีอยู่แล้ว • กด "Sign in" หรือ "Reset password"', 'error');
      } else if (message.includes('email')) {
        toast('อีเมลไม่ถูกต้อง', 'error');
      } else if (message.includes('password')) {
        toast('รหัสผ่านน้อยเกินไป (อย่างน้อย 6 ตัวอักษร)', 'error');
      } else {
        toast(`สมัครไม่สำเร็จ: ${err?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        {/* Professional Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 shadow-sm">
          <header className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Create <span className="italic">Account</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Join the WeGo community</p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              placeholder="Your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none pr-12"
                placeholder="At least 6 characters"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                    <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4.5-8 11-8 11 8 11 8-4.5 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full mt-6 py-3.5 text-sm font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              <>Create Account</>
            )}
          </button>

          <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/auth/signin" className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
          </form>
        </div>
      </div>
    </section>
  );
}
