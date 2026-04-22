import jwt from 'jsonwebtoken';

const STUDENT_TTL = '8h';
const ADMIN_TTL   = '4h';

export function signToken(payload) {
  const ttl = payload.role === 'ADMIN' ? ADMIN_TTL : STUDENT_TTL;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ttl });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
