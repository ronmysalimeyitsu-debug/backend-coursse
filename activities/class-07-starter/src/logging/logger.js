// Minimal structured logger: one JSON line per event, written to stdout
// (info) or stderr (error). No files, no external services — the point of
// this class is deciding WHAT to log, not learning a logging library.

function line(level, event, fields = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields
  });
}

export const logger = {
  info(event, fields) {
    console.log(line('info', event, fields));
  },
  error(event, fields) {
    console.error(line('error', event, fields));
  }
};

// Middleware de registro de peticiones (Allowlist estricta)
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;

    // Allowlist estricta: solo se registran campos deliberadamente permitidos.
    // NUNCA se registran req.headers ni req.body para evitar fugas de tokens o credenciales.
    const fields = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: status,
      durationMs: durationMs
    };

    // Añadir userId con criterio si existe en la sesión/request
    if (req.user && req.user.id) {
      fields.userId = req.user.id;
    }

    // Añadir errorCode si la respuesta marcó un error operativo
    if (res.errorCode) {
      fields.errorCode = res.errorCode;
    }

    // Decidir el nivel de severidad según el código de estado HTTP
    if (status >= 500) {
      logger.error('request_failed', fields);
    } else {
      logger.info('request_completed', fields);
    }
  });

  next();
}