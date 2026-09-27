function formatLog(level, event, fields = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields
  });
}

export const logger = {
  info(event, fields) {
    console.log(formatLog('info', event, fields));
  },
  error(event, fields) {
    console.error(formatLog('error', event, fields));
  }
};

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    
    // ALLOWLIST ESTRICTA: Solo se registran campos permitidos y seguros
    // NUNCA se incluye req.headers ni req.body para proteger credenciales y tokens
    const fields = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs
    };

    if (res.statusCode >= 500) {
      logger.error('request_failed', fields);
    } else {
      logger.info('request_completed', fields);
    }
  });

  next();
}