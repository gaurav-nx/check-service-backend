var express = require('express')
const emplogin = express.Router();
const { employeelogin, empProfile } = require('../controllers/Employeelogin.controller')

emplogin.post('/emplogin', employeelogin);
emplogin.post('/emp-profile', empProfile);

module.exports = emplogin;