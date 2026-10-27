import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { HttpError } from '../utils/http.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return null;
  // Tokens issued before a password change are no longer valid.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) return null;
  return user;
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) throw new HttpError(401, 'Please sign in to continue.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to do that.'));
    }
    next();
  };
