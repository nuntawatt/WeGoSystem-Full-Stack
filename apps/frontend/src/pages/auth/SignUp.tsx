import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError, showWarning } from '../../lib/swal';
import { useAuth } from '../../hooks/useAuth';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';
import GoogleSignIn from '../../components/GoogleSignIn';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showError('กรุณากรอกข้อมูล', 'โปรดกรอกชื่อของคุณ');
    if (!email.trim()) return showError('กรุณากรอกข้อมูล', 'โปรดกรอกอีเมล');
    if (pw.length < 6) return showError('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านอย่างน้อย 6 ตัวอักษร');

    try {
      setLoading(true);
      await signUp(email, pw, name.trim());
      showSuccess('ยินดีต้อนรับสู่ WegoSystem 🎉', 'สมัครสมาชิกสำเร็จ! โปรดตั้งค่าโปรไฟล์ของคุณ');
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
            Create your WegoSystem account
          </h2>
          <p className="text-xs text-[#858B89]">
            Join like-minded peers for collaborative sessions and community activities.
          </p>
        </div>

        {/* Card Form */}
        <div className="card p-7 sm:p-8 bg-white shadow-sm space-y-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <FloatingInput
              id="name"
              label="Full Name or Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={loading}
              required
            />

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
              label="Password (min 6 characters)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <button 
              className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
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
              <span className="bg-white px-2">or join with</span>
            </div>
          </div>

          <GoogleSignIn />

          {/* Sign in prompt */}
          <div className="pt-4 border-t border-[#E8EBE9] text-center text-xs text-[#5F6664]">
            Already have an account?{' '}
            <Link to="/auth/signin" className="font-bold text-[#147D70] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
