import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  const clientHeader = req.headers['x-request-id'];
  // Expresión regular estricta para prevenir inyecciones
  const safePattern = /^[a-zA-Z0-9._-]{1,64}$/;

  let id;
  if (clientHeader && safePattern.test(clientHeader)) {
    id = clientHeader;
  } else {
    id = `req_${randomUUID()}`;
  }

  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  // Interceptamos res.json para asegurar que CUALQUIER objeto JSON devuelto 
  // por la API incluya automáticamente el requestId en su cuerpo (body).
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      if (!body.requestId) {
        body.requestId = id;
      }
    }
    return originalJson(body);
  };

  next();
}