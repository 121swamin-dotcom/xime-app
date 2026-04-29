import pool from '../config/db.js';

// GET /api/placements — all companies with their role category mappings
export async function getPlacements(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        co.id, co.company_name, co.role_name,
        COALESCE(
          json_agg(
            json_build_object(
              'category_code', rc.category_code,
              'description',   rc.description
            ) ORDER BY rc.description
          ) FILTER (WHERE rc.category_code IS NOT NULL),
          '[]'
        ) AS role_categories
      FROM companies co
      LEFT JOIN company_role_categories crc ON crc.company_id = co.id
      LEFT JOIN role_categories rc ON rc.category_code = crc.category_code
      GROUP BY co.id, co.company_name, co.role_name
      ORDER BY co.company_name, co.role_name
    `);

    // Group by company name
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.company_name]) {
        acc[row.company_name] = { company_name: row.company_name, roles: [] };
      }
      acc[row.company_name].roles.push({
        id:             row.id,
        role_name:      row.role_name,
        role_categories: row.role_categories,
      });
      return acc;
    }, {});

    return res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch placements' });
  }
}

// GET /api/placements/by-category/:code — companies for a specific role category
export async function getPlacementsByCategory(req, res) {
  const { code } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT co.company_name, co.role_name
      FROM companies co
      JOIN company_role_categories crc ON crc.company_id = co.id
      WHERE crc.category_code = $1
      ORDER BY co.company_name
    `, [code.toUpperCase()]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch placements' });
  }
}
