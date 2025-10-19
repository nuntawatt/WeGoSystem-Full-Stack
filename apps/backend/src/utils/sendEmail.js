import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return email;
  const head = name.slice(0, 1);
  const tail = name.slice(-1);
  return `${head}${'*'.repeat(Math.max(1, name.length - 2))}${tail}@${domain}`;
}

/**
 * sendEmail: use Resend as primary in production, fallback to SMTP only in dev
 * @param {{to:string|string[], subject:string, html:string, text?:string}}
 */
export async function sendEmail({ to, subject, html, text }) {
  // Primary: Resend (used in prod and dev if configured)
  if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.FROM_EMAIL;
      const result = await resend.emails.send({ from, to, subject, html, text });

      // If Resend indicates domain verification required, return DOMAIN_REQUIRED
      const msg = String(result?.message || result?.error || '');
      if (result?.statusCode === 403 || /verify a domain/i.test(msg)) {
        console.warn('⚠️ Resend domain not verified (403)');
        return { ok: false, provider: 'resend', code: 403, reason: 'DOMAIN_REQUIRED', error: result };
      }

      if (result?.error || (result?.statusCode && result.statusCode >= 400)) {
        console.error('❌ Email send failed via Resend:', String(result?.error || result));
        return { ok: false, provider: 'resend', code: result?.statusCode || 500, reason: 'RESEND_ERROR', error: result };
      }

      // Success
      const recipients = [].concat(to || []);
      console.log(`✅ Email sent via Resend to ${recipients.map(maskEmail).join(', ')}`);
      return { ok: true, provider: 'resend', result };
    } catch (err) {
      const emsg = String(err?.message || err);
      if (err?.statusCode === 403 || /verify a domain/i.test(emsg)) {
        console.warn('⚠️ Resend domain not verified (exception 403)');
        return { ok: false, provider: 'resend', code: 403, reason: 'DOMAIN_REQUIRED', error: err };
      }
      console.error('❌ Email send failed via Resend:', emsg);
      return { ok: false, provider: 'resend', code: 500, reason: 'RESEND_ERROR', error: err };
    }
  }

  // Fallback SMTP - only allowed in non-production (dev/test)
  const haveSmtp = !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD;
  if (!isProd && haveSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT || 587),
        secure: false,
        requireTLS: true,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        connectionTimeout: 10000,
      });

      const from = process.env.FROM_EMAIL || `WeGo <${process.env.EMAIL_USER}>`;
      const info = await transporter.sendMail({ from, to, subject, html, text });
      const recipients = [].concat(to || []);
      console.log(`✅ Email sent via SMTP(dev) -> ${recipients.map(maskEmail).join(', ')}`);
      return { ok: true, provider: 'smtp', result: info };
    } catch (err) {
      console.error('❌ SMTP(dev) error:', String(err?.message || err));
      return { ok: false, provider: 'smtp', code: 500, reason: 'SMTP_ERROR', error: err };
    }
  }

  // No provider
  console.warn('⚠️ No email provider configured (Resend/SMTP missing).');
  return { ok: false, provider: 'none', code: 500, reason: 'NO_PROVIDER' };
}
