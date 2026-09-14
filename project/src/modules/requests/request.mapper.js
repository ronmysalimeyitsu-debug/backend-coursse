// The single bridge between SQL rows (snake_case) and the HTTP
// representation the contract promises (camelCase). A row is not
// automatically the HTTP response.

export function mapRequestRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHistoryRow(row) {
  if (!row) return null;
  return {
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: row.changed_by ?? null,
    changedAt: row.changed_at
  };
}