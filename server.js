const express = require('express');
const app = express();
const OAuth2 = require('oauth').OAuth2;
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const request = require("request");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const config = {
  response_mode: 'form_post',
  url_authorize: 'https://accounts.hara.vn/connect/authorize',
  url_connect_token: 'https://accounts.hara.vn/connect/token',
  grant_type: 'authorization_code',
  nonce: 'asdfasdgd',
  response_type: 'code id_token',
  app_id: '4c5022e7863adb4af30ba766c3211e2b',
  app_secret: 'bf6a3b119ac3ef53b05d775e9969de3839eae82ae5f804f428bf5ab877fc669f',
  scope_login: 'openid profile email org userinfo',
  scope: 'openid profile email org userinfo com.write_products com.write_orders com.write_customers com.write_shippings com.write_inventories com.write_discounts grant_service offline_access wh_api',
  login_callback_url: 'http://localhost:3000/install/login',
  install_callback_url: 'http://localhost:3000/install/grandservice',
  webhook: {
    hrVerifyToken: 'bOL3XFfZabhKe6dnJfCJuTAfi37dFchQ',  //https://randomkeygen.com/ (CodeIgniter Encryption Keys)
    subscribe: 'https://webhook.hara.vn/api/subscribe'
  },
};


function buildUrlLogin() {
  let objQuery = {
    response_mode: config.response_mode,
    response_type: config.response_type,
    scope: config.scope_login,
    client_id: config.app_id,
    redirect_uri: config.login_callback_url,
    nonce: config.nonce
  };
  let query = querystring.stringify(objQuery);
  return `${config.url_authorize}?${query}`;
}

function buildUrlInstall() {
  let objQuery = {
    response_mode: config.response_mode,
    response_type: config.response_type,
    scope: config.scope,
    client_id: config.app_id,
    redirect_uri: config.install_callback_url,
    nonce: config.nonce
  };
  let query = querystring.stringify(objQuery);
  return `${config.url_authorize}?${query}`;
}

function getToken(code, callback_url) {
  return new Promise((resolve => {
    try {
      let params = {};
      params.grant_type = config.grant_type;
      params.redirect_uri = callback_url;

      let _oauth2 = new OAuth2(
        config.app_id,
        config.app_secret,
        '',
        config.url_authorize,
        config.url_connect_token,
        ''
      );

      _oauth2.getOAuthAccessToken(code, params, (err, accessToken, refreshToken, param_token) => {
        if (err) {
          console.log('error', err);
          resolve();
        } else {
          console.log('param_token', param_token);
          resolve(param_token)
        }
      });
    } catch (error) {
      console.log('error', error);
      return resolve();
    }
  }))
}

function getUserFromDecodeJwt(params) {
  try {
    let userHR = jwt.decode(params.id_token);
    if (!_.isObjectLike(userHR)) {
      return {
        is_error: true,
        message: 'Get User Info Failed'
      };
    }
    if (!userHR.id) {
      userHR.id = userHR.sub;
    }
    return userHR;
  } catch (e) {
    return {
      is_error: true,
      message: `Get User Info Failed ${e.message}`
    };
  }
}

function getShop(access_token) {
  return new Promise(resolve => {
    let options = {
      method: 'GET',
      url: 'https://apis.hara.vn/com/shop.json',
      headers:
        {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
      json: true
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
      resolve(body)
    });
  })
}

app.get('/install/login', (req, res) => {
  let url = buildUrlLogin();
  res.redirect(url);
});

app.post('/install/login', async (req, res) => {
  let code = req.body.code;
  if (!code) {
    return res.send('Code not found in request');
  }
  let param_token = await getToken(code, config.login_callback_url);
  if (!param_token) {
    return res.send('Something went wrong!').status(400);
  }
  let userHR = getUserFromDecodeJwt(param_token);
  if (userHR.is_error) {
    return res.send(userHR.message).status(400);
  }

  if (!userHR.id || !userHR.orgname) {
    return res.send('Can not find user or org').status(400);
  }
  userHR.isRoot = 0;
  if (userHR.role) {
    if (_.isString(userHR.role)) {
      userHR.isRoot = userHR.role == 'admin' ? 1 : 0;
    } else {
      userHR.isRoot = userHR.role.includes('admin') ? 1 : 0;
    }
  }

  // Check database shop with userHR.orgid had exists in database and app not removed
  // if had shop and not removed then go to app
  // else if no shop or shop had removed then check
  // if userHR is root then call url install app
  // else response error not have access

  //under is case no shop or shop had removed
  if (userHR.isRoot) {
    let url = buildUrlInstall();
    res.redirect(url);
  } else {
    return res.send('You are not authorized to access this page!').status(401);
  }
});

app.post('/install/grandservice', async (req, res) => {
  let code = req.body.code;
  try {
    if (!code) return res.send('Code not found in request');
    let param_token = await getToken(code, config.install_callback_url);
    if (!param_token) return res.send('Something went wrong!').status(400);
    let userHR = getUserFromDecodeJwt(param_token);
    if (userHR.is_error) return res.send(userHR.message).status(400);
    if (!userHR.id || !userHR.orgname) return res.send('Can not find user or org');
    let authorizeInfo = {
      access_token: param_token.access_token,
      refresh_token: param_token.refresh_token,
      expires_in: param_token.expires_in
    };

    // authorizeInfo can save to database shop for reuse later

    //test request shop.json
    let shopData = await getShop(authorizeInfo.access_token);
    res.send(shopData);

    //if have use webhook, you need subscribe webhook with org token to use
    await subscribe(authorizeInfo.access_token);
  } catch (err) {
    return res.send(err);
  }
});

//--------------------------------------Webhook-----------------------------------//
var crypto = require('crypto');
async function subscribe(access_token) {
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
        if (error) {
          console.log(error);
        }
        console.log(body);
        resolve();
      });
    } catch (e) {
      console.log(e);
      resolve();
    }
  })
}


app.get('/webhooks', (req, res) => {
  var verify_token = req.query['hub.verify_token'] || "";
  var hrVerifyToken = config.webhook.hrVerifyToken || "";
  if (verify_token != hrVerifyToken) {
    return res.sendStatus(401);
  }
  res.send(req.query['hub.challenge']);
});

function webhookValidate(req, res, next) {
  let shop = req.headers['x-haravan-org-id'] || '';
  let signature = req.headers['x-haravan-hmac-sha256'] || '';
  let topic = req.headers['x-haravan-topic'] || '';
  let haravanBody = req.body.toString() || '';
  if (!shop || !signature || !topic) {
    return res.sendStatus(401);
  }

  var header = req.get('x-haravan-hmac-sha256');
  var token_secret = config.app_secret;

  var sh = crypto
    .createHmac('sha1', token_secret)
    .update(new Buffer(haravanBody, 'utf8'))
    .digest('hex');

  if (sh !== header) {
    return res.status(401).send();
  }

  next();
};

app.post('/webhooks', webhookValidate, (req, res) => {
  let topic = req.headers['x-haravan-topic'] || '';
  let org_id = req.headers['x-haravan-org-id'] || '';
  switch (topic) {
    case "product/update": {
      res.sendStatus(200);
      console.log(req.body);
      break;
    }
    default:
      res.sendStatus(200);
      break;
  }
});
//--------------------------------------End Webhook-----------------------------------//

app.use('/', function (req, res) {
  res.redirect('/install/login');
});

app.listen(3000, function () {
  console.log('listening on 3000')
});
