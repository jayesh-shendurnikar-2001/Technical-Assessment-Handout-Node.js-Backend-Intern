const User = require('../models/User');
const cartService = require('../services/cartService');
const AppError = require('../utils/AppError');

/**
 * Middleware to ensure the user exists before operating on their cart.
 * Provides the core tenant isolation logic.
 */
const ensureUserExists = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found. Cannot operate on cart.', 404);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await ensureUserExists(userId);
    
    // Pass createIfMissing = true to always return an empty cart shape instead of 404
    const cart = await cartService.getActiveCart(userId, true);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await ensureUserExists(userId);

    const cart = await cartService.addItem(userId, req.body);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    await ensureUserExists(userId);

    const cart = await cartService.updateItem(userId, productId, req.body);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    await ensureUserExists(userId);

    const cart = await cartService.removeItem(userId, productId);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await ensureUserExists(userId);

    const cart = await cartService.clearCart(userId);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
