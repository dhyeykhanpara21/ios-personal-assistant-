import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { serveStatic } from '@hono/node-server/serve-static';

import authApp from './routes/auth.js';
import tasksApp from './routes/tasks.js';
import remindersApp from './routes/reminders.js';
import hydrationApp from './routes/hydration.js';
import preferencesApp from './routes/preferences.js';
import syncApp from './routes/sync.js';

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: config.ALLOWED_ORIGIN === '*' ? '*' : config.ALLOWED_ORIGIN.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'Luphonix Backend API',
    database: 'Turso (libSQL)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.route('/api/auth', authApp);
app.route('/api/tasks', tasksApp);
app.route('/api/reminders', remindersApp);
app.route('/api/hydration', hydrationApp);
app.route('/api/preferences', preferencesApp);
app.route('/api/sync', syncApp);

// Central Error Handler
app.onError(errorHandler);

// Serve PWA Static Frontend
app.use('/*', serveStatic({ root: './public' }));

// 404 Route for unmatched API calls
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

// Export app for server and test usage
export default app;
