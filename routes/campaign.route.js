const express = require('express');
const campaignRouter = express.Router();

const { singleUpload } = require('../middleware/multer')
const { add, listCampaignsByUserId, listCampaignsById, updateCampaignsById, deleteCampaignById, campaignLeadAdd, campaignLeadList, campaginUpdatePayment, leadTransfer } = require('../controllers/campaign.controller');

campaignRouter.post('/campaign-add', add);
campaignRouter.get('/list-campaign-all', listCampaignsByUserId);
campaignRouter.post('/list-campaign-id', listCampaignsById)
campaignRouter.post('/update-campaign-id', updateCampaignsById);
campaignRouter.post('/delete-campaign', deleteCampaignById);
campaignRouter.post('/campaignlead-add', singleUpload, campaignLeadAdd);
campaignRouter.post('/campaignlead-list', singleUpload, campaignLeadList);
campaignRouter.get('/campagin-updatepayment', campaginUpdatePayment);
campaignRouter.post('/lead-transfer', leadTransfer);

module.exports = campaignRouter;