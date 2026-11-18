import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError, showInfo } from '../../lib/swal';
import { api } from '../../lib/apiClient';
import { Lock, Mail, ArrowLeft, Check, KeyRound, Send, ArrowRight } from 'lucide-react';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return showError('กรุณากรอกข้อมูล', 'โปรดกรอกอีเมล');
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data?.devOTP) {
        setDevOTP(response.data.devOTP);
        showSuccess('รหัส OTP ถูกสร้างแล้ว!', 'กรุณากรอกรหัส OTP ด้านล่าง');
      } else {
        setDevOTP(null);
        showSuccess('ส่งรหัส OTP สำเร็จ!', 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว');
      }
      
      setStep('otp');
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      showError('เกิดข้อผิดพลาด', serverMessage || 'ไม่สามารถส่ง OTP ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      return showError('กรุณากรอกข้อมูล', 'โปรดกรอกรหัส OTP');
    }
    
    if (newPassword.length < 6) {
      return showError('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านอย่างน้อย 6 ตัวอักษร');
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      showSuccess('รีเซ็ตรหัสผ่านสำเร็จ!', 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      navigate('/auth/signin');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'เกิดข้อผิดพลาด';
      showError('รีเซ็ตไม่สำเร็จ', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOTP = () => {
    if (devOTP) {
      setOtp(devOTP);
      showInfo('คัดลอก OTP แล้ว!', 'กรอกรหัส OTP ให้อัตโนมัติแล้ว');
    }
  };

  return (
    <section className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 bg-[#F3F5F4]">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Mark */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#147D70] shadow-sm mb-2">
            <Lock className="w-5 h-5 text-[#D9F36A]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#202124] tracking-tight">
            {step === 'email' ? 'Forgot Password' : 'Enter Verification Code'}
          </h2>
          <p className="text-xs text-[#858B89]">
            {step === 'email' 
              ? 'Enter your registered email to receive an authorization code.' 
              : 'Verify OTP code and create a new secure password.'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-7 sm:p-8 bg-white shadow-sm space-y-5">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <FloatingInput
                id="email"
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                required
              />

              <button 
                type="submit" 
                className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <Send className="w-3.5 h-3.5 text-[#D9F36A]" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[#E8EBE9] text-center">
                <Link
                  to="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#858B89] hover:text-[#147D70] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#F3F5F4] border border-[#E8EBE9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#5F6664]">
                  <Mail className="w-4 h-4 text-[#147D70]" />
                  <span className="font-semibold text-[#202124]">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[#147D70] font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* OTP Field */}
              <div>
                <label htmlFor="otp" className="label">6-Digit Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  className="input text-center text-xl font-mono tracking-[0.4em] font-bold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />

                {devOTP && (
                  <div 
                    onClick={handleCopyOTP}
                    className="mt-2 p-3 rounded-xl bg-[#EAF5D5] border border-[#D9F36A] cursor-pointer text-center hover:bg-[#D9F36A]/30 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-[#11665C] block">
                      Development Mode Auto-Fill:
                    </span>
                    <span className="text-xl font-mono font-bold text-[#202124] tracking-widest mt-0.5 block">
                      {devOTP}
                    </span>
                    <span className="text-[10px] text-[#4D5810] block mt-0.5">Click to auto-populate</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <FloatingPasswordInput
                id="newPassword"
                label="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <button 
                type="submit" 
                className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <Check className="w-4 h-4 text-[#D9F36A]" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[#E8EBE9] text-center text-xs text-[#858B89]">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                  className="font-bold text-[#147D70] hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
