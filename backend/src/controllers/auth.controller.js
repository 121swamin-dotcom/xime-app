import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import {
  sendActivationRequestEmail,
  sendActivationOutcomeEmail,
  sendPasswordResetEmail,
} from '../utils/email.js';

// ── POST /api/auth/activate ───────────────────────────────────────────────────
// Student sets password for the first time.
export async function activateAccount(req, res) {
  const { roll_number, email, password } = req.body;

  if (!roll_number || !email || !password) {
    return res.status(400).json({ error: 'roll_number, email and password are required' });
  }
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and contain a digit' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, roll_number, email, section, status
       FROM users WHERE roll_number = $1 AND email = $2 AND role = 'STUDENT'`,
      [roll_number.toUpperCase(), email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Roll number or email not found' });
    }

    const student = rows[0];

    if (student.status === 'ACTIVE') {
      return res.status(409).json({ error: 'Account already active. Please log in.' });
    }
    if (student.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended. Contact the professor.' });
    }
    if (student.status === 'PENDING_ACTIVATION') {
      return res.status(409).json({ error: 'Activation already pending. Please wait for professor approval.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const token = uuidv4();

    await client.query(
      `UPDATE users SET password_hash = $1, status = 'PENDING_ACTIVATION', activation_token = $2, updated_at = now()
       WHERE id = $3`,
      [hash, token, student.id]
    );

    const base = process.env.API_BASE_URL;
    await sendActivationRequestEmail({
      student,
      approveUrl: `${base}/api/auth/activate/approve?token=${token}`,
      rejectUrl:  `${base}/api/auth/activate/reject?token=${token}`,
    });

    return res.json({ message: 'Activation request sent. You will be emailed when the professor approves.' });
  } finally {
    client.release();
  }
}

// ── GET /api/auth/activate/approve?token=xxx ─────────────────────────────────
export async function approveActivation(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid link');

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users SET status = 'ACTIVE', activation_token = NULL, updated_at = now()
       WHERE activation_token = $1 AND status = 'PENDING_ACTIVATION'
       RETURNING name, email, roll_number`,
      [token]
    );

    if (!rows.length) return res.status(404).send('Token not found or already used');

    await sendActivationOutcomeEmail({ student: rows[0], approved: true });
    return res.send(`<h2>✅ ${rows[0].name} (${rows[0].roll_number}) has been activated.</h2>`);
  } finally {
    client.release();
  }
}

// ── GET /api/auth/activate/reject?token=xxx ──────────────────────────────────
export async function rejectActivation(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid link');

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users SET status = 'SUSPENDED', activation_token = NULL, updated_at = now()
       WHERE activation_token = $1 AND status = 'PENDING_ACTIVATION'
       RETURNING name, email, roll_number`,
      [token]
    );

    if (!rows.length) return res.status(404).send('Token not found or already used');

    await sendActivationOutcomeEmail({ student: rows[0], approved: false });
    return res.send(`<h2>❌ ${rows[0].name} (${rows[0].roll_number}) activation has been rejected.</h2>`);
  } finally {
    client.release();
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req, res) {
  const { roll_number, password } = req.body;

  if (!roll_number || !password) {
    return res.status(400).json({ error: 'roll_number and password are required' });
  }

  const { rows } = await pool.query(
    `SELECT id, name, roll_number, email, section, role, status, password_hash
     FROM users WHERE roll_number = $1`,
    [roll_number.toUpperCase()]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = rows[0];

  if (user.status === 'PRE_SEEDED') {
    return res.status(403).json({ error: 'Account not activated yet. Use the Activate Account flow.' });
  }
  if (user.status === 'PENDING_ACTIVATION') {
    return res.status(403).json({ error: 'Activation pending professor approval.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account suspended. Contact the professor.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({
    id:          user.id,
    roll_number: user.roll_number,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    section:     user.section,
  });

  return res.json({
    token,
    user: {
      id:          user.id,
      name:        user.name,
      roll_number: user.roll_number,
      email:       user.email,
      role:        user.role,
      section:     user.section,
    },
  });
}

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { rows } = await pool.query(
    `SELECT id, name, email FROM users WHERE email = $1 AND status = 'ACTIVE'`,
    [email.toLowerCase()]
  );

  // Always return 200 to avoid user enumeration
  if (!rows.length) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const user = rows[0];
  const token = uuidv4();
  const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await pool.query(
    `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
    [token, expiry, user.id]
  );

  await sendPasswordResetEmail({
    to:       user.email,
    name:     user.name,
    resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
  });

  return res.json({ message: 'If that email exists, a reset link has been sent.' });
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password are required' });
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and contain a digit' });
  }

  const { rows } = await pool.query(
    `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > now()`,
    [token]
  );

  if (!rows.length) return res.status(400).json({ error: 'Token invalid or expired' });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = now()
     WHERE id = $2`,
    [hash, rows[0].id]
  );

  return res.json({ message: 'Password reset successful. Please log in.' });
}
