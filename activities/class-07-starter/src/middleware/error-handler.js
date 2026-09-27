import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

// Mapeo de categorías de negocio a códigos de estado HTTP
const CATEGORY_STATUS = {
  contract: 400,
  auth: 401,
  forbidden: 403,
  resource: 404,
  domain: 409
};

// Códigos de infraestructura que indican fallos de base de datos
const INFRASTRUCTURE_CODES = ['ECONNREFUSED', 'ETIMEDOUT', '57P01', '08006'];

export function errorHandler(error, req, res, next) {
  // 1. Si las cabeceras ya fueron enviadas, delegar al manejador por defecto de Express
  if (res.headersSent) {
    return next(error);
  }

  // CORREGIDO: Ahora busca primero en req.requestId (que es donde lo guarda request-id.js)
 const requestId = req.requestId || res.locals.requestId || req.id;

  // 2. Si el error es una instancia controlada de AppError
  if (error instanceof AppError) {
    const status = CATEGORY_STATUS[error.category] || 500;
    res.locals.errorCode = error.code;
    
    return res.status(status).json({
      error: {
        code: error.code,
        message: error.message
      },
      requestId
    });
  }

  // 3. Si el cuerpo de la petición no es un JSON válido
  if (error.type === 'entity.parse.failed') {
    res.locals.errorCode = 'INVALID_JSON';
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON payload in request body.'
      },
      requestId
    });
  }

  // 4. Si la base de datos no está disponible
  if (INFRASTRUCTURE_CODES.includes(error.code)) {
    res.locals.errorCode = 'DATABASE_UNAVAILABLE';
    logger.error('Database infrastructure unavailable:', {
      code: error.code,
      message: error.message
    });

    return res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable.'
      },
      requestId
    });
  }

  // 5. Fallback para cualquier otro error inesperado (INTERNAL_ERROR - 500)
  res.locals.errorCode = 'INTERNAL_ERROR';
  logger.error('Unexpected internal error:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.'
    },
    requestId
  });
}