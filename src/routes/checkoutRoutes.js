const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const validate = require('../middlewares/validate');
const { checkoutParamSchema } = require('../validators/checkoutValidator');

const router = express.Router({ mergeParams: true });

// GET /api/users/:userId/checkout
router.get(
  '/',
  validate(checkoutParamSchema, 'params'),
  checkoutController.getCheckoutSummary
);

module.exports = router;
