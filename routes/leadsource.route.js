var express = require('express')
const leadSourceRouter = express.Router();

const { addLeadSource, listLeadSource, listLeadSourceById, updateLeadSourceById, deleteLeadSourceById } = require('../controllers/leadsource.controller');

leadSourceRouter.post('/addlead-source', addLeadSource);
leadSourceRouter.get('/listlead-source', listLeadSource);
leadSourceRouter.post('/listlead-sourcebyid', listLeadSourceById);
leadSourceRouter.post('/updatelead-sourcebyid', updateLeadSourceById);
leadSourceRouter.post('/deletelead-sourcebyid', deleteLeadSourceById);

module.exports = leadSourceRouter;