import pool from '../config/db.js';

// ── GET /api/dashboard ────────────────────────────────────────────────────────
export async function getDashboard(req, res) {
  const studentId = req.user.id;
  try {
    // Role targets
    const { rows: targetRows } = await pool.query(
      `SELECT srt.*,
        rc1.description AS primary_description,
        rc2.description AS secondary_description
       FROM student_role_targets srt
       JOIN role_categories rc1 ON rc1.category_code = srt.primary_category
       LEFT JOIN role_categories rc2 ON rc2.category_code = srt.secondary_category
       WHERE srt.student_id = $1`,
      [studentId]
    );
    const target = targetRows[0] || null;

    // Registered electives
    const { rows: electives } = await pool.query(
      `SELECT er.course_code, er.term_code, c.description
       FROM elective_registrations er
       JOIN courses c ON c.course_code = er.course_code
       WHERE er.student_id = $1
       ORDER BY er.term_code, er.course_code`,
      [studentId]
    );

    // Competency readiness (primary target)
    let competencyReadiness = null;
    let ttfReadiness = null;

    if (target) {
      // Competency ratings for primary category
      const { rows: compRatings } = await pool.query(
        `SELECT cr.competency_code,
                COALESCE(cr.confirmed_rating, cr.self_rating, 0) AS effective_rating,
                cr.confirmed_rating IS NOT NULL AS is_confirmed
         FROM role_category_competencies rcc
         LEFT JOIN competency_ratings cr
           ON cr.competency_code = rcc.competency_code AND cr.student_id = $1
         WHERE rcc.category_code = $2`,
        [studentId, target.primary_category]
      );

      const ttfRows = await pool.query(
        `SELECT rct.ttf_code,
                COALESCE(tr.confirmed_rating, tr.self_rating, 0) AS effective_rating,
                tr.confirmed_rating IS NOT NULL AS is_confirmed
         FROM role_category_ttfs rct
         LEFT JOIN ttf_ratings tr
           ON tr.ttf_code = rct.ttf_code AND tr.student_id = $1
         WHERE rct.category_code = $2`,
        [studentId, target.primary_category]
      );

      const compTotal = compRatings.length;
      const compSum   = compRatings.reduce((s, r) => s + parseFloat(r.effective_rating), 0);
      const ttfTotal  = ttfRows.rows.length;
      const ttfSum    = ttfRows.rows.reduce((s, r) => s + parseFloat(r.effective_rating), 0);

      competencyReadiness = compTotal ? Math.round((compSum / (compTotal * 5)) * 100) : 0;
      ttfReadiness        = ttfTotal  ? Math.round((ttfSum  / (ttfTotal  * 5)) * 100) : 0;
    }

    const overallReadiness = target
      ? Math.round(competencyReadiness * 0.6 + ttfReadiness * 0.4)
      : null;

    // Evidence summary
    const { rows: evidenceSummary } = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM evidence_submissions WHERE student_id = $1
       GROUP BY status`,
      [studentId]
    );

    // Pending counselling count
    const { rows: counsellingRows } = await pool.query(
      `SELECT COUNT(*) FROM counselling_requests
       WHERE student_id = $1 AND status = 'PENDING'`,
      [studentId]
    );

    // Mentor assignment
    const { rows: mentorRows } = await pool.query(
      `SELECT ma.id, ma.assigned_at, m.name, m.designation, m.company,
              (SELECT COUNT(*) FROM mentor_session_logs msl WHERE msl.assignment_id = ma.id) AS session_count
       FROM mentor_assignments ma
       JOIN mentors m ON m.id = ma.mentor_id
       WHERE ma.student_id = $1 AND ma.is_active = true`,
      [studentId]
    );

    return res.json({
      target,
      electives,
      readiness: {
        competency: competencyReadiness,
        ttf:        ttfReadiness,
        overall:    overallReadiness,
      },
      evidence: {
        pending:  parseInt(evidenceSummary.find((e) => e.status === 'PENDING')?.count  || 0),
        approved: parseInt(evidenceSummary.find((e) => e.status === 'APPROVED')?.count || 0),
        rejected: parseInt(evidenceSummary.find((e) => e.status === 'REJECTED')?.count || 0),
      },
      pending_counselling: parseInt(counsellingRows[0].count),
      mentor: mentorRows[0] || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
}
