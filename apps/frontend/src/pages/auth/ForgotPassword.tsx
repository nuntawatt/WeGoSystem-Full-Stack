// Forgot Password page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { api } from '../../lib/apiClient';
import { Lock, Mail, ArrowLeft, Check, Eye, EyeOff, KeyRound, Send } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOTP, setDevOTP] = useState<string | null>(null); // Store OTP for display

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return toast('โปรดกรอกอีเมล', 'error');
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email });
      
      // Check if OTP is returned (development mode)
      if (response.data?.devOTP) {
        setDevOTP(response.data.devOTP);
        toast('รหัส OTP ถูกสร้างแล้ว!', 'success');
      } else {
        setDevOTP(null);
        toast('ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว', 'success');
      }
      
      setStep('otp');
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      toast(serverMessage || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      return toast('โปรดกรอกรหัส OTP', 'error');
    }
    
    if (newPassword.length < 6) {
      return toast('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      toast('รีเซ็ตรหัสผ่านสำเร็จ', 'success');
      navigate('/auth/signin');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'เกิดข้อผิดพลาด';
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Copy OTP to input when clicked
  const handleCopyOTP = () => {
    if (devOTP) {
      setOtp(devOTP);
      toast('คัดลอก OTP แล้ว!', 'success');
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 shadow-sm">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-sm mb-4">
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
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2" htmlFor="email">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-6 px-8 py-3.5 font-medium text-white rounded-sm bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60" 
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
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Email Display */}
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-4">
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
                  className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all text-center text-2xl tracking-[0.5em] font-semibold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
                
                {/* Show OTP if in development mode */}
                {devOTP ? (
                  <div 
                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-sm p-4 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2" htmlFor="newPassword">
                  <Lock className="w-4 h-4" /> New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all pr-12"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-6 px-8 py-3.5 font-medium text-white rounded-sm bg-teal-700 hover:bg-teal-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60" 
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
