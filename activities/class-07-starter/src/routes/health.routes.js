import express from 'express';
import { pool } from '../database/pool.js';

export function createHealthRouter({ checkDatabase } = {}) {
  const router = express.Router();

  // Consulta por defecto ligera para verificar PostgreSQL
  const defaultCheck = async () => {
    await pool.query('SELECT 1');
  };
  const performCheck = checkDatabase || defaultCheck;

  // Sonda de vida (/health): Responde inmediatamente sin tocar la base de datos
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Sonda de disponibilidad (/ready): Comprueba el estado de PostgreSQL
  router.get('/ready', async (req, res) => {
    try {
      await performCheck();
      res.status(200).json({ status: 'ready', database: 'available' });
    } catch (error) {
      // Devuelve un 503 controlado sin exponer detalles internos de conexión, contraseñas o SQL
      res.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  });

  return router;
}

export const healthRoutes = createHealthRouter();