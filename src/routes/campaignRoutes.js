const express = require('express');
const campaignController = require('../controllers/campaignController');
const validate = require('../middlewares/validate');
const { createCampaignSchema } = require('../validators/campaignValidator');

const router = express.Router();

router.post('/', validate(createCampaignSchema, 'body'), campaignController.createCampaign);
router.get('/', campaignController.getAllCampaigns);

module.exports = router;
