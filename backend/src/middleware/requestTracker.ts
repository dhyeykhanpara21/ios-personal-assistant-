import { Context, Next } from 'hono';
import { deviceTracker } from '../services/deviceTracker.js';

export async function requestTrackerMiddleware(c: Context, next: Next) {
  const start = performance.now();
  const path = c.req.path;
  const method = c.req.method;

  // Let request proceed
  await next();

  const durationMs = performance.now() - start;
  const status = c.res.status || 200;

  // Don't log static asset requests (css, js, png, ico, fonts) to keep device log clean
  if (
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.json') ||
    path.endsWith('.svg') ||
    path.endsWith('.woff2')
  ) {
    return;
  }

  // Extract query parameters
  const query: Record<string, string> = {};
  const urlObj = new URL(c.req.url);
  urlObj.searchParams.forEach((val, key) => {
    // Mask apiKey partially for privacy
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
      query[key] = val.substring(0, 10) + '...';
    } else {
      query[key] = val;
    }
  });

  // Extract headers
  const headers: Record<string, string | undefined> = {
    'user-agent': c.req.header('user-agent'),
    'x-forwarded-for': c.req.header('x-forwarded-for'),
    'cf-connecting-ip': c.req.header('cf-connecting-ip'),
    'x-real-ip': c.req.header('x-real-ip'),
  };

  const userId = c.get ? c.get('userId') : undefined;

  // Record in tracker
  deviceTracker.recordRequest({
    method,
    url: c.req.url,
    path,
    status,
    headers,
    query,
    durationMs,
    userId: typeof userId === 'string' ? userId : undefined,
  });
}
