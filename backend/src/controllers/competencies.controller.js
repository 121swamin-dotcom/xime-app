import pool from '../config/db.js';

// ── GET /api/competencies ─────────────────────────────────────────────────────
// Returns competencies + TTFs for student's primary & secondary targets
// with current ratings
export async function getMyCompetencies(req, res) {
  const studentId = req.user.id;
  try {
    const { rows: targets } = await pool.query(
      `SELECT primary_category, secondary_category FROM student_role_targets WHERE student_id = $1`,
      [studentId]
    );
    if (!targets.length) return res.json({ competencies: [], ttfs: [], targets: null });

    const target = targets[0];
    const categories = [target.primary_category, target.secondary_category].filter(Boolean);

    // Baseline TTFs always available (T3 core)
    const BASELINE_TTFS = ['TTF03','TTF07','TTF22','TTF23','TTF45'];

    // Competencies for target categories
    const { rows: comps } = await pool.query(`
      SELECT DISTINCT rcc.competency_code, rcc.category_code, c.description,
        cr.self_rating, cr.confirmed_rating, cr.updated_at,
        rc.description AS category_description
      FROM role_category_competencies rcc
      JOIN competencies c ON c.competency_code = rcc.competency_code
      JOIN role_categories rc ON rc.category_code = rcc.category_code
      LEFT JOIN competency_ratings cr
        ON cr.competency_code = rcc.competency_code AND cr.student_id = $1
      WHERE rcc.category_code = ANY($2)
      ORDER BY rcc.category_code, rcc.competency_code
    `, [studentId, categories]);

    // TTFs for target categories + baseline
    const { rows: ttfs } = await pool.query(`
      SELECT DISTINCT rct.ttf_code, rct.category_code, t.description,
        tr.self_rating, tr.confirmed_rating, tr.updated_at,
        rc.description AS category_description,
        (rct.ttf_code = ANY($3)) AS is_baseline
      FROM role_category_ttfs rct
      JOIN ttfs t ON t.ttf_code = rct.ttf_code
      JOIN role_categories rc ON rc.category_code = rct.category_code
      LEFT JOIN ttf_ratings tr
        ON tr.ttf_code = rct.ttf_code AND tr.student_id = $1
      WHERE rct.category_code = ANY($2)
      UNION
      SELECT DISTINCT t.ttf_code, NULL, t.description,
        tr.self_rating, tr.confirmed_rating, tr.updated_at,
        'Baseline (T3 Core)' AS category_description, true AS is_baseline
      FROM ttfs t
      LEFT JOIN ttf_ratings tr ON tr.ttf_code = t.ttf_code AND tr.student_id = $1
      WHERE t.ttf_code = ANY($3)
      ORDER BY category_description, ttf_code
    `, [studentId, categories, BASELINE_TTFS]);

    return res.json({ competencies: comps, ttfs, target });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch competencies' });
  }
}

// ── POST /api/competencies/rate ───────────────────────────────────────────────
export async function rateCompetency(req, res) {
  const { competency_code, self_rating } = req.body;
  if (!competency_code || !self_rating || self_rating < 1 || self_rating > 5) {
    return res.status(400).json({ error: 'competency_code and self_rating (1-5) required' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO competency_ratings (student_id, competency_code, self_rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id, competency_code) DO UPDATE
        SET self_rating = EXCLUDED.self_rating, updated_at = now()
      RETURNING *
    `, [req.user.id, competency_code, self_rating]);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save rating' });
  }
}

// ── POST /api/competencies/rate-ttf ──────────────────────────────────────────
export async function rateTTF(req, res) {
  const { ttf_code, self_rating } = req.body;
  if (!ttf_code || !self_rating || self_rating < 1 || self_rating > 5) {
    return res.status(400).json({ error: 'ttf_code and self_rating (1-5) required' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO ttf_ratings (student_id, ttf_code, self_rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id, ttf_code) DO UPDATE
        SET self_rating = EXCLUDED.self_rating, updated_at = now()
      RETURNING *
    `, [req.user.id, ttf_code, self_rating]);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save TTF rating' });
  }
}

// ── GET /api/competencies/evidence ───────────────────────────────────────────
export async function getEvidence(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT es.*,
        c.description AS competency_description,
        t.description AS ttf_description
      FROM evidence_submissions es
      LEFT JOIN competencies c ON c.competency_code = es.competency_code
      LEFT JOIN ttfs t ON t.ttf_code = es.ttf_code
      WHERE es.student_id = $1
      ORDER BY es.submitted_at DESC
    `, [req.user.id]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch evidence' });
  }
}

// ── POST /api/competencies/evidence ──────────────────────────────────────────
export async function submitEvidence(req, res) {
  const { target_type, competency_code, ttf_code, evidence_type, description, evidence_link, self_rating } = req.body;
  if (!target_type || !evidence_type || !description || !evidence_link || !self_rating) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (target_type === 'COMPETENCY' && !competency_code) {
    return res.status(400).json({ error: 'competency_code required for COMPETENCY type' });
  }
  if (target_type === 'TTF' && !ttf_code) {
    return res.status(400).json({ error: 'ttf_code required for TTF type' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO evidence_submissions
        (student_id, target_type, competency_code, ttf_code, evidence_type, description, evidence_link, self_rating)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [req.user.id, target_type, competency_code || null, ttf_code || null,
        evidence_type, description, evidence_link, self_rating]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit evidence' });
  }
}
