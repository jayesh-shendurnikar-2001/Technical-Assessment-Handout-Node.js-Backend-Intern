const User = require('../models/User');
const cartService = require('../services/cartService');
const pricingEngine = require('../services/pricingEngine');
const AppError = require('../utils/AppError');

exports.getCheckoutSummary = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 1. Verify User
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 2. Fetch Cart (throw 404 if missing, because you can't checkout an empty state)
    const cart = await cartService.getActiveCart(userId, false);

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty. Cannot proceed to checkout.', 400);
    }

    // 3. Calculate Summary using Pricing Engine
    const summary = await pricingEngine.calculateCheckout(cart);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
