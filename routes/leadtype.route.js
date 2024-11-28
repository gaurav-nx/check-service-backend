var express = require('express')
const leadTypeRouter = express.Router();

const { addLeadType, listLeadType, listLeadTypeById, updateLeadTypeById, deleteLeadTypeById } = require('../controllers/leadtype.controller');

leadTypeRouter.post('/addlead-type', addLeadType);
leadTypeRouter.get('/listlead-type', listLeadType);
leadTypeRouter.post('/listlead-typebyid', listLeadTypeById);
leadTypeRouter.post('/updatelead-typebyid', updateLeadTypeById);
leadTypeRouter.post('/deletelead-typebyid', deleteLeadTypeById);

module.exports = leadTypeRouter;