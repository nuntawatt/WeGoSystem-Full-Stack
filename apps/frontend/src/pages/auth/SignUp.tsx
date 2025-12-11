// Sign up page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError, showWarning } from '../../lib/swal';
import { useAuth } from '../../hooks/useAuth';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';

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
    if (!name.trim()) return showError('กรุณากรอกข้อมูล', 'โปรดกรอกชื่อ');
    if (!email.trim()) return showError('กรุณากรอกข้อมูล', 'โปรดกรอกอีเมล');
    if (pw.length < 6) return showError('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านอย่างน้อย 6 ตัวอักษร');

    try {
  setLoading(true);
  await signUp(email, pw, name.trim());
      showSuccess('ยินดีต้อนรับสู่ WeGo 🎉', 'สมัครสมาชิกสำเร็จ!');
      nav('/profile');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('duplicate')) {
        showWarning('อีเมลนี้มีบัญชีอยู่แล้ว', 'กด "Sign in" หรือ "Reset password"');
      } else if (message.includes('email')) {
        showError('อีเมลไม่ถูกต้อง', 'กรุณาตรวจสอบรูปแบบอีเมล');
      } else if (message.includes('password')) {
        showError('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านน้อยเกินไป (อย่างน้อย 6 ตัวอักษร)');
      } else {
        showError('สมัครไม่สำเร็จ', err?.message || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        {/* Professional Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          <header className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Create <span className="italic">Account</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Join the WeGo community</p>
          </header>

          <form onSubmit={onSubmit} className="space-y-6">
            <FloatingInput
              id="username"
              label="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />

            <FloatingInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <FloatingPasswordInput
              id="password"
              label="Password (min 6 characters)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full mt-2 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
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
