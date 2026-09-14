import 'dotenv/config';
import { SignJWT, jwtVerify } from 'jose';

// Fail early: an API that signs tokens with an empty secret is worse
// than an API that refuses to start.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const ALGORITHM = 'HS256';
const ISSUER = process.env.JWT_ISSUER ?? 'backend-course-api';
const AUDIENCE = process.env.JWT_AUDIENCE ?? 'backend-course-client';

export const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS ?? 3600);

export async function issueToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return await new SignJWT({ role: user.role ?? 'requester' })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(String(user.id))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_TTL_SECONDS)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(SECRET_KEY);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE
  });
  return payload;
}