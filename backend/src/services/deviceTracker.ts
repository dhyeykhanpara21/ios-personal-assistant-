import { db } from '../db/client.js';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'siri' | 'terminal';
  platform: string;
  ip: string;
  userAgent: string;
  firstSeen: string;
  lastSeen: string;
  requestCount: number;
  lastEndpoint: string;
  status: 'online' | 'idle' | 'offline';
  userId?: string;
}

export interface ClientRequestLog {
  id: string;
  timestamp: string;
  timeStr: string;
  method: string;
  url: string;
  path: string;
  status: number;
  ip: string;
  device: string;
  actionTag: string;
  params: Record<string, string>;
  isTaskAdd: boolean;
  isSuspiciousLoop: boolean;
  durationMs: number;
}

class DeviceTrackerService {
  private devices: Map<string, ConnectedDevice> = new Map();
  private requestLogs: ClientRequestLog[] = [];
  private readonly maxLogs = 300;
  private recentTaskAdds: { ip: string; time: number }[] = [];

  // Parse friendly client device name from User-Agent and headers
  public parseDevice(userAgent: string = '', isSiriQuery: boolean = false): { name: string; type: 'mobile' | 'desktop' | 'siri' | 'terminal'; platform: string } {
    const ua = userAgent.toLowerCase();

    if (isSiriQuery || ua.includes('shortcut') || ua.includes('cfnetwork') || ua.includes('darwin') && !ua.includes('chrome')) {
      return {
        name: 'Apple iPhone (Siri Shortcuts)',
        type: 'siri',
        platform: 'iOS'
      };
    }

    if (ua.includes('curl') || ua.includes('powershell') || ua.includes('postman') || ua.includes('httpclient')) {
      return {
        name: 'Terminal / cURL Client',
        type: 'terminal',
        platform: 'CLI'
      };
    }

    if (ua.includes('iphone')) {
      return {
        name: 'iPhone 16 Pro (Safari PWA)',
        type: 'mobile',
        platform: 'iOS'
      };
    }

    if (ua.includes('ipad')) {
      return {
        name: 'Apple iPad (Safari PWA)',
        type: 'mobile',
        platform: 'iPadOS'
      };
    }

    if (ua.includes('android')) {
      return {
        name: 'Android Mobile (PWA)',
        type: 'mobile',
        platform: 'Android'
      };
    }

    if (ua.includes('macintosh') || ua.includes('mac os')) {
      return {
        name: 'MacBook / Mac OS (Web App)',
        type: 'desktop',
        platform: 'macOS'
      };
    }

    if (ua.includes('windows')) {
      return {
        name: 'Windows PC (Desktop PWA)',
        type: 'desktop',
        platform: 'Windows'
      };
    }

    return {
      name: 'Web Browser Client',
      type: 'desktop',
      platform: 'Web'
    };
  }

  // Extract client IP accurately
  public getClientIp(headers: Record<string, string | undefined>): string {
    const xForwardedFor = headers['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    return headers['cf-connecting-ip'] || headers['x-real-ip'] || '127.0.0.1';
  }

  // Track an incoming request
  public recordRequest(data: {
    method: string;
    url: string;
    path: string;
    status: number;
    headers: Record<string, string | undefined>;
    query: Record<string, string>;
    durationMs: number;
    userId?: string;
  }): ClientRequestLog {
    const userAgent = data.headers['user-agent'] || '';
    const isSiri = Boolean(data.query.apiKey && (data.query.format === 'text' || userAgent.toLowerCase().includes('shortcut')));
    const device = this.parseDevice(userAgent, isSiri);
    const ip = this.getClientIp(data.headers);
    const now = new Date();
    const nowMs = now.getTime();

    // Generate unique device ID
    const deviceId = `${ip}-${device.name.replace(/\s+/g, '_')}`;

    // Update or add device in registry
    let existingDev = this.devices.get(deviceId);
    if (!existingDev) {
      existingDev = {
        id: deviceId,
        name: device.name,
        type: device.type,
        platform: device.platform,
        ip,
        userAgent,
        firstSeen: now.toISOString(),
        lastSeen: now.toISOString(),
        requestCount: 1,
        lastEndpoint: `${data.method} ${data.path}`,
        status: 'online',
        userId: data.userId
      };
    } else {
      existingDev.lastSeen = now.toISOString();
      existingDev.requestCount += 1;
      existingDev.lastEndpoint = `${data.method} ${data.path}`;
      existingDev.status = 'online';
      if (data.userId) existingDev.userId = data.userId;
    }
    this.devices.set(deviceId, existingDev);

    // Identify Action Tag
    let actionTag = 'OTHER';
    let isTaskAdd = false;

    if (data.path.includes('/api/tasks/add') || (data.method === 'POST' && data.path === '/api/tasks')) {
      actionTag = 'TASK_ADDED ⚠️';
      isTaskAdd = true;
    } else if (data.path.includes('/api/tasks/complete') || data.path.includes('/api/tasks/toggle') || (data.method === 'PATCH' && data.path.startsWith('/api/tasks/'))) {
      actionTag = 'TASK_COMPLETED ✅';
    } else if (data.path.startsWith('/api/tasks')) {
      actionTag = 'TASK_READ 📋';
    } else if (data.path.startsWith('/api/hydration')) {
      actionTag = 'WATER_LOGGED 💧';
    } else if (data.path.startsWith('/api/sync')) {
      actionTag = 'SYNC 🔄';
    } else if (data.path.startsWith('/api/auth')) {
      actionTag = 'AUTH 🔑';
    }

    // Check for suspicious rapid task addition loop
    let isSuspiciousLoop = false;
    if (isTaskAdd) {
      this.recentTaskAdds.push({ ip, time: nowMs });
      this.recentTaskAdds = this.recentTaskAdds.filter(item => nowMs - item.time < 60000); // within last 1 min
      const taskAddsFromIp = this.recentTaskAdds.filter(item => item.ip === ip).length;
      if (taskAddsFromIp >= 4) {
        isSuspiciousLoop = true;
      }
    }

    const logEntry: ClientRequestLog = {
      id: 'req_' + Math.random().toString(36).substring(2, 9),
      timestamp: now.toISOString(),
      timeStr: now.toLocaleTimeString('en-US', { hour12: false }),
      method: data.method,
      url: data.url,
      path: data.path,
      status: data.status,
      ip,
      device: device.name,
      actionTag,
      params: data.query,
      isTaskAdd,
      isSuspiciousLoop,
      durationMs: Math.round(data.durationMs)
    };

    // Prepend to requests list
    this.requestLogs.unshift(logEntry);
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs.pop();
    }

    return logEntry;
  }

  // Get list of connected devices with updated status
  public getDevices(): ConnectedDevice[] {
    const nowMs = Date.now();
    const result: ConnectedDevice[] = [];

    for (const dev of this.devices.values()) {
      const diffMs = nowMs - new Date(dev.lastSeen).getTime();
      if (diffMs < 2 * 60 * 1000) {
        dev.status = 'online';
      } else if (diffMs < 30 * 60 * 1000) {
        dev.status = 'idle';
      } else {
        dev.status = 'offline';
      }
      result.push({ ...dev });
    }

    // Sort: online first, then by lastSeen desc
    result.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });

    return result;
  }

  // Get request logs
  public getRequests(filter?: string, limit: number = 100): {
    requests: ClientRequestLog[];
    stats: {
      totalLogs: number;
      taskAddCount: number;
      suspiciousLoopDetected: boolean;
      loopCulpritIp: string | null;
    };
  } {
    let list = this.requestLogs;
    if (filter === 'tasks_add') {
      list = list.filter(r => r.isTaskAdd);
    } else if (filter === 'sync') {
      list = list.filter(r => r.actionTag.includes('SYNC') || r.actionTag.includes('TASK_READ'));
    } else if (filter === 'auth') {
      list = list.filter(r => r.actionTag.includes('AUTH'));
    }

    const taskAddCount = this.requestLogs.filter(r => r.isTaskAdd).length;
    const loopEntry = this.requestLogs.find(r => r.isSuspiciousLoop);

    return {
      requests: list.slice(0, limit),
      stats: {
        totalLogs: this.requestLogs.length,
        taskAddCount,
        suspiciousLoopDetected: Boolean(loopEntry),
        loopCulpritIp: loopEntry ? loopEntry.ip : null
      }
    };
  }

  // Clear logs
  public clearRequests(): void {
    this.requestLogs = [];
    this.recentTaskAdds = [];
  }

  // Deduplicate tasks in DB: Keep only the single most recently updated row per (user_id, title)
  public async deduplicateTasks(): Promise<{ removedCount: number; remainingCount: number }> {
    try {
      // Find all duplicate titles
      const dupeCheck = await db.execute(`
        SELECT title, user_id, COUNT(*) as count
        FROM tasks
        GROUP BY title, user_id
        HAVING count > 1
      `);

      let totalRemoved = 0;

      for (const row of dupeCheck.rows) {
        const title = row.title;
        const userId = row.user_id;

        // Get all task IDs with this title, ordered by updated_at DESC
        const tasksRes = await db.execute({
          sql: `SELECT id FROM tasks WHERE title = ? AND user_id = ? ORDER BY updated_at DESC`,
          args: [title, userId]
        });

        if (tasksRes.rows.length > 1) {
          // Keep the first (latest), delete the rest
          const toDelete = tasksRes.rows.slice(1).map(r => String(r.id));
          // Delete in batches of 20
          for (let i = 0; i < toDelete.length; i += 20) {
            const batch = toDelete.slice(i, i + 20);
            const placeholders = batch.map(() => '?').join(',');
            await db.execute({
              sql: `DELETE FROM tasks WHERE id IN (${placeholders})`,
              args: batch
            });
            totalRemoved += batch.length;
          }
        }
      }

      const countRes = await db.execute('SELECT COUNT(*) as remaining FROM tasks');
      const remainingCount = Number(countRes.rows[0]?.remaining || 0);

      return {
        removedCount: totalRemoved,
        remainingCount
      };
    } catch (err: any) {
      console.error('Error in deduplicateTasks:', err);
      throw new Error(`Deduplication failed: ${err.message}`);
    }
  }
}

export const deviceTracker = new DeviceTrackerService();
