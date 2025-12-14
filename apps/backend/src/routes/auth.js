import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/user.js';
import Profile from '../models/profile.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map(); // { email: { otp, expiresAt } }

// Email sending function - supports multiple providers
const sendOTPEmail = async (email, otp) => {
  console.log('[email] sendOTPEmail called for', email);
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
      <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 16px; margin-bottom: 20px;">
            <span style="font-size: 32px;">🔐</span>
          </div>
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">รีเซ็ตรหัสผ่าน</h1>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          สวัสดีครับ/ค่ะ 👋
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          คุณได้ทำการขอรีเซ็ตรหัสผ่านสำหรับบัญชี WeGo ของคุณ
        </p>
        
        <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
          <p style="color: #78350f; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">รหัส OTP ของคุณคือ:</p>
          <div style="font-size: 42px; font-weight: bold; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
          <p style="color: #92400e; font-size: 12px; margin: 10px 0 0 0;">
            ⏱️ รหัสนี้จะหมดอายุใน 10 นาที
          </p>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>⚠️ คำเตือน:</strong><br>
            หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน โปรดเพิกเฉยอีเมลนี้และเปลี่ยนรหัสผ่านของคุณทันที
          </p>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          © ${new Date().getFullYear()} WeGo • แพลตฟอร์มรวมกลุ่มกิจกรรมออนไลน์
        </p>
      </div>
    </div>
  `;

  // If an email provider is configured (Resend or SMTP), prefer to use it even in development.
  const hasProvider = !!(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // If no provider configured and we're in development, log OTP and return early
  if (!hasProvider && isDevelopment) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [DEV MODE] OTP Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📬 To: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏱️  Expires: 10 minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, mode: 'development' };
  }

  console.log('[email] provider configured?', hasProvider);

  // Production mode: Send real email
  try {
    // Try using Resend first (if API key is available)
    if (process.env.RESEND_API_KEY) {
      console.log('[email] attempting to send via Resend');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'WeGo <noreply@wego.app>',
          to: email,
          subject: 'WeGo - รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
          html: emailHtml
        })
      });

      if (response.ok) {
        console.log(`✅ OTP sent via Resend to ${email}`);
        return { success: true, mode: 'resend' };
      }
    }

    // SMTP Fallback using Gmail service (handles host/port/secure automatically)
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
    if (smtpUser && smtpPass) {
      console.log('[email] attempting to send via SMTP (Gmail Service) to', smtpUser);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        logger: process.env.EMAIL_DEBUG === 'true',
        debug: process.env.EMAIL_DEBUG === 'true',
        connectionTimeout: 30 * 1000,
        greetingTimeout: 30 * 1000,
        socketTimeout: 30 * 1000
      });

      // Verify connection
      try {
        await transporter.verify();
        console.log('[email] SMTP transporter verified');
      } catch (verifyErr) {
        console.error('[email] verify failed:', verifyErr && verifyErr.message, verifyErr);
        throw new Error(`SMTP Verify Failed: ${verifyErr && verifyErr.message}`);
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to: email,
        subject: 'WeGo - รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
        html: emailHtml
      });

      console.log(`✅ OTP sent via SMTP to ${email}`);
      return { success: true, mode: 'smtp' };
    }

    // No email service configured - fallback to console log
    console.warn('⚠️ No email service configured, logging OTP to console');
    console.log(`🔐 OTP for ${email}: ${otp}`);
    return { success: true, mode: 'console' };

  } catch (error) {
    console.error('❌ Email send error:', error && error.message, error);
    // Even if email fails, log OTP so user can still reset password
    console.log(`🔐 FALLBACK OTP for ${email}: ${otp}`);
    return { success: false, mode: 'fallback', error: error && error.message };
  }
};

// Send password reset link email (JWT token)
const sendResetEmail = async (email, token) => {
  console.log('[email] sendResetEmail called for', email);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password-confirm?token=${encodeURIComponent(token)}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 6px 30px rgba(2,6,23,0.1);">
        <h2 style="margin-top:0">WeGo Password Reset</h2>
        <p>If you requested a password reset, click the button below to set a new password. This link expires in 1 hour.</p>
        <div style="text-align:center; margin:24px 0">
          <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#f59e0b;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        </div>
        <p style="font-size:12px;color:#475569">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size:12px;color:#475569;word-break:break-all">${resetLink}</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  const hasProvider = !!(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
  const isDevelopment = process.env.NODE_ENV !== 'production';
  console.log('[email] provider configured?', hasProvider);
  if (!hasProvider && isDevelopment) {
    console.log('────────────────────────────────────────────');
    console.log('✉️ [DEV MODE] Password Reset Email');
    console.log('To:', email);
    console.log('Link:', resetLink);
    console.log('────────────────────────────────────────────');
    return { success: true, mode: 'development' };
  }

  try {
    if (process.env.RESEND_API_KEY) {
      console.log('[email] attempting to send reset link via Resend');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'WeGo <noreply@wego.app>',
          to: email,
          subject: 'WeGo - Password reset',
          html: emailHtml
        })
      });

      if (response.ok) {
        console.log(`✅ Reset link sent via Resend to ${email}`);
        return { success: true, mode: 'resend' };
      }
    }

    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
    if (smtpUser && smtpPass) {
      console.log('[email] attempting to send reset link via SMTP (Gmail Service) to', smtpUser);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        logger: process.env.EMAIL_DEBUG === 'true',
        debug: process.env.EMAIL_DEBUG === 'true',
        connectionTimeout: 30 * 1000,
        greetingTimeout: 30 * 1000,
        socketTimeout: 30 * 1000
      });

      // Verify connection
      try {
        await transporter.verify();
        console.log('[email] SMTP transporter verified');
      } catch (verifyErr) {
        console.error('[email] verify failed:', verifyErr && verifyErr.message, verifyErr);
        throw new Error(`SMTP Verify Failed: ${verifyErr && verifyErr.message}`);
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to: email,
        subject: 'WeGo - Password reset',
        html: emailHtml
      });

      console.log(`✅ Reset link sent via SMTP to ${email}`);
      return { success: true, mode: 'smtp' };
    }

    console.warn('⚠️ No email service configured, logging reset link to console');
    console.log(`Reset link for ${email}: ${resetLink}`);
    return { success: true, mode: 'console' };
  } catch (error) {
    console.error('❌ Reset email send error:', error?.message || error);
    return { success: false, mode: 'fallback', error: error?.message };
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    // Ensure username is set if provided
    const userData = { ...req.body };
    if (userData.username) {
      userData.username = userData.username.trim();
    }
    const user = new User(userData);
    await user.save();
    
    // Auto-create profile for new user
    const profile = new Profile({
      userId: user._id,
      // Prefer provided username, otherwise fall back to email prefix
      name: user.username ? user.username : user.email.split('@')[0],
      bio: '',
      avatar: ''
    });
    await profile.save();
    
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Find user by email or username
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else if (username) {
      user = await User.findOne({ username: username });
    } else {
      throw new Error('Please provide email or username');
    }
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid login credentials');
    }

    // Check if profile exists, create if not
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({
        userId: user._id,
        name: user.email.split('@')[0],
        bio: '',
        avatar: ''
      });
      await profile.save();
    }

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Logout (optional - can be handled on client side by removing token)
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (emailResult.success) {
      console.log(`✅ OTP ready: ${emailResult.mode}`);
    }

    const hasProvider = !!(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
    res.json({ 
      message: 'If the email exists, an OTP has been sent',
      // Send OTP back in development mode only when no email provider is configured
      ...((process.env.NODE_ENV === 'development' && !hasProvider) ? { devOTP: otp } : {})
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Request password reset via email link (token)
router.post('/forgot-password-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // don't reveal
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const emailResult = await sendResetEmail(email, token);

    if (emailResult.success) {
      console.log(`✅ Password reset link prepared: ${emailResult.mode}`);
    }

    const hasProvider = !!(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD));
    res.json({ message: 'If the email exists, a reset link has been sent', ...((process.env.NODE_ENV === 'development' && !hasProvider) ? { devLinkToken: token } : {}) });
  } catch (error) {
    console.error('Forgot-password-link error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check OTP
    const storedOTP = otpStore.get(email.toLowerCase());
    if (!storedOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Find and update user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear OTP
    otpStore.delete(email.toLowerCase());

    console.log(`✅ Password reset successful for ${email}`);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify reset token (used by frontend reset page)
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(payload._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ email: user.email });
  } catch (error) {
    console.error('verify-reset-token error:', error);
    res.status(500).json({ message: 'Failed to verify token' });
  }
});

// Reset password using token
router.post('/reset-password-confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(payload._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('reset-password-confirm error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Google login using ID token from client
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    // Verify token with Google tokeninfo endpoint
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('google tokeninfo failed', resp.status, txt);
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const payload = await resp.json();
    // Verify the token audience matches our configured Google client id
    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.error('google token audience mismatch', payload.aud);
      return res.status(400).json({ error: 'Invalid Google client id' });
    }

    const email = payload.email;
    if (!email) return res.status(400).json({ error: 'No email in Google token' });

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        username: (payload.email || '').split('@')[0],
        password: crypto.randomBytes(16).toString('hex'),
        provider: 'google'
      });
      await user.save();

      const profile = new Profile({
        userId: user._id,
        name: payload.name || user.username,
        avatar: payload.picture || ''
      });
      await profile.save();
    }

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    console.error('google-login error:', error);
    res.status(500).json({ error: 'Failed to login with Google' });
  }
});

export default router;