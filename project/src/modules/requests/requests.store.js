import { pool } from '../../database/pool.js';

const REQUEST_COLUMNS = `
  id,
  title,
  description,
  priority,
  status,
  created_by,
  created_at,
  updated_at
`;

export async function findAll(filters = {}, db = pool) {
  const conditions = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.priority) {
    values.push(filters.priority);
    conditions.push(`priority = $${values.length}`);
  }
  if (filters.createdBy) {
    values.push(filters.createdBy);
    conditions.push(`created_by = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT ${REQUEST_COLUMNS} FROM requests ${where} ORDER BY id`,
    values
  );
  return result.rows;
}

export async function findById(id, db = pool) {
  const result = await db.query(
    `SELECT ${REQUEST_COLUMNS} FROM requests WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertRequest({ title, description, priority, createdBy }, db = pool) {
  const result = await db.query(
    `INSERT INTO requests (title, description, priority, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING ${REQUEST_COLUMNS}`,
    [title, description, priority, createdBy]
  );
  return result.rows[0];
}

export async function updateRequest(id, changes, db = pool) {
  const assignments = [];
  const values = [];

  for (const field of ['title', 'description', 'priority', 'status']) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${field} = $${values.length}`);
    }
  }

  values.push(id);
  const result = await db.query(
    `UPDATE requests
     SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING ${REQUEST_COLUMNS}`,
    values
  );
  return result.rows[0] ?? null;
}

export async function insertStatusHistory(requestId, previousStatus, newStatus, db = pool, changedBy = null) {
  await db.query(
    `INSERT INTO request_status_history (request_id, previous_status, new_status, changed_by)
     VALUES ($1, $2, $3, $4)`,
    [requestId, previousStatus, newStatus, changedBy]
  );
}

export async function findHistory(requestId, db = pool) {
  const result = await db.query(
    `SELECT previous_status, new_status, changed_by, changed_at
     FROM request_status_history
     WHERE request_id = $1
     ORDER BY id`,
    [requestId]
  );
  return result.rows;
}