import { useState, useEffect } from 'react';
import GoogleSignIn from '../../components/GoogleSignIn';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';
import { SignInSchema } from '../../lib/validators';
import { showSuccess, showError } from '../../lib/swal';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRight } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname || '/';

  const { signIn } = useAuth();

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
    <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Mark */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#147D70] shadow-sm mb-2">
            <div className="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#D9F36A]" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-[#202124] tracking-tight">
            Sign in to WegoSystem
          </h2>
          <p className="text-xs text-[#858B89]">
            Access your activities, chat channels, and matched schedules.
          </p>
        </div>

        {/* Card Form */}
        <div className="card p-7 sm:p-8 bg-white shadow-sm space-y-5">
          <form onSubmit={submit} className="space-y-4">
            <FloatingInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={loading}
              required
            />

            <FloatingPasswordInput
              id="password"
              label="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />

            <div className="flex justify-end text-xs">
              <Link 
                to="/auth/forgot-password" 
                className="font-medium text-[#147D70] hover:text-[#11665C] transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <button 
              className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#D9F36A]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8EBE9]" />
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider text-[#858B89]">
              <span className="bg-white px-2">or continue with</span>
            </div>
          </div>

          <GoogleSignIn />

          {/* Sign up prompt */}
          <div className="pt-4 border-t border-[#E8EBE9] text-center text-xs text-[#5F6664]">
            Don't have an account yet?{' '}
            <Link to="/auth/signup" className="font-bold text-[#147D70] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
