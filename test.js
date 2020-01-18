let HaravanAPI = require('./index');

let config = {
  app_id: '4c5022e7863adb4af30ba766c3211e2b',
  app_secret: 'bf6a3b119ac3ef53b05d775e9969de3839eae82ae5f804f428bf5ab877fc669f',
  scope: 'openid profile email org userinfo',
  scope_install: 'openid profile email org userinfo com.write_products com.write_orders com.write_customers com.write_shippings com.write_inventories com.write_discounts grant_service offline_access wh_api',
  login_callback_url: 'http://localhost:3000/install/login',
  install_callback_url: 'http://localhost:3000/install/grandservice',
  webhook: {
    hrVerifyToken: 'bOL3XFfZabhKe6dnJfCJuTAfi37dFchQ',
  }
}

let { app_id, app_secret } = config;

const start = ({ app }) => {
  app.get('/buildLinkLogin', async (req, res) => {
    let HrvAPI = new HaravanAPI({
      app_id, app_secret,
      scope: config.scope,
      callback_url: config.login_callback_url
    });
    let urlLogin = HrvAPI.buildLinkLogin();
    res.json(urlLogin)
  })

  app.get('/buildLinkInstall', async (req, res) => {
    let HrvAPI = new HaravanAPI({
      app_id, app_secret,
      scope: config.scope_install,
      callback_url: config.install_callback_url
    });
    let urlInstall = HrvAPI.buildLinkInstall();
    res.json(urlInstall)
  })

  app.post('/install/login', async (req, res) => {
    let { code, id_token } = req.body;
    let HrvAPI = new HaravanAPI({
      app_id, app_secret,
      callback_url: config.login_callback_url
    });
    let param_token = await HrvAPI.getToken(code);
    let { access_token, expires_in, token_type } = param_token;
    res.send({ access_token, expires_in, token_type })
  })

  app.post('/install/grandservice', async (req, res) => {
    let { code, id_token } = req.body;
    let HrvAPI = new HaravanAPI({
      app_id, app_secret,
      callback_url: config.install_callback_url
    });
    let param_token = await HrvAPI.getToken(code);
    let { access_token, expires_in, token_type } = param_token;
    await HrvAPI.subscribe({ access_token });
    res.send({ access_token, expires_in, token_type })
  })

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`running on port: ${PORT}`)
  });
}

const test = () => {
  let express = require('express');
  let bodyParser = require('body-parser');
  let app = express();
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  start({ app });
}
// test()