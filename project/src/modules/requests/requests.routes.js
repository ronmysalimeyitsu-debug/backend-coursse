import { Router } from 'express';
import { requestsStore } from './requests.store.js';
import { isValidStatus, isTerminal, canTransition } from './request-status.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(requestsStore.getAll());
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: { code: 'MISSING_TITLE', message: 'El título es obligatorio' } });
  }
  const created = requestsStore.create({ title });
  res.status(201).json(created);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;
  const item = requestsStore.getById(id);

  if (!item) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Solicitud no encontrada' } });
  }
  if (!isValidStatus(nextStatus)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Estado no válido' } });
  }
  if (isTerminal(item.status)) {
    return res.status(409).json({ error: { code: 'REQUEST_IN_TERMINAL_STATUS', message: 'La solicitud está en un estado terminal' } });
  }
  if (!canTransition(item.status, nextStatus)) {
    return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: `No se puede pasar de ${item.status} a${nextStatus}` } });
  }

  const updated = requestsStore.updateStatus(id, nextStatus);
  res.json(updated);
});

export default router;