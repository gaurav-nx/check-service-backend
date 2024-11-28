var express = require('express')
const serviceNameRouter = express.Router();

const { addServiceName, listServiceName, listServiceNameById, updateServiceNameById, deleteServiceNameById } = require('../controllers/service_name.controller');

serviceNameRouter.post('/addservice-name', addServiceName);
serviceNameRouter.get('/listservice-name', listServiceName);
serviceNameRouter.post('/listservice-namebyid', listServiceNameById);
serviceNameRouter.post('/updateservice-namebyid', updateServiceNameById);
serviceNameRouter.post('/deleteservice-namebyid', deleteServiceNameById);

module.exports = serviceNameRouter;