const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Catches all errors thrown/passed via next(err) and returns a structured
 * JSON response. Distinguishes operational errors (AppError) from
 * unexpected programming errors.
 */

// Handle Mongoose CastError (e.g., invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return { statusCode: 400, message };
};

// Handle Mongoose duplicate key error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for field '${field}': '${err.keyValue[field]}'. Please use a different value.`;
  return { statusCode: 409, message };
};

// Handle Mongoose validation error
const handleValidationErrorDB = (err) => {
  const details = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return {
    statusCode: 400,
    message: 'Validation Error',
    details,
  };
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || undefined;

  // Log the full error for server-side debugging
  logger.error(`${statusCode} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  // Transform known Mongoose/MongoDB errors into structured responses
  if (err.name === 'CastError') {
    const handled = handleCastErrorDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.code === 11000) {
    const handled = handleDuplicateFieldsDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === 'ValidationError') {
    const handled = handleValidationErrorDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
    details = handled.details;
  }

  // In production, don't leak error details for 500s
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
