const express = require('express');
const cartController = require('../controllers/cartController');
const validate = require('../middlewares/validate');
const { writeLimiter } = require('../middlewares/rateLimiter');
const {
  userIdParamSchema,
  cartItemParamSchema,
  addItemSchema,
  updateItemSchema,
} = require('../validators/cartValidator');

// mergeParams: true is needed because this router is mounted at /api/users/:userId/cart
const router = express.Router({ mergeParams: true });

// GET /api/users/:userId/cart
router.get(
  '/',
  validate(userIdParamSchema, 'params'),
  cartController.getCart
);

// DELETE /api/users/:userId/cart
router.delete(
  '/',
  validate(userIdParamSchema, 'params'),
  writeLimiter,
  cartController.clearCart
);

// POST /api/users/:userId/cart/items
router.post(
  '/items',
  validate(userIdParamSchema, 'params'),
  validate(addItemSchema, 'body'),
  writeLimiter,
  cartController.addItem
);

// PUT /api/users/:userId/cart/items/:productId
router.put(
  '/items/:productId',
  validate(cartItemParamSchema, 'params'),
  validate(updateItemSchema, 'body'),
  writeLimiter,
  cartController.updateItem
);

// DELETE /api/users/:userId/cart/items/:productId
router.delete(
  '/items/:productId',
  validate(cartItemParamSchema, 'params'),
  writeLimiter,
  cartController.removeItem
);

module.exports = router;
