/**
 * Global error handling middleware
 */

/**
 * Async route wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error handler middleware (must be last)
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Default error response
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: true,
    code,
    message,
    status
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
