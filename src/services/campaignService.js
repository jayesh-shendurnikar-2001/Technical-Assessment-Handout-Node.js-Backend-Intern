const Campaign = require('../models/Campaign');

/**
 * Campaign Service
 * CRUD operations for promotional campaigns.
 */
class CampaignService {
  async createCampaign(campaignData) {
    return await Campaign.create(campaignData);
  }

  async getAllCampaigns() {
    return await Campaign.find().sort('-createdAt');
  }
}

module.exports = new CampaignService();
