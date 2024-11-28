const express = require('express');
const cityRouter = express.Router();

const { addCity, listCity } = require('../controllers/city.controller');

cityRouter.get('/add-city', addCity);
cityRouter.get('/list-city', listCity);

module.exports = cityRouter;