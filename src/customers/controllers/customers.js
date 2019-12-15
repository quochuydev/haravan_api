const path = require('path');
const API = require(path.resolve('./src/core/api/index'));
const mongoose = require('mongoose');
const CustomersMD = mongoose.model('Customers');

exports.get = async (req, res) => {
  let HR = {}
  HR.CUSTOMERS = {
    LIST: {
      method: 'get',
      url: 'com/customers.json',
      resPath: 'body.customers'
    }
  }
  let shop = {
    authorize: {
      access_token: "76e3d20b284c23f82ecf6e255c22a9f082e5533cc6bc8252b06b4e84d8204047"
    }
  }
  let customers = await API.call(HR.CUSTOMERS.LIST, { shop });
  for (let i = 0; i < customers.length; i++) {
    try {
      const customer = customers[i];
      let found = await CustomersMD.findOne({ id: customer.id }).lean(true);
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