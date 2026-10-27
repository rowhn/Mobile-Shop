import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier or value';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `That ${field} is already in use.`;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 6 MB).' : err.message;
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again.';
  }

  res.status(status).json({ message, ...(errors ? { errors } : {}) });
}
