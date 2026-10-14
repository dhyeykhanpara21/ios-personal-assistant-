import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppEnv } from '../types/index.js';

const tasksApp = new Hono<AppEnv>();
tasksApp.use('*', authMiddleware);

const taskInputSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['personal', 'work', 'study', 'health', 'other']).default('other'),
  is_completed: z.boolean().default(false),
  recurrence_rule: z.string().nullable().optional(),
});

// GET /api/tasks
tasksApp.get('/', async (c) => {
  const userId = c.get('userId');
  const filter = c.req.query('filter'); // 'today', 'upcoming', 'completed', 'overdue', 'all'
  const search = c.req.query('q');
  const sortBy = c.req.query('sortBy') || 'due_at'; // 'due_at', 'priority', 'created_at'
  const order = c.req.query('order')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const now = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const args: any[] = [userId];

  if (filter === 'completed') {
    query += ' AND is_completed = 1';
  } else if (filter === 'overdue') {
    query += ' AND is_completed = 0 AND due_at IS NOT NULL AND due_at < ?';
    args.push(now);
  } else if (filter === 'today') {
    // Uncompleted tasks for today: includes tasks with no due date, or due today, or overdue
    query += ' AND is_completed = 0 AND (due_at IS NULL OR due_at <= ?)';
    args.push(todayEnd.toISOString());
  } else if (filter === 'upcoming') {
    query += ' AND is_completed = 0 AND due_at > ?';
    args.push(todayEnd.toISOString());
  }

  if (search && search.trim().length > 0) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    args.push(term, term);
  }

  // Sorting
  if (sortBy === 'priority') {
    query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${order}`;
  } else if (sortBy === 'created_at') {
    query += ` ORDER BY created_at ${order}`;
  } else {
    // Default: due_at (NULLs last)
    query += ` ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END, due_at ${order}, created_at DESC`;
  }

  let tasks: any[] = [];
  try {
    const result = await db.execute({ sql: query, args });
    tasks = result.rows.map((row) => ({
      ...row,
      is_completed: Boolean(row.is_completed),
    }));
  } catch (err) {
    console.error('Error fetching tasks from database:', err);
    return c.json({
      success: true,
      count: 0,
      data: [],
      summary: 'You have no remaining tasks for today in Luphonix!',
      message: 'You have no remaining tasks for today in Luphonix!',
      speech: 'You have no remaining tasks for today in Luphonix!',
    });
  }

  let summary = '';
  if (tasks.length === 0) {
    summary = filter === 'today'
      ? 'You have no remaining tasks for today in Luphonix!'
      : 'You have no tasks in Luphonix.';
  } else {
    const titles = tasks.slice(0, 3).map((t: any) => t.title).join(', ');
    const more = tasks.length > 3 ? ` and ${tasks.length - 3} more` : '';
    summary = `You have ${tasks.length} task${tasks.length === 1 ? '' : 's'}: ${titles}${more}.`;
  }

  const format = c.req.query('format')?.toLowerCase();
  const accept = c.req.header('accept')?.toLowerCase() || '';
  const userAgent = c.req.header('user-agent')?.toLowerCase() || '';
  const hasQueryAuth = Boolean(c.req.query('apiKey') || c.req.query('token') || c.req.query('key'));

  const isExplicitJson = format === 'json' || accept.includes('application/json');
  const isExplicitText = format === 'text' || c.req.query('text') === '1' || accept.includes('text/plain');
  const isShortcut = userAgent.includes('shortcut') || userAgent.includes('cfnetwork') || userAgent.includes('darwin');

  if (isExplicitText || (!isExplicitJson && (isShortcut || hasQueryAuth))) {
    return c.text(summary);
  }

  return c.json({
    success: true,
    count: tasks.length,
    data: tasks,
    summary,
    message: summary,
    speech: summary,
  });
});

// GET /api/tasks/add (Hands-free task creation for Siri Shortcuts)
tasksApp.get('/add', async (c) => {
  const userId = c.get('userId');
  const title = c.req.query('title') || c.req.query('text') || c.req.query('q');

  if (!title || !title.trim()) {
    return c.text('Please provide a task title to add.');
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const taskTitle = title.trim();

  await db.execute({
    sql: `INSERT INTO tasks (
      id, user_id, title, description, due_at, priority, category,
      is_completed, recurrence_rule, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, ?, 'medium', 'work', 0, NULL, ?, ?)`,
    args: [id, userId, taskTitle, now, now, now],
  });

  const msg = `Added "${taskTitle}" to your Luphonix tasks.`;
  const format = c.req.query('format')?.toLowerCase();
  const accept = c.req.header('accept')?.toLowerCase() || '';
  if (format === 'json' || accept.includes('application/json')) {
    return c.json({ success: true, message: msg, data: { id, title: taskTitle } }, 201);
  }
  return c.text(msg);
});

// POST /api/tasks (Create or Upsert)
tasksApp.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = taskInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const {
    id = randomUUID(),
    title,
    description = null,
    due_at = null,
    priority,
    category,
    is_completed,
    recurrence_rule = null,
  } = parsed.data;

  const now = new Date().toISOString();

  // Insert or Replace (idempotent for offline sync)
  await db.execute({
    sql: `INSERT INTO tasks (
      id, user_id, title, description, due_at, priority, category,
      is_completed, recurrence_rule, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      due_at = excluded.due_at,
      priority = excluded.priority,
      category = excluded.category,
      is_completed = excluded.is_completed,
      recurrence_rule = excluded.recurrence_rule,
      updated_at = excluded.updated_at
    WHERE tasks.user_id = excluded.user_id`,
    args: [
      id,
      userId,
      title,
      description,
      due_at,
      priority,
      category,
      is_completed ? 1 : 0,
      recurrence_rule,
      now,
      now,
    ],
  });

  return c.json(
    {
      success: true,
      data: {
        id,
        user_id: userId,
        title,
        description,
        due_at,
        priority,
        category,
        is_completed,
        recurrence_rule,
        created_at: now,
        updated_at: now,
      },
    },
    201
  );
});

// GET /api/tasks/:id
tasksApp.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const result = await db.execute({
    sql: 'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rows.length === 0) {
    return c.json({ success: false, error: 'Task not found' }, 404);
  }

  const task = {
    ...result.rows[0],
    is_completed: Boolean(result.rows[0].is_completed),
  };

  return c.json({ success: true, data: task });
});

// PATCH /api/tasks/:id
tasksApp.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  const updateSchema = taskInputSchema.partial();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Validation failed', details: parsed.error.errors }, 400);
  }

  const existing = await db.execute({
    sql: 'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (existing.rows.length === 0) {
    return c.json({ success: false, error: 'Task not found' }, 404);
  }

  const updates = parsed.data;
  const now = new Date().toISOString();

  const fields: string[] = ['updated_at = ?'];
  const args: any[] = [now];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    args.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    args.push(updates.description);
  }
  if (updates.due_at !== undefined) {
    fields.push('due_at = ?');
    args.push(updates.due_at);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    args.push(updates.priority);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    args.push(updates.category);
  }
  if (updates.is_completed !== undefined) {
    fields.push('is_completed = ?');
    args.push(updates.is_completed ? 1 : 0);
  }
  if (updates.recurrence_rule !== undefined) {
    fields.push('recurrence_rule = ?');
    args.push(updates.recurrence_rule);
  }

  args.push(id, userId);

  await db.execute({
    sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    args,
  });

  const updatedResult = await db.execute({
    sql: 'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  return c.json({
    success: true,
    data: {
      ...updatedResult.rows[0],
      is_completed: Boolean(updatedResult.rows[0].is_completed),
    },
  });
});

// DELETE /api/tasks/:id
tasksApp.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const result = await db.execute({
    sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Task not found' }, 404);
  }

  return c.json({ success: true, message: 'Task deleted successfully', id });
});

export default tasksApp;
