import { Request, Response, NextFunction } from 'express';
import { db, User } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Express middleware to authenticate requests.
 * Checks for x-user-id and x-user-token in headers.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const userToken = req.headers['x-user-token'] as string;

  if (!userId || !userToken) {
    return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
  }

  try {
    const user = await db.getUserById(userId);
    if (!user || user.token !== userToken) {
      return res.status(401).json({ error: 'Unauthorized. Invalid session credentials.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error verifying user:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}
