import { AppError } from '../app-error.js';

/**
 * Middleware para capturar peticiones a rutas que no existen (404).
 */
export function notFound(req, res, next) {
  next(
    new AppError(
      'resource', 
      'ROUTE_NOT_FOUND', 
      `Route ${req.method} ${req.originalUrl} not found.`
    )
  );
}