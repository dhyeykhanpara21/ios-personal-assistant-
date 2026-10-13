import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AuthPayload, AppEnv } from '../types/index.js';

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized: Missing or malformed Bearer token',
      },
      401
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    c.set('userId', decoded.userId);
    c.set('email', decoded.email);
    await next();
  } catch (err) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized: Invalid or expired token',
      },
      401
    );
  }
}
