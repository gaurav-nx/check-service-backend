var express = require('express')
const influencerRouter = express.Router();

const { singleUpload } = require('../middleware/multer')
const { influencerList, influencerAllLeads, influencerWallet, influencerLeadWallet, influencerUnpaidWallet, influencerLeadUnpaidWallet, influencerPaidWallet, influencerLeadPaidWallet, influencerLeadCount, influencerLeadPending, influencerLeadConvert, influencerAddRole, influencerAll, influencerById, getlist, influencerByIdUpdateStatus } = require('../controllers/influencer.controller');

influencerRouter.get('/influencer-list', influencerList);
influencerRouter.get('/influencer-allleads', influencerAllLeads);
influencerRouter.get('/influencer-wallet', influencerWallet);
influencerRouter.get('/influencerlead-wallet', influencerLeadWallet);
influencerRouter.get('/influencer-unpaidwallet', influencerUnpaidWallet);
influencerRouter.get('/influencerlead-unpaidwallet', influencerLeadUnpaidWallet);
influencerRouter.get('/influencer-paidwallet', influencerPaidWallet);
influencerRouter.get('/influencerlead-paidwallet', influencerLeadPaidWallet);
influencerRouter.get('/influencer-leadcount', influencerLeadCount);
influencerRouter.get('/influencerlead-pending', influencerLeadPending);
influencerRouter.get('/influencerlead-convert', influencerLeadConvert);
influencerRouter.post('/influencer-addrole', singleUpload, influencerAddRole);
influencerRouter.get('/influencer-all', influencerAll);
influencerRouter.post('/influencer-byid', influencerById);
// influencerRouter.get('/getlistt', getlist);
influencerRouter.post(
    "/influencer-byid-update-status",
    influencerByIdUpdateStatus
  );
module.exports = influencerRouter;