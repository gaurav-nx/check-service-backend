const express = require('express');
const notificationRouter = express.Router();

const { findNotification, findPreSalesNotification, notificationStatusUpdate } = require('../controllers/notification.controller');

notificationRouter.post('/find-notification', findNotification);
notificationRouter.get('/find-presalesnotification', findPreSalesNotification);
notificationRouter.post('/notification-statusupdate', notificationStatusUpdate);

module.exports = notificationRouter;
