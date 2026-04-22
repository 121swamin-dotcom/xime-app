import pool from '../config/db.js';

// ── GET /api/mentoring/my ─────────────────────────────────────────────────────
export async function getMyMentoring(req, res) {
  const studentId = req.user.id;
  try {
    const { rows: request } = await pool.query(
      `SELECT * FROM mentor_requests WHERE student_id = $1`, [studentId]
    );
    const { rows: assignment } = await pool.query(`
      SELECT ma.*, m.name, m.designation, m.company
      FROM mentor_assignments ma
      JOIN mentors m ON m.id = ma.mentor_id
      WHERE ma.student_id = $1 AND ma.is_active = true
    `, [studentId]);

    let sessions = [];
    if (assignment.length) {
      const { rows } = await pool.query(`
        SELECT * FROM mentor_session_logs
        WHERE assignment_id = $1 ORDER BY session_date DESC
      `, [assignment[0].id]);
      sessions = rows;
    }

    return res.json({
      request:    request[0]    || null,
      assignment: assignment[0] || null,
      sessions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch mentoring data' });
  }
}

// ── POST /api/mentoring/request ───────────────────────────────────────────────
export async function requestMentor(req, res) {
  const { goals } = req.body;
  if (!goals) return res.status(400).json({ error: 'goals is required' });
  if (goals.length > 300) return res.status(400).json({ error: 'goals must be under 300 characters' });

  try {
    // Check no existing active assignment
    const { rows: existing } = await pool.query(
      `SELECT id FROM mentor_assignments WHERE student_id = $1 AND is_active = true`, [req.user.id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'You already have an active mentor assignment' });
    }

    const { rows } = await pool.query(`
      INSERT INTO mentor_requests (student_id, goals)
      VALUES ($1, $2)
      ON CONFLICT (student_id) DO UPDATE SET goals = EXCLUDED.goals, status = 'PENDING'
      RETURNING *
    `, [req.user.id, goals]);

    console.log(`[MENTOR REQUEST] ${req.user.name} — ${goals}`);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit mentor request' });
  }
}

// ── POST /api/mentoring/sessions ─────────────────────────────────────────────
export async function logSession(req, res) {
  const { session_date, duration_mins, topics_covered, outcomes } = req.body;
  if (!session_date || !topics_covered) {
    return res.status(400).json({ error: 'session_date and topics_covered are required' });
  }

  try {
    const { rows: assignment } = await pool.query(
      `SELECT id FROM mentor_assignments WHERE student_id = $1 AND is_active = true`, [req.user.id]
    );
    if (!assignment.length) {
      return res.status(400).json({ error: 'No active mentor assignment found' });
    }

    const { rows } = await pool.query(`
      INSERT INTO mentor_session_logs (assignment_id, session_date, duration_mins, topics_covered, outcomes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [assignment[0].id, session_date, duration_mins || null, topics_covered, outcomes || null]);

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to log session' });
  }
}

// ── Admin: GET /api/mentoring/all ─────────────────────────────────────────────
export async function getAllMentoring(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT ma.id, ma.assigned_at, ma.is_active,
        u.name AS student_name, u.roll_number,
        m.name AS mentor_name, m.designation, m.company,
        (SELECT COUNT(*) FROM mentor_session_logs msl WHERE msl.assignment_id = ma.id) AS session_count,
        (SELECT MAX(session_date) FROM mentor_session_logs msl WHERE msl.assignment_id = ma.id) AS last_session
      FROM mentor_assignments ma
      JOIN users u ON u.id = ma.student_id
      JOIN mentors m ON m.id = ma.mentor_id
      ORDER BY ma.assigned_at DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch mentoring overview' });
  }
}

// ── Admin: GET /api/mentoring/requests ───────────────────────────────────────
export async function getMentorRequests(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT mr.*, u.name AS student_name, u.roll_number, u.section
      FROM mentor_requests mr
      JOIN users u ON u.id = mr.student_id
      WHERE mr.status = 'PENDING'
      ORDER BY mr.requested_at
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch mentor requests' });
  }
}

// ── Admin: GET /api/mentoring/mentors ────────────────────────────────────────
export async function getMentors(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mentors WHERE is_active = true ORDER BY name`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch mentors' });
  }
}

// ── Admin: POST /api/mentoring/assign ────────────────────────────────────────
export async function assignMentor(req, res) {
  const { request_id, mentor_id } = req.body;
  if (!request_id || !mentor_id) {
    return res.status(400).json({ error: 'request_id and mentor_id are required' });
  }

  const client = await pool.connect();
  try {
    const { rows: req_ } = await client.query(
      `SELECT * FROM mentor_requests WHERE id = $1`, [request_id]
    );
    if (!req_.length) return res.status(404).json({ error: 'Request not found' });

    const studentId = req_[0].student_id;

    // Create assignment
    await client.query(`
      INSERT INTO mentor_assignments (student_id, mentor_id, request_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id) DO UPDATE
        SET mentor_id = EXCLUDED.mentor_id, assigned_at = now(), is_active = true
    `, [studentId, mentor_id, request_id]);

    // Update request status
    await client.query(
      `UPDATE mentor_requests SET status = 'ASSIGNED', resolved_at = now() WHERE id = $1`,
      [request_id]
    );

    // Log assignment
    const { rows: mentor } = await client.query(`SELECT * FROM mentors WHERE id = $1`, [mentor_id]);
    const { rows: student } = await client.query(`SELECT name, email FROM users WHERE id = $1`, [studentId]);
    console.log(`[MENTOR ASSIGNED] ${student[0]?.name} → ${mentor[0]?.name} (${mentor[0]?.email})`);

    return res.json({ message: 'Mentor assigned successfully' });
  } finally {
    client.release();
  }
}
