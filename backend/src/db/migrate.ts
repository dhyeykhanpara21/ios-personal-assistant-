import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const db = getDb();
  console.log('🔄 Running Turso database migrations...');

  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }
  let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Strip line comments (-- ...)
  schemaSql = schemaSql.replace(/--.*$/gm, '');

  // Split SQL commands by semicolon, ignoring empty whitespace
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (err) {
      console.error(`❌ Migration error on statement: "${statement.slice(0, 80)}..."`, err);
      throw err;
    }
  }

  console.log(`✅ Successfully executed ${statements.length} migration statements on Turso/libSQL.`);
}

// If run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
