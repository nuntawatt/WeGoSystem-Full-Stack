// Forgot Password page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { api } from '../../lib/apiClient';

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
      toast('รีเซ็ตรหัสผ่านสำเร็จ 🎉', 'success');
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
      toast('คัดลอก OTP แล้ว! ✨', 'success');
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-orange-300 to-amber-400 bg-clip-text text-transparent font-['Poppins']">
              {step === 'email' ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p className="text-slate-400">
              {step === 'email' 
                ? 'Enter your email to receive OTP' 
                : 'Enter OTP and new password'}
            </p>
          </header>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label className="label font-semibold text-slate-200 flex items-center gap-2" htmlFor="email">
                  <p></p> Email :
                </label>
                <input
                  id="email"
                  type="email"
                  className="input bg-slate-700/50 border-slate-600/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-6 px-8 py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:transform-none disabled:shadow-none" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send OTP
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-700/50">
                <p className="text-slate-300">
                  Remember your password?{' '}
                  <Link to="/auth/signin" className="text-amber-400 font-bold hover:text-amber-300 transition-colors duration-300">
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
              <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/30 border border-slate-600/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Sent to:</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="text-amber-400">📧</span>
                  {email}
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="label font-semibold text-slate-200 flex items-center gap-2" htmlFor="otp">
                  <span className="text-amber-400">🔐</span> OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  className="input bg-slate-700/50 border-slate-600/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
                
                {/* Show OTP if in development mode */}
                {devOTP ? (
                  <div 
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4 animate-pulse cursor-pointer hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300"
                    onClick={handleCopyOTP}
                  >
                    <p className="text-xs text-green-300 text-center font-semibold mb-2 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Development Mode - Click to Copy OTP
                    </p>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 tracking-[0.3em] font-mono select-all">
                        {devOTP}
                      </div>
                      <p className="text-xs text-green-300/70 mt-2 flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Click to auto-fill
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    Check your email for the 6-digit code
                  </p>
                )}
              </div>

              {/* New Password Input */}
              <div className="space-y-2">
                <label className="label font-semibold text-slate-200 flex items-center gap-2" htmlFor="newPassword">
                  <p></p> New Password :
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="input bg-slate-700/50 border-slate-600/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 pr-12 transition-all duration-300"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-amber-400 transition-all duration-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                        <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4.5-8 11-8 11 8 11 8-4.5 8-11 8-11-8-11-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-6 px-8 py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:transform-none disabled:shadow-none" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Reset Password
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-amber-400 font-bold hover:text-amber-300 transition-colors duration-300"
                >
                  ← Back to email
                </button>
                <p className="text-slate-300">
                  Didn't receive OTP?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                    }}
                    className="text-amber-400 font-bold hover:text-amber-300 transition-colors duration-300"
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
