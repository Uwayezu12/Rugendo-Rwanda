import { env } from '../config/env.js';

/**
 * Global Express error handler.
 * Must be registered last in app.js.
 */
export function errorHandler(err, req, res, _next) {
  console.error('[ErrorHandler]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
}
