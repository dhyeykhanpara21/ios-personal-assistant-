import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';

const preferencesApp = new Hono();
preferencesApp.use('*', authMiddleware);

const prefUpdateSchema = z.object({
  daily_water_goal_ml: z.number().int().min(500).max(10000).optional(),
  water_reminder_interval_minutes: z.number().int().min(15).max(360).optional(),
  waking_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional(),
  sleeping_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional(),
  quiet_hours_enabled: z.boolean().optional(),
  notification_preferences: z
    .object({
      reminders_sound: z.boolean(),
      water_sound: z.boolean(),
      vibration: z.boolean(),
    })
    .optional(),
});

// GET /api/preferences
preferencesApp.get('/', async (c) => {
  const userId = c.get('userId');

  const result = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    return c.json({ success: false, error: 'Preferences not found' }, 404);
  }

  const row = result.rows[0];

  return c.json({
    success: true,
    data: {
      ...row,
      quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
      notification_preferences:
        typeof row.notification_preferences === 'string'
          ? JSON.parse(row.notification_preferences)
          : row.notification_preferences,
    },
  });
});

// PUT /api/preferences
preferencesApp.put('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = prefUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const updates = parsed.data;
  const now = new Date().toISOString();

  // Fetch current
  const currentRes = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [userId],
  });

  if (currentRes.rows.length === 0) {
    // Insert if not exists
    await db.execute({
      sql: `INSERT INTO user_preferences (
        user_id, daily_water_goal_ml, water_reminder_interval_minutes,
        waking_time, sleeping_time, quiet_hours_enabled, notification_preferences, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        updates.daily_water_goal_ml ?? 2000,
        updates.water_reminder_interval_minutes ?? 60,
        updates.waking_time ?? '07:00',
        updates.sleeping_time ?? '22:00',
        (updates.quiet_hours_enabled ?? true) ? 1 : 0,
        JSON.stringify(updates.notification_preferences ?? { reminders_sound: true, water_sound: true, vibration: true }),
        now,
      ],
    });
  } else {
    // Update
    const current = currentRes.rows[0];
    const newGoal = updates.daily_water_goal_ml ?? current.daily_water_goal_ml;
    const newInterval = updates.water_reminder_interval_minutes ?? current.water_reminder_interval_minutes;
    const newWaking = updates.waking_time ?? current.waking_time;
    const newSleeping = updates.sleeping_time ?? current.sleeping_time;
    const newQuiet = updates.quiet_hours_enabled !== undefined ? (updates.quiet_hours_enabled ? 1 : 0) : current.quiet_hours_enabled;
    const newNotifs = updates.notification_preferences
      ? JSON.stringify(updates.notification_preferences)
      : current.notification_preferences;

    await db.execute({
      sql: `UPDATE user_preferences SET
        daily_water_goal_ml = ?,
        water_reminder_interval_minutes = ?,
        waking_time = ?,
        sleeping_time = ?,
        quiet_hours_enabled = ?,
        notification_preferences = ?,
        updated_at = ?
      WHERE user_id = ?`,
      args: [newGoal, newInterval, newWaking, newSleeping, newQuiet, newNotifs, now, userId],
    });
  }

  const finalRes = await db.execute({
    sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
    args: [userId],
  });

  const row = finalRes.rows[0];

  return c.json({
    success: true,
    data: {
      ...row,
      quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
      notification_preferences:
        typeof row.notification_preferences === 'string'
          ? JSON.parse(row.notification_preferences)
          : row.notification_preferences,
    },
  });
});

export default preferencesApp;
