const path = require('path');
const mongoose = require('mongoose');
const install = require(path.resolve('./src/install/routes/install'));
const customers = require(path.resolve('./src/customers/routes/customers'));
const ShopMD = mongoose.model('Shop');

const routes = (app) => {
  app.use('/*', async (req, res, next) => {
    if (req.session.shop && req.session.shop_id && req.session.access_token) return next();
    if (req.originalUrl.indexOf('install') != -1) return next();
    res.sendStatus(401);
  })
  
  app.get('/', (req, res) => {
    res.send({ error: false });
  })

  app.use('/install', install);
  app.use('/api/customers', customers);
}

module.exports = routes;