const Campaign = require('../models/Campaign');

/**
 * Pricing Engine Service
 * Calculates discounts based on active promotional campaigns.
 */
class PricingEngine {
  /**
   * Calculate checkout summary with dynamic tiered promotions applied.
   * Logic:
   * 1. Calculate base subtotal and identify unique categories.
   * 2. Fetch all active campaigns.
   * 3. For each campaign, find the highest qualifying tier.
   * 4. Stack best value-based tier with best diversity-based tier.
   * 5. Apply a 30% global discount cap.
   */
  async calculateCheckout(cart) {
    // 1. Basic calculations
    const itemCount = cart.totalItems;
    const subtotal = cart.subtotal;

    const uniqueCategories = new Set(cart.items.map((item) => item.category.toLowerCase())).size;

    // Items with line totals for the receipt
    const itemsWithTotals = cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      lineTotal: item.price * item.quantity,
    }));

    // 2. Fetch active campaigns (handling validFrom/validTo dates)
    const now = new Date();
    const activeCampaigns = await Campaign.find({
      isActive: true,
      $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
      $or: [{ validTo: null }, { validTo: { $gte: now } }],
    });

    let appliedPromotions = [];
    let freeGifts = [];
    
    // Group campaigns by type to find the best tier per type
    let bestValuePromotion = null;
    let bestDiversityPromotion = null;

    activeCampaigns.forEach((campaign) => {
      // Find highest qualifying tier
      let bestTier = null;
      
      // Sort tiers descending to check highest thresholds first
      const sortedTiers = [...campaign.tiers].sort((a, b) => {
        if (campaign.type === 'value_based') return b.minValue - a.minValue;
        return b.minCategories - a.minCategories;
      });

      for (const tier of sortedTiers) {
        if (
          (campaign.type === 'value_based' && subtotal >= tier.minValue) ||
          (campaign.type === 'diversity_based' && uniqueCategories >= tier.minCategories)
        ) {
          bestTier = tier;
          break; // Found the highest qualifying tier
        }
      }

      if (bestTier) {
        const discountAmount = this._calculateDiscountAmount(subtotal, bestTier);
        
        const promoResult = {
          campaign: campaign.name,
          tier: bestTier.name,
          type: campaign.type,
          discountAmount: discountAmount,
          freeItem: bestTier.freeItem,
        };

        if (campaign.type === 'value_based') {
          if (!bestValuePromotion || discountAmount > bestValuePromotion.discountAmount) {
            bestValuePromotion = promoResult;
          }
        } else if (campaign.type === 'diversity_based') {
          if (!bestDiversityPromotion || discountAmount > bestDiversityPromotion.discountAmount) {
            bestDiversityPromotion = promoResult;
          }
        }
      }
    });

    // 3. Stack promotions
    if (bestValuePromotion) appliedPromotions.push(bestValuePromotion);
    if (bestDiversityPromotion) appliedPromotions.push(bestDiversityPromotion);

    let totalRawDiscount = appliedPromotions.reduce((sum, p) => sum + p.discountAmount, 0);

    // 4. Apply 30% max cap
    const maxAllowedDiscount = subtotal * 0.3;
    let totalDiscount = totalRawDiscount;
    let capped = false;

    if (totalRawDiscount > maxAllowedDiscount) {
      totalDiscount = maxAllowedDiscount;
      capped = true;
    }

    // Collect free gifts
    appliedPromotions.forEach((p) => {
      if (p.freeItem) freeGifts.push(p.freeItem);
    });

    const grandTotal = subtotal - totalDiscount;

    return {
      userId: cart.userId,
      items: itemsWithTotals,
      itemCount,
      uniqueCategories,
      subtotal,
      appliedPromotions: appliedPromotions.map((p) => ({
        campaign: p.campaign,
        tier: p.tier,
        type: p.type,
        // Scale down reported discounts proportionally if capped
        discount: capped 
          ? (p.discountAmount / totalRawDiscount) * totalDiscount 
          : p.discountAmount
      })),
      totalDiscount,
      discountCappedAt30Percent: capped,
      freeGifts,
      grandTotal,
    };
  }

  _calculateDiscountAmount(subtotal, tier) {
    let amount = 0;
    if (tier.discountPercent > 0) {
      amount = subtotal * (tier.discountPercent / 100);
    } else if (tier.flatDiscount > 0) {
      amount = tier.flatDiscount;
    }
    return amount > subtotal ? subtotal : amount; // Cannot discount more than subtotal
  }
}

module.exports = new PricingEngine();
