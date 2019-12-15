const path = require('path');
const API = require(path.resolve('./src/core/api/index'));
const mongoose = require('mongoose');
const CustomersMD = mongoose.model('Customers');
const ShopMD = mongoose.model('Shop');

exports.get = async (req, res) => {
  let shop = req.session.shop;
  let shop_id = req.session.shop_id;
  let HR = {}
  HR.CUSTOMERS = {
    LIST: {
      method: 'get',
      url: 'com/customers.json',
      resPath: 'body.customers'
    }
  }
  let shopFound = await ShopMD.findOne({ shop_id }).lean(true);
  if (!shopFound) throw { error: true }
  let customers = await API.call(HR.CUSTOMERS.LIST, { shop: shopFound });
  for (let i = 0; i < customers.length; i++) {
    try {
      const customer = customers[i];
      let found = await CustomersMD.findOne({ id: customer.id, shop_id }).lean(true);
      customer.shop = shop;
      customer.shop_id = shop_id;
      if (!found) {
        let customerNew = new CustomersMD(customer);
        await customerNew.save()
      } else {
        let customerUpdate = await CustomersMD.findOneAndUpdate({ id: customer.id }, { $set: customer }, { lean: true, new: true });
      }
    } catch {

    }
  }
  res.send({ error: false })
}

exports.post = (req, res) => {
  res.send({ error: false });
}

let test = async () => {

}
test()