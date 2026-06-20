const mongoose = require('mongoose');

/**
 * Cart Item sub-document schema.
 * Embedded inside the Cart document to keep reads atomic and avoid joins.
 * A single cart rarely exceeds ~100 items, making embedding efficient.
 */
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
  },
  {
    _id: false, // Don't generate _id for sub-documents; productId is the identifier
  }
);

/**
 * Cart Schema
 * One active cart per user (enforced via unique index on userId + status).
 * Features:
 * - Embedded items array for atomic reads/writes
 * - TTL-based expiration via expiresAt field (Feature X)
 * - Status tracking (active → checked_out / expired)
 */
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'checked_out', 'expired'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: only one active cart per user
cartSchema.index({ userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

// TTL index: MongoDB automatically removes documents when expiresAt < now
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Pre-save middleware to set the expiresAt field based on CART_TTL_DAYS env var.
 * Implements a sliding-window TTL: every save/update resets the expiration.
 */
cartSchema.pre('save', function (next) {
  const ttlDays = parseInt(process.env.CART_TTL_DAYS, 10) || 7;
  this.expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  next();
});

/**
 * Virtual: compute total number of items (sum of quantities)
 */
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Virtual: compute subtotal (sum of price × quantity)
 */
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Ensure virtuals are included when converting to JSON/Object
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
