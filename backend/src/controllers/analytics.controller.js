import pool from '../config/db.js';

// ── GET /api/analytics/peer-benchmark ────────────────────────────────────────
// Compare student's readiness against peers with same primary or secondary target
export async function getPeerBenchmark(req, res) {
  const studentId = req.user.id;
  try {
    // Get this student's targets
    const { rows: myTargets } = await pool.query(
      `SELECT primary_category, secondary_category FROM student_role_targets WHERE student_id = $1`,
      [studentId]
    );
    if (!myTargets.length) return res.json({ peer_count: 0, my_scores: null, peer_avg: null, peers: [] });

    const { primary_category, secondary_category } = myTargets[0];
    const categories = [primary_category, secondary_category].filter(Boolean);

    // Find peers — students who share primary OR secondary target
    const { rows: peers } = await pool.query(`
      SELECT DISTINCT srt.student_id, u.name, u.roll_number,
        srt.primary_category, srt.secondary_category
      FROM student_role_targets srt
      JOIN users u ON u.id = srt.student_id
      WHERE srt.student_id != $1
        AND (srt.primary_category = ANY($2) OR srt.secondary_category = ANY($2))
        AND u.status = 'ACTIVE'
    `, [studentId, categories]);

    // Helper: compute readiness for a student for a given category
    async function computeReadiness(sid, categoryCode) {
      const { rows: compRatings } = await pool.query(`
        SELECT COALESCE(cr.confirmed_rating, cr.self_rating, 0) AS rating
        FROM role_category_competencies rcc
        LEFT JOIN competency_ratings cr ON cr.competency_code = rcc.competency_code AND cr.student_id = $1
        WHERE rcc.category_code = $2
      `, [sid, categoryCode]);

      const { rows: ttfRatings } = await pool.query(`
        SELECT COALESCE(tr.confirmed_rating, tr.self_rating, 0) AS rating
        FROM role_category_ttfs rct
        LEFT JOIN ttf_ratings tr ON tr.ttf_code = rct.ttf_code AND tr.student_id = $1
        WHERE rct.category_code = $2
      `, [sid, categoryCode]);

      const compPct = compRatings.length
        ? Math.round((compRatings.reduce((s, r) => s + Number(r.rating), 0) / (compRatings.length * 5)) * 100)
        : 0;
      const ttfPct = ttfRatings.length
        ? Math.round((ttfRatings.reduce((s, r) => s + Number(r.rating), 0) / (ttfRatings.length * 5)) * 100)
        : 0;
      const overall = Math.round(compPct * 0.6 + ttfPct * 0.4);
      return { overall, competency: compPct, ttf: ttfPct };
    }

    // My scores for primary category
    const myScores = await computeReadiness(studentId, primary_category);

    // Peer scores
    const peerScores = await Promise.all(
      peers.map(async (p) => {
        const scores = await computeReadiness(p.student_id, primary_category);
        return { ...p, ...scores };
      })
    );

    // Averages
    const allScores = [...peerScores];
    const avg = (key) => allScores.length
      ? Math.round(allScores.reduce((s, p) => s + p[key], 0) / allScores.length)
      : 0;

    return res.json({
      primary_category,
      peer_count: peers.length,
      my_scores: myScores,
      peer_avg: { overall: avg('overall'), competency: avg('competency'), ttf: avg('ttf') },
      my_rank: allScores.filter((p) => p.overall > myScores.overall).length + 1,
      total_ranked: allScores.length + 1,
      peers: peerScores.sort((a, b) => b.overall - a.overall).slice(0, 10), // top 10 anonymised
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute peer benchmark' });
  }
}

// ── GET /api/analytics/career-pathway ────────────────────────────────────────
// Career pathway for the logged-in student
export async function getCareerPathway(req, res) {
  const studentId = req.user.id;
  try {
    const { rows: targets } = await pool.query(
      `SELECT srt.*, rc1.description AS primary_description, rc2.description AS secondary_description
       FROM student_role_targets srt
       JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
       LEFT JOIN role_categories rc2 ON rc2.category_code = srt.secondary_category
       WHERE srt.student_id = $1`,
      [studentId]
    );
    if (!targets.length) return res.json({ target: null, pathway: [] });

    const target = targets[0];
    const result = await buildPathway(studentId, target.primary_category);
    return res.json({ target, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to build career pathway' });
  }
}

// ── GET /api/analytics/career-pathway/:studentId ─────────────────────────────
// Admin view — career pathway for any student
export async function getCareerPathwayAdmin(req, res) {
  const { studentId } = req.params;
  try {
    const { rows: targets } = await pool.query(
      `SELECT srt.*, rc1.description AS primary_description
       FROM student_role_targets srt
       JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
       WHERE srt.student_id = $1`,
      [studentId]
    );
    if (!targets.length) return res.json({ target: null, pathway: [] });

    const result = await buildPathway(studentId, targets[0].primary_category);
    return res.json({ target: targets[0], ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to build career pathway' });
  }
}

async function buildPathway(studentId, categoryCode) {
  // All courses for this category (M and R)
  const { rows: courses } = await pool.query(`
    SELECT rcc.course_code, rcc.type, c.description, tc.term_code,
      CASE WHEN er.course_code IS NOT NULL THEN true ELSE false END AS registered
    FROM role_category_courses rcc
    JOIN courses c ON c.course_code = rcc.course_code
    JOIN term_courses tc ON tc.course_code = rcc.course_code
    LEFT JOIN elective_registrations er ON er.course_code = rcc.course_code AND er.student_id = $1
    WHERE rcc.category_code = $2
    ORDER BY rcc.type, tc.term_code
  `, [studentId, categoryCode]);

  // Competencies with current ratings
  const { rows: competencies } = await pool.query(`
    SELECT rcc.competency_code, c.description,
      COALESCE(cr.confirmed_rating, cr.self_rating, 0) AS rating,
      cr.confirmed_rating IS NOT NULL AS is_confirmed
    FROM role_category_competencies rcc
    JOIN competencies c ON c.competency_code = rcc.competency_code
    LEFT JOIN competency_ratings cr ON cr.competency_code = rcc.competency_code AND cr.student_id = $1
    WHERE rcc.category_code = $2
    ORDER BY rcc.competency_code
  `, [studentId, categoryCode]);

  // TTFs with ratings
  const { rows: ttfs } = await pool.query(`
    SELECT rct.ttf_code, t.description,
      COALESCE(tr.confirmed_rating, tr.self_rating, 0) AS rating,
      tr.confirmed_rating IS NOT NULL AS is_confirmed
    FROM role_category_ttfs rct
    JOIN ttfs t ON t.ttf_code = rct.ttf_code
    LEFT JOIN ttf_ratings tr ON tr.ttf_code = rct.ttf_code AND tr.student_id = $1
    WHERE rct.category_code = $2
    ORDER BY rct.ttf_code
  `, [studentId, categoryCode]);

  // Missing mandatory courses
  const missedMandatory = courses.filter((c) => c.type === 'M' && !c.registered);

  return {
    courses,
    competencies,
    ttfs,
    missed_mandatory: missedMandatory,
    recommendations: missedMandatory.slice(0, 3).map((c) => ({
      course_code: c.course_code,
      description: c.description,
      term_code:   c.term_code,
      reason:      `Mandatory for your target role category`,
    })),
  };
}

// ── GET /api/analytics/role-analytics ────────────────────────────────────────
// Admin: pick a role category, see all students with that as primary/secondary
export async function getRoleAnalytics(req, res) {
  const { category } = req.query;
  try {
    // All role categories for the dropdown
    const { rows: categories } = await pool.query(
      `SELECT category_code, description FROM role_categories ORDER BY description`
    );

    if (!category) return res.json({ categories, students: [] });

    // Students with this as primary or secondary target
    const { rows: students } = await pool.query(`
      SELECT u.id, u.name, u.roll_number, u.section,
        srt.primary_category, srt.secondary_category,
        rc1.description AS primary_description,
        rc2.description AS secondary_description
      FROM student_role_targets srt
      JOIN users u ON u.id = srt.student_id
      LEFT JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
      LEFT JOIN role_categories rc2 ON rc2.category_code = srt.secondary_category
      WHERE u.status = 'ACTIVE'
        AND (srt.primary_category = $1 OR srt.secondary_category = $1)
      ORDER BY u.roll_number
    `, [category]);

    // Compute readiness for each student
    const result = await Promise.all(students.map(async (s) => {
      const { rows: compRatings } = await pool.query(`
        SELECT COALESCE(cr.confirmed_rating, cr.self_rating, 0) AS rating
        FROM role_category_competencies rcc
        LEFT JOIN competency_ratings cr ON cr.competency_code = rcc.competency_code AND cr.student_id = $1
        WHERE rcc.category_code = $2
      `, [s.id, category]);

      const { rows: ttfRatings } = await pool.query(`
        SELECT COALESCE(tr.confirmed_rating, tr.self_rating, 0) AS rating
        FROM role_category_ttfs rct
        LEFT JOIN ttf_ratings tr ON tr.ttf_code = rct.ttf_code AND tr.student_id = $1
        WHERE rct.category_code = $2
      `, [s.id, category]);

      const compPct = compRatings.length
        ? Math.round((compRatings.reduce((a, r) => a + Number(r.rating), 0) / (compRatings.length * 5)) * 100)
        : 0;
      const ttfPct = ttfRatings.length
        ? Math.round((ttfRatings.reduce((a, r) => a + Number(r.rating), 0) / (ttfRatings.length * 5)) * 100)
        : 0;
      const overall = Math.round(compPct * 0.6 + ttfPct * 0.4);

      return {
        ...s,
        is_primary:   s.primary_category === category,
        is_secondary: s.secondary_category === category,
        overall, competency: compPct, ttf: ttfPct,
      };
    }));

    // Sort by overall desc
    result.sort((a, b) => b.overall - a.overall);

    // Class averages
    const avg = (key) => result.length
      ? Math.round(result.reduce((s, r) => s + r[key], 0) / result.length)
      : 0;

    return res.json({
      categories,
      category_description: categories.find((c) => c.category_code === category)?.description,
      students: result,
      averages: { overall: avg('overall'), competency: avg('competency'), ttf: avg('ttf') },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute role analytics' });
  }
}

// ── GET /api/analytics/evidence-gallery ──────────────────────────────────────
// Student's approved evidence as a portfolio
export async function getEvidenceGallery(req, res) {
  const studentId = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT es.id, es.target_type, es.evidence_type, es.description,
        es.evidence_link, es.self_rating, es.confirmed_rating,
        es.submitted_at, es.reviewed_at,
        c.description AS competency_description,
        t.description AS ttf_description,
        es.professor_comment
      FROM evidence_submissions es
      LEFT JOIN competencies c ON c.competency_code = es.competency_code
      LEFT JOIN ttfs t ON t.ttf_code = es.ttf_code
      WHERE es.student_id = $1 AND es.status = 'APPROVED'
      ORDER BY es.reviewed_at DESC
    `, [studentId]);

    const summary = {
      total:         rows.length,
      certifications: rows.filter((r) => r.evidence_type === 'Certification').length,
      live_projects:  rows.filter((r) => r.evidence_type === 'Live Project').length,
      mock_projects:  rows.filter((r) => r.evidence_type === 'Mock Project').length,
      internships:    rows.filter((r) => r.evidence_type === 'Internship').length,
      avg_rating:    rows.length
        ? (rows.reduce((s, r) => s + Number(r.confirmed_rating), 0) / rows.length).toFixed(1)
        : 0,
    };

    return res.json({ evidence: rows, summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch evidence gallery' });
  }
}
