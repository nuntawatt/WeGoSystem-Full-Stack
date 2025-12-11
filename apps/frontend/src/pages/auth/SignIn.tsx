// Sign in page
import { useState, useEffect } from 'react';
import GoogleSignIn from '../../components/GoogleSignIn';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';
import { SignInSchema } from '../../lib/validators';
import { showSuccess, showError } from '../../lib/swal';
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
    if (!parsed.success) return showError('ข้อมูลไม่ถูกต้อง', parsed.error.errors[0].message);

    try {
      setLoading(true);
      const result = await signIn(email.trim(), pass);
      showSuccess('เข้าสู่ระบบสำเร็จ!', 'ยินดีต้อนรับกลับมา 🎉');
      
      // Redirect admins to dashboard, others to intended location or explore
      if (result && result.role === 'admin') {
        nav('/admin/dashboard', { replace: true });
      } else {
        nav(from === '/' ? '/explore' : from, { replace: true });
      }
    } catch (err: any) {
      showError('เข้าสู่ระบบไม่สำเร็จ', err?.message || 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        {/* Professional Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          {/* Header */}
          <header className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Welcome <span className="italic">Back</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your WeGo account</p>
          </header>

          <form onSubmit={submit} className="space-y-6">
            <FloatingInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />

            <FloatingPasswordInput
              id="password"
              label="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />

          {/* Submit Button */}
          <button 
            className="w-full mt-2 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
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
