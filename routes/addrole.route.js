var express = require('express')
const addrole = express.Router();

const { AddRole, GetAllRole, UpdateRole, DeleteRole, GetByIdRole, adminLogin, addadmin, findByEmail, otpVerify, updatePassword, specificLeads, updateStatus } = require('../controllers/addrole.controller');

addrole.post('/AddRole', AddRole)
addrole.post('/GetAllRole', GetAllRole)
addrole.post('/UpdateRole', UpdateRole)
addrole.post('/DeleteRole', DeleteRole)
addrole.post('/GetByIdRole', GetByIdRole)
addrole.post('/adminLogin', adminLogin)
addrole.post('/addadmin', addadmin)
addrole.post('/getotpbyemail', findByEmail);
addrole.post('/otp-verify', otpVerify);
addrole.post('/update-password', updatePassword);
addrole.post('/specific-leads', specificLeads);
addrole.post('/update-status', updateStatus);

module.exports = addrole;