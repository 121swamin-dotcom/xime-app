import pool from '../config/db.js';

// ── GET /api/courses ──────────────────────────────────────────────────────────
// Returns all courses with their term and TTFs
export async function getCourses(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.course_code,
        c.description,
        c.design_principle,
        c.course_objectives,
        c.co1, c.co2, c.co3, c.co4, c.co5, c.co6,
        tc.term_code,
        t.description AS term_description,
        COALESCE(
          json_agg(
            json_build_object('ttf_code', tf.ttf_code, 'description', tf.description)
          ) FILTER (WHERE tf.ttf_code IS NOT NULL),
          '[]'
        ) AS ttfs
      FROM courses c
      JOIN term_courses tc ON tc.course_code = c.course_code
      JOIN terms t ON t.term_code = tc.term_code
      LEFT JOIN course_ttfs ct ON ct.course_code = c.course_code
      LEFT JOIN ttfs tf ON tf.ttf_code = ct.ttf_code
      GROUP BY c.course_code, tc.term_code, t.description
      ORDER BY tc.term_code, c.course_code
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

// ── GET /api/courses/:code ────────────────────────────────────────────────────
// Returns a single course with TTFs, prerequisites, and role category mappings
export async function getCourse(req, res) {
  const { code } = req.params;
  try {
    // Base course info
    const { rows: courseRows } = await pool.query(`
      SELECT
        c.course_code, c.description, c.design_principle, c.course_objectives,
        c.co1, c.co2, c.co3, c.co4, c.co5, c.co6,
        tc.term_code, t.description AS term_description
      FROM courses c
      JOIN term_courses tc ON tc.course_code = c.course_code
      JOIN terms t ON t.term_code = tc.term_code
      WHERE c.course_code = $1
    `, [code.toUpperCase()]);

    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });

    // TTFs
    const { rows: ttfRows } = await pool.query(`
      SELECT tf.ttf_code, tf.description
      FROM course_ttfs ct
      JOIN ttfs tf ON tf.ttf_code = ct.ttf_code
      WHERE ct.course_code = $1
    `, [code.toUpperCase()]);

    // Prerequisites
    const { rows: prereqRows } = await pool.query(`
      SELECT c.course_code, c.description
      FROM course_prerequisites cp
      JOIN courses c ON c.course_code = cp.prereq_code
      WHERE cp.course_code = $1
    `, [code.toUpperCase()]);

    // Role category mappings (M/R)
    const { rows: roleRows } = await pool.query(`
      SELECT rcc.category_code, rc.description AS category_description, rcc.type
      FROM role_category_courses rcc
      JOIN role_categories rc ON rc.category_code = rcc.category_code
      WHERE rcc.course_code = $1
      ORDER BY rcc.type, rc.description
    `, [code.toUpperCase()]);

    return res.json({
      ...courseRows[0],
      ttfs: ttfRows,
      prerequisites: prereqRows,
      role_mappings: roleRows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
}
