const Joi = require('joi');

/**
 * Validation schemas for Campaign endpoints.
 */

const createCampaignSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': "'name' cannot be empty",
    'string.min': "'name' must be at least 2 characters",
    'string.max': "'name' cannot exceed 100 characters",
    'any.required': "'name' is required",
  }),
  type: Joi.string().valid('value_based', 'diversity_based').required().messages({
    'any.only': "'type' must be either 'value_based' or 'diversity_based'",
    'any.required': "'type' is required",
  }),
  tiers: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(1).max(50).required().messages({
          'any.required': "Tier 'name' is required",
        }),
        minValue: Joi.number().min(0).default(0),
        minCategories: Joi.number().integer().min(0).default(0),
        discountPercent: Joi.number().min(0).max(100).default(0),
        flatDiscount: Joi.number().min(0).default(0),
        freeItem: Joi.string().trim().allow(null, '').default(null),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': "'tiers' must have at least one tier",
      'any.required': "'tiers' is required",
    }),
  isActive: Joi.boolean().default(true),
  validFrom: Joi.date().iso().allow(null).default(null),
  validTo: Joi.date().iso().allow(null).greater(Joi.ref('validFrom')).default(null).messages({
    'date.greater': "'validTo' must be after 'validFrom'",
  }),
});

module.exports = { createCampaignSchema };
