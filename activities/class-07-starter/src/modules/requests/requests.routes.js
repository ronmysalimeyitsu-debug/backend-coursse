// src/modules/requests/requests.routes.js
import express from 'express';
import {
  listRequests,
  getRequest,
  createRequest,
  patchRequest,
  getHistory
} from './requests.service.js';
import { respondError } from '../../http/respond-error.js';

const router = express.Router();

// Lista blanca de prioridades aceptadas por el negocio
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

// Guarda para validar que el ID sea un número entero positivo (INC-701)
function isValidId(idParam) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0;
}

// Guarda para validar que la prioridad pertenezca al Enum (INC-702)
function isInvalidPriority(priority) {
  if (typeof priority !== 'string') return true;
  return !ALLOWED_PRIORITIES.includes(priority.toLowerCase());
}

// GET /requests — Listar solicitudes
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    res.status(200).json(await listRequests(req.auth, { status, priority }));
  } catch (error) {
    respondError(res, error);
  }
});

// GET /requests/:id — Consultar solicitud por ID
router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST_ID',
          message: 'Request id must be a positive integer.'
        }
      });
    }
    res.status(200).json(await getRequest(req.auth, Number(req.params.id)));
  } catch (error) {
    respondError(res, error);
  }
});

// GET /requests/:id/history — Consultar historial
router.get('/:id/history', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST_ID',
          message: 'Request id must be a positive integer.'
        }
      });
    }
    res.status(200).json(await getHistory(req.auth, Number(req.params.id)));
  } catch (error) {
    respondError(res, error);
  }
});

// POST /requests — Crear solicitud
router.post('/', async (req, res) => {
  try {
    if (req.body?.priority) {
      if (isInvalidPriority(req.body.priority)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PRIORITY',
            message: 'Priority must be LOW, MEDIUM, or HIGH.'
          }
        });
      }
      req.body.priority = req.body.priority.toLowerCase();
    }
    res.status(201).json(await createRequest(req.auth, req.body));
  } catch (error) {
    respondError(res, error);
  }
});

// PATCH /requests/:id — Actualización parcial de solicitud
router.patch('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST_ID',
          message: 'Request id must be a positive integer.'
        }
      });
    }
    if (req.body?.priority) {
      if (isInvalidPriority(req.body.priority)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PRIORITY',
            message: 'Priority must be LOW, MEDIUM, or HIGH.'
          }
        });
      }
      req.body.priority = req.body.priority.toLowerCase();
    }
    res.status(200).json(await patchRequest(req.auth, Number(req.params.id), req.body));
  } catch (error) {
    respondError(res, error);
  }
});

export default router;