var express = require('express')
const apiRouter = express.Router();

const addrole = require('./addrole.route')
const presales = require('./pre_sales.route')
const emplogin = require('./Employeelogin.route')
const saleassign = require('./sale.route')
const campaignRouter = require('./campaign.route');
const notificationRouter = require('./notification.routes');
const countryRouter = require('./country.route');
const stateRouter = require('./state.route');
const cityRouter = require('./city.route');
const leadTypeRouter = require('./leadtype.route');
const leadSourceRouter = require('./leadsource.route');
const serviceNameRouter = require('./service_name.route');
const influencerRouter = require('./influencer.route');

apiRouter.use('/api', addrole);
apiRouter.use('/api', presales);
apiRouter.use('/api', emplogin);
apiRouter.use('/api', saleassign);
apiRouter.use('/api', campaignRouter);
apiRouter.use('/api', notificationRouter);
apiRouter.use('/api', countryRouter);
apiRouter.use('/api', stateRouter);
apiRouter.use('/api', cityRouter);
apiRouter.use('/api', leadTypeRouter);
apiRouter.use('/api', leadSourceRouter);
apiRouter.use('/api', serviceNameRouter);
apiRouter.use('/api', influencerRouter);

module.exports = apiRouter;