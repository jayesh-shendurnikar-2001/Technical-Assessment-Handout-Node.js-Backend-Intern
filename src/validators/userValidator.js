const Joi = require('joi');

/**
 * Validation schemas for User endpoints.
 */

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': "'name' cannot be empty",
    'string.min': "'name' must be at least 2 characters",
    'string.max': "'name' cannot exceed 100 characters",
    'any.required': "'name' is required",
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': "'email' cannot be empty",
    'string.email': "'email' must be a valid email address",
    'any.required': "'email' is required",
  }),
});

module.exports = { createUserSchema };
