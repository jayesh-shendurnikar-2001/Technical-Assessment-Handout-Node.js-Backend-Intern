const mongoose = require('mongoose');

/**
 * Campaign Tier sub-document schema.
 * Each tier defines thresholds and rewards for a promotional campaign.
 * - value_based: uses minValue (cart subtotal threshold)
 * - diversity_based: uses minCategories (unique categories threshold)
 */
const campaignTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tier name is required'],
      trim: true,
    },
    minValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum value cannot be negative'],
    },
    minCategories: {
      type: Number,
      default: 0,
      min: [0, 'Minimum categories cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Minimum categories must be an integer',
      },
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    flatDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Flat discount cannot be negative'],
    },
    freeItem: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Campaign Schema
 * Represents a promotional campaign with tiered discounts.
 * Two types supported:
 * - value_based: discounts scale with cart subtotal
 * - diversity_based: discounts scale with number of unique categories
 *
 * Campaigns can be time-bounded via validFrom/validTo and toggled via isActive.
 */
const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      required: [true, 'Campaign type is required'],
      enum: {
        values: ['value_based', 'diversity_based'],
        message: 'Campaign type must be either value_based or diversity_based',
      },
    },
    tiers: {
      type: [campaignTierSchema],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: 'Campaign must have at least one tier',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTo: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Campaign', campaignSchema);
