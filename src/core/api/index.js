const path = require('path');
const _ = require('lodash');
const request = require('request');

const API = {
  call: async (di, config) => {
    const { before, after, handler, resPath } = di;

    let finalConfig = {
      method: di.method,
      url: 'https://apis.hara.vn/' + di.url,
      headers: {
        Authorization: `Bearer ${config.shop.authorize.access_token}`
      }
    }
    let it = {};
    it.res = await API.requestPromise(finalConfig);
    if(it.res.body) it.res.body = JSON.parse(it.res.body)
    if (typeof resPath === 'string') {
      it.res = _.get(it.res, resPath);
    }
    return it.res;
  },
  requestPromise: (config) => {
    return new Promise((resolve, reject) => {
      request(config, (err, res) => {
        if (err) return reject(err)
        if (res.statusCode >= 400) {
          return reject({ response: res });
        }
        resolve(res);
      })
    })
  }
}

module.exports = API;