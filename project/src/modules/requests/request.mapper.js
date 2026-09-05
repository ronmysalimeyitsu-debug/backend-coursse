function toDTO(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function toHistoryDTO(row) {
    if (!row) return null;
    return {
        id: row.id,
        requestId: row.request_id,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        changedAt: row.changed_at
    };
}

module.exports = { toDTO, toHistoryDTO };