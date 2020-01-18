const { OAuth2 } = require('oauth');
const querystring = require('querystring');
const request = require('request');

const config = {
  url_authorize: 'https://accounts.hara.vn/connect/authorize',
  url_connect_token: 'https://accounts.hara.vn/connect/token',
  grant_type: 'authorization_code',
  response_mode: 'form_post',
  response_type: 'code id_token',
  nonce: 'nonce',
  webhook: {
    subscribe: 'https://webhook.hara.vn/api/subscribe'
  }
}

class HaravanAPI {
  constructor({ app_id, app_secret, scope, callback_url }) {
    this.app_id = app_id;
    this.app_secret = app_secret;
    this.scope = scope;
    this.callback_url = callback_url;
  }

  buildLinkLogin() {
    let objQuery = {
      response_mode: config.response_mode,
      response_type: config.response_type,
      scope: this.scope,
      client_id: this.app_id,
      redirect_uri: this.callback_url,
      nonce: config.nonce
    };
    let query = querystring.stringify(objQuery);
    return `${config.url_authorize}?${query}`;
  }

  buildLinkInstall() {
    let objQuery = {
      response_mode: config.response_mode,
      response_type: config.response_type,
      scope: this.scope,
      client_id: this.app_id,
      redirect_uri: this.callback_url,
      nonce: config.nonce
    };
    let query = querystring.stringify(objQuery);
    return `${config.url_authorize}?${query}`;
  }

  getToken(code) {
    return new Promise((resolve => {
      try {
        let params = {};
        params.grant_type = config.grant_type;
        params.redirect_uri = this.callback_url;

        let _oauth2 = new OAuth2(
          this.app_id,
          this.app_secret,
          '',
          config.url_authorize,
          config.url_connect_token,
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
          url: config.webhook.subscribe,
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
}

module.exports = HaravanAPI;