const express = require('express');
const countryRouter = express.Router();

const { addCountry, listCountry } = require('../controllers/country.controller');

countryRouter.get('/add-country', addCountry);
countryRouter.get('/list-country', listCountry);

module.exports = countryRouter;