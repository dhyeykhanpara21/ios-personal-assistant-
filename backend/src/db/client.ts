import { createClient, Client, ResultSet, Row } from '@libsql/client';
import { config } from '../config.js';

let dbClient: Client | null = null;

function mapValueToHrana(val: any): { type: string; value?: string } {
  if (val === null || val === undefined) {
    return { type: 'null' };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { type: 'integer', value: String(val) };
    }
    return { type: 'float', value: String(val) };
  }
  if (typeof val === 'boolean') {
    return { type: 'integer', value: val ? '1' : '0' };
  }
  return { type: 'text', value: String(val) };
}

function parseHranaResult(result: any): ResultSet {
  const cols = (result.cols || []).map((c: any) => c.name);
  const rows = (result.rows || []).map((rowArr: any[]) => {
    const obj: any = {};
    cols.forEach((col: string, i: number) => {
      const cell = rowArr[i];
      if (cell === null || cell === undefined || cell.type === 'null') {
        obj[col] = null;
      } else if (cell.type === 'integer' || cell.type === 'float') {
        obj[col] = Number(cell.value);
      } else {
        obj[col] = cell.value;
      }
    });
    return obj;
  });

  return {
    columns: cols,
    columnTypes: (result.cols || []).map((c: any) => c.decltype || ''),
    rows: rows as unknown as Row[],
    rowsAffected: result.affected_row_count || 0,
    lastInsertRowid:
      result.last_insert_rowid !== undefined && result.last_insert_rowid !== null
        ? BigInt(result.last_insert_rowid)
        : undefined,
  } as ResultSet;
}

class TursoHttpClient {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace('libsql://', 'https://').replace(/\/$/, '');
    this.token = token;
  }

  async execute(stmtOrSql: string | { sql: string; args?: any[] }): Promise<ResultSet> {
    const sql = typeof stmtOrSql === 'string' ? stmtOrSql : stmtOrSql.sql;
    const rawArgs = typeof stmtOrSql === 'string' ? [] : (stmtOrSql.args || []);
    const args = Array.isArray(rawArgs) ? rawArgs.map(mapValueToHrana) : [];

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: { sql, args },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Turso HTTP ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as any;
    const firstResult = json.results?.[0];
    if (!firstResult) {
      throw new Error('Empty result from Turso pipeline');
    }

    if (firstResult.type === 'error') {
      throw new Error(firstResult.error?.message || 'Turso query error');
    }

    return parseHranaResult(firstResult.response?.result || {});
  }

  async batch(stmts: Array<string | { sql: string; args?: any[] }>): Promise<ResultSet[]> {
    const requests = stmts.map((s) => {
      const sql = typeof s === 'string' ? s : s.sql;
      const rawArgs = typeof s === 'string' ? [] : (s.args || []);
      const args = Array.isArray(rawArgs) ? rawArgs.map(mapValueToHrana) : [];
      return {
        type: 'execute',
        stmt: { sql, args },
      };
    });

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Turso HTTP ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as any;
    const results: ResultSet[] = [];
    for (const r of json.results || []) {
      if (r.type === 'error') {
        throw new Error(r.error?.message || 'Turso batch statement error');
      }
      results.push(parseHranaResult(r.response?.result || {}));
    }
    return results;
  }
}

export function getDb(): any {
  const url = (config.TURSO_DATABASE_URL || '').trim();
  const token = (config.TURSO_AUTH_TOKEN || '').trim();

  if (url.startsWith('file:')) {
    if (!dbClient) {
      dbClient = createClient({ url });
    }
    return dbClient;
  }

  return new TursoHttpClient(url, token);
}

export const db = getDb() as Client;
