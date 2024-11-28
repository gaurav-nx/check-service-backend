var express = require('express')
const saleassign = express.Router();

const { GetByIdLead} = require('../controllers/saleassign.controller')
// saleassign.post('/saleassign', saleassignadd)
// saleassign.post('/GetAllAssgin', GetAllAssgin)
// saleassign.post('/UpdateLead', UpdateLead)
// // presales.post('/DeleteLead', DeleteLead)
saleassign.post('/GetByIdLeadassign', GetByIdLead)
// // presales.get('/GetAllSales', GetAllSales)



module.exports = saleassign;