// Application setup: middlewares and module mounting. It does not open any
// port.
//
// TODO(OPS-703): Implementado el orden correcto para requestId, requestLogger, 
// healthRoutes, notFound y errorHandler.
import express from 'express';
import { corsPolicy } from './middleware/cors.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { healthRoutes } from './routes/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import requestsRoutes from './modules/requests/requests.routes.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { authenticate } from './middleware/authenticate.js';

const app = express();

// 1. CORS primero: preflights de navegador
app.use(corsPolicy);

// 2. Request ID: asigna un identificador único a cada petición
app.use(requestId);

// 3. Request Logger: registra la línea de log al finalizar
app.use(requestLogger);

// 4. JSON Body Parser: traduce cuerpos entrantes a req.body
app.use(express.json());

// 5. Health Routes: endpoints públicos de diagnóstico
app.use(healthRoutes);

// 6. Rutas de autenticación
app.use('/auth', authRoutes);

// 7. Rutas de negocio protegidas
app.use('/requests', authenticate, requestsRoutes);

// 8. Not Found (404): se ejecuta únicamente si ninguna ruta anterior coincidió
app.use(notFound);

// 9. Error Handler Central: ÚLTIMO middleware de la pila. 
// Captura y traduce cualquier error de los bloques anteriores.
app.use(errorHandler);

export default app;