const store = require('./requests.store');
const mapper = require('./request.mapper');
const { executeTransaction } = require('../../database/transaction');
const { isValidTransition } = require('./request-status');

class RequestsService {
    async getAllRequests() {
        const rows = await store.findAll();
        return rows.map(mapper.toDTO);
    }

    async getRequestById(id) {
        const row = await store.findById(id);
        if (!row) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }
        return mapper.toDTO(row);
    }

    async createRequest(data) {
        if (!data.title || data.title.trim() === '') {
            const error = new Error('Title is required');
            error.statusCode = 400;
            throw error;
        }
        const row = await store.create(data.title.trim());
        return mapper.toDTO(row);
    }

    async updateRequestStatus(id, newStatus) {
        return executeTransaction(async (client) => {
            const current = await store.findById(id, client);
            if (!current) {
                const error = new Error('Request not found');
                error.statusCode = 404;
                throw error;
            }

            if (!isValidTransition(current.status, newStatus)) {
                const error = new Error(`Invalid status transition from ${current.status} to ${newStatus}`);
                error.statusCode = 400;
                throw error;
            }

            const updated = await store.updateStatus(id, newStatus, client);
            await store.addHistory(id, current.status, newStatus, client);

            return mapper.toDTO(updated);
        });
    }

    async getRequestHistory(id) {
        const current = await store.findById(id);
        if (!current) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }
        const historyRows = await store.findHistoryByRequestId(id);
        return historyRows.map(mapper.toHistoryDTO);
    }
}

module.exports = new RequestsService();