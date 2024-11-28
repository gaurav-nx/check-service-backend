const express = require('express');
const stateRouter = express.Router();

const { addState, listState, findByCountryCode } = require('../controllers/state.controller');

stateRouter.get('/add-state', addState);
stateRouter.get('/list-state', listState);
stateRouter.post('/find-countrycode', findByCountryCode);

module.exports = stateRouter;