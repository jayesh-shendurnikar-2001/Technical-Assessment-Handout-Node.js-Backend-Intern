const AppError = require('../utils/AppError');
const Cart = require('../models/Cart');

/**
 * Cart Service
 * Encapsulates business logic for cart operations.
 */
class CartService {
  /**
   * Get the active cart for a user.
   * Optionally creates a new cart if one doesn't exist and createIfMissing is true.
   */
  async getActiveCart(userId, createIfMissing = true) {
    let cart = await Cart.findOne({ userId, status: 'active' });

    if (!cart && createIfMissing) {
      cart = await Cart.create({
        userId,
        items: [],
        status: 'active',
        // expiresAt is handled by pre-save hook
      });
    }

    if (!cart && !createIfMissing) {
      throw new AppError('No active cart found for this user', 404);
    }

    return cart;
  }

  /**
   * Add an item to the cart or increment its quantity if it already exists.
   */
  async addItem(userId, itemData) {
    const cart = await this.getActiveCart(userId);

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === itemData.productId
    );

    if (existingItemIndex > -1) {
      // Increment quantity
      cart.items[existingItemIndex].quantity += itemData.quantity;
      // Update other details in case they changed (e.g., price change)
      cart.items[existingItemIndex].price = itemData.price;
      cart.items[existingItemIndex].name = itemData.name;
      cart.items[existingItemIndex].category = itemData.category;
    } else {
      // Add new item
      cart.items.push(itemData);
    }

    await cart.save();
    return cart;
  }

  /**
   * Update an existing item in the cart (e.g., change quantity or price).
   */
  async updateItem(userId, productId, updates) {
    const cart = await this.getActiveCart(userId, false);

    const itemIndex = cart.items.findIndex((item) => item.productId === productId);
    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', 404);
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        cart.items[itemIndex][key] = updates[key];
      }
    });

    await cart.save();
    return cart;
  }

  /**
   * Remove an item from the cart entirely.
   */
  async removeItem(userId, productId) {
    const cart = await this.getActiveCart(userId, false);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === initialLength) {
      throw new AppError('Item not found in cart', 404);
    }

    await cart.save();
    return cart;
  }

  /**
   * Clear all items from the cart.
   */
  async clearCart(userId) {
    const cart = await this.getActiveCart(userId, false);
    cart.items = [];
    await cart.save();
    return cart;
  }
}

module.exports = new CartService();
