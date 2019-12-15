const path = require('path');
const mongoose = require('mongoose');
const install = require(path.resolve('./src/install/routes/install'));
const customers = require(path.resolve('./src/customers/routes/customers'));
const ShopMD = mongoose.model('Shop');

const routes = (app) => {
  app.use('/*', async (req, res, next) => {
    try {
      console.log(req.originalUrl, req.session.shop)
    } catch{

    }
    var requestShop = req.query.shop ||
      req.headers['haravan-shop-domain'] ||
      req.body.shop ||
      req.session.shop || '';
    if (req.session.shop && req.session.shop_id && req.session.access_token) {
      next();
    } else {
      if (req.originalUrl.indexOf('install') != -1) {
        next();
      } else {
        let shop = await ShopMD.findOne({ shop: requestShop }).lean(true);
        if (!shop) {
          res.sendStatus(401);
        } else {
          req.session.shop = shop.shop;
          req.session.shop_id = shop.shop_id;
          req.session.access_token = shop.authorize.access_token;
          req.session.save(() => {
            next();
          })
        }
      }
    }
  })
  app.get('/', (req, res) => {
    res.send({ error: false });
  })

  app.use('/install', install);
  app.use('/api/customers', customers);
}

module.exports = routes;