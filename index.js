const { OAuth2 } = require('oauth');
const querystring = require('querystring');
const _ = require('lodash');
const request = require('request');

let config_test = {
  url_authorize: 'https://accounts.hara.vn/connect/authorize',
  url_connect_token: 'https://accounts.hara.vn/connect/token',
  host: 'https://apis.hara.vn',
  grant_type: 'authorization_code',
  response_mode: 'form_post',
  response_type: 'code id_token',
  nonce: 'nonce',
  webhook: {
    subscribe: 'https://webhook.hara.vn/api/subscribe'
  }
}

let config_pro = {
  url_authorize: 'https://accounts.haravan.com/connect/authorize',
  url_connect_token: 'https://accounts.haravan.com/connect/token',
  host: 'https://apis.haravan.com',
  grant_type: 'authorization_code',
  response_mode: 'form_post',
  response_type: 'code id_token',
  nonce: 'nonce',
  webhook: {
    subscribe: 'https://webhook.haravan.com/api/subscribe'
  }
}

class HaravanAPI {
  constructor({ app_id, app_secret, scope, callback_url, is_test, access_token }) {
    this.app_id = app_id;
    this.app_secret = app_secret;
    this.scope = scope;
    this.callback_url = callback_url;
    this.access_token = access_token;
    this.config = is_test ? config_test : config_pro;
  }

  buildLinkLogin() {
    let objQuery = {
      response_mode: this.config.response_mode,
      response_type: this.config.response_type,
      scope: this.scope,
      client_id: this.app_id,
      redirect_uri: this.callback_url,
      nonce: this.config.nonce
    };
    let query = querystring.stringify(objQuery);
    return `${this.config.url_authorize}?${query}`;
  }

  buildLinkInstall() {
    let objQuery = {
      response_mode: this.config.response_mode,
      response_type: this.config.response_type,
      scope: this.scope,
      client_id: this.app_id,
      redirect_uri: this.callback_url,
      nonce: this.config.nonce
    };
    let query = querystring.stringify(objQuery);
    return `${this.config.url_authorize}?${query}`;
  }

  getToken(code) {
    return new Promise((resolve => {
      try {
        let params = {};
        params.grant_type = this.config.grant_type;
        params.redirect_uri = this.callback_url;

        let _oauth2 = new OAuth2(
          this.app_id,
          this.app_secret,
          '',
          this.config.url_authorize,
          this.config.url_connect_token,
          ''
        );

        _oauth2.getOAuthAccessToken(code, params, (err, accessToken, refreshToken, param_token) => {
          if (err) { return resolve(); }
          resolve(param_token)
        });
      } catch (error) {
        console.log('error', error);
        return resolve();
      }
    }))
  }

  async subscribe({ access_token }) {
    return new Promise(resolve => {
      try {
        let options = {
          method: 'POST',
          url: this.config.webhook.subscribe,
          headers: {
            authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        };

        request(options, function (error, response, body) {
          if (error) { console.log(error); }
          console.log(body);
          resolve();
        });
      } catch (e) {
        console.log(e);
        resolve();
      }
    })
  }

  call(f, plus, callback) {
    let { url, method, resPath } = f;
    let { data, query, params, fields } = plus;
    let { access_token } = this || plus;
    return new Promise(resolve => {
      try {
        let options = {
          method,
          url: `${this.config.host}/${url}`,
          headers: {
            authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
        };

        if (data) { options.body = JSON.stringify(data); }

        if (params) { options.url = compile(options.url, params); }

        if (query) {
          options.url += '?'
          for (let f in query) {
            if (f && query[f]) { options.url += `${f}=${query[f]}` }
          }
        }
        if (fields) {
          if (typeof fields == 'object') {

          }

          if (typeof fields == 'string') {

          }

          if (typeof fields == 'array') {

          }
        }
        request(options, function (error, response, body) {
          if (error) { console.log(error); }
          console.log(`[CALL] [${String(options.method).toUpperCase()}] ${options.url} - ${response.statusCode}`);
          let data = JSON.parse(body);
          if (resPath) { data = _.get(data, resPath); }
          if (callback) { callback(null, data) }
          resolve(data);
        });
      } catch (e) {
        console.log(e);
        if (callback) { callback(e, null) }
        resolve();
      }
    })
  }
}

function compile(template, data) {
  let result = template.toString ? template.toString() : '';
  result = result.replace(/{.+?}/g, function (matcher) {
    var path = matcher.slice(1, -1).trim();
    return _.get(data, path, '');
  });
  return result;
}

module.exports = HaravanAPI;

// let HRV = {}
// HRV.ORDERS = {
//   LIST: {
//     method: 'get',
//     url: `com/orders.json`
//   },
//   COUNT: {
//     method: 'get',
//     url: `com/orders/count.json`,
//     resPath: 'count'
//   }
// }
// let API = new HaravanAPI({})
// API.call(HRV.ORDERS.COUNT, { access_token: 'ff6989e637b18cafff5747be860bd4cd79a01a774685f207fea47aa9118e7675' }).then(res => {
//   console.log(res)
// });