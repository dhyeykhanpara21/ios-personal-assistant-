import { Context } from 'hono';
import { ZodError } from 'zod';

export function errorHandler(err: Error, c: Context) {
  console.error('Unhandled API Error:', err);

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      400
    );
  }

  return c.json(
    {
      success: false,
      error: err.message || 'Internal Server Error',
    },
    500
  );
}
