// ============================================================================
// STARTER NOTE — Station 5.
//
// Authentication middleware: establishes WHO the actor is, nothing more.
// What the actor may DO is authorization and lives in the module policies.
//
// Contract:
//   * read the Authorization header; require exactly the Bearer scheme
//     ("Basic ...", a bare token or an empty Bearer are not identities)
//     -> AppError('auth', 'AUTHENTICATION_REQUIRED', ...);
//   * verify the token with verifyToken (never just decode it);
//     any verification failure (altered, expired, wrong issuer/audience)
//     -> AppError('auth', 'INVALID_TOKEN', ...) — one same answer, the
//     response never explains which check failed;
//   * on success, build the ONLY trusted source of identity:
//       req.auth = { userId: payload.sub, role: payload.role }
//     and call next().
//
// Errors are answered here with respondError (middlewares do not reach the
// router's try/catch).
// ============================================================================
import { AppError } from '../app-error.js';
import { respondError } from '../http/respond-error.js';
import { verifyToken } from '../modules/auth/token.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('auth', 'AUTHENTICATION_REQUIRED', 'Authorization header with Bearer token is required.');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError('auth', 'AUTHENTICATION_REQUIRED', 'Bearer token cannot be empty.');
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch (err) {
      throw new AppError('auth', 'INVALID_TOKEN', 'The provided token is invalid or expired.');
    }

    req.auth = {
      userId: payload.sub,
      role: payload.role
    };

    next();
  } catch (error) {
    respondError(res, error);
  }
}