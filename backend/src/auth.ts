import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
  };
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      res.status(401).json({ error: 'Invalid authentication token.' });
      return;
    }

    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(roles: readonly string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}