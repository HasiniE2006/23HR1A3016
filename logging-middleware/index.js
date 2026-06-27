// logging-middleware/index.js
// Simple Express logging middleware used by the notification backend.

/**
 * requestLogger – logs every incoming request and its response details.
 * Format: [TIMESTAMP] METHOD PATH STATUS DURATIONms
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

/**
 * errorLogger – logs uncaught errors passed via next(err).
 * Must be registered BEFORE the generic error handler.
 */
function errorLogger(err, req, res, next) {
  const timestamp = new Date().toISOString();
  console.error(
    `[${timestamp}] [ApiError] ERROR ${req.method} ${req.originalUrl} – ${err.message}`
  );
  next(err);
}

/**
 * logEvent – general utility to log structured system events.
 * Format: [TIMESTAMP] [TAG] MESSAGE
 */
function logEvent(tag, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${tag}] ${message}`);
}

module.exports = { requestLogger, errorLogger, logEvent };

