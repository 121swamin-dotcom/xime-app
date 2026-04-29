import dotenv from 'dotenv';
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'XIME IT & Analytics <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'swaminathann@xime.org';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://xime-domain-app.vercel.app';

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[EMAIL ERROR]', data);
    throw new Error(data.message || 'Email send failed');
  }
  console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  return data;
}

export async function sendActivationRequestEmail({ student, approveUrl, rejectUrl }) {
  console.log(`[ACTIVATION REQUEST] ${student.name} (${student.roll_number})`);
  console.log(`  Approve: ${approveUrl}`);
  console.log(`  Reject:  ${rejectUrl}`);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#CC0000;padding:20px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">XIME IT & Analytics Domain</h1>
      </div>
      <div style="padding:24px;background:#f9f9f9;">
        <h2 style="color:#1a1a1a;">Account Activation Request</h2>
        <p>A student has requested account activation:</p>
        <table cellpadding="8" style="background:white;border-radius:8px;width:100%;border:1px solid #eee;">
          <tr><td style="color:#888;font-size:13px;">Name</td><td><strong>${student.name}</strong></td></tr>
          <tr><td style="color:#888;font-size:13px;">Roll No</td><td><strong>${student.roll_number}</strong></td></tr>
          <tr><td style="color:#888;font-size:13px;">Section</td><td>${student.section}</td></tr>
          <tr><td style="color:#888;font-size:13px;">Email</td><td>${student.email}</td></tr>
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="${approveUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;margin-right:12px;font-weight:bold;">✓ Approve</a>
          <a href="${rejectUrl}" style="background:#dc2626;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">✗ Reject</a>
        </div>
        <p style="color:#888;font-size:12px;margin-top:20px;">These links expire in 72 hours.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[XIME] Activation Request — ${student.name} (${student.roll_number})`,
    html,
  });
}

export async function sendActivationOutcomeEmail({ student, approved }) {
  const html = approved
    ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#CC0000;padding:20px;text-align:center;">
          <h1 style="color:white;margin:0;">XIME IT & Analytics Domain</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#16a34a;">Account Approved ✓</h2>
          <p>Hi ${student.name},</p>
          <p>Your XIME Domain App account has been <strong>approved</strong>. You can now log in.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${FRONTEND_URL}/login" style="background:#CC0000;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Log In Now</a>
          </div>
        </div>
      </div>`
    : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#CC0000;padding:20px;text-align:center;">
          <h1 style="color:white;margin:0;">XIME IT & Analytics Domain</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#dc2626;">Activation Declined</h2>
          <p>Hi ${student.name},</p>
          <p>Your activation request has been declined. Please contact Prof Swaminathan N if you believe this is an error.</p>
        </div>
      </div>`;

  return sendEmail({
    to: student.email,
    subject: `[XIME] Account ${approved ? 'Activated' : 'Declined'}`,
    html,
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#CC0000;padding:20px;text-align:center;">
        <h1 style="color:white;margin:0;">XIME IT & Analytics Domain</h1>
      </div>
      <div style="padding:24px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}" style="background:#CC0000;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
        </div>
        <p style="color:#888;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: '[XIME] Password Reset Request', html });
}