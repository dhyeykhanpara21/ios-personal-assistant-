import { serve } from '@hono/node-server';
import app from './index.js';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';

async function startServer() {
  try {
    // Automatically execute schema migrations on boot
    await runMigrations();

    console.log(`🚀 Luphonix API Server listening on http://localhost:${config.PORT}`);
    serve({
      fetch: app.fetch,
      port: config.PORT,
    });
  } catch (err) {
    console.error('Failed to start Luphonix API Server:', err);
    process.exit(1);
  }
}

startServer();
