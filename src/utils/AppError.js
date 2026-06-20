/**
 * Custom application error class.
 * Extends native Error with an HTTP status code and operational flag
 * so the global error handler can distinguish expected client errors
 * from unexpected server bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Operational errors are expected (bad input, not found, etc.)
    // Programming errors are bugs that should be logged and investigated
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
