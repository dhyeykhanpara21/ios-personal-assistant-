import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { AuthPayload, AppEnv } from '../types/index.js';

export async function getOrCreateDefaultUser(): Promise<{ id: string; email: string }> {
  try {
    const userResult = await db.execute('SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1');
    if (userResult.rows.length > 0) {
      return {
        id: String(userResult.rows[0].id),
        email: String(userResult.rows[0].email),
      };
    }

    const defaultId = 'user_siri_default';
    const email = 'user@luphonix.local';
    const now = new Date().toISOString();

    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password_hash, timezone, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [defaultId, 'Luphonix User', email, 'siri-auth-user', 'UTC', now],
    });

    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_preferences (user_id, daily_water_goal_ml, updated_at) VALUES (?, 2000, ?)',
      args: [defaultId, now],
    });

    return { id: defaultId, email };
  } catch (err) {
    return { id: 'user_siri_default', email: 'user@luphonix.local' };
  }
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  // 1. Check Authorization header: Bearer <token>
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check x-api-key header
  if (!token) {
    const xApiKey = c.req.header('x-api-key');
    if (xApiKey) token = xApiKey.trim();
  }

  // 3. Check URL query parameters (?apiKey=... or ?token=... or ?key=...)
  if (!token) {
    token = c.req.query('apiKey') || c.req.query('token') || c.req.query('key');
  }

  if (!token) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized: Missing token or apiKey. Provide an Authorization header or include ?apiKey= in the URL.',
      },
      401
    );
  }

  // Check JWT validity
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    c.set('userId', decoded.userId);
    c.set('email', decoded.email);
    return await next();
  } catch {
    // If not a standard JWT, check if it matches master secret, webhook prefix, or master key
    if (
      token === config.JWT_SECRET ||
      token === 'luphonix-siri-master-key' ||
      token.startsWith('lpx_')
    ) {
      const user = await getOrCreateDefaultUser();
      c.set('userId', user.id);
      c.set('email', user.email);
      return await next();
    }

    return c.json(
      {
        success: false,
        error: 'Unauthorized: Invalid or expired token / apiKey',
      },
      401
    );
  }
}

