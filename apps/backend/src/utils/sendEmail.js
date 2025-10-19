import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }) {
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.FROM_EMAIL || 'WeGo <onboarding@resend.dev>';
      const result = await resend.emails.send({ from, to, subject, html });
      // Log full response for debugging delivery issues
      console.log('[Resend] send response:', result);
      if (result && result.error) throw new Error(String(result.error));
      console.log('✅ Email via Resend ->', to);
      return result;
    }

    // Fallback to nodemailer (Gmail) for development
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log('✅ Email via Gmail ->', to);
    return true;
  } catch (err) {
    console.error('❌ Email send error:', err);
    return false;
  }
}
