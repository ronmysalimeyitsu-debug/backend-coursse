import { pool } from '../../database/pool.js';

export async function insertUser({ email, passwordHash }) {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [email, passwordHash];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findByEmail(email) {
  const query = `SELECT * FROM users WHERE email = $1;`;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

export async function findById(id) {
  const query = `SELECT * FROM users WHERE id = $1;`;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}