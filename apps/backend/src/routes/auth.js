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

  // Check environment mode
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // Development mode: Always log OTP to console (no email needed)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [DEV MODE] OTP Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📬 To: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏱️  Expires: 10 minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, mode: 'development' };
  }

  // Production mode: Send real email
  try {
    // Try using Resend first (if API key is available)
    if (process.env.RESEND_API_KEY) {
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

    // Fallback to Gmail (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'WeGo - รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
        html: emailHtml
      });

      console.log(`✅ OTP sent via Gmail to ${email}`);
      return { success: true, mode: 'gmail' };
    }

    // No email service configured - fallback to console log
    console.warn('⚠️ No email service configured, logging OTP to console');
    console.log(`🔐 OTP for ${email}: ${otp}`);
    return { success: true, mode: 'console' };

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Even if email fails, log OTP so user can still reset password
    console.log(`🔐 FALLBACK OTP for ${email}: ${otp}`);
    return { success: false, mode: 'fallback', error: error.message };
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

    res.json({ 
      message: 'If the email exists, an OTP has been sent',
      // Send OTP back in development mode for easy testing
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
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

export default router;