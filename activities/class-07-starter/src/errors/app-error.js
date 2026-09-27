/**
 * Clase personalizada para manejar errores operacionales de negocio.
 */
export class AppError extends Error {
  constructor(category, code, message) {
    super(message);
    this.category = category;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}