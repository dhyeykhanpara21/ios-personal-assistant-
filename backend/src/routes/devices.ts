import { Hono } from 'hono';
import { deviceTracker } from '../services/deviceTracker.js';

const devicesApp = new Hono();

// GET /api/devices - List all connected devices
devicesApp.get('/', (c) => {
  const devices = deviceTracker.getDevices();
  const userAgent = c.req.header('user-agent') || '';
  const currentDev = deviceTracker.parseDevice(userAgent);
  const currentIp = deviceTracker.getClientIp({
    'x-forwarded-for': c.req.header('x-forwarded-for'),
    'cf-connecting-ip': c.req.header('cf-connecting-ip'),
    'x-real-ip': c.req.header('x-real-ip'),
  });

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const idleCount = devices.filter((d) => d.status === 'idle').length;

  return c.json({
    success: true,
    currentDevice: {
      ...currentDev,
      ip: currentIp,
      userAgent,
    },
    devices,
    stats: {
      totalDevices: devices.length,
      onlineCount: Math.max(1, onlineCount),
      idleCount,
    },
  });
});

// GET /api/devices/requests - Live client requests feed
devicesApp.get('/requests', (c) => {
  const filter = c.req.query('filter') || 'all';
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const result = deviceTracker.getRequests(filter, limit);

  return c.json({
    success: true,
    ...result,
  });
});

// DELETE /api/devices/requests - Clear request logs
devicesApp.delete('/requests', (c) => {
  deviceTracker.clearRequests();
  return c.json({
    success: true,
    message: 'Request logs cleared successfully.',
  });
});

// POST /api/devices/deduplicate-tasks - Clean up duplicate tasks in DB
devicesApp.post('/deduplicate-tasks', async (c) => {
  try {
    const res = await deviceTracker.deduplicateTasks();
    return c.json({
      success: true,
      message: `Successfully removed ${res.removedCount} duplicate tasks! Database now has ${res.remainingCount} distinct tasks.`,
      ...res,
    });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      500
    );
  }
});

// POST /api/devices/ping - Device heartbeat
devicesApp.post('/ping', (c) => {
  const userAgent = c.req.header('user-agent') || '';
  const currentDev = deviceTracker.parseDevice(userAgent);
  return c.json({
    success: true,
    pong: true,
    timestamp: new Date().toISOString(),
    device: currentDev.name,
  });
});

export default devicesApp;
