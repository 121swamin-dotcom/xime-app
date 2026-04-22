import pool from '../config/db.js';

// ── GET /api/roles/categories ─────────────────────────────────────────────────
// All 13 role categories with their competencies, TTFs, and M/R courses
export async function getRoleCategories(req, res) {
  try {
    const { rows: categories } = await pool.query(`
      SELECT category_code, description FROM role_categories ORDER BY description
    `);

    const { rows: competencies } = await pool.query(`
      SELECT rcc.category_code, rcc.competency_code, c.description
      FROM role_category_competencies rcc
      JOIN competencies c ON c.competency_code = rcc.competency_code
    `);

    const { rows: ttfs } = await pool.query(`
      SELECT rct.category_code, rct.ttf_code, t.description
      FROM role_category_ttfs rct
      JOIN ttfs t ON t.ttf_code = rct.ttf_code
    `);

    const { rows: courses } = await pool.query(`
      SELECT rcc.category_code, rcc.course_code, rcc.type, c.description
      FROM role_category_courses rcc
      JOIN courses c ON c.course_code = rcc.course_code
      ORDER BY rcc.type, c.course_code
    `);

    const { rows: roles } = await pool.query(`
      SELECT role_code, role_name, category_code FROM roles ORDER BY role_name
    `);

    // Merge everything into each category
    const result = categories.map((cat) => ({
      ...cat,
      competencies: competencies.filter((c) => c.category_code === cat.category_code),
      ttfs:         ttfs.filter((t) => t.category_code === cat.category_code),
      courses:      courses.filter((c) => c.category_code === cat.category_code),
      roles:        roles.filter((r) => r.category_code === cat.category_code),
    }));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch role categories' });
  }
}

// ── GET /api/roles/categories/:code ──────────────────────────────────────────
export async function getRoleCategory(req, res) {
  const { code } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT category_code, description FROM role_categories WHERE category_code = $1`,
      [code.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Role category not found' });

    const { rows: competencies } = await pool.query(`
      SELECT rcc.competency_code, c.description
      FROM role_category_competencies rcc
      JOIN competencies c ON c.competency_code = rcc.competency_code
      WHERE rcc.category_code = $1
    `, [code.toUpperCase()]);

    const { rows: ttfs } = await pool.query(`
      SELECT rct.ttf_code, t.description
      FROM role_category_ttfs rct
      JOIN ttfs t ON t.ttf_code = rct.ttf_code
      WHERE rct.category_code = $1
    `, [code.toUpperCase()]);

    const { rows: courses } = await pool.query(`
      SELECT rcc.course_code, rcc.type, c.description
      FROM role_category_courses rcc
      JOIN courses c ON c.course_code = rcc.course_code
      WHERE rcc.category_code = $1
      ORDER BY rcc.type, c.course_code
    `, [code.toUpperCase()]);

    const { rows: roles } = await pool.query(`
      SELECT role_code, role_name FROM roles
      WHERE category_code = $1 ORDER BY role_name
    `, [code.toUpperCase()]);

    return res.json({
      ...rows[0],
      competencies,
      ttfs,
      courses,
      roles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch role category' });
  }
}

// ── GET /api/roles/companies ──────────────────────────────────────────────────
export async function getCompanies(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        co.id, co.company_name, co.role_name,
        COALESCE(
          json_agg(
            json_build_object('category_code', crc.category_code, 'description', rc.description)
          ) FILTER (WHERE crc.category_code IS NOT NULL),
          '[]'
        ) AS role_categories
      FROM companies co
      LEFT JOIN company_role_categories crc ON crc.company_id = co.id
      LEFT JOIN role_categories rc ON rc.category_code = crc.category_code
      GROUP BY co.id, co.company_name, co.role_name
      ORDER BY co.company_name
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
}
