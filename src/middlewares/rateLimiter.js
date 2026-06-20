const rateLimit = require('express-rate-limit');

/**
 * Feature X: Rate Limiting
 *
 * Two tiers of rate limiting to protect the API:
 * 1. General limiter: 100 requests per 15 minutes per IP (all endpoints)
 * 2. Write limiter: 30 requests per 15 minutes per IP (mutation endpoints only)
 *
 * Why: Prevents abuse, cart-bombing attacks, and is a baseline expectation
 * for any production API. Protects MongoDB from excessive write operations.
 */

// General rate limiter for all endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

// Stricter rate limiter for write/mutation endpoints
const writeLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_WRITE_MAX_REQUESTS, 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many write requests. Please try again later.',
  },
});

module.exports = { generalLimiter, writeLimiter };
