import { createClient, Client } from '@libsql/client';
import { config } from '../config.js';

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    dbClient = createClient({
      url: config.TURSO_DATABASE_URL,
      authToken: config.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return dbClient;
}

export const db = getDb();
