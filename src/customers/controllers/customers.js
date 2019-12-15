const path = require('path');
const API = require(path.resolve('./src/core/api/index'));
const mongoose = require('mongoose');
const CustomersMD = mongoose.model('Customers');
const ShopMD = mongoose.model('Shop');

exports.get = async (req, res) => {
  let shop = req.session.shop;
  let shop_id = req.session.shop_id;
  let access_token = req.session.access_token;
  let HR = {}
  HR.CUSTOMERS = {
    LIST: {
      method: 'get',
      url: 'com/customers.json',
      resPath: 'body.customers'
    }
  }
  let customers = await API.call(HR.CUSTOMERS.LIST, { access_token });
  let count = {
    api: 'customers.json',
    new: 0,
    update: 0,
    start_time: new Date()
  }
  for (let i = 0; i < customers.length; i++) {
    try {
      const customer = customers[i];
      let found = await CustomersMD.findOne({ id: customer.id, shop_id }).lean(true);
      customer.shop = shop;
      customer.shop_id = shop_id;
      if (!found) {
        let customerNew = new CustomersMD(customer);
        await customerNew.save()
        count.new++;
      } else {
        await CustomersMD.findOneAndUpdate({ id: customer.id }, { $set: customer }, { lean: true, new: true });
        count.update++;
      }
    } catch {

    }
  }
  count.end_time = new Date();
  count.time = (count.end_time - count.start_time) / 1000 + 's';
  res.send({ error: false, data: { shop, count } })
}

exports.post = (req, res) => {
  res.send({ error: false });
}

let test = async () => {

}
test()