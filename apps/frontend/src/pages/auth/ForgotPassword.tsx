// Forgot Password page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showSuccess, showError, showInfo } from '../../lib/swal';
import { api } from '../../lib/apiClient';
import { Lock, Mail, ArrowLeft, Check, KeyRound, Send } from 'lucide-react';
import FloatingInput from '../../components/FloatingInput';
import FloatingPasswordInput from '../../components/FloatingPasswordInput';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null); // Store OTP for display

  // Reset scroll on mount
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
      
      // Check if OTP is returned (development mode)
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

  // Copy OTP to input when clicked
  const handleCopyOTP = () => {
    if (devOTP) {
      setOtp(devOTP);
      showInfo('คัดลอก OTP แล้ว!', 'กรอกรหัส OTP ให้อัตโนมัติแล้ว');
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl mb-4">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-slate-800 dark:text-white mb-2">
              {step === 'email' ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {step === 'email' 
                ? 'Enter your email to receive OTP' 
                : 'Enter OTP and new password'}
            </p>
          </header>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />

              <button 
                type="submit" 
                className="w-full mt-2 px-8 py-3.5 font-medium text-white rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-300">
                  Remember your password?{' '}
                  <Link to="/auth/signin" className="text-teal-700 dark:text-teal-400 font-medium hover:text-teal-600 dark:hover:text-teal-300 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Step 2: OTP & New Password */}
          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email Display */}
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sent to:</p>
                <p className="text-slate-800 dark:text-white font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  {email}
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2" htmlFor="otp">
                  <KeyRound className="w-4 h-4" /> OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  className="w-full px-4 py-4 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none transition-all text-center text-2xl tracking-[0.5em] font-semibold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
                
                {/* Show OTP if in development mode */}
                {devOTP ? (
                  <div 
                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
                    onClick={handleCopyOTP}
                  >
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center font-medium mb-2 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Development Mode - Click to Copy OTP
                    </p>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em] font-mono select-all">
                        {devOTP}
                      </div>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">
                        Click to auto-fill
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Check your email for the 6-digit code
                  </p>
                )}
              </div>

              {/* New Password Input */}
              <FloatingPasswordInput
                id="newPassword"
                label="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <button 
                type="submit" 
                className="w-full mt-2 px-8 py-3.5 font-medium text-white rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-teal-700 dark:text-teal-400 font-medium hover:text-teal-600 dark:hover:text-teal-300 transition-colors flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to email
                </button>
                <p className="text-slate-600 dark:text-slate-300">
                  Didn't receive OTP?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                    }}
                    className="text-teal-700 dark:text-teal-400 font-medium hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
