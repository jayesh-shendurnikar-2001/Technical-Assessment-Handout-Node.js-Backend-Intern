const Joi = require('joi');

/**
 * Validation schemas for Cart endpoints.
 * Validates both the URL params (userId must be a valid ObjectId)
 * and the request body for item operations.
 */

// Reusable ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Validate :userId param
const userIdParamSchema = Joi.object({
  userId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': "'userId' must be a valid 24-character hex string (MongoDB ObjectId)",
    'any.required': "'userId' is required",
  }),
});

// Validate :userId and :productId params together
const cartItemParamSchema = Joi.object({
  userId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': "'userId' must be a valid MongoDB ObjectId",
    'any.required': "'userId' is required",
  }),
  productId: Joi.string().trim().min(1).required().messages({
    'string.empty': "'productId' cannot be empty",
    'any.required': "'productId' is required",
  }),
});

// Validate body for adding an item to the cart
const addItemSchema = Joi.object({
  productId: Joi.string().trim().min(1).required().messages({
    'string.empty': "'productId' cannot be empty",
    'any.required': "'productId' is required",
  }),
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': "'name' cannot be empty",
    'string.max': "'name' cannot exceed 200 characters",
    'any.required': "'name' is required",
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': "'price' must be a number",
    'number.positive': "'price' must be a positive number",
    'any.required': "'price' is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': "'quantity' must be a number",
    'number.integer': "'quantity' must be an integer",
    'number.min': "'quantity' must be at least 1",
    'any.required': "'quantity' is required",
  }),
  category: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': "'category' cannot be empty",
    'string.max': "'category' cannot exceed 100 characters",
    'any.required': "'category' is required",
  }),
});

// Validate body for updating an item in the cart
const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).messages({
    'number.base': "'quantity' must be a number",
    'number.integer': "'quantity' must be an integer",
    'number.min': "'quantity' must be at least 1",
  }),
  price: Joi.number().positive().precision(2).messages({
    'number.base': "'price' must be a number",
    'number.positive': "'price' must be a positive number",
  }),
  name: Joi.string().trim().min(1).max(200).messages({
    'string.empty': "'name' cannot be empty",
    'string.max': "'name' cannot exceed 200 characters",
  }),
  category: Joi.string().trim().min(1).max(100).messages({
    'string.empty': "'category' cannot be empty",
    'string.max': "'category' cannot exceed 100 characters",
  }),
})
  .min(1) // At least one field must be provided
  .messages({
    'object.min': 'At least one field (quantity, price, name, or category) must be provided for update',
  });

module.exports = {
  userIdParamSchema,
  cartItemParamSchema,
  addItemSchema,
  updateItemSchema,
};
