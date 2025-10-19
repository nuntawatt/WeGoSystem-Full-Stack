import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }) {
  // Return shape: { ok: boolean, provider: 'resend'|'gmail'|'none', result: any }
  try {
    // Try Resend first when API key is present
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.FROM_EMAIL || 'WeGo <onboarding@resend.dev>';
        const result = await resend.emails.send({ from, to, subject, html });
        console.log('[Resend] send response:', result);

        // Treat a response that contains an error or statusCode >= 400 as failure
        if (result && (result.error || result.statusCode >= 400)) {
          console.warn('[Resend] returned an error - falling back to SMTP if available', result);
        } else {
          console.log('✅ Email via Resend ->', to);
          return { ok: true, provider: 'resend', result };
        }
      } catch (resendErr) {
        // If the Resend SDK throws, log and continue to fallback
        console.warn('[Resend] SDK error, falling back to SMTP if available', resendErr);
      }
    }

    // Fallback to nodemailer (Gmail) when configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        });

        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
          to,
          subject,
          html,
        });

        console.log('✅ Email via Gmail ->', to, info);
        return { ok: true, provider: 'gmail', result: info };
      } catch (smtpErr) {
        console.error('[SMTP] send error:', smtpErr);
        return { ok: false, provider: 'gmail', result: smtpErr };
      }
    }

    console.warn('⚠️ No email provider configured (no RESEND_API_KEY and no SMTP credentials)');
    return { ok: false, provider: 'none', result: null };
  } catch (err) {
    console.error('❌ Email send unexpected error:', err);
    return { ok: false, provider: 'none', result: err };
  }
}
