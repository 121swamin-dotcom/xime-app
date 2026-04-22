const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

pool.query("SELECT password_hash, status FROM users WHERE roll_number = 'ADMIN/001'")
  .then(async (r) => {
    console.log('Status:', r.rows[0].status);
    console.log('Hash prefix:', r.rows[0].password_hash.substring(0, 7));
    const match = await bcrypt.compare('Admin1234', r.rows[0].password_hash);
    console.log('Password match:', match);
    pool.end();
  })
  .catch(e => { console.error(e.message); pool.end(); });