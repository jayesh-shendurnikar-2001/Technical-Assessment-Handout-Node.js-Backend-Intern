const Joi = require('joi');

/**
 * Validation schema for Checkout endpoint.
 */

// Reusable ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const checkoutParamSchema = Joi.object({
  userId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': "'userId' must be a valid MongoDB ObjectId",
    'any.required': "'userId' is required",
  }),
});

module.exports = { checkoutParamSchema };
