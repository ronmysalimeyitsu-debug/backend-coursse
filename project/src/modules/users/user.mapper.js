export function mapUserRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at || row.createdAt
  };
}