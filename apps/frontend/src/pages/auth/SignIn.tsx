// Sign in page
import { useState, useEffect } from 'react';
import GoogleSignIn from '../../components/GoogleSignIn';
import { SignInSchema } from '../../lib/validators';
import { toast } from '../../components/Toasts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname || '/';

  const { signIn } = useAuth();

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const parsed = SignInSchema.safeParse({ email, password: pass });
    if (!parsed.success) return toast(parsed.error.errors[0].message, 'error');

    try {
      setLoading(true);
      const result = await signIn(email.trim(), pass);
      toast('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับกลับมา 🎉', 'success');
      
      // Redirect admins to dashboard, others to intended location or explore
      if (result && result.role === 'admin') {
        nav('/admin/dashboard', { replace: true });
      } else {
        nav(from === '/' ? '/explore' : from, { replace: true });
      }
    } catch (err: any) {
      toast(err?.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        {/* Professional Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 shadow-sm">
          {/* Header */}
          <header className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Welcome <span className="italic">Back</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your WeGo account</p>
          </header>

          <form onSubmit={submit} className="space-y-5">
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
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none pr-12"
                placeholder="••••••••"
                type={showPw ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
                disabled={loading}
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
            className="w-full mt-6 py-3.5 text-sm font-medium text-white bg-slate-800 dark:bg-white dark:text-slate-900 rounded-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <>Sign In</>
            )}
          </button>

          {/* Google Sign-In */}
          <GoogleSignIn />

          <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors duration-200">
                Sign up
              </Link>
            </p>
            <p>
              <Link to="/auth/forgot-password" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors duration-200">
                Forgot password?
              </Link>
            </p>
          </div>
            </form>
        </div>
      
      </div>
    </section>
  );
}
