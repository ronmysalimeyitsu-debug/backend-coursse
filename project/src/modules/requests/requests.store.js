const db = require('../../database/pool');

class RequestsStore {
    async findAll(client = db) {
        const query = 'SELECT id, title, status, created_at, updated_at FROM requests ORDER BY created_at DESC';
        const result = await client.query(query);
        return result.rows;
    }

    async findById(id, client = db) {
        const query = 'SELECT id, title, status, created_at, updated_at FROM requests WHERE id = $1';
        const result = await client.query(query, [id]);
        return result.rows[0];
    }

    async create(title, client = db) {
        const query = `
            INSERT INTO requests (title, status, created_at, updated_at) 
            VALUES ($1, 'open', NOW(), NOW()) 
            RETURNING id, title, status, created_at, updated_at
        `;
        const result = await client.query(query, [title]);
        return result.rows[0];
    }

    async updateStatus(id, newStatus, client = db) {
        const query = `
            UPDATE requests 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING id, title, status, created_at, updated_at
        `;
        const result = await client.query(query, [newStatus, id]);
        return result.rows[0];
    }

    async addHistory(requestId, previousStatus, newStatus, client = db) {
        const query = `
            INSERT INTO request_status_history (request_id, previous_status, new_status, changed_at) 
            VALUES ($1, $2, $3, NOW()) 
            RETURNING id, request_id, previous_status, new_status, changed_at
        `;
        const result = await client.query(query, [requestId, previousStatus, newStatus]);
        return result.rows[0];
    }

    async findHistoryByRequestId(requestId, client = db) {
        const query = `
            SELECT id, request_id, previous_status, new_status, changed_at 
            FROM request_status_history 
            WHERE request_id = $1 
            ORDER BY changed_at DESC
        `;
        const result = await client.query(query, [requestId]);
        return result.rows;
    }
}

module.exports = new RequestsStore();