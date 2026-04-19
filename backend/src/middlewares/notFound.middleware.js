import { notFound } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
}
