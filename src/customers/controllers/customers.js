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
      let customerNew = new CustomersMD(customer);
      await customerNew.save()
      await timeout(100)
    } catch {

    }
  }
  res.send({ customers })
}

const timeout = (time) => { return new Promise(setTimeout(resolve, time)) }

exports.post = (req, res) => {
  let link = 'https://apis.hara.vn/com/customers.json';
  let customers = API.call({ method: 'get', url: link });
  res.send({ customers });
}

let test = async () => {

}
test()