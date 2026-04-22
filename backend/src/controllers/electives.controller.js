import pool from '../config/db.js';

// ── GET /api/electives/targets ────────────────────────────────────────────────
export async function getTargets(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT srt.*, 
        rc1.description AS primary_description,
        rc2.description AS secondary_description
       FROM student_role_targets srt
       JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
       LEFT JOIN role_categories rc2 ON rc2.category_code = srt.secondary_category
       WHERE srt.student_id = $1`,
      [req.user.id]
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch targets' });
  }
}

// ── POST /api/electives/targets ───────────────────────────────────────────────
export async function setTargets(req, res) {
  const { primary_category, secondary_category } = req.body;
  if (!primary_category) {
    return res.status(400).json({ error: 'primary_category is required' });
  }
  if (secondary_category && secondary_category === primary_category) {
    return res.status(400).json({ error: 'Primary and secondary targets must be different' });
  }

  const client = await pool.connect();
  try {
    // Validate categories exist
    const { rows: cats } = await client.query(
      `SELECT category_code FROM role_categories WHERE category_code = ANY($1)`,
      [[primary_category, secondary_category].filter(Boolean)]
    );
    if (!cats.find((c) => c.category_code === primary_category)) {
      return res.status(400).json({ error: 'Invalid primary category' });
    }

    const { rows } = await client.query(
      `INSERT INTO student_role_targets (student_id, primary_category, secondary_category)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id) DO UPDATE
         SET primary_category   = EXCLUDED.primary_category,
             secondary_category = EXCLUDED.secondary_category,
             updated_at         = now()
       RETURNING *`,
      [req.user.id, primary_category, secondary_category || null]
    );
    return res.json(rows[0]);
  } finally {
    client.release();
  }
}

// ── GET /api/electives/registrations ─────────────────────────────────────────
export async function getRegistrations(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT er.course_code, er.term_code, er.registered_at,
              c.description AS course_description
       FROM elective_registrations er
       JOIN courses c ON c.course_code = er.course_code
       WHERE er.student_id = $1
       ORDER BY er.term_code, er.course_code`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch registrations' });
  }
}

// ── POST /api/electives/register ─────────────────────────────────────────────
export async function register(req, res) {
  const { course_codes } = req.body; // array of course codes to register

  if (!Array.isArray(course_codes) || course_codes.length === 0) {
    return res.status(400).json({ error: 'course_codes array is required' });
  }

  const client = await pool.connect();
  try {
    // Check student has set targets
    const { rows: targets } = await client.query(
      `SELECT id FROM student_role_targets WHERE student_id = $1`, [req.user.id]
    );
    if (!targets.length) {
      return res.status(400).json({ error: 'Please set your role targets before registering electives' });
    }

    // Validate all courses exist and are electives (T4-T6)
    const { rows: courses } = await client.query(
      `SELECT c.course_code, tc.term_code
       FROM courses c
       JOIN term_courses tc ON tc.course_code = c.course_code
       WHERE c.course_code = ANY($1) AND tc.term_code IN (4,5,6)`,
      [course_codes]
    );

    if (courses.length !== course_codes.length) {
      return res.status(400).json({ error: 'One or more courses are invalid or not electives' });
    }

    // Check per-term limit of 4
    const termGroups = courses.reduce((acc, c) => {
      acc[c.term_code] = (acc[c.term_code] || []);
      acc[c.term_code].push(c.course_code);
      return acc;
    }, {});

    for (const [term, codes] of Object.entries(termGroups)) {
      // Count existing registrations for this term
      const { rows: existing } = await client.query(
        `SELECT COUNT(*) FROM elective_registrations
         WHERE student_id = $1 AND term_code = $2`,
        [req.user.id, term]
      );
      const existingCount = parseInt(existing[0].count);
      if (existingCount + codes.length > 4) {
        return res.status(400).json({
          error: `Term ${term} would exceed 4 electives (already have ${existingCount})`
        });
      }
    }

    // Check for already registered courses
    const { rows: alreadyReg } = await client.query(
      `SELECT course_code FROM elective_registrations
       WHERE student_id = $1 AND course_code = ANY($2)`,
      [req.user.id, course_codes]
    );
    if (alreadyReg.length) {
      return res.status(409).json({
        error: `Already registered: ${alreadyReg.map((r) => r.course_code).join(', ')}`
      });
    }

    // Insert registrations
    for (const course of courses) {
      await client.query(
        `INSERT INTO elective_registrations (student_id, course_code, term_code)
         VALUES ($1, $2, $3)`,
        [req.user.id, course.course_code, course.term_code]
      );
    }

    return res.json({ message: 'Electives registered successfully', registered: course_codes });
  } finally {
    client.release();
  }
}

// ── GET /api/electives/role-fit ───────────────────────────────────────────────
// Computes role fit % for all 13 categories based on student's registered electives
export async function getRoleFit(req, res) {
  try {
    // Get student's registered courses
    const { rows: registered } = await pool.query(
      `SELECT course_code FROM elective_registrations WHERE student_id = $1`,
      [req.user.id]
    );
    const registeredCodes = registered.map((r) => r.course_code);

    // Get all role category course mappings
    const { rows: mappings } = await pool.query(
      `SELECT rcc.category_code, rcc.course_code, rcc.type, rc.description
       FROM role_category_courses rcc
       JOIN role_categories rc ON rc.category_code = rcc.category_code`
    );

    // Get student targets
    const { rows: targets } = await pool.query(
      `SELECT primary_category, secondary_category
       FROM student_role_targets WHERE student_id = $1`,
      [req.user.id]
    );
    const target = targets[0] || {};

    // Compute fit per category
    const categories = [...new Set(mappings.map((m) => m.category_code))];
    const result = categories.map((cat) => {
      const catMappings = mappings.filter((m) => m.category_code === cat);
      const mandatory   = catMappings.filter((m) => m.type === 'M');
      const recommended = catMappings.filter((m) => m.type === 'R');

      const mandatoryHit   = mandatory.filter((m) => registeredCodes.includes(m.course_code)).length;
      const recommendedHit = recommended.filter((m) => registeredCodes.includes(m.course_code)).length;

      const mandatoryPct   = mandatory.length   ? Math.round((mandatoryHit   / mandatory.length)   * 100) : 0;
      const recommendedPct = recommended.length ? Math.round((recommendedHit / recommended.length) * 100) : 0;
      const overallPct     = Math.round((mandatoryPct * 0.7) + (recommendedPct * 0.3));

      return {
        category_code:    cat,
        description:      catMappings[0]?.description,
        mandatory_total:  mandatory.length,
        mandatory_hit:    mandatoryHit,
        mandatory_pct:    mandatoryPct,
        recommended_total:recommended.length,
        recommended_hit:  recommendedHit,
        recommended_pct:  recommendedPct,
        overall_pct:      overallPct,
        is_primary:       cat === target.primary_category,
        is_secondary:     cat === target.secondary_category,
      };
    });

    result.sort((a, b) => b.overall_pct - a.overall_pct);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute role fit' });
  }
}

// ── GET /api/electives/change-requests ───────────────────────────────────────
export async function getChangeRequests(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ecr.*,
              c1.description AS drop_course_name,
              c2.description AS add_course_name
       FROM elective_change_requests ecr
       JOIN courses c1 ON c1.course_code = ecr.drop_course
       JOIN courses c2 ON c2.course_code = ecr.add_course
       WHERE ecr.student_id = $1
       ORDER BY ecr.requested_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch change requests' });
  }
}

// ── POST /api/electives/change-requests ──────────────────────────────────────
export async function requestChange(req, res) {
  const { drop_course, add_course, reason } = req.body;
  if (!drop_course || !add_course || !reason) {
    return res.status(400).json({ error: 'drop_course, add_course and reason are required' });
  }
  if (drop_course === add_course) {
    return res.status(400).json({ error: 'Drop and add courses must be different' });
  }

  const client = await pool.connect();
  try {
    // Confirm student is registered for the drop course
    const { rows: reg } = await client.query(
      `SELECT id FROM elective_registrations
       WHERE student_id = $1 AND course_code = $2`,
      [req.user.id, drop_course]
    );
    if (!reg.length) {
      return res.status(400).json({ error: 'You are not registered for the course to drop' });
    }

    // Check no pending request already exists
    const { rows: pending } = await client.query(
      `SELECT id FROM elective_change_requests
       WHERE student_id = $1 AND status = 'PENDING'`,
      [req.user.id]
    );
    if (pending.length) {
      return res.status(409).json({ error: 'You already have a pending change request' });
    }

    const { rows } = await client.query(
      `INSERT INTO elective_change_requests (student_id, drop_course, add_course, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, drop_course, add_course, reason]
    );
    return res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
}
