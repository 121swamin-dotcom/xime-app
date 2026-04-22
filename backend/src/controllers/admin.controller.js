import pool from '../config/db.js';

// ── GET /api/admin/overview ───────────────────────────────────────────────────
export async function getOverview(req, res) {
  try {
    const queries = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE status = 'PENDING_ACTIVATION'`),
      pool.query(`SELECT COUNT(*) FROM evidence_submissions WHERE status = 'PENDING'`),
      pool.query(`SELECT COUNT(*) FROM elective_change_requests WHERE status = 'PENDING'`),
      pool.query(`SELECT COUNT(*) FROM counselling_requests WHERE status = 'PENDING'`),
      pool.query(`SELECT COUNT(*) FROM mentor_requests WHERE status = 'PENDING'`),
    ]);
    return res.json({
      activations:      parseInt(queries[0].rows[0].count),
      evidence:         parseInt(queries[1].rows[0].count),
      elective_changes: parseInt(queries[2].rows[0].count),
      counselling:      parseInt(queries[3].rows[0].count),
      mentor_requests:  parseInt(queries[4].rows[0].count),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
}

// ── GET /api/admin/activations ────────────────────────────────────────────────
export async function getActivations(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, roll_number, section, email, created_at, activation_token
      FROM users WHERE status = 'PENDING_ACTIVATION'
      ORDER BY created_at
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch activations' });
  }
}

// ── POST /api/admin/activations/:id/approve ───────────────────────────────────
export async function approveActivation(req, res) {
  try {
    const { rows } = await pool.query(`
      UPDATE users SET status = 'ACTIVE', activation_token = NULL, updated_at = now()
      WHERE id = $1 AND status = 'PENDING_ACTIVATION'
      RETURNING name, roll_number, email
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found or already processed' });
    console.log(`[ACTIVATION APPROVED] ${rows[0].name} (${rows[0].roll_number})`);
    return res.json({ message: 'Approved', student: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to approve' });
  }
}

// ── POST /api/admin/activations/:id/reject ────────────────────────────────────
export async function rejectActivation(req, res) {
  try {
    const { rows } = await pool.query(`
      UPDATE users SET status = 'SUSPENDED', activation_token = NULL, updated_at = now()
      WHERE id = $1 AND status = 'PENDING_ACTIVATION'
      RETURNING name, roll_number, email
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found or already processed' });
    console.log(`[ACTIVATION REJECTED] ${rows[0].name} (${rows[0].roll_number})`);
    return res.json({ message: 'Rejected', student: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reject' });
  }
}

// ── GET /api/admin/evidence ───────────────────────────────────────────────────
export async function getEvidenceQueue(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT es.*, u.name AS student_name, u.roll_number,
        c.description AS competency_description,
        t.description AS ttf_description
      FROM evidence_submissions es
      JOIN users u ON u.id = es.student_id
      LEFT JOIN competencies c ON c.competency_code = es.competency_code
      LEFT JOIN ttfs t ON t.ttf_code = es.ttf_code
      WHERE es.status = 'PENDING'
      ORDER BY es.submitted_at
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch evidence queue' });
  }
}

// ── POST /api/admin/evidence/:id/approve ─────────────────────────────────────
export async function approveEvidence(req, res) {
  const { confirmed_rating } = req.body;
  if (!confirmed_rating || confirmed_rating < 1 || confirmed_rating > 5) {
    return res.status(400).json({ error: 'confirmed_rating (1-5) is required' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      UPDATE evidence_submissions
      SET status = 'APPROVED', confirmed_rating = $2, reviewed_at = now()
      WHERE id = $1 RETURNING *
    `, [req.params.id, confirmed_rating]);

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const ev = rows[0];

    // Update the actual rating record
    if (ev.target_type === 'COMPETENCY') {
      await client.query(`
        INSERT INTO competency_ratings (student_id, competency_code, confirmed_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, competency_code) DO UPDATE
          SET confirmed_rating = EXCLUDED.confirmed_rating, updated_at = now()
      `, [ev.student_id, ev.competency_code, confirmed_rating]);
    } else {
      await client.query(`
        INSERT INTO ttf_ratings (student_id, ttf_code, confirmed_rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, ttf_code) DO UPDATE
          SET confirmed_rating = EXCLUDED.confirmed_rating, updated_at = now()
      `, [ev.student_id, ev.ttf_code, confirmed_rating]);
    }

    return res.json({ message: 'Approved', evidence: ev });
  } finally {
    client.release();
  }
}

// ── POST /api/admin/evidence/:id/reject ──────────────────────────────────────
export async function rejectEvidence(req, res) {
  const { professor_comment } = req.body;
  if (!professor_comment) return res.status(400).json({ error: 'professor_comment is required' });

  try {
    const { rows } = await pool.query(`
      UPDATE evidence_submissions
      SET status = 'REJECTED', professor_comment = $2, reviewed_at = now()
      WHERE id = $1 RETURNING *
    `, [req.params.id, professor_comment]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reject' });
  }
}

// ── GET /api/admin/elective-changes ──────────────────────────────────────────
export async function getElectiveChanges(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT ecr.*, u.name AS student_name, u.roll_number,
        c1.description AS drop_course_name,
        c2.description AS add_course_name
      FROM elective_change_requests ecr
      JOIN users u ON u.id = ecr.student_id
      JOIN courses c1 ON c1.course_code = ecr.drop_course
      JOIN courses c2 ON c2.course_code = ecr.add_course
      WHERE ecr.status = 'PENDING'
      ORDER BY ecr.requested_at
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch elective changes' });
  }
}

// ── POST /api/admin/elective-changes/:id/approve ──────────────────────────────
export async function approveElectiveChange(req, res) {
  const client = await pool.connect();
  try {
    const { rows: changeRows } = await client.query(
      `SELECT * FROM elective_change_requests WHERE id = $1`, [req.params.id]
    );
    if (!changeRows.length) return res.status(404).json({ error: 'Not found' });
    const change = changeRows[0];

    // Swap the elective
    await client.query(
      `DELETE FROM elective_registrations WHERE student_id = $1 AND course_code = $2`,
      [change.student_id, change.drop_course]
    );

    const { rows: newCourse } = await client.query(
      `SELECT tc.term_code FROM term_courses tc WHERE tc.course_code = $1`, [change.add_course]
    );
    await client.query(
      `INSERT INTO elective_registrations (student_id, course_code, term_code) VALUES ($1,$2,$3)`,
      [change.student_id, change.add_course, newCourse[0].term_code]
    );

    await client.query(`
      UPDATE elective_change_requests
      SET status = 'APPROVED', professor_comment = $2, resolved_at = now()
      WHERE id = $1
    `, [req.params.id, req.body.professor_comment || null]);

    return res.json({ message: 'Elective change approved' });
  } finally {
    client.release();
  }
}

// ── POST /api/admin/elective-changes/:id/reject ───────────────────────────────
export async function rejectElectiveChange(req, res) {
  const { professor_comment } = req.body;
  if (!professor_comment) return res.status(400).json({ error: 'professor_comment is required' });
  try {
    await pool.query(`
      UPDATE elective_change_requests
      SET status = 'REJECTED', professor_comment = $2, resolved_at = now()
      WHERE id = $1
    `, [req.params.id, professor_comment]);
    return res.json({ message: 'Rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reject' });
  }
}

// ── GET /api/admin/students ───────────────────────────────────────────────────
export async function getStudents(req, res) {
  const { q } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.roll_number, u.section, u.email, u.status,
        srt.primary_category, srt.secondary_category,
        rc1.description AS primary_description,
        (SELECT COUNT(*) FROM elective_registrations er WHERE er.student_id = u.id) AS elective_count,
        (SELECT COUNT(*) FROM evidence_submissions es WHERE es.student_id = u.id AND es.status = 'APPROVED') AS approved_evidence
      FROM users u
      LEFT JOIN student_role_targets srt ON srt.student_id = u.id
      LEFT JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
      WHERE u.role = 'STUDENT'
        AND ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%' OR u.roll_number ILIKE '%' || $1 || '%')
      ORDER BY u.roll_number
    `, [q || null]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
}

// ── GET /api/admin/students/:id ───────────────────────────────────────────────
export async function getStudentProfile(req, res) {
  const { id } = req.params;
  try {
    const { rows: user } = await pool.query(
      `SELECT id, name, roll_number, section, email, status FROM users WHERE id = $1`, [id]
    );
    if (!user.length) return res.status(404).json({ error: 'Student not found' });

    const [targets, electives, evidence, counselling, mentoring] = await Promise.all([
      pool.query(`SELECT srt.*, rc1.description AS primary_description, rc2.description AS secondary_description
        FROM student_role_targets srt
        LEFT JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
        LEFT JOIN role_categories rc2 ON rc2.category_code = srt.secondary_category
        WHERE srt.student_id = $1`, [id]),
      pool.query(`SELECT er.*, c.description FROM elective_registrations er
        JOIN courses c ON c.course_code = er.course_code WHERE er.student_id = $1`, [id]),
      pool.query(`SELECT es.*, c.description AS comp_desc, t.description AS ttf_desc
        FROM evidence_submissions es
        LEFT JOIN competencies c ON c.competency_code = es.competency_code
        LEFT JOIN ttfs t ON t.ttf_code = es.ttf_code
        WHERE es.student_id = $1 ORDER BY es.submitted_at DESC`, [id]),
      pool.query(`SELECT * FROM counselling_requests WHERE student_id = $1 ORDER BY requested_at DESC`, [id]),
      pool.query(`SELECT ma.*, m.name AS mentor_name, m.designation, m.company,
        json_agg(json_build_object('date', msl.session_date, 'topics', msl.topics_covered,
          'outcomes', msl.outcomes, 'duration', msl.duration_mins)
          ORDER BY msl.session_date DESC) FILTER (WHERE msl.id IS NOT NULL) AS sessions
        FROM mentor_assignments ma
        JOIN mentors m ON m.id = ma.mentor_id
        LEFT JOIN mentor_session_logs msl ON msl.assignment_id = ma.id
        WHERE ma.student_id = $1 GROUP BY ma.id, m.name, m.designation, m.company`, [id]),
    ]);

    return res.json({
      student:     user[0],
      targets:     targets.rows[0]  || null,
      electives:   electives.rows,
      evidence:    evidence.rows,
      counselling: counselling.rows,
      mentoring:   mentoring.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch student profile' });
  }
}
