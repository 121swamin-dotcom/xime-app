import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendActivationRequestEmail({ student, approveUrl, rejectUrl }) {
  console.log(`[ACTIVATION REQUEST] ${student.name} (${student.roll_number})`);
  console.log(`  Approve: ${approveUrl}`);
  console.log(`  Reject:  ${rejectUrl}`);
  const html = `
    <p>A student has requested account activation:</p>
    <table cellpadding="6">
      <tr><td><b>Name</b></td><td>${student.name}</td></tr>
      <tr><td><b>Roll No</b></td><td>${student.roll_number}</td></tr>
      <tr><td><b>Section</b></td><td>${student.section}</td></tr>
      <tr><td><b>Email</b></td><td>${student.email}</td></tr>
    </table>
    <br/>
    <a href="${approveUrl}" style="background:#16a34a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;margin-right:12px;">Approve</a>
    <a href="${rejectUrl}" style="background:#dc2626;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reject</a>
    <br/><br/>
    <small>These links expire in 72 hours.</small>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `[XIME] Activation Request — ${student.name} (${student.roll_number})`,
    html,
  });
}

export async function sendActivationOutcomeEmail({ student, approved }) {
  const html = approved
    ? `<p>Hi ${student.name},</p><p>Your account has been <b>approved</b>. Log in at <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a>.</p>`
    : `<p>Hi ${student.name},</p><p>Your activation request has been <b>declined</b>. Contact Prof Swaminathan N if this is an error.</p>`;
  return sendEmail({
    to: student.email,
    subject: `[XIME] Account ${approved ? 'Activated' : 'Declined'}`,
    html,
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const html = `
    <p>Hi ${name},</p>
    <p>Click below to reset your password. Link expires in 30 minutes.</p>
    <a href="${resetUrl}" style="background:#CC0000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a>
    <br/><br/>
    <small>If you didn't request this, ignore this email.</small>
  `;
  return sendEmail({ to, subject: '[XIME] Password Reset Request', html });
}