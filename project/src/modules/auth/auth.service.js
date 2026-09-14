import { findByEmail, insertUser, findById } from '../users/users.store.js';
import { mapUserRow } from '../users/user.mapper.js';
import { hashPassword, verifyPassword } from './password.js';
import { issueToken } from './token.js';

function makeError(message, status, code) {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  err.code = code;
  return err;
}

export async function register(body) {
  if (!body || typeof body !== 'object') {
    throw makeError('Cuerpo de la petición inválido', 400, 'INVALID_BODY');
  }

  const allowedKeys = ['email', 'password'];
  const bodyKeys = Object.keys(body);
  const hasForbiddenKeys = bodyKeys.some(key => !allowedKeys.includes(key));

  if (hasForbiddenKeys) {
    throw makeError('El cuerpo contiene campos controlados por el servidor', 400, 'SERVER_CONTROLLED_FIELD');
  }

  const { email, password } = body;
  if (!email || typeof email !== 'string') {
    throw makeError('Formato de email inválido', 400, 'INVALID_EMAIL');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw makeError('Formato de email inválido', 400, 'INVALID_EMAIL');
  }

  if (!password || typeof password !== 'string' || password.length < 15 || password.length > 128) {
    throw makeError('La contraseña debe tener entre 15 y 128 caracteres', 400, 'INVALID_PASSWORD');
  }

  const existingUser = await findByEmail(normalizedEmail);
  if (existingUser) {
    throw makeError('No se puede crear la cuenta', 409, 'ACCOUNT_CANNOT_BE_CREATED');
  }

  const passwordHash = await hashPassword(password);
  const newUser = await insertUser({
    email: normalizedEmail,
    passwordHash
  });

  return mapUserRow(newUser);
}

export async function login(body) {
  const user = await findByEmail(body?.email);
  const isValid = user ? await verifyPassword(body?.password, user.password_hash) : false;

  if (!user || !isValid) {
    throw makeError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = await issueToken(user);

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: mapUserRow(user)
  };
}

export async function getCurrentUser(userId) {
  const user = await findById(userId);
  if (!user) {
    throw makeError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }
  return mapUserRow(user);
}