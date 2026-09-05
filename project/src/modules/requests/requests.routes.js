const express = require('express');
const service = require('./requests.service');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const requests = await service.getAllRequests();
        res.json(requests);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const request = await service.getRequestById(req.params.id);
        res.json(request);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const request = await service.createRequest(req.body);
        res.status(201).json(request);
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        const request = await service.updateRequestStatus(req.params.id, status);
        res.json(request);
    } catch (err) {
        next(err);
    }
});

router.get('/:id/history', async (req, res, next) => {
    try {
        const history = await service.getRequestHistory(req.params.id);
        res.json(history);
    } catch (err) {
        next(err);
    }
});

module.exports = router;