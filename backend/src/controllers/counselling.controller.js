import pool from '../config/db.js';

// ── GET /api/counselling ──────────────────────────────────────────────────────
export async function getMyCounselling(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM counselling_requests
      WHERE student_id = $1 ORDER BY requested_at DESC
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch counselling requests' });
  }
}

// ── POST /api/counselling ─────────────────────────────────────────────────────
export async function requestCounselling(req, res) {
  const { preferred_date, preferred_time, agenda } = req.body;
  if (!preferred_date || !preferred_time || !agenda) {
    return res.status(400).json({ error: 'preferred_date, preferred_time and agenda are required' });
  }

  // Validate time slot (09:00-15:00, 30-min slots)
  const [h, m] = preferred_time.split(':').map(Number);
  if (h < 9 || h > 14 || (h === 14 && m > 30) || (m !== 0 && m !== 30)) {
    return res.status(400).json({ error: 'Slots are 09:00-15:00 IST in 30-minute intervals' });
  }

  // Validate weekday
  const day = new Date(preferred_date).getDay();
  if (day === 0 || day === 6) {
    return res.status(400).json({ error: 'Only weekday slots are available' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO counselling_requests (student_id, preferred_date, preferred_time, agenda)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [req.user.id, preferred_date, preferred_time, agenda]);

    // Log to terminal (email skipped for now)
    console.log(`[COUNSELLING REQUEST] ${req.user.name} — ${preferred_date} ${preferred_time}`);
    console.log(`  Agenda: ${agenda}`);

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit request' });
  }
}

// ── Admin: GET /api/counselling/all ──────────────────────────────────────────
export async function getAllCounselling(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT cr.*, u.name AS student_name, u.roll_number, u.section
      FROM counselling_requests cr
      JOIN users u ON u.id = cr.student_id
      ORDER BY cr.preferred_date, cr.preferred_time
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch counselling requests' });
  }
}

// ── Admin: POST /api/counselling/:id/confirm ──────────────────────────────────
export async function confirmCounselling(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      UPDATE counselling_requests
      SET status = 'CONFIRMED', confirmed_at = now(), professor_comment = $2
      WHERE id = $1 RETURNING *
    `, [id, req.body.professor_comment || null]);

    if (!rows.length) return res.status(404).json({ error: 'Request not found' });

    // Fetch student info for email log
    const { rows: student } = await pool.query(
      `SELECT name, email FROM users WHERE id = $1`, [rows[0].student_id]
    );
    console.log(`[COUNSELLING CONFIRMED] ${student[0]?.name} — ${rows[0].preferred_date} ${rows[0].preferred_time}`);

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to confirm' });
  }
}

// ── Admin: POST /api/counselling/:id/decline ──────────────────────────────────
export async function declineCounselling(req, res) {
  const { id } = req.params;
  const { professor_comment } = req.body;
  if (!professor_comment) return res.status(400).json({ error: 'A comment is required when declining' });

  try {
    const { rows } = await pool.query(`
      UPDATE counselling_requests
      SET status = 'DECLINED', professor_comment = $2
      WHERE id = $1 RETURNING *
    `, [id, professor_comment]);
    if (!rows.length) return res.status(404).json({ error: 'Request not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to decline' });
  }
}
